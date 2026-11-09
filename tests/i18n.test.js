// Valida las traducciones: ejecútalo después de editar textos o añadir un proyecto (npm test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, LANGS } from "../src/i18n/strings.js";
import { PROJECTS } from "../src/data/projects.js";
import { PROJECTS_EN } from "../src/data/projects.en.js";
import { PROFILE } from "../src/data/profile.js";
import { PROFILE_EN } from "../src/data/profile.en.js";

test("español e inglés tienen exactamente las mismas claves de interfaz", () => {
  assert.deepEqual(LANGS, ["es", "en"]);
  const es = Object.keys(STRINGS.es).sort();
  const en = Object.keys(STRINGS.en).sort();
  assert.deepEqual(en.filter((k) => !es.includes(k)), [], "claves solo en inglés");
  assert.deepEqual(es.filter((k) => !en.includes(k)), [], "claves sin traducir al inglés");
  for (const lang of LANGS) {
    for (const [k, v] of Object.entries(STRINGS[lang])) assert.ok(typeof v === "string" && v.trim(), `${lang}:${k} vacío`);
  }
});

test("cada proyecto tiene su traducción al inglés (título, resumen y etiqueta)", () => {
  for (const p of PROJECTS) {
    const en = PROJECTS_EN[p.id];
    assert.ok(en, `falta la traducción de «${p.id}» en src/data/projects.en.js`);
    for (const f of ["tag", "title", "summary"]) assert.ok(en[f]?.trim(), `${p.id}: falta ${f} en inglés`);
  }
  for (const id of Object.keys(PROJECTS_EN)) assert.ok(PROJECTS.some((p) => p.id === id), `traducción huérfana: ${id}`);
});

test("las listas traducidas conservan el mismo número de elementos", () => {
  for (const p of PROJECTS) {
    const en = PROJECTS_EN[p.id];
    for (const f of ["highlights", "tech", "learnings", "images", "videos", "models"]) {
      if (Array.isArray(p[f]) && en[f]) assert.equal(en[f].length, p[f].length, `${p.id}.${f}`);
    }
    // Las evidencias traducidas son las mismas (los arreglos se sustituyen completos).
    for (const [i, img] of (p.images || []).entries()) if (en.images) assert.equal(en.images[i].src, img.src, `${p.id}.images[${i}].src`);
    for (const [i, m] of (p.models || []).entries()) if (en.models) assert.deepEqual([en.models[i].src, en.models[i].poster], [m.src, m.poster], `${p.id}.models[${i}]`);
    for (const [i, v] of (p.videos || []).entries()) if (en.videos) assert.deepEqual({ ...en.videos[i], title: 0, caption: 0 }, { ...v, title: 0, caption: 0 }, `${p.id}.videos[${i}]`);
  }
  assert.equal(PROFILE_EN.ship.goals.length, PROFILE.ship.goals.length, "objetivos de la nave");
});

// V6.14: la versión en inglés también es puntual y conserva la estructura de cada ficha.
test("fichas puntuales en inglés: misma estructura que en español y texto breve", () => {
  const words = (s) => (s || "").split(/\s+/).filter(Boolean).length;
  for (const p of PROJECTS) {
    const en = { ...p, ...PROJECTS_EN[p.id] };
    const total = words(en.summary) + words(en.problem) + words(en.contribution) + (en.highlights || []).reduce((n, h) => n + words(h), 0);
    assert.ok(total <= 180, `${p.id}: ${total} palabras en inglés (máximo 180)`);
    assert.equal(Boolean(en.problem), Boolean(p.problem), `${p.id}: «El problema» en un idioma y no en el otro`);
    assert.equal((en.contribution || "").split("\n\n").length, (p.contribution || "").split("\n\n").length, `${p.id}: distinto número de párrafos en inglés`);
    for (const h of en.highlights || []) assert.ok(words(h) <= 18, `${p.id}: punto clave largo en inglés: ${h}`);
  }
});
