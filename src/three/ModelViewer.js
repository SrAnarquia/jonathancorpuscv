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
import {
  ACESFilmicToneMapping, Box3, Color, DirectionalLight, HemisphereLight, MathUtils,
  PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Dirección desde la que se mira al empezar: de tres cuartos y un poco desde arriba, con la pinza a la
// derecha, como en su póster (V6.17).
const VIEW_DIR = new Vector3(1, 0.3, 0.5).normalize();

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

export function createModelViewer(canvas, { src, background = "#0b1022", reducedMotion = false, onReady, onError, onInteract } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  } catch (err) {
    onError?.(err);
    return { dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  scene.background = new Color(background);
  // Luz de estudio generada (sin descargar un HDR) más una luz principal para que el plástico negro brille.
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTexture = pmrem.fromScene(room, 0.04).texture;
  disposeObject(room);
  scene.environment = envTexture;
  scene.add(new HemisphereLight(0xffffff, 0x1c2a48, 0.5));
  const key = new DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 4);
  scene.add(key);

  const camera = new PerspectiveCamera(32, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.08;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 1.4;
  controls.addEventListener("start", () => {
    controls.autoRotate = false; // en cuanto la persona lo toca, deja de girar solo
    onInteract?.();
  });

  let model = null;
  let halfHeight = 1; // medio alto del modelo
  let ringRadius = 1; // radio del cilindro vertical que lo envuelve al girar
  let touched = false;
  let disposed = false;
  let frame = 0;
  controls.addEventListener("start", () => { touched = true; });

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
    if (model) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  new GLTFLoader().load(
    src,
    (gltf) => {
      if (disposed) { disposeObject(gltf.scene); return; }
      model = gltf.scene;
      scene.add(model);
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      halfHeight = size.y / 2;
      ringRadius = Math.hypot(size.x, size.z) / 2;
      controls.target.copy(box.getCenter(new Vector3()));
      resize();
      frameModel();
      renderer.render(scene, camera);
      onReady?.();
    },
    undefined,
    (err) => { if (!disposed) onError?.(err); },
  );

  // Solo se vuelve a dibujar cuando la cámara cambia: al girar solo, mientras amortigua el giro y al
  // arrastrar. OrbitControls avisa con «change» también cuando aplica el arrastre por su cuenta, que es
  // lo que pasa sin amortiguación (movimiento reducido): ahí su update() del cuadro ya no ve cambios.
  let dirty = true;
  controls.addEventListener("change", () => { dirty = true; });
  const tick = () => {
    frame = requestAnimationFrame(tick);
    if (!model || document.hidden) return;
    controls.update();
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
      ro.disconnect();
      controls.dispose();
      disposeObject(scene);
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
