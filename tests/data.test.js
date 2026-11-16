// Valida src/data: ejecútalo después de añadir o editar un proyecto (npm test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PROJECTS, SHIP_ID } from "../src/data/projects.js";
import { PROFILE } from "../src/data/profile.js";
import { resolveVideo } from "../src/lib/video.js";
import { assetStatus } from "../src/lib/assetStatus.js";

const PUBLIC = fileURLToPath(new URL("../public", import.meta.url));
const KINDS = ["robot", "finance", "meal", "supply", "factory", "scada", "health", "vr", "generic"];
const local = (src) => typeof src === "string" && src.startsWith("/");

test("los ocho planetas originales siguen presentes", () => {
  const names = PROJECTS.map((p) => p.planet.name);
  for (const n of ["Robot 6-DOF", "Finanzas y datos", "MealFlow", "Supply Chain Hub", "Mantenimiento KIA", "SCADA y planta", "Hospital UANL", "VR y la nave"]) {
    assert.ok(names.includes(n), `falta el planeta ${n}`);
  }
});

test("cada proyecto tiene los campos obligatorios", () => {
  const ids = new Set();
  for (const p of PROJECTS) {
    assert.match(p.id, /^[a-z0-9-]+$/, `id inválido: ${p.id}`);
    assert.ok(!ids.has(p.id), `id repetido: ${p.id}`);
    assert.notEqual(p.id, SHIP_ID, `"${SHIP_ID}" está reservado para la nave`);
    ids.add(p.id);
    for (const k of ["tag", "title", "summary"]) assert.ok(p[k]?.trim(), `${p.id}: falta ${k}`);
    assert.ok(p.planet?.name && p.planet.color, `${p.id}: falta planet.name o planet.color`);
    assert.ok(KINDS.includes(p.planet.kind || "generic"), `${p.id}: planet.kind desconocido (${p.planet.kind})`);
  }
});

test("los videos configurados son válidos", () => {
  for (const p of PROJECTS) {
    if (p.video != null) assert.ok(resolveVideo(p.video), `${p.id}: la configuración de video no es válida`);
    for (const [i, v] of (p.videos || []).entries()) assert.ok(resolveVideo(v), `${p.id}: videos[${i}] no es válido`);
  }
  if (PROFILE.presentationVideo) assert.ok(resolveVideo(PROFILE.presentationVideo), "video de presentación inválido");
});

