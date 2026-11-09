// Asistente de contacto (prototipo): respuestas de demostración y cálculos de la burbuja (npm test).
// Si cambias los textos o las palabras clave de src/lib/assistantDemo.js, esto comprueba que cada
// sugerencia siga teniendo respuesta, que los datos vengan del sitio y que nada se conecte afuera.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PROJECTS } from "../src/data/projects.js";
import { PROJECTS_EN } from "../src/data/projects.en.js";
import { PROFILE } from "../src/data/profile.js";
import { PROFILE_EN } from "../src/data/profile.en.js";
import { DEMO_TEXT, demoGreeting, demoReply, demoSuggestions, hasKey, normalize } from "../src/lib/assistantDemo.js";
import { askAssistant, fallbackReply, greet, typingDelay } from "../src/lib/assistant.js";
import { bubblePlacement, keyboardInset, onScrollSettled, pickLift, snapBubble } from "../src/lib/assistantDock.js";

// La misma mezcla de traducciones que src/i18n/index.jsx (aquí sin React).
function merge(base, over) {
  if (over == null) return base;
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (typeof base === "object" && base !== null && typeof over === "object") {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
    return out;
  }
  return over;
}
const CTX = {
  es: { lang: "es", profile: PROFILE, projects: PROJECTS },
  en: { lang: "en", profile: merge(PROFILE, PROFILE_EN), projects: PROJECTS.map((p) => merge(p, PROJECTS_EN[p.id])) },
};
const ALL_SUGGESTIONS = ["sWho", "sProjects", "sWork", "sContact", "sCv", "sTech", "sProjectTech", "sVideo"];
const fallbackText = (lang) => demoReply("zzzz qwerty", CTX[lang]).text;

test("los textos de la demostración existen en español y en inglés", () => {
  assert.deepEqual(Object.keys(DEMO_TEXT.en).sort(), Object.keys(DEMO_TEXT.es).sort());
  for (const lang of ["es", "en"]) for (const [k, v] of Object.entries(DEMO_TEXT[lang])) assert.ok(v.trim(), `${lang}:${k} vacío`);
});

test("las palabras clave ignoran acentos, mayúsculas y signos", () => {
  assert.equal(normalize("¿Quién es JONATHAN?"), "quien es jonathan");
  assert.ok(hasKey(normalize("¿Dónde ha trabajado?"), "trabaj*"));
  assert.ok(hasKey(normalize("Quiero su CV, por favor"), "cv"));
  assert.ok(!hasKey(normalize("cvs y más"), "cv"), "palabra completa, no parte de otra");
});

test("cada sugerencia que ofrece el asistente tiene una respuesta propia (nunca «no sé»)", () => {
  for (const lang of ["es", "en"]) {
    for (const s of demoSuggestions(CTX[lang], ALL_SUGGESTIONS)) {
      const reply = demoReply(s, CTX[lang]);
      assert.notEqual(reply.text, fallbackText(lang), `${lang}: «${s}» cae en la respuesta por defecto`);
    }
  }
});

test("las respuestas salen de los datos del sitio", () => {
  const es = CTX.es;
  const about = demoReply("¿Quién es Jonathan?", es);
  assert.ok(about.text.includes(PROFILE.name) && about.text.includes(PROFILE.currentRole));

  const projects = demoReply("¿Qué proyectos tiene?", es);
  for (const p of PROJECTS) assert.ok(projects.text.includes(p.planet.name), `falta ${p.planet.name}`);
  assert.deepEqual(projects.actions.map((a) => a.to), ["/#universo"]);

  const work = demoReply("¿Dónde ha trabajado?", es);
  for (const h of PROFILE.highlights) assert.ok(work.text.includes(h), `falta ${h}`);
  assert.ok(work.text.includes(PROJECTS.find((p) => p.id === "finanzas-datos").title), "relaciona cada lugar con sus proyectos");
  assert.deepEqual(work.actions.map((a) => a.href), [PROFILE.cv.es.href, PROFILE.cv.en.href]);

  const tech = demoReply("¿Qué tecnologías usa?", es);
  assert.ok(tech.text.includes("Power BI") && tech.text.includes("Unity"));
  assert.ok(!tech.text.includes("Nube") && !tech.text.includes("App móvil"), "sin tecnologías genéricas en el resumen");

  const cv = demoReply("quiero su cv", es);
  assert.deepEqual(cv.actions.map((a) => [a.href, a.download]), [[PROFILE.cv.es.href, true], [PROFILE.cv.en.href, true]]);

  const video = demoReply("¿Tiene un video?", es);
  assert.deepEqual(video.actions.map((a) => a.to), ["/video"]);
});

