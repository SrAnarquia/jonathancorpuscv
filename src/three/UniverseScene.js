import * as THREE from "three";
import { buildPlanet, buildShip, buildPrince, buildStarKite, placeOnSurface, clearCaches, planetPaint, prepareWatercolors } from "./worlds.js";
import { glowTexture } from "./textures.js";

// Escena Three.js del universo. Vive separada de React: la interfaz HTML le pide
// cosas (enfocar un planeta, volver al centro, acercar) y la escena avisa mediante
// callbacks (hover, selección, listo, contexto perdido).

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;
const UP = new THREE.Vector3(0, 1, 0);

function shortAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d;
}

const SKY_VERT = `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const SKY_FRAG = `
varying vec3 vDir;
uniform float uDawn;
float hash(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 top  = vec3(0.07, 0.10, 0.21);
  vec3 mid  = vec3(0.16, 0.22, 0.40);
  vec3 low  = vec3(0.36, 0.34, 0.52);
  vec3 warm = vec3(0.96, 0.74, 0.52);
  vec3 col = mix(mid, top, smoothstep(0.0, 0.8, h));
  col = mix(low, col, smoothstep(-0.45, 0.15, h));
  float s = max(dot(d, normalize(vec3(-0.55, -0.08, -0.83))), 0.0);
  float glow = pow(s, 4.0) * (1.0 - smoothstep(0.0, 0.65, abs(h + 0.08)));
  col = mix(col, warm, glow * (0.5 + 0.4*uDawn));
  float n = noise(d*3.0)*0.55 + noise(d*8.0)*0.3 + noise(d*20.0)*0.15;
  col *= 0.92 + 0.14*n;
  col = mix(col, col*1.3 + vec3(0.06,0.035,0.0), uDawn*0.4);
  vec3 dawn = mix(vec3(0.98,0.80,0.60), vec3(0.55,0.52,0.72), smoothstep(-0.25, 0.55, h));
  col = mix(col, dawn, uDawn*0.55*(1.0 - smoothstep(-0.1, 0.7, h)));
  gl_FragColor = vec4(col, 1.0);
}`;

const STAR_VERT = `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uTime; uniform float uPR; uniform float uTwinkle;
varying float vAlpha; varying vec3 vColor; varying float vBig;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_Position = projectionMatrix * mv;
  vAlpha = 0.72 + 0.28*sin(uTime*(0.5+aPhase*1.6) + aPhase*6.2831)*uTwinkle;
  vColor = aColor;
  vBig = step(2.6, aSize);
  gl_PointSize = min(aSize * uPR * (260.0 / -mv.z) * (1.0 + vBig*1.6), 28.0*uPR);
}`;

const STAR_FRAG = `
uniform float uFade;
varying float vAlpha; varying vec3 vColor; varying float vBig;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = pow(smoothstep(0.5, 0.0, d), 1.8);
  float cross = (max(0.0, 1.0 - abs(c.x)*16.0) + max(0.0, 1.0 - abs(c.y)*16.0)) * smoothstep(0.5, 0.05, d) * vBig;
  a = (a*(1.0 - vBig*0.45) + cross*0.7) * vAlpha * uFade;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

const DUST_VERT = `
attribute float aSeed;
uniform float uTime; uniform float uPR;
varying float vA;
void main(){
  vec3 p = position;
  p.y = mod(p.y + uTime*(0.25 + aSeed*0.35) + 30.0, 60.0) - 30.0;
  p.x += sin(uTime*0.2 + aSeed*20.0)*0.8;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  gl_Position = projectionMatrix * mv;
  vA = (0.25 + 0.5*aSeed) * smoothstep(30.0, 22.0, abs(p.y));
  gl_PointSize = (1.0 + aSeed*2.0) * uPR * (60.0 / -mv.z);
}`;

const DUST_FRAG = `
varying float vA;
void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d)*vA; if(a<0.01) discard; gl_FragColor = vec4(1.0,0.86,0.58,a); }`;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Lo más pesado del arranque (pintar las acuarelas de los planetas), hecho antes de crear la escena y
// repartido en tareas cortas: la página sigue respondiendo mientras el universo se prepara.
export function prepareScene(projects) {
  return prepareWatercolors(projects.map((p, i) => planetPaint(p, i)));
}

