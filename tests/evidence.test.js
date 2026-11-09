// Evidencias de la ficha (V6.8): lo que el visor recibe de un proyecto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { evidenceItems, evidenceSummary } from "../src/lib/evidence.js";
import { PROJECTS } from "../src/data/projects.js";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname } from "node:path";

const yt = { type: "youtube", id: "TdU0hq1quLo", title: "Demo" };
const img = (n) => ({ src: `/images/proyectos/x/${n}.jpg`, alt: `alt ${n}`, caption: `pie ${n}` });

test("sin evidencias → lista vacía (la sección no se muestra)", () => {
  assert.deepEqual(evidenceItems({ images: [], video: null }), []);
  assert.deepEqual(evidenceItems({}), []);
  assert.deepEqual(evidenceItems(null), []);
});

test("primero los videos, después las imágenes; con pie y texto alternativo", () => {
  const items = evidenceItems({ images: [img(1), img(2)], videos: [yt] });
  assert.deepEqual(items.map((it) => it.kind), ["video", "image", "image"]);
  assert.equal(items[0].source.src, "https://www.youtube-nocookie.com/embed/TdU0hq1quLo?rel=0");
  assert.equal(items[0].caption, "Demo");
  assert.deepEqual(items[1], { kind: "image", src: "/images/proyectos/x/1.jpg", alt: "alt 1", caption: "pie 1" });
  assert.deepEqual(evidenceSummary(items), { videos: 1, images: 2, models: 0, firstVideo: 0, firstImage: 1, firstModel: -1 });
});

test("el campo antiguo `video` sigue valiendo y va antes que `videos`", () => {
  const items = evidenceItems({ video: { type: "file", src: "/videos/a.mp4", title: "A" }, videos: [yt] });
  assert.deepEqual(items.map((it) => it.caption), ["A", "Demo"]);
  assert.equal(items[0].source.kind, "native");
});

test("una configuración inválida se omite sin romper la ficha", () => {
  const items = evidenceItems({ videos: [{ type: "youtube", url: "https://youtube.com/sin-id" }, yt], images: [{ alt: "sin src" }, img(1)] });
  assert.deepEqual(items.map((it) => it.kind), ["video", "image"]);
  assert.deepEqual(evidenceSummary([]), { videos: 0, images: 0, models: 0, firstVideo: -1, firstImage: -1, firstModel: -1 });
});

test("el Robot 6-DOF trae su video de YouTube y sus dos imágenes", () => {
  const robot = PROJECTS.find((p) => p.id === "robot-6dof");
  const items = evidenceItems(robot);
  assert.deepEqual(items.map((it) => it.kind), ["video", "image", "image"]);
  assert.equal(items[0].source.external, "https://www.youtube.com/watch?v=TdU0hq1quLo");
  assert.ok(items.slice(1).every((it) => it.alt && it.caption), "cada imagen con alt y pie");
});

test("los modelos 3D van al final y solo se aceptan .gltf (V6.16)", () => {
  const model = { src: "/modelos/x/m.gltf", poster: "/images/x.jpg", alt: "modelo", caption: "pie" };
  const items = evidenceItems({ videos: [yt], images: [img(1)], models: [model, { src: "/modelos/x/m.glb" }, { alt: "sin src" }] });
  assert.deepEqual(items.map((it) => it.kind), ["video", "image", "model"]);
  assert.deepEqual(items[2], { kind: "model", ...model });
  assert.deepEqual(evidenceSummary(items), { videos: 1, images: 1, models: 1, firstVideo: 0, firstImage: 1, firstModel: 2 });
});