test("recuerda el último proyecto del que se habló", () => {
  const es = CTX.es;
  const meal = demoReply("Háblame de MealFlow", es);
  assert.equal(meal.meta.project, "mealflow");
  assert.deepEqual(meal.actions.map((a) => a.to), ["/proyecto/mealflow"]);
  const used = demoReply("¿Qué tecnologías usó?", es, [{ from: "bot", ...meal }]);
  for (const t of PROJECTS.find((p) => p.id === "mealflow").tech) assert.ok(used.text.includes(t), `falta ${t}`);
  const robot = demoReply("what technologies did he use for the robot?", CTX.en);
  assert.equal(robot.meta.project, "robot-6dof");
});

test("contacto: siempre ofrece los medios reales (correo y LinkedIn)", () => {
  for (const lang of ["es", "en"]) {
    const ctx = CTX[lang];
    for (const ask of ["¿Cómo lo contacto?", "Quiero dejarle un mensaje", "¿Cuál es su color favorito?", "how can I reach him?", "what's his phone number?"]) {
      const r = demoReply(ask, ctx);
      const hrefs = (r.actions || []).map((a) => a.href || a.value);
      assert.ok(hrefs.includes(`mailto:${PROFILE.email}`) || hrefs.includes(PROFILE.email), `${lang}: «${ask}» sin correo`);
      assert.ok(hrefs.includes(PROFILE.linkedin), `${lang}: «${ask}» sin LinkedIn`);
    }
    const err = fallbackReply(ctx);
    assert.ok(err.actions.some((a) => a.href === PROFILE.linkedin) && err.actions.some((a) => a.value === PROFILE.email));
  }
});

test("es honesto: dice que es una demostración y que todavía no envía mensajes", () => {
  assert.match(demoReply("¿Eres una IA?", CTX.es).text, /demostración.*sin inteligencia artificial/s);
  assert.match(demoReply("are you a bot?", CTX.en).text, /demo.*no artificial intelligence/s);
  assert.match(demoReply("Tengo una vacante para él", CTX.es).text, /todavía no puedo enviarle mensajes/);
  assert.match(demoGreeting(CTX.es, { source: "linkedin" }).text, /versión de demostración/);
});

test("saludo según por dónde llega la persona", () => {
  const es = CTX.es;
  assert.match(greet(es, { source: "email", copied: true, first: true }).text, /portapapeles/);
  const fail = greet(es, { source: "email", copied: false, first: true });
  assert.ok(fail.text.includes(PROFILE.email) && fail.actions[0].type === "copy");
  // LinkedIn (V6.6; V6.19: en cada clic se abre en otra pestaña y se copia su enlace): el saludo lo confirma y
  // ofrece el enlace directo.
  const li = greet(es, { source: "linkedin", copied: true, first: true });
  assert.match(li.text, /otra pestaña/);
  assert.match(li.text, /portapapeles/);
  assert.equal(li.actions[0].href, PROFILE.linkedin);
  assert.equal(li.actions[0].external, true);
  assert.ok(li.suggestions.length >= 3);
  assert.match(greet(CTX.en, { source: "linkedin", copied: true, first: true }).text, /another tab.*clipboard/);
  const liFail = greet(es, { source: "linkedin", copied: false, first: true });
  assert.ok(/otra pestaña/.test(liFail.text) && /No pude copiar/.test(liFail.text) && liFail.actions[0].href === PROFILE.linkedin);
  // «Contacto» de la barra o del menú (V6.6): saluda con los tres medios de contacto y sugerencias.
  const c = greet(es, { source: "contact", first: true });
  assert.match(c.text, /versión de demostración/);
  assert.deepEqual(c.actions.map((a) => a.value || a.href), [PROFILE.email, `mailto:${PROFILE.email}`, PROFILE.linkedin]);
  assert.ok(c.suggestions.length >= 3);
  // Al volver a abrirlo solo se añade lo que aporte algo nuevo.
  assert.equal(greet(es, { source: "email", copied: true, first: false }), null);
  assert.equal(greet(es, { source: "bubble", first: false }), null);
  assert.equal(greet(es, { source: "contact", first: false }), null);
  const liAgain = greet(es, { source: "linkedin", copied: true, first: false });
  assert.ok(/otra pestaña/.test(liAgain.text) && /portapapeles/.test(liAgain.text) && liAgain.actions[0].href === PROFILE.linkedin);
  assert.match(greet(es, { source: "linkedin", copied: false, first: false }).text, /no pude copiar/i);
});