export class UniverseScene {
  constructor(container, opts) {
    this.container = container;
    this.opts = opts;
    this.projects = opts.projects;
    this.shipId = opts.shipId;
    this.reduced = !!opts.reducedMotion;
    this.coarse = !!opts.coarse;
    this.focusId = null;
    this.hoverId = null;
    this.highlightId = null;
    this.running = false;
    this.visible = true;
    this.inView = true;
    this.paused = false;
    this.time = 0;
    this.timeScale = this.reduced ? 0 : 1;
    this.zoom = 1;
    this.user = { theta: 0, phi: 0 };
    this.parallax = new THREE.Vector2();
    this.parallaxGoal = new THREE.Vector2();
    this.shift = { x: 0, y: 0, gx: 0, gy: 0, band: 0 };
    this.fit = 1; // alejamiento de la cámara para que el planeta quepa en la franja libre (ver `bandFit`)
    this.frames = 0;
    this.slowFrames = 0;
    this._v = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0); this._dir = new THREE.Vector3(0, 0, 1); this._hand = new THREE.Vector3();
    this._axis = new THREE.Vector3(); this._q = new THREE.Quaternion();
    this.fly = 0;
    this._listeners = [];

    this.initRenderer();
    this.initWorld();
    this.initLabels();
    this.initEvents();
    this.resize();

