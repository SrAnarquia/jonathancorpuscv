import * as THREE from "three";
import { watercolorTexture, glowTexture, qrTexture, starTexture } from "./textures.js";
export { prepareWatercolors } from "./textures.js";

// Cada planeta = esfera con textura de acuarela + una pequeña escena que cuenta su proyecto.
// Las geometrías y materiales se comparten mediante caché para no duplicarlos.

const geoCache = new Map();
const matCache = new Map();

export function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...opts }));
  }
  return matCache.get(key);
}

export function clearCaches() {
  geoCache.forEach((g) => g.dispose());
  matCache.forEach((m) => m.dispose());
  geoCache.clear();
  matCache.clear();
}

const box = (w, h, d) => geo(`box${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
const cyl = (rt, rb, h, s = 16) => geo(`cyl${rt}|${rb}|${h}|${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const sph = (r, ws = 20, hs = 14) => geo(`sph${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
const cone = (r, h, s = 12) => geo(`cone${r}|${h}|${s}`, () => new THREE.ConeGeometry(r, h, s));

const UP = new THREE.Vector3(0, 1, 0);

// Coloca un objeto sobre la superficie (lat/lon en grados) y lo orienta según la normal.
export function placeOnSurface(obj, R, lat, lon, lift = 0) {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  const n = new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
  obj.position.copy(n).multiplyScalar(R + lift);
  obj.quaternion.setFromUnitVectors(UP, n);
  return obj;
}

const CREAM = "#f4ecdc";
const GOLD = "#e2b04a";
const INK = "#3a4060";

// ---------- Escenas de cada planeta ----------

function robotScene(R) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(cyl(0.26, 0.32, 0.22), mat("#5d6680"));
  base.position.y = 0.05; // la base entra un poco en el planeta: sin rendija bajo el borde
  const yaw = new THREE.Group(); yaw.position.y = 0.16;
  const shoulder = new THREE.Group(); shoulder.position.y = 0.1;
  const j1 = new THREE.Mesh(sph(0.12), mat(GOLD));
  const a1 = new THREE.Mesh(box(0.13, 0.62, 0.13), mat(CREAM)); a1.position.y = 0.31;
  const elbow = new THREE.Group(); elbow.position.y = 0.62;
  const j2 = new THREE.Mesh(sph(0.1), mat(GOLD));
  const a2 = new THREE.Mesh(box(0.11, 0.5, 0.11), mat(CREAM)); a2.position.y = 0.25;
  const wrist = new THREE.Group(); wrist.position.y = 0.5;
  const f1 = new THREE.Mesh(box(0.04, 0.16, 0.06), mat(INK)); f1.position.set(-0.05, 0.08, 0);
  const f2 = f1.clone(); f2.position.x = 0.05;
  wrist.add(new THREE.Mesh(sph(0.07), mat(GOLD)), f1, f2);
  elbow.add(j2, a2, wrist);
  shoulder.add(j1, a1, elbow);
  yaw.add(shoulder);
  g.add(base, yaw);
  g.scale.setScalar(R * 0.55);
  placeOnSurface(g, R, 68, -28, -0.02);
  return {
    group: g,
    update(t) {
      yaw.rotation.y = Math.sin(t * 0.45) * 0.9;
      shoulder.rotation.z = -0.35 + Math.sin(t * 0.7) * 0.25;
      elbow.rotation.z = 1.0 + Math.sin(t * 0.95) * 0.35;
      wrist.rotation.z = -0.4 + Math.sin(t * 1.3) * 0.3;
    },
  };
}

function financeScene(R) {
  const g = new THREE.Group();
  const bars = new THREE.Group();
  const hs = [0.22, 0.36, 0.5, 0.7, 0.95];
  const BURY = 0.12; // cada barra entra un poco en el planeta: las de los extremos flotaban sobre su curva
  hs.forEach((h, i) => {
    const m = new THREE.Mesh(box(0.15, 1, 0.15), mat(i % 2 ? GOLD : CREAM));
    m.scale.y = h + BURY;
    m.position.set((i - 2) * 0.21, (h - BURY) / 2, 0);
    m.userData.h = h;
    bars.add(m);
  });
  bars.scale.setScalar(R * 0.6);
  placeOnSurface(bars, R, 70, -20, -0.02);
  const ring = new THREE.Mesh(
    geo(`ring${R}`, () => new THREE.RingGeometry(R * 1.45, R * 1.62, 96)),
    new THREE.MeshBasicMaterial({ color: "#f3dca0", transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2 + 0.38;
  g.add(bars, ring);
  return {
    group: g,
    update(t) {
      bars.children.forEach((b, i) => {
        const h = b.userData.h * (1 + 0.1 * Math.sin(t * 1.2 + i * 0.8));
        b.scale.y = h + BURY; b.position.y = (h - BURY) / 2;
      });
      ring.rotation.z = t * 0.05;
    },
  };
}

function mealScene(R) {
  const g = new THREE.Group();
  const sign = new THREE.Group();
  const post = new THREE.Mesh(cyl(0.035, 0.04, 0.5, 8), mat("#7a5a45"));
  post.position.y = 0.25;
  const tile = new THREE.Mesh(
    geo("qrplane", () => new THREE.PlaneGeometry(0.62, 0.62)),
    new THREE.MeshStandardMaterial({ map: qrTexture(11), roughness: 0.9, side: THREE.DoubleSide })
  );
  tile.position.y = 0.78;
  const frame = new THREE.Mesh(box(0.7, 0.7, 0.03), mat(GOLD));
  frame.position.set(0, 0.78, -0.02);
  sign.add(post, frame, tile);
  sign.scale.setScalar(R * 0.55);
  placeOnSurface(sign, R, 72, -10, -0.02);
  g.add(sign);
  // Arbolitos y un tazón
  const tree = (lat, lon, s) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(cyl(0.03, 0.04, 0.14, 6), mat("#7a5a45")); trunk.position.y = 0.07;
    const top = new THREE.Mesh(cone(0.13, 0.32, 8), mat("#6f9e78", { flatShading: true })); top.position.y = 0.28;
    t.add(trunk, top); t.scale.setScalar(s * R * 0.6);
    return placeOnSurface(t, R, lat, lon, -0.02);
  };
  g.add(tree(48, -60, 1), tree(40, -40, 0.75), tree(55, 70, 0.9));
  // Tazón con borde y comida (antes era media esfera sola y, de lado, parecía un cráter).
  const bowl = new THREE.Mesh(
    geo("bowl", () => new THREE.SphereGeometry(0.14, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
    mat("#d98a6a", { side: THREE.DoubleSide })
  );
  const bowlG = new THREE.Group(); bowl.position.y = 0.13;
  const bowlRim = new THREE.Mesh(geo("bowlRim", () => new THREE.TorusGeometry(0.14, 0.013, 6, 28)), mat("#e8a283"));
  bowlRim.rotation.x = Math.PI / 2; bowlRim.position.y = 0.13;
  const food = new THREE.Mesh(sph(0.125, 16, 8), mat(CREAM)); food.scale.y = 0.36; food.position.y = 0.12;
  const berry = new THREE.Mesh(sph(0.03, 10, 8), mat("#c9455a")); berry.position.set(0.035, 0.165, 0.02);
  const sprig = new THREE.Mesh(sph(0.032, 8, 6), mat("#6f9e78")); sprig.scale.set(1.3, 0.4, 0.8); sprig.position.set(-0.03, 0.163, -0.025);
  bowlG.add(bowl, bowlRim, food, berry, sprig);
  bowlG.scale.setScalar(R * 0.6);
  g.add(placeOnSurface(bowlG, R, 45, -95, -0.02));
  return { group: g, update(t) { sign.rotation.y = Math.sin(t * 0.5) * 0.35; } };
}

function supplyScene(R) {
  const g = new THREE.Group();
  const crateMat = mat("#c9a273");
  const stack = new THREE.Group();
  [[0, 0.15, 0], [0.32, 0.15, 0.05], [0.16, 0.45, 0.02]].forEach(([x, y, z], i) => {
    const c = new THREE.Mesh(box(0.3, 0.3, 0.3), crateMat);
    c.position.set(x - 0.16, y, z);
    c.rotation.y = i * 0.25;
    const edges = new THREE.LineSegments(
      geo("crateEdges", () => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.3, 0.3))),
      new THREE.LineBasicMaterial({ color: "#7a5a45" })
    );
    c.add(edges);
    stack.add(c);
  });
  stack.scale.setScalar(R * 0.6);
  placeOnSurface(stack, R, 68, -25, -0.02);
  // Cadena de cajas que orbitan
  const count = 16;
  const inst = new THREE.InstancedMesh(box(0.16, 0.16, 0.16), mat("#e8cfa0"), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const belt = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    p.set(Math.cos(a) * R * 1.55, 0, Math.sin(a) * R * 1.55);
    q.setFromEuler(new THREE.Euler(0.3 * i, a, 0.2 * i));
    m.compose(p, q, s);
    inst.setMatrixAt(i, m);
  }
  belt.add(inst);
  belt.rotation.x = 0.35; belt.rotation.z = -0.2;
  g.add(stack, belt);
  return { group: g, update(t) { inst.rotation.y = t * 0.18; } };
}

function gearGeometry(r = 0.3, teeth = 10) {
  return geo(`gear${r}${teeth}`, () => {
    const shape = new THREE.Shape();
    const inner = r * 0.78;
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2;
      const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
      const rr = i % 2 ? inner : r;
      if (i === 0) shape.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
      else shape.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
      shape.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, r * 0.3, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const gg = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false });
    gg.translate(0, 0, -0.035);
    return gg;
  });
}

function factoryScene(R) {
  const g = new THREE.Group();
  const f = new THREE.Group();
  // La base entra en el planeta (sin huecos bajo las esquinas) y los tres techos son de dos aguas,
  // con el vértice hacia arriba (antes el prisma quedaba de cabeza y se veían tres bloques con ranuras).
  const body = new THREE.Mesh(box(0.72, 0.44, 0.44), mat("#efe6d8"));
  body.position.y = 0.14;
  for (let i = 0; i < 3; i++) {
    const roof = new THREE.Mesh(cyl(0.12, 0.12, 0.44, 3), mat("#4b4566", { flatShading: true }));
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(-0.24 + i * 0.24, 0.42, 0);
    f.add(roof);
  }
  const win = new THREE.Mesh(box(0.5, 0.08, 0.01), mat("#f6d58c", { emissive: "#f6d58c", emissiveIntensity: 0.6 }));
  win.position.set(0, 0.2, 0.225);
  const puffs = [];
  [-0.22, 0.18].forEach((x, k) => {
    const ch = new THREE.Mesh(cyl(0.05, 0.06, 0.42, 10), mat("#c46b5b"));
    ch.position.set(x, 0.55, -0.12);
    f.add(ch);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(sph(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, roughness: 1, depthWrite: false }));
      p.userData = { x, phase: i / 4 + k * 0.13 };
      puffs.push(p);
      f.add(p);
    }
  });
  f.add(body, win);
  f.scale.setScalar(R * 0.55);
  placeOnSurface(f, R, 66, -30, -0.03);
  const gear = new THREE.Mesh(gearGeometry(0.3, 10), mat(GOLD, { metalness: 0.2, roughness: 0.6 }));
  // Montado en un eje con su poste: suelto, de lejos parecía flotar junto al planeta.
  const axle = new THREE.Mesh(cyl(0.06, 0.06, 0.17, 14), mat("#5d6680"));
  axle.rotation.x = Math.PI / 2; axle.position.y = 0.32;
  const gearPost = new THREE.Mesh(cyl(0.035, 0.05, 0.36, 8), mat("#5d6680"));
  gearPost.position.set(0, 0.14, -0.07);
  const gearG = new THREE.Group(); gear.position.y = 0.32; gearG.add(gearPost, axle, gear);
  gearG.scale.setScalar(R * 0.55);
  placeOnSurface(gearG, R, 50, 68, -0.02); // a la derecha del sitio donde aterriza el principito (58, 34), que antes quedaba encima
  g.add(f, gearG);
  return {
    group: g,
    update(t) {
      gear.rotation.z = t * 0.6;
      puffs.forEach((p) => {
        const k = (t * 0.25 + p.userData.phase) % 1;
        p.position.set(p.userData.x + k * 0.12, 0.8 + k * 0.55, -0.12);
        p.scale.setScalar(0.6 + k * 1.2);
        p.material.opacity = 0.75 * (1 - k);
      });
    },
  };
}

function scadaScene(R) {
  const g = new THREE.Group();
  const t = new THREE.Group();
  const tower = new THREE.Mesh(cyl(0.03, 0.08, 0.6, 6), mat("#5d6680"));
  tower.position.y = 0.3;
  const head = new THREE.Group(); head.position.y = 0.62;
  const dish = new THREE.Mesh(
    geo("dish", () => new THREE.SphereGeometry(0.3, 24, 10, 0, Math.PI * 2, 0, Math.PI / 3.2)),
    mat(CREAM, { side: THREE.DoubleSide })
  );
  dish.rotation.x = -Math.PI / 2 - 0.5;
  // El dorso del plato apoya en la punta del mástil (antes flotaba detrás de ella) y un brazo
  // sostiene el alimentador, que antes era una bolita suelta delante del plato.
  const aim = new THREE.Vector3(0, Math.sin(0.5), Math.cos(0.5)); // hacia donde mira el plato
  dish.position.copy(aim).multiplyScalar(0.3);
  const feedArm = new THREE.Mesh(cyl(0.012, 0.012, 0.25, 6), mat("#5d6680"));
  feedArm.quaternion.setFromUnitVectors(UP, aim);
  feedArm.position.copy(aim).multiplyScalar(0.125);
  const mount = new THREE.Mesh(sph(0.045, 12, 8), mat("#5d6680"));
  const tip = new THREE.Mesh(sph(0.04), mat("#ff9a5a", { emissive: "#ff9a5a", emissiveIntensity: 1 }));
  tip.position.copy(aim).multiplyScalar(0.25);
  head.add(dish, feedArm, mount, tip);
  t.add(tower, head);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      geo("sig", () => new THREE.RingGeometry(0.3, 0.33, 48)),
      new THREE.MeshBasicMaterial({ color: "#ffd9a8", transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
    );
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.7;
    r.userData.phase = i / 3;
    rings.push(r); t.add(r);
  }
  t.scale.setScalar(R * 0.6);
  placeOnSurface(t, R, 70, -15, -0.02);
  g.add(t);
  return {
    group: g,
    update(time) {
      head.rotation.y = time * 0.5;
      rings.forEach((r) => {
        const k = (time * 0.35 + r.userData.phase) % 1;
        r.scale.setScalar(0.4 + k * 3.2);
        r.material.opacity = 0.55 * (1 - k);
      });
    },
  };
}

function healthScene(R) {
  const g = new THREE.Group();
  const rose = new THREE.Group();
  const stem = new THREE.Mesh(cyl(0.015, 0.02, 0.42, 6), mat("#4f7d5c"));
  stem.position.y = 0.21;
  const leafGeo = sph(0.06, 10, 6);
  const l1 = new THREE.Mesh(leafGeo, mat("#6f9e78")); l1.scale.set(1.4, 0.35, 0.7); l1.position.set(0.06, 0.16, 0); l1.rotation.z = 0.5;
  const l2 = l1.clone(); l2.position.x = -0.06; l2.rotation.z = -0.5;
  const bloom = new THREE.Group(); bloom.position.y = 0.46;
  const petalMat = mat("#c9455a");
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(sph(0.065, 12, 8), petalMat);
    const a = (i / 6) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.045, (i % 2) * 0.02, Math.sin(a) * 0.045);
    p.scale.set(0.9, 1.25, 0.9);
    bloom.add(p);
  }
  const bud = new THREE.Mesh(cone(0.05, 0.12, 10), mat("#a83246")); bud.position.y = 0.06; bloom.add(bud);
  const dome = new THREE.Mesh(
    geo("dome", () => new THREE.SphereGeometry(0.36, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)),
    new THREE.MeshStandardMaterial({ color: "#e8f4ff", transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0.1, depthWrite: false })
  );
  dome.scale.y = 1.6;
  rose.add(stem, l1, l2, bloom, dome);
  rose.scale.setScalar(R * 0.62);
  placeOnSurface(rose, R, 70, -18, -0.02);
  // Onda tipo EEG que rodea al planeta
  const N = 220;
  const pos = new Float32Array(N * 3);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const wave = new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: "#ffe1ea", transparent: true, opacity: 0.6 }));
  wave.rotation.x = 0.4;
  g.add(rose, wave);
  return {
    group: g,
    update(t) {
      const rr = R * 1.5;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const spike = Math.pow(Math.max(0, Math.sin(a * 9 - t * 2)), 12) * 0.35;
        const y = Math.sin(a * 24 + t * 3) * 0.05 + spike * R * 0.5;
        pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * rr;
      }
      lg.attributes.position.needsUpdate = true;
      bloom.rotation.y = Math.sin(t * 0.4) * 0.2;
    },
  };
}

function vrScene(R) {
  const g = new THREE.Group();
  const cage = new THREE.LineSegments(
    geo(`cage${R}`, () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(R * 1.42, 1))),
    new THREE.LineBasicMaterial({ color: "#c9f1f0", transparent: true, opacity: 0.32 })
  );
  const hs = new THREE.Group();
  const shell = new THREE.Mesh(box(0.5, 0.24, 0.22), mat("#2e3a52"));
  shell.position.y = 0.32;
  const lensMat = mat("#7fe0e0", { emissive: "#58c9cc", emissiveIntensity: 0.9 });
  const lens1 = new THREE.Mesh(cyl(0.07, 0.07, 0.03, 16), lensMat);
  lens1.rotation.x = Math.PI / 2; lens1.position.set(-0.11, 0.32, 0.12);
  const lens2 = lens1.clone(); lens2.position.x = 0.11;
  const strap = new THREE.Mesh(geo("strap", () => new THREE.TorusGeometry(0.26, 0.025, 6, 24, Math.PI)), mat(GOLD));
  strap.position.y = 0.32; strap.rotation.x = Math.PI / 2; strap.rotation.z = Math.PI;
  const stand = new THREE.Mesh(cyl(0.03, 0.05, 0.24, 6), mat("#5d6680")); stand.position.y = 0.12;
  // Carcasa, lentes y correa flotan juntas (antes solo subía la carcasa y las lentes se despegaban).
  const visor = new THREE.Group();
  visor.add(shell, lens1, lens2, strap);
  hs.add(stand, visor);
  hs.scale.setScalar(R * 0.6);
  placeOnSurface(hs, R, 70, -20, -0.02);
  g.add(cage, hs);
  return {
    group: g,
    update(t) {
      cage.rotation.y = t * 0.06; cage.rotation.x = Math.sin(t * 0.1) * 0.1;
      visor.position.y = Math.sin(t * 1.5) * 0.02;
    },
  };
}

function genericScene(R) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    geo(`gring${R}`, () => new THREE.RingGeometry(R * 1.4, R * 1.5, 80)),
    new THREE.MeshBasicMaterial({ color: "#f3dca0", transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2 + 0.3;
  g.add(ring);
  return { group: g, update() {} };
}

const SCENES = {
  robot: robotScene, finance: financeScene, meal: mealScene, supply: supplyScene,
  factory: factoryScene, scada: scadaScene, health: healthScene, vr: vrScene, generic: genericScene,
};

const SIZES = { robot: 1.7, finance: 1.85, meal: 1.6, supply: 1.85, factory: 2.0, scada: 1.7, health: 1.8, vr: 2.05 };

// Colores y semilla de la acuarela de cada planeta (los mismos para pintarla por adelantado).
export function planetPaint(project, index) {
  const { color, color2 } = project.planet;
  return [color, color2 || color, index + 3];
}

export function buildPlanet(project, index) {
  const { kind = "generic", color } = project.planet;
  const R = SIZES[kind] || 1.8;
  const group = new THREE.Group();

  const tex = watercolorTexture(...planetPaint(project, index));
  const body = new THREE.Mesh(
    geo("planet", () => new THREE.SphereGeometry(1, 48, 32)),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 })
  );
  body.scale.setScalar(R);
  body.rotation.z = 0.25;

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.setScalar(R * 3.6);

  // La "cara" del planeta (decoración y principito) mira siempre hacia la cámara.
  const face = new THREE.Group();
  const scene = (SCENES[kind] || genericScene)(R);
  face.add(scene.group);

  const hit = new THREE.Mesh(sph(1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.scale.setScalar(R * 1.7);
  hit.userData.id = project.id;

  group.add(halo, body, face, hit);
  return { id: project.id, group, body, halo, face, hit, R, update: scene.update, texture: tex };
}

// ---------- La nave ----------
// Casco elipsoidal (semiejes 2.3 × 1 × 1, nariz hacia +x). Lo que va pegado al casco (aletas,
// ventanilla, tobera) se calcula sobre su superficie para que nada flote ni lo atraviese.
const HULL_A = 2.3;
const hullRadius = (x) => Math.sqrt(Math.max(0, 1 - (x / HULL_A) ** 2));

export function buildShip() {
  const g = new THREE.Group();
  const craft = new THREE.Group();
  const body = new THREE.Mesh(sph(1, 40, 24), mat("#ee9fb2"));
  body.scale.set(HULL_A, 1, 1);

  // Ventanilla: ojo de buey al ras del casco (aro dorado y cristal abombado), orientado con la normal
  // real del elipsoide; antes la esfera y el aro se hundían de forma dispareja.
  const wx = 0.75, wa = THREE.MathUtils.degToRad(52), wr = hullRadius(wx);
  const wp = new THREE.Vector3(wx, wr * Math.cos(wa), wr * Math.sin(wa));
  const wn = new THREE.Vector3(wp.x / (HULL_A * HULL_A), wp.y, wp.z).normalize();
  const port = new THREE.Group();
  port.position.copy(wp).addScaledVector(wn, -0.02);
  port.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), wn);
  const win = new THREE.Mesh(sph(0.28, 24, 16), mat("#bfe3f5", { emissive: "#9fd3ef", emissiveIntensity: 0.45, roughness: 0.25 }));
  win.scale.z = 0.42;
  const winRim = new THREE.Mesh(geo("portRim", () => new THREE.TorusGeometry(0.3, 0.05, 10, 36)), mat(GOLD));
  port.add(win, winRim);

  const stripe = new THREE.Mesh(geo("stripe", () => new THREE.TorusGeometry(1, 0.05, 8, 64)), mat(CREAM));
  stripe.rotation.y = Math.PI / 2; stripe.position.x = -0.9; stripe.scale.set(0.93, 0.93, 1);

  // Aletas: tres a 120° (una arriba y dos abajo), iguales y simétricas. El perfil se mide desde el eje
  // de la nave y su raíz sigue la curva del casco un poco por dentro, así que cada aleta nace de la
  // superficie en todo su largo. (Antes una de las de abajo estaba girada hacia dentro: su punta salía
  // por el centro de la parte trasera, en el resplandor del motor.)
  const finMat = mat("#f0c35a", { flatShading: true });
  const finGeo = geo("hullFin", () => {
    const x0 = -1.15, x1 = -2.2, inset = 0.05, n = 8;
    const s = new THREE.Shape();
    s.moveTo(x0, hullRadius(x0) - inset);
    s.quadraticCurveTo(-1.95, 0.98, -2.45, 1.55); // borde de ataque hasta la punta
    s.lineTo(x1, hullRadius(x1) * 0.6);           // borde de salida, hasta dentro de la tobera
    for (let i = 1; i < n; i++) {                  // raíz: sigue el casco por dentro
      const x = x1 + ((x0 - x1) * i) / n;
      s.lineTo(x, hullRadius(x) - inset);
    }
    const fg = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 10 });
    fg.translate(0, 0, -0.035); // grosor centrado en el plano de la aleta
    return fg;
  });
  const fins = [0, (2 * Math.PI) / 3, (-2 * Math.PI) / 3].map((a) => {
    const f = new THREE.Mesh(finGeo, finMat);
    f.rotation.x = a;
    return f;
  });
  const nose = new THREE.Mesh(cone(0.3, 0.6, 16), finMat); nose.rotation.z = -Math.PI / 2; nose.position.x = 2.4;

  // Tobera: el resplandor del motor sale de ella (antes salía del casco desnudo).
  const nozzle = new THREE.Mesh(cyl(0.34, 0.24, 0.4, 24), [
    mat("#9a6b3a", { metalness: 0.35, roughness: 0.45 }),
    new THREE.MeshBasicMaterial({ color: "#ffb35c" }), // boca encendida
    mat("#9a6b3a", { metalness: 0.35, roughness: 0.45 }),
  ]);
  nozzle.rotation.z = Math.PI / 2; nozzle.position.x = -2.33; // boca ancha hacia atrás, en x ≈ −2.53
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: "#ffcf7a", transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  flame.position.x = -2.75; flame.scale.set(2.4, 1.6, 1);
  craft.add(body, port, stripe, ...fins, nose, nozzle, flame);

  // Estela de polvo dorado
  const N = 90;
  const tpos = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) seeds[i] = Math.random();
  const tg = new THREE.BufferGeometry();
  tg.setAttribute("position", new THREE.BufferAttribute(tpos, 3));
  const trail = new THREE.Points(tg, new THREE.PointsMaterial({
    color: "#ffd98a", size: 0.14, map: glowTexture(), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  g.add(craft, trail);

  const hit = new THREE.Mesh(sph(1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.scale.set(3.4, 2.2, 2.2);
  g.add(hit);

  return {
    group: g, craft, hit, R: 2.2,
    update(t, motion) {
      craft.position.y = Math.sin(t * 0.9) * 0.25 * motion;
      craft.rotation.z = Math.sin(t * 0.6) * 0.06 * motion;
      craft.rotation.x = Math.sin(t * 0.45) * 0.05 * motion;
      flame.material.opacity = 0.7 + Math.sin(t * 9) * 0.15 * motion;
      for (let i = 0; i < N; i++) {
        const k = (seeds[i] + t * 0.12 * (0.6 + seeds[i])) % 1;
        tpos[i * 3] = -2.6 - k * 9;
        tpos[i * 3 + 1] = Math.sin(seeds[i] * 40 + k * 6) * k * 0.9 + craft.position.y * (1 - k);
        tpos[i * 3 + 2] = Math.cos(seeds[i] * 70 + k * 5) * k * 0.9;
      }
      tg.attributes.position.needsUpdate = true;
    },
  };
}

// ---------- El principito ----------
export function buildPrince() {
  const g = new THREE.Group();
  const coat = new THREE.Mesh(cone(0.2, 0.46, 14), mat("#4f8a6a"));
  coat.position.y = 0.3;
  const belt = new THREE.Mesh(cyl(0.12, 0.13, 0.04, 14), mat(GOLD)); belt.position.y = 0.33;
  const legL = new THREE.Mesh(cyl(0.035, 0.035, 0.12, 6), mat("#efe6d8")); legL.position.set(-0.06, 0.06, 0);
  const legR = legL.clone(); legR.position.x = 0.06;
  const head = new THREE.Mesh(sph(0.14, 20, 14), mat("#f6dcc0"));
  head.position.y = 0.66;
  const hair = new THREE.Group(); hair.position.y = 0.74;
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(cone(0.05, 0.14, 6), mat("#f0c35a", { flatShading: true }));
    const a = (i / 7) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.08, 0.02, Math.sin(a) * 0.08);
    s.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
    hair.add(s);
  }
  // Bufanda: nudo al cuello y una cinta que se afina y ondula hacia la punta. La cinta gira desde su
  // raíz, dentro del nudo (antes era una barra que giraba por su centro y se separaba del cuello).
  const SCARF = "#f2c84b";
  const scarf = new THREE.Group(); scarf.position.set(0, 0.53, 0);
  const knot = new THREE.Mesh(cyl(0.09, 0.1, 0.06, 12), mat(SCARF)); scarf.add(knot);
  const tail = new THREE.Group(); tail.position.set(-0.07, 0, -0.05);
  const ribbon = new THREE.Mesh(geo("scarfRibbon", () => {
    const len = 0.38;
    const rg = new THREE.PlaneGeometry(1, 1, 12, 1);
    const pos = rg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + 0.5;  // 0 en el nudo, 1 en la punta
      const w = 0.085 - 0.055 * u;  // se afina hacia la punta
      pos.setXYZ(i, -u * len, pos.getY(i) * w - u * u * 0.03, Math.sin(u * Math.PI * 1.5) * 0.03 * u);
    }
    rg.computeVertexNormals();
    return rg;
  }), mat(SCARF, { side: THREE.DoubleSide }));
  tail.add(ribbon);
  scarf.add(tail);
  // Brazos: hombro redondeado bajo la bufanda, manga del abrigo en dos tramos (brazo y antebrazo con
  // un leve codo), puño dorado y mano. En reposo cuelgan algo separados del abrigo con las manos
  // hacia el frente, a la altura del cinturón; el derecho se alza para sujetar los hilos de las estrellas.
  const COAT = "#4f8a6a", SKIN = "#f6dcc0";
  const buildArm = (side) => {
    const arm = new THREE.Group(); arm.position.set(side * 0.085, 0.485, 0.01);
    const shoulder = new THREE.Mesh(sph(0.046, 12, 10), mat(COAT));
    const upper = new THREE.Mesh(cyl(0.03, 0.036, 0.15, 10), mat(COAT)); upper.position.y = 0.075;
    const elbow = new THREE.Group(); elbow.position.y = 0.15;
    const fore = new THREE.Mesh(cyl(0.026, 0.03, 0.13, 10), mat(COAT)); fore.position.y = 0.065;
    const cuff = new THREE.Mesh(cyl(0.031, 0.031, 0.02, 10), mat(GOLD)); cuff.position.y = 0.125;
    const hand = new THREE.Mesh(sph(0.037, 10, 8), mat(SKIN)); hand.position.y = 0.15;
    elbow.add(fore, cuff, hand);
    arm.add(shoulder, upper, elbow);
    return { arm, elbow, hand };
  };
  const armR = buildArm(1), armL = buildArm(-1);
  // Reposo: el brazo cae 22° separado del cuerpo y el antebrazo gira hacia dentro y al frente.
  const ARM_DOWN = Math.PI - 0.38, ARM_UP = 0.35, ELBOW_Z = 0.6, ELBOW_X = 0.5;
  const pose = (fly) => {
    armR.arm.rotation.set(0, 0, -ARM_DOWN + (ARM_DOWN - ARM_UP) * fly);
    armR.elbow.rotation.set(ELBOW_X * (1 - fly), 0, -ELBOW_Z * (1 - fly));
    armL.arm.rotation.set(-0.45 * fly, 0, ARM_DOWN);
    armL.elbow.rotation.set(ELBOW_X * (1 - 0.6 * fly), 0, ELBOW_Z * (1 - 0.6 * fly));
  };
  pose(0);
  g.add(legL, legR, coat, belt, head, hair, scarf, armR.arm, armL.arm);
  return {
    group: g,
    hand: armR.hand,
    // fly: 0..1, cuánto está volando (brazo derecho en alto, izquierdo hacia atrás y bufanda al viento).
    update(t, motion, fly = 0) {
      tail.rotation.z = 0.15 + Math.sin(t * 5) * 0.12 * motion - fly * 0.45; // en vuelo se alza al viento
      tail.rotation.y = Math.sin(t * 3.3) * (0.25 + fly * 0.35) * motion;
      pose(fly);
    },
  };
}

// ---------- Las estrellitas amarradas ----------
// Un ramillete de estrellas atadas con hilos a la mano del principito: lo alzan y lo llevan
// de planeta en planeta (como las aves de la ilustración). Vive en coordenadas de mundo.
export function buildStarKite() {
  const g = new THREE.Group();
  g.visible = false;
  const N = 11;
  const tex = starTexture();
  const stars = [];
  for (let i = 0; i < N; i++) {
    const spread = (i / (N - 1) - 0.5) * 2; // -1..1, de un lado al otro del abanico
    const base = new THREE.Vector3(
      spread * 1.1,
      1.15 + (1 - Math.abs(spread)) * 1.05 + ((i * 3) % 4) * 0.15,
      0.5 + Math.abs(spread) * 0.35 + ((i * 5) % 3) * 0.2 // algo adelantadas (unos 60°): van sobre él, no tirando por delante
    );
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, color: i % 3 ? "#fff1c9" : "#ffd36e", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.position.copy(base);
    sp.userData = { base, size: 0.3 + ((i * 7) % 5) * 0.05, phase: i * 1.7 };
    g.add(sp);
    stars.push(sp);
  }
  // Hilos: un segmento por estrella, desde la mano (origen del grupo) hasta cada una.
  const lpos = new Float32Array(N * 2 * 3);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: "#fff3d6", transparent: true, opacity: 0, depthWrite: false }));
  lines.frustumCulled = false; // los hilos cambian cada cuadro; no recortar por su caja inicial
  g.add(lines);
  const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
  return {
    group: g,
    // hand: mano en coordenadas de mundo; dir: rumbo del viaje; up: arriba del principito;
    // fly: 0..1 intensidad del vuelo; release: 0..1 las estrellas se sueltan al aterrizar; e: avance del viaje.
    update(t, hand, dir, up, fly, release, e) {
      g.visible = fly > 0.01;
      if (!g.visible) return;
      g.position.copy(hand);
      _y.copy(up).normalize();
      _z.copy(dir).addScaledVector(_y, -dir.dot(_y));
      if (_z.lengthSq() < 1e-6) _z.set(0, 0, 1);
      _z.normalize();
      _x.crossVectors(_y, _z).normalize();
      _m.makeBasis(_x, _y, _z);
      g.quaternion.setFromRotationMatrix(_m);
      g.rotateX(-0.18 + 0.36 * e); // al despegar tiran un poco hacia atrás y arriba; al llegar, apenas hacia adelante
      for (let i = 0; i < N; i++) {
        const s = stars[i], u = s.userData;
        s.position.set(
          u.base.x + Math.sin(t * 2.1 + u.phase) * 0.12,
          u.base.y + Math.cos(t * 1.6 + u.phase) * 0.1 + release * 2.2,
          u.base.z + Math.sin(t * 2.7 + u.phase) * 0.09 + release * 0.6
        );
        s.scale.setScalar(u.size * (1 + Math.sin(t * 5 + u.phase) * 0.16));
        s.material.opacity = fly * (0.8 + Math.sin(t * 4 + u.phase) * 0.2);
        lpos[i * 6 + 3] = s.position.x; lpos[i * 6 + 4] = s.position.y; lpos[i * 6 + 5] = s.position.z;
      }
      lg.attributes.position.needsUpdate = true;
      lines.material.opacity = fly * 0.75 * (1 - release);
    },
  };
}