test("el 08 (VR y la nave) trae su video, la captura de Unity y el modelo 3D (V6.15 a V6.18)", () => {
  const vr = PROJECTS.find((p) => p.id === "vr-nave");
  const items = evidenceItems(vr);
  assert.deepEqual(items.map((it) => it.kind), ["video", "image", "model"]);
  assert.equal(items[0].source.external, "https://www.youtube.com/watch?v=FvwiXazVh-8");
  assert.ok(items.every((it) => /en proceso/.test(it.caption)), "cada evidencia avisa que el prototipo está en proceso");
  assert.ok(items.slice(1).every((it) => it.alt), "la imagen y el modelo con alt");
  assert.equal(items[1].src, "/images/proyectos/vr-nave/unity-entorno.jpg");
  assert.match(items[2].caption, /demostración/);
  // Desde la V6.17 el modelo es el brazo de 6 DOF de JC: su poster es un render de él mismo, y en la V6.18 salió
  // la imagen de Meshy AI (otro modelo) a pedido de JC.
  assert.equal(items[2].poster, "/images/proyectos/vr-nave/modelo-brazo-3d.jpg", "mientras carga, el modelo muestra un render de sí mismo");
  assert.ok(!items.some((it) => /\/modelo-brazo\.jpg$/.test(it.src || "")), "sin la imagen de Meshy AI");
  assert.doesNotMatch(items[2].caption, /mismo modelo/i, "el pie no dice que es el mismo modelo de otra imagen");
});

// V6.17: el modelo es el GLB que mandó JC (brazo_robot_6dof_v2), convertido a glTF con normales: el original
// no traía normales y three.js lo habría dibujado facetado.
test("el modelo 3D del 08 es el brazo de 6 DOF de JC, con normales y sin texturas (V6.17)", () => {
  const vr = PROJECTS.find((p) => p.id === "vr-nave");
  const gltf = JSON.parse(readFileSync(new URL("../public" + vr.models[0].src, import.meta.url), "utf8"));
  const names = gltf.nodes.map((n) => n.name);
  for (const n of ["Base_Plate", "Servo_01_Base", "Servo_02_Hombro", "Servo_03_Codo", "Servo_04_Muneca", "Servo_05_Roll", "Servo_06_Gripper", "Dedo_R", "Dedo_L"]) {
    assert.ok(names.includes(n), `falta la pieza ${n}`);
  }
  for (const m of gltf.meshes) for (const pr of m.primitives) assert.ok("NORMAL" in pr.attributes, `${m.name}: sin normales se vería facetado`);
  assert.equal((gltf.images || []).length, 0, "sin texturas: los colores van en los materiales");
  assert.ok(gltf.materials.some((m) => /Aluminio_Negro/.test(m.name)) && gltf.materials.some((m) => /Servo/.test(m.name)));
});

// La CSP del sitio no tiene blob: ni wasm-unsafe-eval (vercel.json): el modelo debe traer el .bin y las
// texturas como archivos aparte (dentro de un .glb, GLTFLoader las abre con una URL blob:) y sin Draco
// ni meshopt (sus decodificadores son WebAssembly). Así el visor 3D funciona con la CSP de producción.
test("el modelo 3D del 08 funciona con la CSP del sitio y pesa poco (V6.16)", () => {
  const vr = PROJECTS.find((p) => p.id === "vr-nave");
  const file = new URL("../public" + vr.models[0].src, import.meta.url);
  const gltf = JSON.parse(readFileSync(file, "utf8"));
  const dir = dirname(file.pathname);
  assert.deepEqual(gltf.extensionsRequired || [], ["KHR_mesh_quantization"]);
  for (const ext of gltf.extensionsUsed || []) assert.doesNotMatch(ext, /draco|meshopt|basisu|ktx/i, `extensión con decodificador: ${ext}`);
  let bytes = statSync(file).size;
  const uris = [...(gltf.buffers || []).map((b) => b.uri), ...(gltf.images || []).map((im) => im.uri)];
  for (const im of gltf.images || []) assert.equal(im.bufferView, undefined, "las texturas van en su propio archivo");
  for (const uri of uris) {
    assert.ok(uri && !/^(data|blob|https?):/.test(uri), `recurso aparte y relativo: ${uri}`);
    assert.ok(existsSync(`${dir}/${uri}`), `no existe ${uri}`);
    bytes += statSync(`${dir}/${uri}`).size;
  }
  assert.ok(bytes < 2.5e6, `el modelo pesa ${bytes} bytes (máximo 2.5 MB)`);
  assert.ok(existsSync(new URL("../public" + vr.models[0].poster, import.meta.url)), "falta el poster");
});

test("desde la V6.15 los ocho proyectos tienen evidencias", () => {
  for (const p of PROJECTS) assert.ok(evidenceItems(p).length > 0, `${p.id} sin evidencias`);
});
