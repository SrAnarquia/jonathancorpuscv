// Genera public/modelos/entorno-estudio.bin: la luz de estudio del visor 3D, ya calculada (V6.22).
//
// Es la misma luz que el visor generaba cada vez que se abría hasta la V6.21 (PMREMGenerator de three.js con
// RoomEnvironment y desenfoque 0.04, a 256 px), pero hecha una sola vez aquí: compilar los shaders que la
// generan congelaba la página unos 3 s la primera vez en equipos con gráficos integrados y en celulares.
//
// Del resultado se guardan solo los niveles de 16 px (336 × 32 texeles en media precisión, 84 KB). Son los únicos
// que leen los materiales con rugosidad de 0.21 o más, como todos los del brazo del 08 (npm test lo comprueba).
// El visor los pone tal cual en una textura de 336 × 64, que es la forma con la que three.js ubica esos niveles,
// y en pantalla se ve igual que antes. Un material más liso se vería con reflejos un poco más difusos, no negro.
//
// Solo hace falta volver a correrlo si se cambia la luz o si una versión nueva de three.js cambia este entorno.
// Uso, desde la carpeta portafolio-vite:   node assets-src/entorno/hornear-entorno.cjs
// Requiere Playwright, igual que las pruebas e2e: `npm i -D playwright` y `npx playwright install chromium`.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const THREE = path.join(ROOT, "node_modules", "three");
const OUT = path.join(ROOT, "public", "modelos", "entorno-estudio.bin");
const WIDTH = 336; // 3 × 16 × 7: el nivel de 16 px y los 6 niveles más difusos, uno junto a otro
const ROWS = 32; // dos filas de caras de 16 px

const PAGE = `<!doctype html><meta charset="utf-8"><title>Entorno</title>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import { DataUtils, PMREMGenerator, REVISION, WebGLRenderer } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
try {
  const renderer = new WebGLRenderer();
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(new RoomEnvironment(), 0.04); // lo mismo que hacía el visor hasta la V6.21
  const { width, height } = target; // 768 × 1024: caras de 256 px
  renderer.setRenderTarget(target);
  const gl = renderer.getContext();
  const px = new Float32Array(${WIDTH} * ${ROWS} * 4);
  gl.readPixels(0, height - 64, ${WIDTH}, ${ROWS}, gl.RGBA, gl.FLOAT, px); // el nivel de 16 px empieza 4 × 16 filas antes del final
  const glError = gl.getError();
  const half = new Uint16Array(px.length);
  for (let i = 0; i < px.length; i++) half[i] = DataUtils.toHalfFloat(px[i]);
  window.result = { ok: glError === 0, glError, revision: REVISION, width, height, bytes: Array.from(new Uint8Array(half.buffer)) };
} catch (err) {
  window.result = { ok: false, error: String(err) };
}
</script>`;

const TYPES = { ".js": "text/javascript; charset=utf-8" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(PAGE);
  }
  const file = path.normalize(path.join(THREE, url.replace(/^\/three\//, "")));
  if (!url.startsWith("/three/") || !file.startsWith(THREE + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  if (!fs.existsSync(THREE)) throw new Error("No encuentro node_modules/three: corre antes npm install.");
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  // SwiftShader (WebGL por software): el mismo resultado en cualquier equipo, con o sin tarjeta gráfica.
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("Error en la página:", e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const r = await page.waitForFunction(() => window.result, null, { timeout: 120000 }).then((h) => h.jsonValue());
    if (!r.ok) throw new Error(r.error || `WebGL devolvió el error ${r.glError} al leer el entorno`);
    if (r.width !== 768 || r.height !== 1024) throw new Error(`El entorno salió de ${r.width} × ${r.height}; se esperaba 768 × 1024`);
    const buf = Buffer.from(r.bytes);
    const half = new Uint16Array(buf.buffer, buf.byteOffset, buf.length / 2);
    const bad = half.some((h) => (h & 0x7c00) === 0x7c00 || (h & 0x8000 && h & 0x7fff)); // infinito, NaN o negativo
    const lit = half.filter((h, i) => i % 4 !== 3 && h > 0).length;
    if (bad || lit < WIDTH * ROWS * 3 * 0.9) throw new Error("El entorno salió con valores inválidos o vacío");
    fs.writeFileSync(OUT, buf);
    const sha = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
    console.log(`Listo: ${path.relative(ROOT, OUT)} (${buf.length} bytes, three.js r${r.revision}, sha256 ${sha}…)`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