test("askAssistant responde tras una pausa breve y se puede cancelar", async () => {
  assert.ok(typingDelay("hola") >= 420 && typingDelay("x".repeat(900)) <= 1150);
  assert.ok(typingDelay("x".repeat(900), true) <= 450, "con movimiento reducido la pausa es corta");
  const t0 = Date.now();
  const reply = await askAssistant({ text: "¿Quién es Jonathan?", ctx: CTX.es, reduced: true });
  assert.ok(Date.now() - t0 >= 300 && reply.text.includes(PROFILE.name));
  const ctrl = new AbortController();
  const pending = askAssistant({ text: "hola", ctx: CTX.es, signal: ctrl.signal });
  ctrl.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("en esta fase no hay conexiones externas, claves ni servicios", () => {
  for (const f of ["src/lib/assistant.js", "src/lib/assistantDemo.js", "src/components/ContactAssistant.jsx", "src/hooks/useAssistantDock.js", "src/hooks/useBubbleDrag.js"]) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|api[_-]?key|secret|token/i.test(src), `${f} no debe conectarse a servicios`);
  }
});

test("burbuja: sube lo justo para no tapar un control, o se aparta si no hay sitio", () => {
  const spot = { left: 1294, right: 1348, top: 534, bottom: 588 };
  assert.equal(pickLift(spot, []), 0);
  // Un botón justo debajo: sube por encima de él con 10 px de aire.
  assert.equal(pickLift(spot, [{ left: 1300, right: 1340, top: 520, bottom: 600 }]), 588 - 520 + 10);
  // Dos controles apilados: sube por encima de los dos.
  const stack = [{ left: 1300, right: 1340, top: 548, bottom: 588 }, { left: 1300, right: 1340, top: 500, bottom: 540 }];
  assert.equal(pickLift(spot, stack), 588 - 500 + 10);
  // Un control en otra columna no cuenta.
  assert.equal(pickLift(spot, [{ left: 900, right: 1000, top: 540, bottom: 580 }]), 0);
  // Un panel alto que ocupa toda la columna: no hay sitio sin subir de más.
  assert.equal(pickLift(spot, [{ left: 1000, right: 1366, top: 76, bottom: 590 }], { max: 240 }), null);
});

test("hadita arrastrable (V6.6): se pega al lado más cercano, a la altura donde se soltó, sin salirse", () => {
  // Portátil de JC: 1366 × 606, burbuja de 54 px, 18 px de margen y la barra (62 px) más 10 de aire.
  const box = { size: 54, width: 1366, height: 606, margins: { x: 18, top: 72, bottom: 18 } };
  const range = 606 - 54 - 72 - 18;
  const left = snapBubble({ x: 300, y: 300, ...box });
  assert.deepEqual([left.side, left.left, left.top], ["left", 18, 300]);
  assert.ok(Math.abs(left.frac - (300 - 72) / range) < 1e-9, "guarda la altura como fracción del recorrido");
  const right = snapBubble({ x: 900, y: 300, ...box });
  assert.deepEqual([right.side, right.left, right.top], ["right", 1366 - 54 - 18, 300]);
  // Soltada sobre la barra o más allá del borde inferior: se queda dentro.
  assert.equal(snapBubble({ x: 0, y: 10, ...box }).top, 72);
  assert.equal(snapBubble({ x: 0, y: 900, ...box }).top, 606 - 54 - 18);
  // El sitio guardado se recoloca en otra ventana en la misma proporción, sin salirse.
  assert.deepEqual(bubblePlacement({ side: "left", frac: 0 }, box), { left: 18, top: 72 });
  assert.deepEqual(bubblePlacement({ side: "right", frac: 1 }, box), { left: 1294, top: 534 });
  assert.deepEqual(bubblePlacement({ side: "left", frac: 0.5 }, { ...box, height: 900 }), { left: 18, top: Math.round(72 + 0.5 * (900 - 54 - 72 - 18)) });
  assert.deepEqual(bubblePlacement({ side: "right", frac: 7 }, box), { left: 1294, top: 534 }, "un valor fuera de rango no la saca de la ventana");
  // Una ventana demasiado baja (no hay recorrido): bajo la barra.
  assert.equal(snapBubble({ x: 0, y: 100, ...box, height: 120 }).top, 72);
  assert.equal(bubblePlacement({ side: "left", frac: 0.5 }, { ...box, height: 120 }).top, 72);
});