test("los archivos locales referenciados existen en /public", () => {
  const refs = [];
  for (const p of PROJECTS) {
    for (const v of [p.video, ...(p.videos || [])]) if (v?.type === "file") refs.push([p.id, v.src], [p.id, v.poster]);
    for (const m of p.models || []) {
      assert.match(m.src || "", /^\/modelos\/.+\.gltf$/, `${p.id}: el modelo 3D debe ser un .gltf en /public/modelos (${m.src})`);
      assert.ok(m.alt?.trim(), `${p.id}: el modelo ${m.src} necesita alt (texto alternativo)`);
      refs.push([p.id, m.src], [p.id, m.poster]);
    }
    for (const img of p.images || []) {
      assert.match(img.src || "", /^\/images\//, `${p.id}: la imagen debe estar en /public/images (${img.src})`);
      assert.ok(img.alt?.trim(), `${p.id}: la imagen ${img.src} necesita alt (texto alternativo)`);
      refs.push([p.id, img.src]);
    }
  }
  for (const [id, src] of refs) {
    if (!local(src)) continue;
    assert.ok(existsSync(PUBLIC + src), `${id}: no existe public${src}`);
  }
});

test("los enlaces externos usan https", () => {
  for (const p of PROJECTS) for (const l of p.links || []) assert.match(l.href, /^https:\/\//, `${p.id}: ${l.href}`);
  // Perfil (encabezado, contacto y asistente) y el aviso sin JavaScript de index.html.
  assert.match(PROFILE.linkedin, /^https:\/\//, `perfil: ${PROFILE.linkedin}`);
  for (const l of PROFILE.links || []) assert.match(l.href || l, /^https:\/\//, `perfil: ${l.href || l}`);
  const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
  for (const [, href] of html.matchAll(/href="(http:[^"]*)"/g)) assert.fail(`index.html: ${href}`);
});

// V6.14: JC pidió fichas «muy puntuales, que dejen lo que importa y las tecnologías» (regla de énfasis absoluta).
const words = (s) => (s || "").split(/\s+/).filter(Boolean).length;
const fichaWords = (p) => words(p.summary) + words(p.problem) + words(p.contribution) + (p.highlights || []).reduce((n, h) => n + words(h), 0);

test("fichas puntuales: texto breve, contribución en 1 o 2 párrafos y hasta 5 puntos clave de una sola idea", () => {
  for (const p of PROJECTS) {
    assert.ok(fichaWords(p) <= 180, `${p.id}: ${fichaWords(p)} palabras entre resumen, problema, contribución y puntos clave (máximo 180)`);
    assert.ok(words(p.summary) <= 30, `${p.id}: el resumen pasa de 30 palabras`);
    assert.ok((p.contribution || "").split("\n\n").length <= 2, `${p.id}: «Mi contribución» en más de 2 párrafos`);
    assert.ok((p.highlights || []).length <= 5, `${p.id}: más de 5 puntos clave`);
    for (const h of p.highlights || []) assert.ok(words(h) <= 18, `${p.id}: punto clave largo (${words(h)} palabras): ${h}`);
  }
});

// V6.22: los botones del CV solo dicen «pendiente» si el servidor responde que el PDF no está (404 o una página en su
// lugar). Un fallo de red o un 403 del firewall ya no los apagan toda la visita (src/lib/assetStatus.js). A cambio,
// aquí se comprueba que los dos CV existan y sean PDF de verdad.
test("los dos CV existen y son PDF (V6.22)", () => {
  for (const cv of Object.values(PROFILE.cv)) {
    assert.ok(existsSync(PUBLIC + cv.href), `no existe public${cv.href}`);
    assert.equal(readFileSync(PUBLIC + cv.href).subarray(0, 5).toString("latin1"), "%PDF-", `${cv.href} no es un PDF`);
  }
});

test("un fallo de red o un 403 no marcan el CV como pendiente; un 404 sí (V6.22)", () => {
  const res = (status, type) => ({ status, ok: status >= 200 && status < 300, headers: new Headers(type ? { "content-type": type } : {}) });
  assert.equal(assetStatus(null, "pdf"), "unknown", "sin red");
  assert.equal(assetStatus(res(403, "text/html"), "pdf"), "unknown", "403 del firewall");
  assert.equal(assetStatus(res(503), "pdf"), "unknown", "error del servidor");
  assert.equal(assetStatus(res(405), "pdf"), "unknown", "HEAD no admitido");
  assert.equal(assetStatus(res(200), "pdf"), "unknown", "respuesta sin tipo");
  assert.equal(assetStatus(res(404, "text/html"), "pdf"), "missing");
  assert.equal(assetStatus(res(410), "pdf"), "missing");
  assert.equal(assetStatus(res(200, "text/html; charset=utf-8"), "pdf"), "missing", "un hosting de SPA que responde con index.html");
  assert.equal(assetStatus(res(200, "application/pdf"), "pdf"), "ok");
  assert.equal(assetStatus(res(200, "application/octet-stream")), "ok", "sin tipo esperado");
});

// V6.23: Fraunces y Nunito Sans son archivos del propio sitio (src/fonts.css), ya no de Google Fonts: la página no
// espera a otro dominio para pintar y la política de contenido ya no lo permite.
test("las tipografías se sirven desde el sitio y la política de contenido ya no permite Google Fonts (V6.23)", () => {
  const root = (p) => fileURLToPath(new URL("../" + p, import.meta.url));
  const css = readFileSync(root("src/fonts.css"), "utf8");
  const urls = [...css.matchAll(/url\("\.\/(assets\/fonts\/[^"]+\.woff2)"\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 6, "fonts.css con los seis archivos (latin y latin-ext)");
  for (const u of urls) assert.ok(existsSync(root("src/" + u)), `no existe src/${u}`);
  for (const fam of ["Fraunces", "Nunito Sans"]) assert.match(css, new RegExp(`font-family: "${fam}"`), `falta ${fam}`);
  for (const lic of ["OFL-Fraunces.txt", "OFL-NunitoSans.txt"]) assert.ok(existsSync(root("src/assets/fonts/" + lic)), `falta la licencia ${lic}`);
  assert.match(readFileSync(root("src/main.jsx"), "utf8"), /import "\.\/fonts\.css";/, "main.jsx no carga fonts.css");
  const html = readFileSync(root("index.html"), "utf8");
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/, "index.html todavía pide Google Fonts");
  const pre = [...html.matchAll(/<link rel="preload" href="\/src\/(assets\/fonts\/[^"]+)" as="font" type="font\/woff2" crossorigin/g)].map((m) => m[1]);
  assert.equal(pre.length, 2, "se precargan las dos fuentes que se ven al abrir");
  for (const u of pre) assert.ok(urls.includes(u), `la precarga ${u} no está en fonts.css`);
  const csp = JSON.parse(readFileSync(root("vercel.json"), "utf8")).headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;
  assert.doesNotMatch(csp, /googleapis|gstatic/, "la política todavía permite Google Fonts");
  assert.match(csp, /style-src 'self';/);
  assert.match(csp, /font-src 'self';/);
});
