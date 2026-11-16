// Visor de un modelo 3D dentro del visor de evidencias (V6.16): un glTF con su .bin (y sus texturas,
// si las tiene) en archivos aparte, que se gira con el dedo o el ratón (OrbitControls) y se acerca
// con pellizco o rueda. Se descarga y se crea solo al abrir esa evidencia, y al salir de ella se
// libera todo: geometría, texturas, el entorno de luz y el contexto WebGL.
//
// Por qué archivos aparte y no un .glb: la CSP del sitio no permite `blob:`, y GLTFLoader usa una
// URL blob: para las texturas que van dentro de un .glb. Con texturas en su propio archivo las pide
// con fetch al mismo origen (connect-src 'self'). Tampoco hay Draco ni meshopt: sus decodificadores
// necesitan WebAssembly, que la CSP tampoco permite; el modelo va cuantizado (KHR_mesh_quantization),
// que three.js lee sin decodificador.
//
// V6.22, para que en celular se sienta fluido:
// - La luz de estudio llega ya calculada y los shaders se compilan sin bloquear la página: la primera
//   apertura ya no congela unos 3 s los equipos con gráficos integrados. Mientras tanto se ve la imagen fija.
// - Con el dedo, el modelo sigue al dedo y se queda donde lo sueltas (sin inercia). Con el ratón, una inercia
//   breve que termina en cuanto deja de verse.
// - En pantallas táctiles se dibuja a 1.5× como mucho (antes 2×): casi la mitad de píxeles por cuadro.
// - Gira solo 12 s al abrirse para mostrar que es 3D, y se detiene; si lo tocas antes, se detiene antes.
// - El aviso de «soltar» llega siempre a OrbitControls (ver ModelView.jsx).
import {
  ACESFilmicToneMapping, Box3, Color, CubeUVReflectionMapping, DataTexture, DirectionalLight, HalfFloatType,
  HemisphereLight, LinearFilter, LinearSRGBColorSpace, MathUtils, PerspectiveCamera, PMREMGenerator, Quaternion,
  RGBAFormat, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Dirección desde la que se mira al empezar: de tres cuartos y un poco desde arriba, con la pinza a la
// derecha, como en su póster (V6.17).
const VIEW_DIR = new Vector3(1, 0.3, 0.5).normalize();

// Cuánto gira solo al abrirse, antes de detenerse (V6.22).
const AUTO_SPIN_MS = 12000;
// Inercia con el ratón: lo que se frena en cada cuadro a 60 por segundo (V6.22). Se ajusta al tiempo real de
// cada cuadro para que dure lo mismo (medio segundo) en un equipo que dibuja menos cuadros por segundo.
const DAMPING_60FPS = 0.12;

// Luz de estudio ya calculada (V6.22). Hasta la V6.21 el visor la generaba al abrirse (PMREMGenerator con
// RoomEnvironment): el resultado era siempre el mismo, pero compilar los shaders que la generan era lo que
// congelaba la página. Ahora se hace una vez con assets-src/entorno/hornear-entorno.cjs y se guardan sus
// niveles de 16 px (336 × 32 en media precisión, 84 KB), los únicos que leen los materiales con rugosidad de
// 0.21 o más, como los del brazo. En una textura de 336 × 64, three.js los encuentra en el mismo lugar y el
// resultado es el mismo. Se descarga una vez por visita; si falla, el fallo no se guarda y el visor la genera
// como antes.
const ENV_URL = "/modelos/entorno-estudio.bin";
const ENV_WIDTH = 336; // 3 × 16 × 7: el nivel de 16 px y los 6 niveles más difusos, uno junto a otro
const ENV_ROWS = 32; // dos filas de caras de 16 px
const ENV_HEIGHT = 64; // alto con el que three.js ubica esos niveles (las 32 filas de arriba no se leen)
let envRequest = null;

function requestEnvironment() {
  envRequest ??= fetch(ENV_URL)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`entorno: HTTP ${r.status}`))))
    .then((buf) => {
      if (buf.byteLength !== ENV_WIDTH * ENV_ROWS * 8) throw new Error("entorno: tamaño inesperado");
      return new Uint16Array(buf);
    })
    .catch((err) => {
      envRequest = null;
      throw err;
    });
  return envRequest;
}

function bakedEnvironment(halfs) {
  const data = new Uint16Array(ENV_WIDTH * ENV_HEIGHT * 4);
  data.set(halfs);
  const tex = new DataTexture(data, ENV_WIDTH, ENV_HEIGHT, RGBAFormat, HalfFloatType);
  tex.mapping = CubeUVReflectionMapping;
  tex.colorSpace = LinearSRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function disposeObject(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const v of Object.values(m)) {
        if (v?.isTexture) {
          v.source?.data?.close?.(); // los ImageBitmap no se liberan solos
          v.dispose();
        }
      }
      m.dispose();
    }
  });
}