test("teclado del móvil: solo cuenta mientras se escribe y sin zoom", () => {
  assert.deepEqual(keyboardInset({ height: 500, offsetTop: 0, scale: 1 }, 844, true), { inset: 344, height: 500 });
  assert.deepEqual(keyboardInset({ height: 500, offsetTop: 0, scale: 1 }, 844, false), { inset: 0, height: 844 });
  assert.deepEqual(keyboardInset({ height: 500, offsetTop: 0, scale: 1.6 }, 844, true), { inset: 0, height: 844 });
  assert.deepEqual(keyboardInset({ height: 800, offsetTop: 0, scale: 1 }, 844, true), { inset: 0, height: 844 }, "barras del navegador, no teclado");
});

// Ventana de mentira con reloj propio: cada frame(ms) avanza el reloj, dispara los temporizadores
// vencidos y luego los cuadros (requestAnimationFrame), como un navegador.
function fakeWindow({ scrollend = true } = {}) {
  let t = 0, id = 0;
  const timers = new Map(), frames = new Map(), listeners = {};
  const win = {
    scrollY: 0,
    requestAnimationFrame: (cb) => { frames.set(++id, cb); return id; },
    cancelAnimationFrame: (n) => frames.delete(n),
    setTimeout: (cb, ms) => { timers.set(++id, { cb, at: t + ms }); return id; },
    clearTimeout: (n) => timers.delete(n),
    addEventListener: (type, cb) => { (listeners[type] ||= new Set()).add(cb); },
    removeEventListener: (type, cb) => listeners[type]?.delete(cb),
  };
  if (scrollend) win.onscrollend = null;
  const frame = (ms) => {
    t += ms;
    for (const [n, tm] of [...timers]) if (tm.at <= t) { timers.delete(n); tm.cb(); }
    const due = [...frames.values()];
    frames.clear();
    due.forEach((cb) => cb());
  };
  const fire = (type) => listeners[type]?.forEach((cb) => cb());
  return { win, frame, fire, now: () => t };
}

test("llegada: un desplazamiento lento con cuadros espaciados no se da por terminado a medio camino", () => {
  const { win, frame, now } = fakeWindow({ scrollend: false });
  let done = false;
  onScrollSettled(() => { done = true; }, { win, now });
  // Equipo lento: 1000 px en 12 cuadros de 300 ms (3.6 s), más que los 2 s que antes se esperaban.
  for (let i = 1; i <= 12; i++) {
    win.scrollY = Math.round((1000 * i) / 12);
    frame(300);
    assert.equal(done, false, `terminó antes de llegar (cuadro ${i}, ${win.scrollY} px)`);
  }
  for (let i = 0; i < 10 && !done; i++) frame(16);
  assert.equal(done, true, "al detenerse sí termina");
  assert.equal(win.scrollY, 1000);
});

test("llegada: si la página no se mueve termina tras unos cuadros quietos; scrollend lo adelanta", () => {
  {
    const { win, frame, now } = fakeWindow({ scrollend: false });
    let at = null;
    onScrollSettled(() => { at = now(); }, { win, now });
    for (let i = 0; i < 20 && at == null; i++) frame(16);
    assert.ok(at != null && at >= 140 && at <= 200, `terminó a los ${at} ms`);
  }
  {
    const { win, frame, fire, now } = fakeWindow();
    let at = null;
    onScrollSettled(() => { at = now(); }, { win, now });
    win.scrollY = 300; frame(16);
    win.scrollY = 600; frame(16);
    fire("scrollend");
    for (let i = 0; i < 20 && at == null; i++) frame(16);
    assert.equal(at, 64, "aviso del navegador + dos cuadros quietos");
  }
  {
    // Un «scrollend» de un desplazamiento anterior no corta el que sigue en marcha.
    const { win, frame, fire, now } = fakeWindow();
    let done = false;
    onScrollSettled(() => { done = true; }, { win, now });
    fire("scrollend");
    for (let i = 1; i <= 5; i++) { win.scrollY = i * 100; frame(16); }
    assert.equal(done, false);
  }
});

test("llegada: la red de seguridad corta si algo mueve la página sin parar", () => {
  const { win, frame, now } = fakeWindow();
  let done = false;
  const stop = onScrollSettled(() => { done = true; }, { win, now, max: 1000 });
  for (let i = 0; i < 70 && !done; i++) { win.scrollY += 5; frame(16); }
  assert.equal(done, true);
  let again = false;
  onScrollSettled(() => { again = true; }, { win, now })();
  for (let i = 0; i < 30; i++) frame(16);
  assert.equal(again, false, "cancelado no avisa");
  stop();
});