    const pose = this.goalPose(null);
    this.pose = { ...pose, target: pose.target.clone() };
    this.tween = null;
    // Donde el navegador compila shaders en paralelo, se compilan en segundo plano antes del primer
    // cuadro para que arrancar no congele la página (si algo lo retrasa, a los 3 s se arranca igual).
    // Donde no, el primer cuadro va en su propia tarea, como antes.
    this.warm = false;
    const warmed = () => {
      if (this.warm || this.disposed) return;
      this.warm = true;
      // Primer cuadro en el acto, aunque el universo todavía no se vea: las texturas suben y los shaders
      // quedan listos durante el arranque, no en el momento en que la persona llega al universo.
      this.frame();
      this.updateRunning();
    };
    if (this.renderer.extensions.has("KHR_parallel_shader_compile")) {
      Promise.race([this.renderer.compileAsync(this.scene, this.camera), new Promise((r) => setTimeout(r, 3000))]).then(warmed, warmed);
    } else {
      setTimeout(warmed, 0);
    }
  }

  // ---------- inicialización ----------
  initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: !this.coarse, powerPreference: "high-performance" });
    this.maxPR = Math.min(window.devicePixelRatio || 1, this.coarse ? 1.5 : 2);
    r.setPixelRatio(this.maxPR);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.domElement.className = "u-canvas";
    r.domElement.setAttribute("role", "img");
    r.domElement.setAttribute("aria-label", "Universo en 3D con un planeta por proyecto y la nave al final del viaje. Usa la lista de planetas para navegar con teclado.");
    this.container.appendChild(r.domElement);
    this.renderer = r;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1f2a4c, 0.0055);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 800);
    this.last = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  initWorld() {
    const S = this.scene;
    const lite = this.coarse;

    // Cielo pintado
    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uDawn: { value: 0 } },
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), this.skyMat);
    S.add(this.sky);

    // Estrellas en tres planos de profundidad
    this.starMats = [];
    this.starLayers = [
      this.makeStars(lite ? 500 : 1100, 220, 340, 1.4, 1),
      this.makeStars(lite ? 160 : 320, 120, 200, 2.0, 2),
      this.makeStars(lite ? 30 : 60, 90, 150, 3.0, 3),
    ];
    this.starLayers.forEach((l) => S.add(l));

    // Polvo dorado cercano
    if (!lite) {
      const N = 260, r = rng(42);
      const pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (r() - 0.5) * 110; pos[i * 3 + 1] = (r() - 0.5) * 60; pos[i * 3 + 2] = (r() - 0.5) * 110;
        seed[i] = r();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      this.dustMat = new THREE.ShaderMaterial({
        vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPR: { value: this.maxPR } },
      });
      this.dust = new THREE.Points(g, this.dustMat);
      S.add(this.dust);
    }

    // Luz
    S.add(new THREE.HemisphereLight(0xc4d6ff, 0x4a3f63, 1.15));
    const sunLight = new THREE.PointLight(0xffe0b0, 2.3, 0, 0);
    S.add(sunLight);
    const rim = new THREE.DirectionalLight(0xa9c0ff, 0.9);
    rim.position.set(30, 40, -60);
    S.add(rim);

    // Centro: una estrella cálida
    this.core = new THREE.Group();
    const coreBall = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffe3a6, toneMapped: false }));
    const halo1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd27a, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo1.scale.setScalar(16);
    const halo2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc070, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo2.scale.setScalar(46);
    this.coreHalo = halo1;
    this.core.add(halo2, halo1, coreBall);
    S.add(this.core);

    // Planetas en órbita
    const r = rng(7);
    this.planets = this.projects.map((p, i) => {
      const pl = buildPlanet(p, i);
      const radius = 11 + i * 4.6;
      const orbit = new THREE.Group();
      orbit.rotation.x = (r() - 0.5) * 0.12;
      orbit.rotation.z = (r() - 0.5) * 0.12;
      const pts = [];
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xf1d79e, transparent: true, opacity: 0.2, depthWrite: false })
      );
      orbit.add(line, pl.group);
      S.add(orbit);
      Object.assign(pl, {
        orbit, line, radius,
        angle: i * 2.399 + 0.6,
        speed: 0.075 / Math.sqrt(radius),
        scale: 1,
        project: p,
      });
      pl.group.position.set(Math.cos(pl.angle) * radius, 0, Math.sin(pl.angle) * radius);
      return pl;
    });

    // La nave, más allá de la última órbita
    this.ship = buildShip();
    this.ship.group.position.set(50, 11, -34);
    this.ship.group.rotation.y = 0.5;
    this.ship.id = this.shipId;
    this.ship.hit.userData.id = this.shipId;
    S.add(this.ship.group);
    const shipLight = new THREE.PointLight(0xffd7a0, 1.4, 30, 1.2);
    shipLight.position.set(44, 16, -28);
    S.add(shipLight);

    // El principito viaja con el visitante
    this.prince = buildPrince();
    this.prince.group.scale.setScalar(1.05);
    S.add(this.prince.group);
    this.princeAt = this.planets[0];
    this.princeFrom = null;
    this.princeT = 1;      // avance del vuelo (1 = en reposo)
    this.princeT0 = 0;     // instante en que despegó
    this.arcH = 0;         // altura del arco del vuelo
    this.bandK = 1;        // 1 = todo el lienzo visible; baja cuando la ficha tapa parte (móvil)
    this.anchorLocal = new THREE.Object3D();
    // Las estrellitas amarradas que lo llevan en cada viaje
    this.kite = buildStarKite();
    S.add(this.kite.group);

    // Anillo de selección
    this.selRing = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.012, 128),
      new THREE.MeshBasicMaterial({ color: 0xf4d389, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    S.add(this.selRing);

    this.hitTargets = [...this.planets.map((p) => p.hit), this.ship.hit];
  }

  makeStars(count, rMin, rMax, size, seed) {
    const r = rng(seed * 101);
    const pos = new Float32Array(count * 3), sizes = new Float32Array(count), phase = new Float32Array(count), col = new Float32Array(count * 3);
    const palette = [[1, 0.95, 0.85], [1, 0.88, 0.62], [0.85, 0.9, 1], [1, 1, 1]];
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, rad = lerp(rMin, rMax, r());
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = s * Math.cos(th) * rad; pos[i * 3 + 1] = u * rad * 0.8 + 10; pos[i * 3 + 2] = s * Math.sin(th) * rad;
      sizes[i] = size * (0.6 + r() * 0.8);
      phase[i] = r();
      const c = palette[Math.floor(r() * palette.length)];
      col.set(c, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPR: { value: this.maxPR }, uTwinkle: { value: this.reduced ? 0 : 1 }, uFade: { value: 1 } },
    });
    this.starMats.push(m);
    return new THREE.Points(g, m);
  }

  initLabels() {
    const layer = document.createElement("div");
    layer.className = "u-labels";
    layer.setAttribute("aria-hidden", "true");
    this.labels = new Map();
    const make = (id, num, name) => {
      const b = document.createElement("button");
      b.type = "button";
      b.tabIndex = -1;
      b.className = "u-label";
      b.innerHTML = `<span class="u-label-num">${num}</span><span class="u-label-name"></span>`;
      b.querySelector(".u-label-name").textContent = name;
      b.addEventListener("click", () => this.opts.onSelect?.(id));
      b.addEventListener("pointerenter", () => this.setHover(id));
      b.addEventListener("pointerleave", () => this.setHover(null));
      layer.appendChild(b);
      this.labels.set(id, b);
    };
    this.planets.forEach((p, i) => make(p.id, String(i + 1).padStart(2, "0"), p.project.planet.name));
    make(this.shipId, "✦", "La nave");
    this.container.appendChild(layer);
    this.labelLayer = layer;
  }

  on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this._listeners.push(() => target.removeEventListener(type, fn, opts));
  }

  initEvents() {
    const el = this.renderer.domElement;
    let down = null;

    this.on(el, "pointerdown", (e) => {
      down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, type: e.pointerType };
      if (e.pointerType === "mouse") el.setPointerCapture(e.pointerId);
    });
    this.on(el, "pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      if (e.pointerType === "mouse") this.parallaxGoal.set(this.pointer.x, this.pointer.y);
      if (down) {
        const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;
        if (down.moved) {
          this.user.theta -= dx * 0.005;
          if (down.type === "mouse") this.user.phi = clamp(this.user.phi - dy * 0.004, -0.55, 0.4);
          el.classList.add("is-dragging");
        }
        down.lx = e.clientX; down.ly = e.clientY;
      } else if (e.pointerType === "mouse") {
        this.setHover(this.pick());
      }
    });
    const end = (e) => {
      if (down && !down.moved && e.type === "pointerup") {
        const rect = el.getBoundingClientRect();
        this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        const id = this.pick();
        if (id) this.opts.onSelect?.(id);
      }
      down = null;
      el.classList.remove("is-dragging");
    };
    this.on(el, "pointerup", end);
    this.on(el, "pointercancel", end);
    this.on(el, "pointerleave", () => { if (!down) this.setHover(null); this.parallaxGoal.set(0, 0); });
    // Ctrl + rueda acerca; la rueda sola deja desplazar la página.
    this.on(el, "wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.zoomBy(Math.exp(e.deltaY * 0.0015));
    }, { passive: false });

    this.on(el, "webglcontextlost", (e) => {
      e.preventDefault();
      this.stop();
      this.opts.onContextLost?.();
    });

    this.on(document, "visibilitychange", () => {
      this.visible = !document.hidden;
      this.updateRunning();
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.io = new IntersectionObserver(([en]) => { this.inView = en.isIntersecting; this.updateRunning(); }, { rootMargin: "80px" });
    this.io.observe(this.container);
  }

  // ---------- API pública ----------
  focus(id) {
    if (id === this.focusId && this.tween == null) return;
    const from = this.currentPose();
    this.focusId = id || null;
    this.user.theta = 0; this.user.phi = 0; this.zoom = 1;
    this.tween = { from, t0: performance.now(), dur: this.reduced ? 0 : id ? 1700 : 1900 };
    const target = id === this.shipId ? this.ship : this.planets.find((p) => p.id === id);
    if (target && target !== this.princeAt) {
      // Si lo llaman en pleno vuelo, sigue desde donde va (no vuelve a saltar desde el planeta anterior).
      this.princeFrom = this.princeT < 1 && this.princeFrom
        ? { pos: this.prince.group.position.clone(), up: this._up.clone() }
        : this.princeWorld(this.princeAt);
      this.princeAt = target;
      this.princeT = this.reduced ? 1 : 0;
      this.princeT0 = performance.now();
      this.arcH = Math.min(this.princeFrom.pos.distanceTo(this.princeWorld(target).pos) * 0.22, 7);
    }
  }

  setHighlight(id) { this.highlightId = id; }
  // Textos de las etiquetas (cambian con el idioma).
  setLabels(names, aria) {
    this._labelSizes = null; // otro idioma, otro ancho
    for (const [id, el] of this.labels) {
      const name = names?.[id];
      if (name) el.querySelector(".u-label-name").textContent = name;
    }
    if (aria) this.renderer.domElement.setAttribute("aria-label", aria);
  }
  setHover(id) {
    if (id === this.hoverId) return;
    this.hoverId = id;
    // Sobre un planeta el cursor es la navecita (.u-canvas.is-over en index.css); en el resto, la mano de arrastrar.
    this.renderer.domElement.classList.toggle("is-over", !!id);
    this.opts.onHover?.(id);
  }
  zoomBy(f) { this.zoom = clamp(this.zoom * f, 0.55, 1.7); }
  // `band` (V6.13): alto en px de la franja libre entre los controles de arriba y la hoja inferior (0 si la
  // ficha va a un lado o no hay ficha).
  setViewShift(x, y, band = 0) { this.shift.gx = x; this.shift.gy = y; this.shift.band = band > 0 ? band : 0; }
  // Con la ficha de celular más alta (V6.13) la franja que queda encima es más baja y el planeta, a la
  // distancia de siempre, se salía por arriba con su etiqueta sobre los controles. La cámara se aleja lo justo
  // para que quepan, con 6 px de margen: por debajo del punto que mira la cámara queda 1,3 R de planeta y por
  // encima 1,05 R más la etiqueta (~26 px). Con la franja de la V6.12 o más alta el factor es 1: nada cambia.
  bandFit(base) {
    const b = this.shift.band;
    if (!(b > 0)) return 1;
    const half = b / 2 - 6;
    const rPx = Math.max(16, Math.min(half / 1.3, (half - 26) / 1.05));
    const tanHalf = Math.tan((this.camera.fov * Math.PI) / 360);
    return clamp(this.height / (2 * tanHalf * base * rPx), 1, 1.8);
  }
  // Pausa pedida desde fuera (p. ej. el video abierto encima): no se dibuja nada mientras dure.
  setPaused(v) {
    this.paused = !!v;
    this.updateRunning();
  }
  setReducedMotion(v) {
    this.reduced = !!v;
    this.starMats.forEach((m) => (m.uniforms.uTwinkle.value = v ? 0 : 1));
  }

  // ---------- cámara ----------
  currentPose() {
    return { target: this.pose.target.clone(), radius: this.pose.radius, theta: this.pose.theta, phi: this.pose.phi };
  }

  goalPose(id) {
    const aspect = this.width / Math.max(1, this.height) || 1.6;
    const portrait = aspect < 1;
    // En escritorio el lienzo se ajusta a la ventana y en ventanas bajas queda por debajo de los 640 px
    // con los que se diseñó el encuadre; la cámara se acerca en la misma proporción para que planetas
    // y nave se vean del mismo tamaño en pantalla (se recorta algo de cielo, no la escena).
    const near = this.width >= 901 ? clamp(this.height / 640, 0.8, 1) : 1;
    if (!id) {
      const fit = portrait ? 1.45 : aspect < 1.5 ? 1.5 / aspect : 1;
      return {
        target: new THREE.Vector3(0, -2, 0),
        radius: 74 * fit * near,
        theta: 0.3 + (this.reduced ? 0 : Math.sin(this.time * 0.03) * 0.35),
        phi: portrait ? 0.62 : 1.08,
      };
    }
    if (id === this.shipId) {
      const p = this.ship.group.getWorldPosition(new THREE.Vector3());
      // La mirada apunta un poco hacia la cola (V6.17): la nave entera queda más a la derecha, lejos de la lista.
      const ry = this.ship.group.rotation.y;
      return {
        target: p.clone().add(new THREE.Vector3(-Math.cos(ry) * 0.8, 0.6, Math.sin(ry) * 0.8)),
        // Un poco más lejos en escritorio (V6.17): de cerca, la cola y las aletas quedaban bajo la lista de planetas.
        radius: (portrait ? 17 : 13.5) * near * this.fit,
        theta: this.ship.group.rotation.y + 0.55 + (this.reduced ? 0 : Math.sin(this.time * 0.15) * 0.2),
        phi: 1.4,
      };
    }
    const pl = this.planets.find((p) => p.id === id);
    if (!pl) return this.goalPose(null);
    const p = pl.group.getWorldPosition(new THREE.Vector3());
    return {
      target: p.clone().add(new THREE.Vector3(0, pl.R * 0.3, 0)),
      radius: pl.R * (portrait ? 10 : 7.6) * near * this.fit,
      theta: Math.atan2(p.x, p.z) + 1.0,
      phi: 1.1,
    };
  }

  updateCamera(now, dt) {
    // El alejamiento sigue a la franja con suavidad (al abrir, contraer o cerrar la ficha no da saltos).
    const fitGoal = this.bandFit(this.width / Math.max(1, this.height) < 1 ? 10 : 7.6);
    this.fit = this.reduced ? fitGoal : lerp(this.fit, fitGoal, 1 - Math.exp(-dt * 4));
    const goal = this.goalPose(this.focusId);
    const band = clamp(1 - (2 * Math.abs(this.shift.gy)) / Math.max(1, this.height), 0.2, 1);
    this.bandK = smooth(band, 0.4, 1);
    let pose;
    if (this.tween) {
      const k = this.tween.dur ? clamp((now - this.tween.t0) / this.tween.dur, 0, 1) : 1;
      const e = easeInOut(k);
      const f = this.tween.from;
      const th = shortAngle(f.theta, goal.theta);
      // Arco: al viajar lejos la cámara se aleja un poco y vuelve a acercarse.
      const travel = f.target.distanceTo(goal.target);
      const lift = Math.sin(Math.PI * e) * Math.min(travel * 0.35, 18);
      // Mientras el principito vuela, la mirada sube con él para que no se salga del cuadro
      // (del todo cuando la ficha deja poca franja visible, como en móvil).
      const follow = this.princeFrom && this.princeT < 1 ? Math.sin(Math.PI * e) * this.arcH * lerp(1, 0.7, this.bandK) : 0;
      pose = {
        target: f.target.clone().lerp(goal.target, e).add(this._v.set(0, follow, 0)),
        radius: lerp(f.radius, goal.radius, e) + lift,
        theta: lerp(f.theta, th, e),
        phi: lerp(f.phi, goal.phi, e),
      };
      if (k >= 1) this.tween = null;
    } else {
      pose = goal;
      pose.theta = shortAngle(this.pose.theta, goal.theta);
    }
    this.pose = pose;

    const k = 1 - Math.exp(-dt * 4);
    this.parallax.lerp(this.reduced ? this.parallaxGoal.set(0, 0) : this.parallaxGoal, k * 0.5);
    const theta = pose.theta + this.user.theta + this.parallax.x * 0.04;
    const phi = clamp(pose.phi + this.user.phi - this.parallax.y * 0.03, 0.3, 1.52);
    const rad = pose.radius * this.zoom;
    const c = this.camera;
    c.position.set(
      pose.target.x + rad * Math.sin(phi) * Math.sin(theta),
      pose.target.y + rad * Math.cos(phi),
      pose.target.z + rad * Math.sin(phi) * Math.cos(theta)
    );
    c.lookAt(pose.target);

    // Desplaza el encuadre cuando la ficha ocupa parte de la pantalla.
    this.shift.x = lerp(this.shift.x, this.shift.gx, this.reduced ? 1 : k);
    this.shift.y = lerp(this.shift.y, this.shift.gy, this.reduced ? 1 : k);
    if (Math.abs(this.shift.x) > 0.5 || Math.abs(this.shift.y) > 0.5) {
      c.setViewOffset(this.width, this.height, this.shift.x, this.shift.y, this.width, this.height);
    } else if (c.view) {
      c.clearViewOffset();
    }
  }

  // ---------- principito ----------
  princeWorld(target) {
    const out = new THREE.Vector3();
    const up = new THREE.Vector3();
    if (target === this.ship) {
      this.ship.craft.updateMatrixWorld();
      out.set(0.2, 0.975, 0.15).applyMatrix4(this.ship.craft.matrixWorld); // los pies apenas dentro del casco
      up.set(0, 1, 0);
      return { pos: out, up };
    }
    placeOnSurface(this.anchorLocal, target.R, 58, 34, 0);
    target.face.updateMatrixWorld();
    out.copy(this.anchorLocal.position).applyMatrix4(target.face.matrixWorld);
    up.copy(this.anchorLocal.position).normalize().transformDirection(target.face.matrixWorld);
    return { pos: out, up };
  }

  updatePrince(now) {
    const g = this.prince.group;
    const dest = this.princeWorld(this.princeAt);
    let fly = 0, release = 0, e = 1;
    if (this.princeT < 1 && this.princeFrom) {
      // Vuelo: las estrellitas lo alzan, lo llevan en un arco hasta el siguiente planeta y lo sueltan al llegar.
      // Mismo reloj y duración que el viaje de la cámara (1.7 s), para que lleguen juntos aunque el equipo vaya lento.
      this.princeT = clamp((now - this.princeT0) / 1700, 0, 1);
      e = easeInOut(this.princeT);
      g.position.copy(this.princeFrom.pos).lerp(dest.pos, e);
      g.position.y += Math.sin(Math.PI * e) * this.arcH;
      this._up.copy(this.princeFrom.up).lerp(dest.up, e).normalize();
      g.quaternion.setFromUnitVectors(UP, this._up);
      this._dir.copy(dest.pos).sub(this.princeFrom.pos).normalize();
      fly = smooth(this.princeT, 0, 0.12) * (1 - smooth(this.princeT, 0.82, 1));
      release = smooth(this.princeT, 0.82, 1);
    } else {
      g.position.copy(dest.pos);
      g.quaternion.setFromUnitVectors(UP, dest.up);
    }
    // mira hacia la cámara
    const toCam = this._v.copy(this.camera.position).sub(g.position);
    const local = toCam.applyQuaternion(g.quaternion.clone().invert());
    g.rotateY(Math.atan2(local.x, local.z));
    if (fly > 0) {
      // Colgado de los hilos se inclina hacia el rumbo, con los pies por detrás.
      this._axis.crossVectors(this._up, this._dir);
      if (this._axis.lengthSq() > 1e-6) g.quaternion.premultiply(this._q.setFromAxisAngle(this._axis.normalize(), 0.28 * fly));
    }
    this.fly = fly;
    g.updateMatrixWorld(true);
    this.prince.hand.getWorldPosition(this._hand);
    this.kite.group.scale.setScalar(lerp(0.65, 1, this.bandK)); // ramillete más recogido cuando hay poca franja visible
    this.kite.update(this.time, this._hand, this._dir, this._up, fly, release, e);
  }

  // ---------- bucle ----------
  pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0];
    return hit ? hit.object.userData.id : null;
  }

  start() {
    if (this.running || this.disposed || !this.warm) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  updateRunning() {
    if (this.visible && this.inView && !this.paused) this.start();
    else this.stop();
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.width = w; this.height = h;
    this._labelSizes = null; // la letra de las etiquetas cambia con el ancho (index.css, ≤ 900 px)
    this._covers = null;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.camera.view) this.camera.setViewOffset(w, h, this.shift.x, this.shift.y, w, h);
    // Cambiar el tamaño borra el lienzo: en pausa (video encima) se repinta el cuadro quieto.
    if (this.paused && !this.running && !this.disposed) {
      this.renderer.render(this.scene, this.camera);
      this.updateLabels();
    }
  }

  frame() {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const motion = this.reduced ? 0 : 1;
    const goalScale = this.reduced ? 0 : this.focusId ? 0.12 : 1;
    this.timeScale = lerp(this.timeScale, goalScale, 1 - Math.exp(-dt * 2));
    this.time += dt * motion;
    const t = this.time;

    // Calidad adaptativa: si los primeros cuadros van lentos, baja la resolución.
    if (this.frames < 120) {
      this.frames++;
      if (dt > 0.03) this.slowFrames++;
      if (this.frames === 120 && this.slowFrames > 50 && this.renderer.getPixelRatio() > 1) {
        this.renderer.setPixelRatio(1);
        this.starMats.forEach((m) => (m.uniforms.uPR.value = 1));
        this.resize();
      }
    }

    this.starMats.forEach((m) => (m.uniforms.uTime.value = t));
    this.starLayers.forEach((l, i) => (l.rotation.y = t * 0.004 * (i + 1)));
    if (this.dustMat) this.dustMat.uniforms.uTime.value = t;
    this.coreHalo.scale.setScalar(16 + Math.sin(t * 0.8) * 0.8 * motion);

    const dawnGoal = this.focusId === this.shipId ? 1 : 0;
    this.skyMat.uniforms.uDawn.value = lerp(this.skyMat.uniforms.uDawn.value, dawnGoal, this.reduced ? 1 : 1 - Math.exp(-dt * 1.2));
    const fade = 1 - this.skyMat.uniforms.uDawn.value * 0.35;
    this.starMats.forEach((m) => (m.uniforms.uFade.value = fade));

    const camPos = this.camera.position;
    for (const p of this.planets) {
      p.angle += p.speed * dt * this.timeScale;
      p.group.position.set(Math.cos(p.angle) * p.radius, 0, Math.sin(p.angle) * p.radius);
      p.body.rotation.y += dt * 0.08 * motion;
      p.update?.(t);
      // la "cara" del planeta gira suavemente hacia la cámara
      p.group.updateMatrixWorld();
      const local = p.group.worldToLocal(this._v.copy(camPos));
      const yaw = Math.atan2(local.x, local.z);
      p.face.rotation.y = this.reduced ? yaw : p.face.rotation.y + (shortAngle(p.face.rotation.y, yaw) - p.face.rotation.y) * (1 - Math.exp(-dt * 3));
      const active = p.id === this.hoverId || p.id === this.highlightId;
      const sel = p.id === this.focusId;
      p.scale = lerp(p.scale, active ? 1.08 : 1, 1 - Math.exp(-dt * 10));
      p.group.scale.setScalar(p.scale);
      p.halo.material.opacity = lerp(p.halo.material.opacity, active || sel ? 0.5 : 0.22, 1 - Math.exp(-dt * 8));
      p.line.material.opacity = lerp(p.line.material.opacity, sel ? 0.55 : active ? 0.4 : 0.2, 1 - Math.exp(-dt * 6));
    }
    this.ship.update(t, motion);
    const shipActive = this.hoverId === this.shipId || this.highlightId === this.shipId;
    this.ship.craft.scale.setScalar(lerp(this.ship.craft.scale.x, shipActive ? 1.08 : 1, 1 - Math.exp(-dt * 10)));
    this.prince.update(t, motion, this.fly);

    this.updateCamera(now, dt);
    this.updatePrince(now);

    // anillo de selección
    const selObj = this.focusId === this.shipId ? this.ship : this.planets.find((p) => p.id === this.focusId);
    const ring = this.selRing;
    if (selObj && selObj !== this.ship) {
      selObj.group.getWorldPosition(ring.position);
      ring.lookAt(camPos);
      ring.scale.setScalar(selObj.R * 1.9 * selObj.scale);
      ring.material.opacity = lerp(ring.material.opacity, 0.32 + Math.sin(t * 2) * 0.1 * motion, 1 - Math.exp(-dt * 5));
    } else {
      ring.material.opacity = lerp(ring.material.opacity, 0, 1 - Math.exp(-dt * 6));
    }

    this.renderer.render(this.scene, this.camera);
    this.updateLabels();

    if (!this.readySent) {
      this.readySent = true;
      this.opts.onReady?.();
    }
  }

  // Rectángulos (relativos al lienzo) de lo que va encima de él: barra de herramientas, lista de planetas,
  // zoom, ficha y barra superior. Se leen como mucho cada 250 ms (no cambian cuadro a cuadro).
  coverRects(now) {
    if (this._covers && now - this._coversAt < 250) return this._covers;
    this._coversAt = now;
    const host = this.container.getBoundingClientRect();
    const root = this.container.closest(".universe") || document;
    // En pantalla completa la barra superior no se ve (queda detrás o fuera): no cuenta.
    const fs = !!document.fullscreenElement || !!this.container.closest(".is-fullscreen");
    const els = [...root.querySelectorAll(".universe-tools, .planet-index, .zoom"), document.querySelector(".sheet"), fs ? null : document.querySelector(".topbar:not(.is-hidden)")];
    this._covers = els.filter(Boolean).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ l: r.left - host.left, t: r.top - host.top, r: r.right - host.left, b: r.bottom - host.top }));
    return this._covers;
  }

  updateLabels() {
    const w = this.width, h = this.height;
    // Una etiqueta que caería (aunque sea en parte) debajo de esa interfaz se desvanece: antes asomaban
    // pedazos («…spi», media etiqueta bajo la barra) por sus bordes mientras los planetas orbitan.
    const covers = this.coverRects(performance.now());
    const sizes = this._labelSizes || (this._labelSizes = new Map());
    const place = (id, obj, R) => {
      const el = this.labels.get(id);
      obj.getWorldPosition(this._v);
      this._v.y += R * 1.35;
      this._v.project(this.camera);
      const off = this._v.z > 1 || Math.abs(this._v.x) > 1.2 || Math.abs(this._v.y) > 1.2;
      el.style.visibility = off ? "hidden" : "visible";
      if (off) return;
      const x = (this._v.x * 0.5 + 0.5) * w, y = (-this._v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      let sz = sizes.get(el);
      if (!sz) { sz = { w: el.offsetWidth, h: el.offsetHeight }; sizes.set(el, sz); }
      const L = x - sz.w / 2, T = y - sz.h, Rt = x + sz.w / 2;
      el.classList.toggle("is-covered", covers.some((c) => L < c.r && Rt > c.l && T < c.b && y > c.t));
      el.classList.toggle("is-hover", id === this.hoverId || id === this.highlightId);
      el.classList.toggle("is-active", id === this.focusId);
      el.classList.toggle("is-dim", !!this.focusId && id !== this.focusId);
    };
    this.planets.forEach((p) => place(p.id, p.group, p.R));
    place(this.shipId, this.ship.group, 1.6);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this._listeners.forEach((off) => off());
    this.ro?.disconnect();
    this.io?.disconnect();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    this.planets.forEach((p) => p.texture.dispose());
    clearCaches();
    this.renderer.dispose();
    // Suelta el contexto WebGL en el momento (el navegador admite pocos vivos a la vez; si no, se
    // acumulan al alternar lista/3D o al reintentar). Los eventos ya se quitaron arriba.
    if (!this.renderer.getContext().isContextLost()) this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labelLayer.remove();
  }
}
