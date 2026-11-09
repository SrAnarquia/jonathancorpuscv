// Valida src/data: ejecútalo después de añadir o editar un proyecto (npm test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PROJECTS, SHIP_ID } from "../src/data/projects.js";
import { PROFILE } from "../src/data/profile.js";
import { resolveVideo } from "../src/lib/video.js";

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