// `coarse`: la entrada principal es una pantalla táctil (V6.22).
export function createModelViewer(canvas, { src, background = "#0b1022", reducedMotion = false, coarse = false, onReady, onError, onInteract } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  } catch (err) {
    onError?.(err);
    return { dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  scene.background = new Color(background);
  // Luz de estudio (el entorno, que llega con el modelo) más una luz principal para que el plástico negro brille.
  scene.add(new HemisphereLight(0xffffff, 0x1c2a48, 0.5));
  const key = new DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 4);
  scene.add(key);

  const camera = new PerspectiveCamera(32, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  // Sin inercia con el dedo: el modelo gira lo mismo que el dedo y se queda donde lo sueltas (V6.22).
  controls.enableDamping = !reducedMotion && !coarse;
  controls.dampingFactor = DAMPING_60FPS;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 1.4;

  let model = null;
  let envTexture = null;
  let pmrem = null; // solo si la luz se genera aquí (respaldo)
  let halfHeight = 1; // medio alto del modelo
  let ringRadius = 1; // radio del cilindro vertical que lo envuelve al girar
  let touched = false;
  let dragging = false;
  let ready = false; // no se dibuja hasta que los shaders estén compilados
  let disposed = false;
  let frame = 0;
  let spinTimer = 0;
  controls.addEventListener("start", () => {
    controls.autoRotate = false; // en cuanto la persona lo toca, deja de girar solo
    touched = true;
    dragging = true;
    onInteract?.();
  });
  controls.addEventListener("end", () => { dragging = false; });

  // Distancia para que el modelo quepa entero mientras gira sobre sí mismo, también en un escenario más
  // alto que ancho (celular): se encuadra el cilindro vertical que lo envuelve, no su caja (que al girar
  // se saldría por los lados) ni su esfera (que lo dejaría muy pequeño).
  const fitDistance = () => {
    const vfov = MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const byWidth = ringRadius / Math.sin(hfov / 2);
    const byHeight = halfHeight / Math.tan(vfov / 2) + ringRadius;
    return Math.max(byWidth, byHeight) * 1.05;
  };
  const frameModel = () => {
    const dist = fitDistance();
    const dir = touched ? camera.position.clone().sub(controls.target).normalize() : VIEW_DIR;
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    camera.near = dist / 50;
    camera.far = dist * 10;
    camera.updateProjectionMatrix();
    controls.minDistance = dist * 0.45;
    controls.maxDistance = dist * 1.6;
    controls.update();
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (model && !touched) frameModel();
    if (ready) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let dirty = true;
  const show = () => {
    if (disposed) return;
    ready = true;
    dirty = false;
    renderer.render(scene, camera);
    onReady?.();
    if (controls.autoRotate) spinTimer = setTimeout(() => { controls.autoRotate = false; }, AUTO_SPIN_MS);
  };

  // El modelo y la luz se piden a la vez.
  const environment = requestEnvironment().then(bakedEnvironment, () => {
    if (disposed) return null;
    // Respaldo, como hasta la V6.21: generar la luz aquí (en equipos modestos congela unos segundos la primera vez).
    pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const tex = pmrem.fromScene(room, 0.04).texture;
    disposeObject(room);
    return tex;
  });
  const loaded = new Promise((resolve, reject) => { new GLTFLoader().load(src, resolve, undefined, reject); });

  Promise.all([loaded, environment]).then(
    ([gltf, env]) => {
      if (disposed) {
        disposeObject(gltf.scene);
        env?.dispose();
        return;
      }
      envTexture = env;
      scene.environment = env;
      model = gltf.scene;
      scene.add(model);
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      halfHeight = size.y / 2;
      ringRadius = Math.hypot(size.x, size.z) / 2;
      controls.target.copy(box.getCenter(new Vector3()));
      resize();
      frameModel();
      // Como en el universo (UniverseScene): donde el navegador compila shaders en paralelo, se compilan en
      // segundo plano y el primer cuadro se dibuja cuando están listos (si algo lo retrasa, a los 3 s se dibuja
      // igual); donde no, el primer cuadro va en su propia tarea. Mientras, sigue la imagen fija con «Cargando…».
      if (renderer.extensions.has("KHR_parallel_shader_compile")) {
        Promise.race([renderer.compileAsync(scene, camera), new Promise((r) => { setTimeout(r, 3000); })]).then(show, show);
      } else {
        setTimeout(show, 0);
      }
    },
    (err) => { if (!disposed) onError?.(err); },
  );

  // Solo se vuelve a dibujar cuando la cámara cambia: al girar solo, mientras amortigua el giro y al
  // arrastrar. OrbitControls avisa con «change» también cuando aplica el arrastre por su cuenta, que es
  // lo que pasa sin amortiguación (con el dedo o con movimiento reducido): ahí su update() del cuadro ya no
  // ve cambios.
  controls.addEventListener("change", () => { dirty = true; });
  const prevQuat = new Quaternion();
  const prevPos = new Vector3();
  let last = 0;
  const tick = (time) => {
    frame = requestAnimationFrame(tick);
    if (!ready || document.hidden) { last = 0; return; }
    // Segundos desde el cuadro anterior (como mucho 0.1): el giro automático y la inercia van por tiempo, no
    // por cuadro, así que una pantalla de 120 Hz no gira el doble de rápido ni un equipo lento frena más tarde.
    const dt = last ? Math.min((time - last) / 1000, 0.1) : 1 / 60;
    last = time;
    if (controls.enableDamping) controls.dampingFactor = 1 - (1 - DAMPING_60FPS) ** (dt * 60);
    prevQuat.copy(camera.quaternion);
    prevPos.copy(camera.position);
    const moved = controls.update(dt);
    // Fin de la inercia (V6.22): cuando lo que falta girar ya no se ve (menos de 0.02° por cuadro), se aplica
    // de una vez y se deja de dibujar. Antes OrbitControls seguía dibujando segundos de giros invisibles, cada
    // cuadro igual de caro, y en celular la página se sentía pegada justo al soltar.
    if (moved && !dragging && !controls.autoRotate && controls.enableDamping) {
      const dist = camera.position.distanceTo(controls.target) || 1;
      if (prevQuat.angleTo(camera.quaternion) < 3e-4 && prevPos.distanceTo(camera.position) < 3e-4 * dist) {
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = true;
      }
    }
    if (dirty) {
      dirty = false;
      renderer.render(scene, camera);
    }
  };
  frame = requestAnimationFrame(tick);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(spinTimer);
      ro.disconnect();
      controls.dispose();
      disposeObject(scene);
      envTexture?.dispose();
      pmrem?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
