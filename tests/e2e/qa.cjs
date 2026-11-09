// Pruebas de extremo a extremo con Playwright (opcional).
// Uso:  npm run build && npx vite preview --port 4173  (en otra terminal)
//       BASE=http://localhost:4173 SHOTS=./qa-shots node tests/e2e/qa.cjs
// Con las cabeceras de producción (política de seguridad incluida), en lugar de vite preview:
//       node tests/e2e/serve.cjs 4180  y  BASE=http://localhost:4180 node tests/e2e/qa.cjs
// Las esperas son por condición (que la página se detenga, que termine una animación), no por
// tiempo fijo: así una máquina lenta tarda más, pero no da falsos fallos.
// Requiere `npm i -D playwright` y `npx playwright install chromium` si no lo tienes.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:4173";
const SHOTS = process.env.SHOTS || "qa-shots";
const VIDEO_TEST = process.env.VIDEO_TEST === "1"; // build con un video de prueba en robot-6dof
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond, extra }); };

// Espera a que la página deje de desplazarse: 8 cuadros seguidos quieta (o `timeout` ms como mucho).
const scrollRest = (page, timeout = 8000) => page.evaluate((timeout) => new Promise((done) => {
  let last = scrollY, still = 0;
  const t0 = performance.now();
  const tick = () => {
    if (Math.abs(scrollY - last) < 0.5) still++;
    else { still = 0; last = scrollY; }
    if (still >= 8 || performance.now() - t0 > timeout) return done();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), timeout);
// Espera a que terminen las animaciones y transiciones con fin (entrada de la ficha, del panel…).
const uiRest = (page, timeout = 6000) => page.waitForFunction(
  () => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity),
  null, { timeout, polling: 50 }).catch(() => {});
// Espera una condición sin lanzar error: devuelve si se cumplió (la comprobación la hace ok()).
const until = (page, fn, arg, timeout = 8000) => page.waitForFunction(fn, arg, { timeout, polling: 50 }).then(() => true, () => false);
const resumen = () => {
  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "✓" : "✗"} ${r.name}${r.extra && !r.pass ? `  → ${r.extra}` : ""}`);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas`);
  return failed.length;
};

function watch(page, bag) {
  page.on("console", (m) => { if (m.type() === "error") bag.push(`[console.error] ${m.text()}`); });
  page.on("pageerror", (e) => bag.push(`[pageerror] ${e.message}`));
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && u.startsWith(BASE)) bag.push(`[http ${r.status()}] ${u}`);
  });
}

const GL_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

// Consultas del asistente de contacto (V6.4) sobre la página.
function assistantProbe(page) {
  const isOpen = () => page.evaluate(() => document.documentElement.dataset.assistant === "open" && !!document.querySelector(".assistant-panel.is-open"));
  return {
    isOpen,
    isMin: () => page.evaluate(() => document.documentElement.dataset.assistant === "min" && !document.querySelector(".assistant-panel.is-open") && !!document.querySelector(".assistant-bubble.is-shown")),
    state: () => page.evaluate(() => ({ mode: document.documentElement.dataset.assistant, y: Math.round(scrollY), contact: Math.round(document.getElementById("contacto").getBoundingClientRect().top), max: document.documentElement.scrollHeight - innerHeight })),
    contactInView: () => page.evaluate(() => { const r = document.getElementById("contacto").getBoundingClientRect(); return r.top < innerHeight * 0.5 && r.bottom > 0; }),
    // En Contacto: justo bajo la barra o, si la página no da para tanto, al final.
    atContact: () => page.evaluate(() => {
      const top = document.getElementById("contacto").getBoundingClientRect().top;
      const end = Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 3;
      return top >= -400 && top < innerHeight * 0.5 && (Math.abs(top - 70) < 8 || end || top < 70);
    }),
    // Medios de contacto del pie que quedan bajo el panel (cadena vacía si ninguno).
    coveredInContact: () => page.evaluate(() => {
      const p = document.querySelector(".assistant-panel").getBoundingClientRect();
      return [...document.querySelectorAll("#contacto a, #contacto button")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && r.bottom > 0 && r.top < innerHeight && r.right > p.left && r.left < p.right && r.bottom > p.top && r.top < p.bottom;
      }).map((el) => el.textContent.trim() || el.getAttribute("aria-label")).join(", ");
    }),
    // Controles visibles bajo la burbuja (cadena vacía si ninguno).
    bubbleCovers: () => page.evaluate(() => {
      const b = document.querySelector(".assistant-bubble");
      if (!b.classList.contains("is-shown") || b.hasAttribute("data-away")) return "";
      const r0 = b.getBoundingClientRect();
      return [...document.querySelectorAll('a[href], button, input, textarea, iframe, video, [role="button"], h1, h2, h3')].filter((el) => {
        if (el.closest(".assistant, .u-labels")) return false;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") return false;
        return r.right > r0.left && r.left < r0.right && r.bottom > r0.top && r.top < r0.bottom;
      }).map((el) => el.textContent.trim().slice(0, 30) || el.getAttribute("aria-label")).join(", ");
    }),
  };
}

// Idioma (V6.5): marca lo que hay en el centro de la pantalla, que es lo que la persona está viendo, para
// medir después cuánto se movió. Se salta lo fijo o pegajoso (barra, asistente, ficha) y las etiquetas
// del universo, que se mueven solas con la escena.
const markCenter = (page) => page.evaluate(() => {
  document.querySelectorAll("[data-probe]").forEach((e) => e.removeAttribute("data-probe"));
  const pinned = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) if (/fixed|sticky/.test(getComputedStyle(n).position)) return true; return false; };
  for (const hit of document.elementsFromPoint(innerWidth / 2, innerHeight / 2)) {
    if (hit === document.documentElement || hit === document.body) break;
    if (pinned(hit) || hit.closest(".u-labels")) continue;
    hit.setAttribute("data-probe", "");
    return { top: hit.getBoundingClientRect().top, el: hit.tagName.toLowerCase() + (hit.classList[0] ? "." + hit.classList[0] : "") };
  }
  return null;
});
const centerShift = (page, mark) => page.evaluate((top0) => {
  const el = document.querySelector("[data-probe]");
  return el ? Math.round((el.getBoundingClientRect().top - top0) * 10) / 10 : null;
}, mark.top);
// Pulsa ES/EN en el selector que está a la vista (el del encabezado o el de la barra) y espera el cambio.
async function switchLang(page, mobile) {
  const to = await page.evaluate(() => (document.documentElement.lang === "es" ? "en" : "es"));
  const at = await page.evaluate((to) => {
    for (const b of document.querySelectorAll(`.lang button[lang="${to}"]`)) {
      const r = b.getBoundingClientRect();
      if (r.width && r.top >= 0 && r.bottom <= innerHeight && !b.closest("[inert], .is-hidden") && getComputedStyle(b).visibility !== "hidden") return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return null;
  }, to);
  if (!at) return null;
  if (mobile) await page.touchscreen.tap(at.x, at.y); else await page.mouse.click(at.x, at.y);
  return (await until(page, (to) => document.documentElement.lang === to, to, 4000)) ? to : null;
}
// Cuenta lo que dibuja el universo (llamadas de dibujo WebGL) y los contextos WebGL que se crean.
function glCounters() {
  window.__gls = [];
  window.__draws = 0;
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const c = getContext.call(this, type, ...rest);
    if (c && /webgl/.test(type) && !window.__gls.includes(c)) window.__gls.push(c);
    return c;
  };
  for (const P of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
    for (const fn of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
      const orig = P && P.prototype[fn];
      if (orig) P.prototype[fn] = function (...a) { window.__draws++; return orig.apply(this, a); };
    }
  }
}

(async () => {
  const browser = await chromium.launch({ args: GL_ARGS });

  // ---------- Escritorio ----------
  {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "es-MX" });
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });

    // Información profesional visible sin interacción, en HTML real y dentro del primer pantallazo
    const h1 = page.locator("h1");
    ok("Nombre visible en H1", (await h1.textContent()).includes("Jonathan Corpus"));
    const box = await h1.boundingBox();
    ok("Nombre dentro del primer pantallazo", box && box.y + box.height < 900);
    ok("Título profesional visible", await page.locator(".hero").getByText("Ingeniero en Electrónica y Automatización").first().isVisible());
    const mail = page.locator('.hero a[href^="mailto:"]');
    ok("Correo visible con mailto", await mail.isVisible() && (await mail.getAttribute("href")) === "mailto:Jonathan.Ecorpus@gmail.com");
    const li = page.locator('.hero a[href*="linkedin.com/in/jonathan-corpus"]');
    ok("LinkedIn visible y abre en pestaña nueva", await li.isVisible() && (await li.getAttribute("target")) === "_blank");
    ok("Barra superior oculta al inicio (sin redundancia con el encabezado)", await page.locator(".topbar").evaluate((e) => e.classList.contains("is-hidden") && getComputedStyle(e).visibility === "hidden"));
    const cvEs = page.locator(".hero").getByText("CV en español");
    ok("Botón CV español en el encabezado", await cvEs.isVisible());
    const hasPdf = await page.evaluate(async () => {
      const r = await fetch("/JonathanCorpusCV_ESP.pdf", { method: "HEAD" });
      return (r.headers.get("content-type") || "").includes("pdf");
    });
    const cvLink = page.locator('.hero a[href="/JonathanCorpusCV_ESP.pdf"][download]');
    if (hasPdf) ok("CV español: enlace de descarga directo", await cvLink.count() === 1);
    else ok("CV español ausente: se marca como pendiente (sin enlace roto)", await cvLink.count() === 0 && await page.locator(".hero .is-unavailable").count() >= 1);
    ok("Botón Explorar proyectos", await page.getByRole("link", { name: /Explorar mis proyectos/ }).isVisible());
    ok("Botón CV inglés en el encabezado", await page.locator(".hero").getByText("CV in English").isVisible());
    const hasPdfEn = await page.evaluate(async () => {
      const r = await fetch("/JonathanCorpusCV_ENG.pdf", { method: "HEAD" });
      return (r.headers.get("content-type") || "").includes("pdf");
    });
    if (hasPdfEn) ok("CV inglés: enlace de descarga directo", await page.locator('.hero a[href="/JonathanCorpusCV_ENG.pdf"][download]').count() === 1);
    else ok("CV inglés ausente: se marca como pendiente", await page.locator(".hero .is-unavailable").count() >= 1);
    const videoLink = page.locator('.hero-contact a[href="/video"]');
    const vb = await videoLink.boundingBox(), mb = await mail.boundingBox();
    ok("Correo · LinkedIn · Video de presentación en la misma fila", await videoLink.isVisible() && !!vb && !!mb && Math.abs((vb.y + vb.height / 2) - (mb.y + mb.height / 2)) < 12, `video=${JSON.stringify(vb)} correo=${JSON.stringify(mb)}`);
    ok("El encabezado no enlaza «Sobre mí» (se quitó del sitio: el video lo cubre)", await page.locator(".hero-about").count() === 0 && await page.locator(".hero").getByText("Sobre mí", { exact: true }).count() === 0);
    const hb = page.locator(".hero-actions .btn");
    const [xb, esb, enb] = await Promise.all([hb.nth(0).boundingBox(), hb.nth(1).boundingBox(), hb.nth(2).boundingBox()]);
    ok("«Explorar mis proyectos» y los dos CV en la misma fila", await hb.count() === 3 && Math.abs((xb.y + xb.height / 2) - (esb.y + esb.height / 2)) < 3 && Math.abs(esb.y - enb.y) < 2 && xb.x + xb.width <= esb.x + 1 && esb.x + esb.width <= enb.x + 1, `x=${JSON.stringify(xb)} es=${JSON.stringify(esb)} en=${JSON.stringify(enb)}`);

    await page.screenshot({ path: `${SHOTS}/d1-hero.png` });

    // Copiar correo (V6.4: además lleva a Contacto y abre el asistente; ver la sección del asistente)
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    await page.locator(".hero .email .icon-btn").click();
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    ok("Copiar correo al portapapeles", clip === "Jonathan.Ecorpus@gmail.com", clip);
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 }).catch(() => {});
    ok("Copiar correo abre el asistente en Contacto", await page.locator(".assistant-panel.is-open").count() === 1);
    // El resto de esta sección prueba el sitio sin el asistente: se recarga la página.
    await page.goto(BASE + "/", { waitUntil: "networkidle" });

    // Universo
    await page.getByRole("link", { name: /Explorar mis proyectos/ }).click();
    await page.waitForFunction(() => !document.querySelector(".topbar").classList.contains("is-hidden"), null, { timeout: 5000 });
    ok("Al bajar aparece la barra con navegación y CV", await page.locator(".topbar").getByText(/CV ES/).isVisible() && await page.locator(".topnav").getByText("Contacto").isVisible());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    ok("Escena WebGL creada", await page.locator(".u-canvas").count() === 1);
    ok("Tema claro: el papel marfil sigue siendo el fondo por defecto", await page.evaluate(() => getComputedStyle(document.body).backgroundColor === "rgb(248, 242, 228)"));
    ok("Etiquetas de los 9 puntos de interés", await page.locator(".u-label").count() === 9);
    await page.screenshot({ path: `${SHOTS}/d2-universo.png` });

    // Hover sobre etiqueta y selección con ratón (clic sobre la etiqueta 3D)
    const lbl = page.locator(".u-label", { hasText: "MealFlow" });
    await lbl.hover({ force: true });
    await page.waitForTimeout(300);
    ok("Hover resalta la etiqueta", await lbl.evaluate((e) => e.classList.contains("is-hover")));
    await lbl.click({ force: true });
    await page.waitForSelector(".sheet h2");
    ok("Clic abre la ficha correcta", (await page.locator(".sheet h2").textContent()).includes("consumos de comedor"));
    ok("La URL refleja el proyecto", page.url().endsWith("/proyecto/mealflow"));
    // V4.4: la primera interacción directa con el lienzo entra sola en pantalla completa.
    ok("Interactuar con el lienzo entra solo en pantalla completa", await page.locator(".universe-wrap.is-fullscreen").count() === 1);
    ok("En pantalla completa la ficha queda dentro del lienzo", await page.evaluate(() => {
      const sh = document.querySelector(".sheet").getBoundingClientRect();
      const st = document.querySelector(".universe-stage").getBoundingClientRect();
      return sh.top >= st.top - 1 && sh.bottom <= st.bottom + 1;
    }));
    await page.keyboard.press(" ");
    await page.waitForFunction(() => !document.fullscreenElement && !document.querySelector(".universe-wrap").classList.contains("is-fullscreen"), null, { timeout: 6000 });
    await page.waitForTimeout(300);
    ok("Espacio sale de la pantalla completa automática y en escritorio la ficha sigue abierta", await page.locator(".universe-wrap.is-fullscreen").count() === 0 && await page.locator(".sheet").count() === 1);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${SHOTS}/d3-ficha.png` });

    // Clic directo sobre el canvas (raycasting) en el planeta central de la vista
    await page.locator(".sheet-close").click();
    ok("Cerrar ficha", await page.locator(".sheet").count() === 0);
    ok("Foco vuelve al botón del planeta", await page.evaluate(() => document.activeElement?.dataset?.planet === "mealflow"));
    const canvas = page.locator(".u-canvas");
    const cb = await canvas.boundingBox();
    // Cursor: mano de arrastrar sobre una zona vacía del lienzo; navecita solo sobre un
    // planeta o su etiqueta. La zona vacía es el centro-abajo: la cámara está sobre el
    // planeta elegido, así que ahí solo hay estrellas, pase lo que pase con el desplazamiento.
    await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height - 60);
    await page.waitForTimeout(250);
    ok("Cursor por defecto sobre el lienzo: mano de arrastrar", await canvas.evaluate((c) => !c.classList.contains("is-over") && getComputedStyle(c).cursor === "grab"), await canvas.evaluate((c) => getComputedStyle(c).cursor.slice(0, 40)));
    await page.mouse.move(cb.x + cb.width / 2 - 20, cb.y + cb.height / 2 + 30); // centro: el planeta enfocado
    await page.waitForTimeout(250);
    ok("Cursor de nave al pasar sobre un planeta", await canvas.evaluate((c) => c.classList.contains("is-over") && getComputedStyle(c).cursor.startsWith("url(")), await canvas.evaluate((c) => c.className + " " + getComputedStyle(c).cursor.slice(0, 40)));
    ok("Cursor de nave también sobre las etiquetas", await lbl.evaluate((e) => getComputedStyle(e).cursor.startsWith("url(")));
    await page.mouse.click(cb.x + cb.width / 2 - 20, cb.y + cb.height / 2 + 30);
    await page.waitForTimeout(400);
    ok("Clic sobre el planeta en el canvas abre su ficha", await page.locator(".sheet").count() === 1);
    ok("Tras salir una vez, el clic en el lienzo ya no reentra en pantalla completa", await page.locator(".universe-wrap.is-fullscreen").count() === 0);
    // V4.4: la ficha se ancla al lienzo; aunque la página se desplace, no rebasa sus bordes.
    await page.evaluate(() => window.scrollBy(0, -280));
    await page.waitForTimeout(500);
    ok("Ficha anclada: con la página a medio desplazar no sobresale del lienzo", await page.evaluate(() => {
      const sh = document.querySelector(".sheet").getBoundingClientRect();
      const u = document.querySelector("#universo").getBoundingClientRect();
      return u.top > 40 && sh.top >= u.top - 1 && sh.bottom <= u.bottom + 1;
    }), await page.evaluate(() => JSON.stringify({ s: document.querySelector(".sheet").getBoundingClientRect().top, u: document.querySelector("#universo").getBoundingClientRect().top })));
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForTimeout(500);

    // Teclado
    await page.locator('[data-planet="robot-6dof"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector(".sheet h2");
    ok("Enter en la lista abre la ficha", (await page.locator(".sheet h2").textContent()).includes("robot"));
    ok("El foco pasa al título de la ficha", await page.evaluate(() => document.activeElement?.tagName === "H2"));
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    ok("Flecha derecha → siguiente planeta", (await page.locator(".sheet h2").textContent()).includes("NetSuite"));
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(200);
    ok("Flecha izquierda → planeta anterior", (await page.locator(".sheet h2").textContent()).includes("robot"));
    await page.keyboard.press("Escape");
    ok("Escape cierra la ficha", await page.locator(".sheet").count() === 0);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    ok("Segundo Escape vuelve al centro", await page.locator(".planet-index .is-active").count() === 0);

    // ---------- Idioma ----------
    // La barra aparece cuando el encabezado sale de pantalla; se asegura esa condición
    // (el desplazamiento exacto previo puede dejar el encabezado asomando unos píxeles).
    await page.evaluate(() => { const u = document.querySelector("#universo"); window.scrollTo(0, Math.round(u.getBoundingClientRect().top + window.scrollY + 140)); });
    await page.waitForFunction(() => !document.querySelector(".topbar").classList.contains("is-hidden"), null, { timeout: 8000 });
    await page.locator(".topbar .lang button[lang='en']").click();
    await page.waitForTimeout(300);
    ok("ES/EN: el atributo lang del documento cambia", await page.evaluate(() => document.documentElement.lang === "en"));
    ok("ES/EN: etiquetas del universo traducidas", await page.locator(".u-label", { hasText: "Finance & data" }).count() === 1);
    ok("ES/EN: lista de planetas traducida", await page.locator('.planet-index [data-planet="finanzas-datos"]').textContent().then((x) => x.includes("Finance")));
    await page.locator('[data-planet="finanzas-datos"]').click();
    await page.waitForSelector(".sheet h2");
    ok("ES/EN: ficha de proyecto en inglés", (await page.locator(".sheet h2").textContent()).includes("Serverless integration of NetSuite") && await page.locator(".sheet").getByText("My contribution").isVisible());
    ok("ES/EN: el idioma se recuerda", await page.evaluate(() => localStorage.getItem("jc-lang") === "en"));
    await page.keyboard.press("Escape");
    await page.locator(".topbar .lang button[lang='es']").click();
    await page.waitForTimeout(300);
    ok("ES/EN: vuelve a español", await page.evaluate(() => document.documentElement.lang === "es") && await page.locator(".u-label", { hasText: "Finanzas y datos" }).count() === 1);

    // ---------- Música ----------
    ok("Música: arranca al 35 % del archivo (tu ajuste: el archivo ya viene al 15 % del original)", await page.evaluate(() => Math.abs(document.querySelector("audio").volume - 0.35) < 0.001));
    await page.locator(".top-actions .music").hover();
    await page.waitForTimeout(400);
    ok("Música: aparece el control de volumen al pasar el cursor", await page.locator(".top-actions .music-vol input").isVisible());
    await page.locator(".top-actions .music-vol input").fill("20");
    ok("Música: el control ajusta el volumen", await page.evaluate(() => Math.abs(document.querySelector("audio").volume - 0.2) < 0.001));
    await page.locator(".top-actions .music-vol input").fill("65");
    const musicBtn = page.locator(".top-actions .music-btn");
    if (await page.evaluate(() => document.querySelector("audio").paused)) await musicBtn.click(); // por si el navegador esperaba un gesto
    await page.waitForTimeout(500);
    ok("Música: suena", await page.evaluate(() => !document.querySelector("audio").paused));
    await musicBtn.click();
    await page.waitForTimeout(300);
    ok("Música: un clic la silencia", await page.evaluate(() => document.querySelector("audio").paused) && await musicBtn.getAttribute("aria-pressed") === "false");
    await musicBtn.click();
    await page.waitForTimeout(500);
    ok("Música: otro clic la activa al volumen guardado", await page.evaluate(() => !document.querySelector("audio").paused && Math.abs(document.querySelector("audio").volume - 0.65) < 0.001));

    // ---------- Pantalla completa ----------
    const fsGone = () => page.waitForFunction(() => !document.fullscreenElement && !document.querySelector(".universe-wrap").classList.contains("is-fullscreen"), null, { timeout: 6000 }).catch(() => {});
    await page.getByRole("button", { name: "Pantalla completa" }).first().click();
    await page.waitForTimeout(800);
    // El Chromium sin interfaz de este entorno no concede la API nativa de pantalla completa; se prueba el modo equivalente (CSS), que es el mismo código de estado.
    ok("Pantalla completa: se activa", await page.locator(".universe-wrap.is-fullscreen").count() === 1);
    ok("Pantalla completa: el canvas ocupa toda la pantalla", await page.evaluate(() => { const c = document.querySelector(".u-canvas").getBoundingClientRect(); return c.width >= innerWidth - 2 && c.height >= innerHeight - 2; }));
    await page.screenshot({ path: `${SHOTS}/d6-pantalla-completa.png` });
    await page.keyboard.press("Space");
    await fsGone();
    await page.waitForTimeout(200);
    ok("Pantalla completa: la barra espaciadora sale", await page.locator(".universe-wrap.is-fullscreen").count() === 0);
    await page.getByRole("button", { name: "Pantalla completa" }).first().click();
    await page.waitForTimeout(600);
    await page.locator('[data-planet="mealflow"]').focus();
    await page.keyboard.press("Space");
    await fsGone();
    await page.waitForTimeout(200);
    ok("Pantalla completa: Espacio sale aunque el foco esté en un botón (sin abrir su ficha)", await page.locator(".universe-wrap.is-fullscreen").count() === 0 && await page.locator(".sheet").count() === 0,
      `fs=${await page.locator(".universe-wrap.is-fullscreen").count()} sheet=${await page.locator(".sheet").count()} url=${page.url()}`);
    await page.getByRole("button", { name: "Pantalla completa" }).first().click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Salir de pantalla completa" }).first().click();
    await fsGone();
    await page.waitForTimeout(200);
    ok("Pantalla completa: el botón de minimizar sale", await page.locator(".universe-wrap.is-fullscreen").count() === 0);
    await page.getByRole("button", { name: "Pantalla completa" }).first().click();
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await fsGone();
    await page.waitForTimeout(200);
    ok("Pantalla completa: Esc también sale", await page.locator(".universe-wrap.is-fullscreen").count() === 0 && await page.getByRole("button", { name: "Pantalla completa" }).first().isVisible());

    // Desde la V6.15 los 8 proyectos tienen evidencias (el 08 era el último sin ellas): aquí se comprueba que el
    // 08 muestra la suya; el caso sin evidencias (sin sección ni botones) lo cubren las unitarias de evidence.js.
    await page.locator('[data-planet="vr-nave"]').click();
    await page.waitForSelector(".sheet h2");
    // V6.18: sin la imagen de Meshy AI, al 08 le queda una imagen (la captura de Unity).
    ok("V6.15 proyecto 08: sección «Evidencia» con «Ver video» y «Ver imagen» (V6.18: solo la captura de Unity)", (await page.locator(".sheet-section h3").allTextContents()).includes("Evidencia") && await page.getByRole("button", { name: "Ver video", exact: true }).count() === 1 && await page.getByRole("button", { name: "Ver imagen", exact: true }).count() === 1);

    // Recorrido guiado
    await page.getByRole("button", { name: /Recorrido guiado/ }).click();
    await page.waitForSelector(".tour-line");
    ok("Recorrido guiado comienza en la etapa 1", (await page.locator(".tour-line").textContent()).includes("etapa 1 de 9"));
    for (let i = 0; i < 8; i++) await page.locator(".sheet-nav .btn").last().click();
    ok("Recorrido termina en la nave", (await page.locator(".sheet h2").textContent()).includes("La nave"));
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${SHOTS}/d4-nave.png` });
    ok("La nave ofrece el video de presentación", await page.getByRole("button", { name: /video de presentación/ }).isVisible());
    ok("La nave incluye contacto", await page.locator(".sheet a[href^='mailto:']").count() === 1);

    // Reproductor con el video de presentación (iframe)
    await page.getByRole("button", { name: /video de presentación/ }).click();
    await page.waitForSelector("dialog.video-modal[open]");
    ok("Modal de video abierto", true);
    ok("Video de presentación como iframe (YouTube)", await page.locator("dialog iframe").count() === 1);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    ok("Escape cierra el reproductor", await page.locator("dialog.video-modal").count() === 0);
    ok("El foco vuelve al botón del video", await page.evaluate(() => /video/i.test(document.activeElement?.textContent || "")));

    // Cerrar la ficha de la nave devuelve la cámara al centro: el principito no se queda a bordo sin su ficha
    await page.locator(".sheet-close").click();
    await page.waitForTimeout(400);
    ok("Cerrar la ficha de la nave devuelve al centro (el principito no queda a bordo sin ficha)",
      await page.locator(".sheet").count() === 0 && await page.locator(".planet-index .is-active").count() === 0 && new URL(page.url()).pathname === "/",
      `url=${page.url()} activos=${await page.locator(".planet-index .is-active").count()}`);

    // Volver al centro
    await page.locator('[data-planet="mealflow"]').click();
    await page.waitForSelector(".sheet");
    await page.getByRole("button", { name: /Volver al centro/ }).click();
    ok("Volver al centro cierra la ficha", await page.locator(".sheet").count() === 0 && await page.locator(".planet-index .is-active").count() === 0);

    // Zoom con botones
    await page.getByRole("button", { name: "Acercar" }).click();
    await page.getByRole("button", { name: "Alejar" }).click();

    // Vista de lista y regreso a 3D (libera y recrea la escena)
    await page.getByRole("button", { name: /Vista de lista/ }).click();
    ok("Vista de lista muestra 9 tarjetas", await page.locator(".pcard").count() === 9);
    // V4.5: en la vista de lista la ficha convive con las tarjetas: las empuja (no las tapa),
    // acompaña el desplazamiento pegada bajo la barra y nunca sale de la sección.
    await page.locator(".pcard").nth(5).click();
    await page.waitForSelector(".sheet");
    await uiRest(page);
    await scrollRest(page);
    const listState = () => page.evaluate(() => {
      const sh = document.querySelector(".sheet").getBoundingClientRect();
      const u = document.querySelector("#universo").getBoundingClientRect();
      const cardsRight = Math.max(...[...document.querySelectorAll(".pcard")].map((c) => c.getBoundingClientRect().right));
      const toolsRight = document.querySelector(".universe-tools").getBoundingClientRect().right;
      return { pos: getComputedStyle(document.querySelector(".sheet")).position, inside: sh.top >= u.top - 1 && sh.bottom <= u.bottom + 1, gap: Math.round(sh.left - Math.max(cardsRight, toolsRight)), uTop: Math.round(u.top), uBottom: Math.round(u.bottom), sTop: Math.round(sh.top), sBottom: Math.round(sh.bottom) };
    });
    let ls = await listState();
    ok("Lista: la ficha empuja las tarjetas y los controles en vez de taparlos", ls.pos === "sticky" && ls.gap >= 8, JSON.stringify(ls));
    await page.evaluate(() => { const u = document.querySelector("#universo").getBoundingClientRect().top + scrollY; scrollTo(0, Math.max(0, u - 330)); });
    await page.waitForTimeout(500);
    ls = await listState();
    ok("Lista: con el encabezado a la vista, la ficha no sube por encima de la sección", ls.inside && ls.uTop > 0, JSON.stringify(ls));
    await page.evaluate(() => { const u = document.querySelector("#universo").getBoundingClientRect(); scrollTo(0, scrollY + u.bottom - innerHeight + 140); });
    await page.waitForTimeout(500);
    ls = await listState();
    ok("Lista: al final de la lista, la ficha no baja por debajo de la sección", ls.inside && ls.uBottom < 900, JSON.stringify(ls));
    await page.evaluate(() => { const u = document.querySelector("#universo").getBoundingClientRect().top + scrollY; scrollTo(0, u + 500); });
    await page.waitForTimeout(500);
    ls = await listState();
    ok("Lista: a media lista, la ficha acompaña pegada bajo la barra", ls.inside && ls.sTop >= 60 && ls.sTop <= 90 && ls.gap >= 8, JSON.stringify(ls));
    // Pantalla completa en vista de lista: la lista completa sigue desplazable y la ficha tampoco tapa las tarjetas
    await page.getByRole("button", { name: /^Pantalla completa/ }).click();
    await page.waitForFunction(() => !!document.fullscreenElement || document.querySelector(".universe-wrap").classList.contains("is-fullscreen"), null, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600);
    ls = await listState();
    const fsScroll = await page.evaluate(() => { const w = document.querySelector(".universe-wrap"); return w.scrollHeight > w.clientHeight + 100; });
    ok("Pantalla completa + lista: la ficha queda dentro y no tapa las tarjetas", ls.inside && ls.gap >= 8, JSON.stringify(ls));
    ok("Pantalla completa + lista: la lista completa sigue desplazable", fsScroll);
    await page.getByRole("button", { name: /Salir de pantalla completa/ }).click();
    await fsGone();
    await page.waitForTimeout(600);
    await page.evaluate(() => { const u = document.querySelector("#universo").getBoundingClientRect().top + scrollY; scrollTo(0, Math.max(0, u - 330)); });
    await page.waitForTimeout(500);
    ls = await listState();
    ok("Tras salir de pantalla completa en lista, la ficha sigue dentro de la sección (no tapa el encabezado)", ls.inside && ls.uTop > 0, JSON.stringify(ls));
    await page.locator(".sheet-close").click();
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Vista 3D/ }).click();
    await page.waitForSelector(".u-canvas");
    ok("Volver a 3D recrea una sola escena", await page.locator(".u-canvas").count() === 1);

    // Pérdida de contexto WebGL
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const gl = document.querySelector(".u-canvas").getContext("webgl2");
      gl.getExtension("WEBGL_lose_context").loseContext();
    });
    await page.waitForTimeout(500);
    ok("Contexto perdido: aviso con opciones", await page.getByRole("button", { name: "Reintentar" }).isVisible());
    await page.getByRole("button", { name: "Reintentar" }).click();
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    ok("Reintentar recupera la escena", await page.locator(".u-canvas").count() === 1);

    ok("Escritorio sin errores de consola ni recursos rotos", errors.length === 0, errors.join(" | "));
    await page.close();
  }

  // ---------- Asistente de contacto (V6.4; V6.6: también desde «Contacto» y desde el pie) ----------
  // En el portátil de JC (1366×606): copiar el correo o LinkedIn llevan a Contacto y abren el asistente;
  // al volver a subir por la página se contrae en una hadita, y la hadita lo reabre y regresa a Contacto.
  // Desde la V6.6 «Contacto» de la barra también lo abre y el correo y LinkedIn del propio Contacto hacen lo
  // mismo que los del encabezado. Desde la V6.19, cada clic en LinkedIn abre su página en otra pestaña, copia
  // su enlace al portapapeles y abre el asistente, que confirma la copia.
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok("Asistente: no aparece hasta que se pide (sin burbuja al cargar)", await page.locator(".assistant-panel, .assistant-bubble").count() === 0);

    // 1. Copiar correo: copia, baja a Contacto, abre el asistente y confirma con discreción.
    await page.locator(".hero .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok("Asistente: el correo se copia al portapapeles", await page.evaluate(() => navigator.clipboard.readText().catch(() => "")) === "Jonathan.Ecorpus@gmail.com");
    ok("Asistente: el ícono de copiar lleva a Contacto", await A.atContact(), JSON.stringify(await A.state()));
    ok("Asistente: confirmación discreta «Correo copiado»", await page.locator(".assistant-toast.is-shown").innerText().then((t) => t.includes("Correo copiado")).catch(() => false));
    ok("Asistente: saludo de la demostración que menciona el portapapeles", /versión de demostración[\s\S]*portapapeles/.test(await page.locator(".msg-bot").first().innerText()));
    ok("Asistente: el campo queda listo para escribir", await page.evaluate(() => document.activeElement?.classList.contains("assistant-input")));
    await uiRest(page);
    await page.screenshot({ path: `${SHOTS}/d7-asistente.png` });
    ok("Asistente: encabezado con nombre, aviso de demostración y botón de minimizar", await page.locator(".assistant-title").innerText().then((t) => t.includes("Asistente de Jonathan") && /demo/i.test(t)) && await page.getByRole("button", { name: "Minimizar el asistente" }).isVisible());
    ok("Asistente: accesible (diálogo con nombre, conversación como registro, campo con etiqueta y botón Enviar)", await page.getByRole("dialog", { name: "Asistente de Jonathan Demo" }).count() === 1 && await page.getByRole("log", { name: "Conversación con el asistente" }).count() === 1 && await page.getByLabel("Escribe tu pregunta para el asistente").count() === 1 && await page.getByRole("button", { name: "Enviar" }).count() === 1);
    {
      const p = await page.locator(".assistant-panel").boundingBox();
      ok("Asistente: panel compacto en la esquina inferior derecha", p.width <= 380 && p.height <= 500 && p.x + p.width >= 1366 - 30 && p.y + p.height >= 606 - 30, JSON.stringify(p));
    }
    ok("Asistente: no tapa el correo, LinkedIn, los CV ni la navegación del pie", await A.coveredInContact() === "", await A.coveredInContact());
    ok("Asistente: el enlace real de LinkedIn y el correo siguen en Contacto", await page.locator('#contacto a[href*="linkedin.com/in/jonathan-corpus"][target="_blank"]').isVisible() && await page.locator('#contacto a[href="mailto:Jonathan.Ecorpus@gmail.com"]').isVisible());
    ok("Asistente: «Enviar» desactivado con el campo vacío", await page.locator(".assistant-send").isDisabled());

    // Conversación simulada: sugerencia → «escribiendo…» → respuesta.
    const bots = await page.locator(".msg-bot").count();
    await page.locator(".assistant-suggest .assistant-chip", { hasText: "¿Qué proyectos tiene?" }).click();
    await page.waitForTimeout(150);
    ok("Asistente: muestra que está escribiendo y no deja enviar dos veces", await page.locator(".msg-typing").count() === 1 && await page.locator(".assistant-send").isDisabled());
    await page.waitForSelector(".msg-typing", { state: "detached", timeout: 4000 });
    ok("Asistente: responde con los proyectos del sitio", await page.locator(".msg-me").last().innerText().then((t) => t.includes("¿Qué proyectos tiene?")) && await page.locator(".msg-bot").count() === bots + 1 && /MealFlow[\s\S]*Hospital UANL/.test(await page.locator(".msg-bot").last().innerText()));
    await page.locator(".assistant-input").fill("¿Cuál es su color favorito?");
    await page.keyboard.press("Enter");
    await page.waitForSelector(".msg-typing", { state: "detached", timeout: 4000 });
    ok("Asistente: lo que no sabe lo deriva a los medios reales (correo y LinkedIn)", await page.locator('.msg-bot').last().locator('a[href^="mailto:"], a[href*="linkedin.com"]').count() === 2);

    // Leer la conversación (rueda sobre el panel) y movimientos mínimos no lo contraen.
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.move(1170, 330);
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -220); await page.waitForTimeout(40); }
    await page.waitForTimeout(500);
    ok("Asistente: desplazarse dentro de la conversación no mueve la página ni lo contrae", await page.evaluate(() => scrollY) === y0 && await A.isOpen());
    await page.mouse.move(500, 300);
    await page.mouse.wheel(0, -70);
    await scrollRest(page);
    await page.waitForTimeout(300);
    ok("Asistente: un movimiento mínimo de la página no lo contrae", await A.isOpen());
    await page.mouse.wheel(0, 70);
    await scrollRest(page);

    // 2. Al volver a subir de verdad se contrae en la hadita, que no tapa controles.
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -130); await page.waitForTimeout(50); }
    await until(page, () => document.documentElement.dataset.assistant === "min" && !!document.querySelector(".assistant-bubble.is-shown"), null, 6000);
    await scrollRest(page);
    await uiRest(page);
    ok("Asistente: al subir por la página se contrae en una burbuja", await A.isMin(), JSON.stringify(await A.state()));
    ok("Asistente: la burbuja es pequeña (≤ 56 px)", await page.locator(".assistant-bubble").evaluate((b) => b.offsetWidth <= 56 && b.offsetHeight <= 56));
    ok("Asistente: la burbuja no tapa botones, enlaces ni títulos", await A.bubbleCovers() === "", await A.bubbleCovers());
    await page.screenshot({ path: `${SHOTS}/d8-asistente-burbuja.png` });
    await page.mouse.wheel(0, -900);
    await scrollRest(page);
    await page.waitForTimeout(400); // la burbuja se recoloca 160 ms después de que la página se detiene
    await uiRest(page);
    ok("Asistente: la burbuja sigue sin tapar controles en otra parte de la página", await A.bubbleCovers() === "", await A.bubbleCovers());

    // 3. La burbuja lo reabre y regresa a Contacto.
    await page.locator(".assistant-bubble").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok("Asistente: la burbuja lo reabre y vuelve a Contacto con la conversación", await A.atContact() && await page.locator(".msg-me").count() === 2, JSON.stringify(await A.state()));
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await uiRest(page);
    ok("Asistente: Esc lo minimiza y el foco pasa a la burbuja", await A.isMin() && await page.evaluate(() => document.activeElement?.classList.contains("assistant-bubble")));
    await page.keyboard.press("Enter");
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok("Asistente: con el teclado (Enter en la burbuja) se vuelve a abrir", await A.isOpen());

    // V6.6. «Contacto» de la barra lo trae de vuelta cuando está contraído, sin repetir el saludo, y deja /#contacto.
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await page.evaluate(() => window.scrollTo(0, 700));
    await scrollRest(page);
    await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
    await uiRest(page);
    const botsBar = await page.locator(".msg-bot").count();
    await page.locator(".topnav a", { hasText: "Contacto" }).click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await scrollRest(page);
    ok("V6.6 «Contacto» de la barra: baja al pie y abre el asistente", await A.isOpen() && await A.atContact(), JSON.stringify(await A.state()));
    ok("V6.6 «Contacto» de la barra: retoma la conversación sin repetir el saludo", await page.locator(".msg-bot").count() === botsBar && await page.locator(".msg-me").count() === 2);
    ok("V6.6 «Contacto» de la barra: la dirección queda en /#contacto", await page.evaluate(() => location.pathname + location.hash) === "/#contacto");

    // V6.6. El botón de copiar el correo del propio Contacto: copia, abre (o reabre) el asistente y confirma.
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await uiRest(page);
    await page.evaluate(() => navigator.clipboard.writeText("-"));
    await page.locator("#contacto .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok("V6.6 copiar el correo desde Contacto: copia y abre el asistente", await A.isOpen() && await page.evaluate(() => navigator.clipboard.readText().catch(() => "")) === "Jonathan.Ecorpus@gmail.com");
    ok("V6.6 copiar el correo desde Contacto: confirmación discreta «Correo copiado»", await page.locator(".assistant-toast.is-shown").innerText().then((t) => t.includes("Correo copiado")).catch(() => false));

    // V6.19 (antes V6.6). LinkedIn del propio Contacto: abre LinkedIn en otra pestaña, copia su enlace y el
    // asistente, que sigue abierto, lo confirma. Cada clic hace lo mismo.
    await page.evaluate(() => navigator.clipboard.writeText("-"));
    const footLi = page.locator("#contacto .footer-actions a", { hasText: "LinkedIn" });
    const footLiHref = await footLi.getAttribute("href");
    const botsLi = await page.locator(".msg-bot").count();
    const popupFoot = ctx.waitForEvent("page", { timeout: 4000 }).catch(() => null);
    await footLi.click();
    const tabFoot = await popupFoot;
    ok("V6.19 LinkedIn en Contacto: abre LinkedIn en otra pestaña", !!tabFoot && /linkedin\.com|chrome-error/.test(tabFoot.url()), tabFoot && tabFoot.url());
    if (tabFoot) await tabFoot.close();
    await page.bringToFront();
    await until(page, (n) => document.querySelectorAll(".msg-bot").length === n + 1, botsLi, 4000);
    ok("V6.19 LinkedIn en Contacto: copia el enlace al portapapeles", await page.evaluate(() => navigator.clipboard.readText().catch(() => "")) === footLiHref, footLiHref);
    ok("V6.19 LinkedIn en Contacto: el asistente sigue abierto, dice que LinkedIn se abrió en otra pestaña y que el enlace se copió, y lo ofrece", await A.isOpen() && /otra pestaña[\s\S]*portapapeles/.test(await page.locator(".msg-bot").last().innerText()) && await page.locator(".msg-bot").last().locator('a[href*="linkedin.com/in/jonathan-corpus"][target="_blank"]').count() === 1);
    ok("V6.19 LinkedIn en Contacto: aviso «Enlace de LinkedIn copiado»", await page.locator(".assistant-toast.is-shown").innerText().then((t) => t.includes("Enlace de LinkedIn copiado")).catch(() => false));
    await page.evaluate(() => navigator.clipboard.writeText("-"));
    const popupFoot2 = ctx.waitForEvent("page", { timeout: 4000 }).catch(() => null);
    await footLi.click();
    const tabFoot2 = await popupFoot2;
    if (tabFoot2) await tabFoot2.close();
    await page.bringToFront();
    await until(page, (n) => document.querySelectorAll(".msg-bot").length === n + 2, botsLi, 4000);
    const foot2 = { tab: !!tabFoot2, clip: await page.evaluate(() => navigator.clipboard.readText().catch(() => "")), open: await A.isOpen(), bots: await page.locator(".msg-bot").count() - botsLi };
    ok("V6.19 LinkedIn en Contacto (otra vez): de nuevo otra pestaña, enlace copiado y mensaje del asistente", foot2.tab && foot2.clip === footLiHref && foot2.open && foot2.bots === 2, JSON.stringify(foot2));
    await page.evaluate(() => window.scrollTo(0, 700));
    await scrollRest(page);
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 6000);
    await page.locator(".assistant-bubble").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await scrollRest(page);

    // Cambiar el tamaño de la ventana con el panel abierto: sin saltos ni desbordes.
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.waitForTimeout(800);
    await scrollRest(page);
    await uiRest(page);
    ok("Asistente: al cambiar el tamaño de la ventana sigue abierto, sin desbordes", await A.isOpen() && await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    ok("Asistente: en una ventana más estrecha el contacto se aparta del panel", await A.coveredInContact() === "", await A.coveredInContact());
    await page.setViewportSize({ width: 1366, height: 606 });
    await page.waitForTimeout(600);

    // Una acción del chat que lleva al sitio: se contrae y la página va hacia allá.
    await page.locator(".assistant-input").fill("¿Qué proyectos tiene?");
    await page.keyboard.press("Enter");
    await page.waitForSelector(".msg-typing", { state: "detached", timeout: 4000 });
    await page.locator(".msg-actions button", { hasText: "Explorar el universo" }).last().click();
    // El viaje es con desplazamiento suave; con WebGL por software puede pasar de 1,5 s.
    await page.waitForFunction(() => Math.abs(document.getElementById("universo").getBoundingClientRect().top - 62) < 4, null, { timeout: 10000, polling: 100 }).catch(() => {});
    const went = await page.evaluate(() => ({ top: Math.round(document.getElementById("universo").getBoundingClientRect().top), url: location.pathname + location.hash }));
    const wentMin = await A.isMin();
    ok("Asistente: «Explorar el universo» lo contrae y lleva al universo", wentMin && went.url === "/#universo" && Math.abs(went.top - 62) < 4, JSON.stringify({ min: wentMin, ...went }));
    ok("Asistente sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // LinkedIn del encabezado (V6.19, pedido de JC): cada clic abre LinkedIn en otra pestaña y, en esta, copia su
  // enlace, lleva a Contacto y abre el asistente, que confirma la copia. El aviso espera a que la persona vuelva.
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const li = page.locator(".hero-contact a", { hasText: "LinkedIn" });
    const liHref = await li.getAttribute("href");
    const liText = await li.innerText();
    ok("Asistente: el LinkedIn del encabezado avisa a lectores de pantalla que abre otra pestaña, copia el enlace y abre el asistente", liText.includes("pestaña nueva") && liText.includes("copia el enlace") && liText.includes("abre el asistente"), liText);
    const popup1 = ctx.waitForEvent("page", { timeout: 4000 }).catch(() => null);
    await li.click();
    const tab1 = await popup1;
    ok("V6.19 LinkedIn del encabezado: abre LinkedIn en otra pestaña", !!tab1 && /linkedin\.com|chrome-error/.test(tab1.url()), tab1 && tab1.url());
    if (tab1) await tab1.close();
    await page.bringToFront();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok("Asistente: LinkedIn lleva a Contacto y abre el asistente", await A.atContact());
    ok("Asistente: el saludo ofrece el enlace real de LinkedIn", await page.locator('.msg-bot a[href*="linkedin.com/in/jonathan-corpus"][target="_blank"]').count() === 1);
    ok("V6.19 LinkedIn del encabezado: copia su enlace al portapapeles", await page.evaluate(() => navigator.clipboard.readText().catch(() => "")) === liHref);
    ok("V6.19 el asistente confirma (aviso «Enlace de LinkedIn copiado» y un saludo que dice que se abrió en otra pestaña y se copió)", await page.locator(".assistant-toast.is-shown").innerText().then((t) => t.includes("Enlace de LinkedIn copiado")).catch(() => false) && /otra pestaña[\s\S]*portapapeles/.test(await page.locator(".msg-bot").first().innerText()));
    // Mientras la persona está en la pestaña de LinkedIn (página oculta) el aviso no corre su tiempo: sigue ahí al
    // volver y después se va solo.
    const setVisibility = (v) => page.evaluate((state) => {
      Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    }, v);
    await setVisibility("hidden");
    await page.waitForTimeout(3200);
    const keptHidden = await page.locator(".assistant-toast.is-shown").count() === 1;
    await setVisibility("visible");
    const keptBack = await page.locator(".assistant-toast.is-shown").count() === 1;
    const goneLater = await until(page, () => !document.querySelector(".assistant-toast.is-shown"), null, 6000);
    ok("V6.19 el aviso de LinkedIn espera a que vuelvas de la otra pestaña y luego se va solo", keptHidden && keptBack && goneLater, JSON.stringify({ keptHidden, keptBack, goneLater }));
    await page.locator(".assistant-min").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await scrollRest(page);
    await uiRest(page);
    await page.evaluate(() => navigator.clipboard.writeText("-"));
    const popup2 = ctx.waitForEvent("page", { timeout: 4000 }).catch(() => null);
    await li.click();
    const tab2 = await popup2;
    if (tab2) await tab2.close();
    await page.bringToFront();
    const reopened = await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 }).then(() => true, () => false);
    const again = { tab: !!tab2, reopened, clip: await page.evaluate(() => navigator.clipboard.readText().catch(() => "")), contact: await A.atContact() };
    ok("V6.19 LinkedIn del encabezado (otra vez): de nuevo otra pestaña, enlace copiado y el asistente abierto en Contacto", again.tab && again.reopened && again.clip === liHref && again.contact, JSON.stringify(again));
    ok("Asistente (LinkedIn) sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // Móvil (390×844 y 375×667): hoja inferior de media pantalla que deja ver la página.
  for (const [w, h] of [[390, 844], [375, 667]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".hero .email .icon-btn").tap();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await uiRest(page); // el panel termina de abrirse (escala) antes de medirlo
    const geo = await page.evaluate(() => {
      const p = document.querySelector(".assistant-panel").getBoundingClientRect();
      const row = document.querySelector("#contacto .footer-actions").getBoundingClientRect();
      return { top: p.top, height: p.height, width: p.width, bottom: p.bottom, row: row.bottom, vh: innerHeight, vw: innerWidth };
    });
    ok(`Móvil ${w}×${h}: el asistente ocupa cerca de la mitad inferior`, geo.height >= geo.vh * 0.44 && geo.height <= geo.vh * 0.6 && geo.width >= geo.vw - 1 && Math.abs(geo.bottom - geo.vh) < 2, JSON.stringify(geo));
    ok(`Móvil ${w}×${h}: el correo y LinkedIn de Contacto quedan visibles encima`, geo.row <= geo.top, JSON.stringify(geo));
    // Contra clientWidth: en celular, si algo se sale, el navegador aleja la vista y innerWidth crece con el contenido.
    ok(`Móvil ${w}×${h}: sin desplazamiento horizontal`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    ok(`Móvil ${w}×${h}: no abre el teclado sin pedirlo`, await page.evaluate(() => !document.activeElement?.classList.contains("assistant-input")));
    if (w === 390) await page.screenshot({ path: `${SHOTS}/m6-asistente.png` });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await scrollRest(page);
    ok(`Móvil ${w}×${h}: todo el contacto se puede leer por encima del panel`, await page.evaluate(() => document.querySelector(".foot").getBoundingClientRect().bottom <= document.querySelector(".assistant-panel").getBoundingClientRect().top));
    await page.locator(".assistant-suggest .assistant-chip").first().tap();
    await page.waitForSelector(".msg-typing", { state: "detached", timeout: 4000 });
    ok(`Móvil ${w}×${h}: las sugerencias funcionan al tocarlas`, await page.locator(".msg-me").count() === 1 && await page.locator(".msg-bot").count() === 2);
    // Bajar y volver a subir dentro del pie no lo contrae: sigue en Contacto.
    await page.evaluate(() => window.scrollBy(0, -Math.round(innerHeight * 0.25)));
    await scrollRest(page);
    await page.waitForTimeout(300);
    ok(`Móvil ${w}×${h}: subir un poco dentro del pie no lo contrae`, await A.isOpen(), JSON.stringify(await A.state()));
    // Volver a subir a explorar la página (Contacto queda casi fuera de la pantalla, abajo).
    await page.evaluate(() => window.scrollTo(0, document.getElementById("contacto").getBoundingClientRect().top + scrollY - Math.round(innerHeight * 0.8)));
    await until(page, () => document.documentElement.dataset.assistant === "min" && !!document.querySelector(".assistant-bubble.is-shown"), null, 6000);
    await scrollRest(page);
    await page.waitForTimeout(400);
    await uiRest(page);
    ok(`Móvil ${w}×${h}: al subir se contrae en la burbuja`, await A.isMin(), JSON.stringify(await A.state()));
    ok(`Móvil ${w}×${h}: la burbuja no tapa botones, enlaces ni títulos`, await A.bubbleCovers() === "", await A.bubbleCovers());
    if (w === 390) await page.screenshot({ path: `${SHOTS}/m7-asistente-burbuja.png` });
    await page.locator(".assistant-bubble").tap();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok(`Móvil ${w}×${h}: la burbuja lo reabre en Contacto`, await A.atContact(), JSON.stringify(await A.state()));
    await page.locator(".assistant-min").tap();
    await until(page, () => !("assistantSpace" in document.documentElement.dataset), null, 4000);
    await scrollRest(page);
    await uiRest(page);
    ok(`Móvil ${w}×${h}: al minimizarlo con el botón no queda espacio vacío bajo el pie`, await page.evaluate(() => !("assistantSpace" in document.documentElement.dataset) && innerHeight - document.querySelector(".foot").getBoundingClientRect().bottom <= 120), await page.evaluate(() => JSON.stringify({ foot: document.querySelector(".foot").getBoundingClientRect().bottom, vh: innerHeight })));
    if (w === 390) {
      // Menú móvil: copiar el correo cierra el menú y lleva al asistente, como en el encabezado.
      await page.evaluate(() => window.scrollTo(0, 900));
      await scrollRest(page);
      await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
      await page.getByRole("button", { name: "Abrir menú" }).tap();
      await page.locator("#menu-movil .email .icon-btn").tap();
      await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
      ok("Móvil: copiar el correo desde el menú lo cierra y abre el asistente en Contacto", await page.locator("#menu-movil").isHidden() && await A.atContact());
      // V6.6: «Contacto» del menú también lo abre (y cierra el menú), con un solo viaje hasta Contacto.
      await page.locator(".assistant-min").tap();
      await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
      await page.evaluate(() => window.scrollTo(0, 900));
      await scrollRest(page);
      await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
      await page.getByRole("button", { name: "Abrir menú" }).tap();
      await page.locator("#menu-movil nav a", { hasText: "Contacto" }).tap();
      await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
      await scrollRest(page);
      ok("V6.6 móvil: «Contacto» del menú lo cierra y abre el asistente en Contacto", await page.locator("#menu-movil").isHidden() && await A.isOpen() && await A.atContact(), JSON.stringify(await A.state()));
      ok("V6.6 móvil: el correo y LinkedIn de Contacto quedan visibles encima del panel", await page.evaluate(() => document.querySelector("#contacto .footer-actions").getBoundingClientRect().bottom <= document.querySelector(".assistant-panel").getBoundingClientRect().top));
    }
    ok(`Móvil ${w}×${h}: asistente sin errores`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ---------- V6.6: «Contacto» de la barra como primera entrada ----------
  // Saluda con los tres medios de contacto (copiar correo, escribir, LinkedIn), sin aviso de «copiado» porque no
  // se copió nada; pulsarlo otra vez con el panel abierto no repite el saludo.
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.mouse.move(600, 300);
    await page.mouse.wheel(0, 700);
    await scrollRest(page);
    await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
    await page.locator(".topnav a", { hasText: "Contacto" }).click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await scrollRest(page);
    ok("V6.6 «Contacto» como primera entrada: abre el asistente en Contacto", await A.isOpen() && await A.atContact(), JSON.stringify(await A.state()));
    const greeting = page.locator(".msg-bot").first();
    ok("V6.6 «Contacto» como primera entrada: saluda y ofrece copiar el correo, escribir y LinkedIn", await page.locator(".msg-bot").count() === 1 && /versión de demostración/.test(await greeting.innerText()) && await greeting.locator(".msg-actions .assistant-chip").count() === 3 && await greeting.locator('a[href^="mailto:"]').count() === 1 && await greeting.locator('a[href*="linkedin.com"][target="_blank"]').count() === 1);
    ok("V6.6 «Contacto» como primera entrada: sin aviso de «copiado» (no se copió nada) y con sugerencias", await page.locator(".assistant-toast.is-shown").count() === 0 && await page.locator(".assistant-suggest .assistant-chip").count() >= 3);
    ok("V6.6 «Contacto» como primera entrada: el campo queda listo para escribir", await page.evaluate(() => document.activeElement?.classList.contains("assistant-input")));
    await page.locator(".topnav a", { hasText: "Contacto" }).click();
    await page.waitForTimeout(700);
    await scrollRest(page);
    ok("V6.6 «Contacto» otra vez con el panel abierto: sigue abierto y sin repetir el saludo", await A.isOpen() && await page.locator(".msg-bot").count() === 1, JSON.stringify(await A.state()));
    ok("V6.6 «Contacto» (primera entrada) sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ---------- V6.6: la hadita se puede mover ----------
  // Arrastrarla (ratón aquí; dedo más abajo) la pega al lado más cercano, a esa altura, sin salirse de la ventana
  // ni meterse bajo la barra; el clic que la suelta no la abre, un clic sin arrastre sí; recuerda su sitio al
  // contraerse otra vez y al recargar (misma visita); donde la dejó la persona no se mueve sola, salvo para
  // esconderse en pantalla completa.
  const bubbleInfo = (page) => page.evaluate(() => {
    const b = document.querySelector(".assistant-bubble");
    const r = b.getBoundingClientRect();
    const hint = b.querySelector(".assistant-hint").getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), side: b.dataset.side || "", placed: "placed" in b.dataset, away: b.hasAttribute("data-away"), dragging: b.hasAttribute("data-dragging"), cursor: getComputedStyle(b).cursor, hintSide: hint.left > r.right ? "right" : hint.right < r.left ? "left" : "?" };
  });
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".hero .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await scrollRest(page);
    await page.waitForTimeout(400);
    await uiRest(page);
    let b = await bubbleInfo(page);
    ok("V6.6 hadita: en reposo, abajo a la derecha, con el cursor de arrastrar", b.x + b.w === 1366 - 18 && b.cursor === "grab" && !b.placed, JSON.stringify(b));
    await page.mouse.move(b.cx, b.cy);
    await page.mouse.down();
    await page.mouse.move(b.cx - 100, b.cy - 50, { steps: 6 });
    await page.mouse.move(300, 300, { steps: 10 });
    b = await bubbleInfo(page);
    ok("V6.6 hadita: mientras se arrastra sigue al puntero", b.dragging && Math.abs(b.cx - 300) <= 2 && Math.abs(b.cy - 300) <= 2 && b.cursor === "grabbing", JSON.stringify(b));
    await page.mouse.up();
    // Al soltar se desliza al borde (transición de 0,3 s): se espera a que llegue.
    const bubbleAt = (page, left, top) => until(page, ([l, t]) => { const r = document.querySelector(".assistant-bubble").getBoundingClientRect(); return !document.querySelector(".assistant-bubble[data-dragging]") && (l == null || Math.round(r.left) === l) && (t == null || Math.round(r.top) === t); }, [left, top], 5000);
    await bubbleAt(page, 18, null);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok("V6.6 hadita: al soltarla se pega al borde izquierdo a esa altura (y la pista pasa a su derecha)", !b.dragging && b.x === 18 && Math.abs(b.cy - 300) <= 2 && b.side === "left" && b.hintSide === "right", JSON.stringify(b));
    ok("V6.6 hadita: soltarla no abre el asistente", await A.isMin());
    ok("V6.6 hadita: el sitio se guarda para la visita (sessionStorage)", /"side":"left"/.test(await page.evaluate(() => sessionStorage.getItem("jc-assistant-bubble") || "")));
    await page.locator(".assistant-bubble").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    ok("V6.6 hadita: un clic sin arrastre la sigue abriendo", await A.isOpen() && await A.atContact(), JSON.stringify(await A.state()));
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok("V6.6 hadita: al contraerse vuelve donde la persona la dejó", b.x === 18 && Math.abs(b.cy - 300) <= 2 && b.placed, JSON.stringify(b));
    await page.mouse.move(b.cx, b.cy);
    await page.mouse.down();
    await page.mouse.move(1360, 5, { steps: 12 });
    await page.mouse.up();
    await bubbleAt(page, 1366 - 18 - 54, 72);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok("V6.6 hadita: arrastrada fuera, se queda dentro de la ventana y bajo la barra", b.x + b.w === 1366 - 18 && b.y === 62 + 10 && b.side === "right" && b.hintSide === "left", JSON.stringify(b));
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".hero .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok("V6.6 hadita: al recargar (misma visita) vuelve a su sitio", b.x + b.w === 1366 - 18 && b.y === 72, JSON.stringify(b));
    await page.locator(".assistant-bubble").focus();
    await page.keyboard.press("Enter");
    ok("V6.6 hadita: con el teclado (Enter) se sigue abriendo", await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 }).then(() => true, () => false));
    await page.keyboard.press("Escape");
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await scrollRest(page);
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.getByRole("button", { name: "Pantalla completa" }).first().click();
    await until(page, () => !!document.querySelector(".universe-wrap.is-fullscreen") || !!document.fullscreenElement, null, 5000);
    await until(page, () => document.querySelector(".assistant-bubble").hasAttribute("data-away"), null, 4000);
    ok("V6.6 hadita: en pantalla completa se esconde aunque la persona la haya colocado", (await bubbleInfo(page)).away);
    await page.keyboard.press("Escape");
    await until(page, () => !document.querySelector(".universe-wrap.is-fullscreen") && !document.fullscreenElement, null, 5000);
    await until(page, () => !document.querySelector(".assistant-bubble").hasAttribute("data-away"), null, 4000);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok("V6.6 hadita: al salir de pantalla completa vuelve a su sitio", !b.away && b.y === 72 && b.x + b.w === 1366 - 18, JSON.stringify(b));
    ok("V6.6 hadita (ratón) sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }
  // Con el dedo (toques reales por CDP): la página no se desplaza mientras se arrastra.
  for (const [w, h] of [[390, 844], [375, 667]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX" });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".hero .email .icon-btn").tap();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await page.locator(".assistant-min").tap();
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await scrollRest(page);
    await page.waitForTimeout(400);
    await uiRest(page);
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
    let b = await bubbleInfo(page);
    const y0 = await page.evaluate(() => scrollY);
    await touch("touchStart", b.cx, b.cy);
    for (let i = 1; i <= 12; i++) { await touch("touchMove", b.cx + (60 - b.cx) * i / 12, b.cy + (300 - b.cy) * i / 12); await page.waitForTimeout(16); }
    const mid = await bubbleInfo(page);
    await touch("touchEnd", 0, 0);
    await until(page, () => { const r = document.querySelector(".assistant-bubble").getBoundingClientRect(); return !document.querySelector(".assistant-bubble[data-dragging]") && Math.round(r.left) === 14; }, null, 5000);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok(`V6.6 hadita, celular ${w}×${h}: con el dedo sigue al toque y la página no se mueve`, mid.dragging && Math.abs(mid.cx - 60) <= 2 && Math.abs(mid.cy - 300) <= 2 && await page.evaluate(() => scrollY) === y0, JSON.stringify({ mid, y0 }));
    ok(`V6.6 hadita, celular ${w}×${h}: al soltarla se pega al borde izquierdo a esa altura`, b.x === 14 && Math.abs(b.cy - 300) <= 2 && b.side === "left", JSON.stringify(b));
    ok(`V6.6 hadita, celular ${w}×${h}: soltarla no abre el asistente`, await A.isMin());
    await page.locator(".assistant-bubble").tap();
    ok(`V6.6 hadita, celular ${w}×${h}: un toque sin arrastre la sigue abriendo`, await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 }).then(() => true, () => false));
    await page.locator(".assistant-min").tap();
    await until(page, () => document.documentElement.dataset.assistant === "min", null, 4000);
    await uiRest(page);
    b = await bubbleInfo(page);
    ok(`V6.6 hadita, celular ${w}×${h}: al contraerse vuelve donde la dejó`, b.x === 14 && Math.abs(b.cy - 300) <= 2, JSON.stringify(b));
    ok(`V6.6 hadita, celular ${w}×${h} sin errores`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // Modo oscuro y movimiento reducido.
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX", colorScheme: "dark" });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".hero .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await uiRest(page);
    ok("Oscuro: el asistente pasa a noche con texto crema", await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector(".assistant-panel"));
      return cs.backgroundColor === "rgb(24, 35, 68)" && cs.color === "rgb(243, 234, 214)";
    }));
    await page.screenshot({ path: `${SHOTS}/d9-asistente-oscuro.png` });
    ok("Oscuro: asistente sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX", reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const A = assistantProbe(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".hero .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 5000 });
    ok("Movimiento reducido: el asistente aparece sin animaciones y en Contacto", await A.atContact() && await page.evaluate(() => getComputedStyle(document.querySelector(".assistant-panel")).transitionDuration === "0s"));
    await page.locator(".assistant-min").click();
    ok("Movimiento reducido: la hadita queda quieta", await page.evaluate(() => getComputedStyle(document.querySelector(".assistant-bubble .fairy-wings")).animationName === "none"));
    await ctx.close();
  }

  // ---------- Idioma inicial según el navegador ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok("Un navegador en inglés abre el sitio en inglés", await page.evaluate(() => document.documentElement.lang === "en") && await page.getByText("Explore my projects").isVisible());
    await ctx.close();
  }

  // ---------- Rutas de entrada ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: "es-MX" });
    await page.goto(BASE + "/proyecto/finanzas-datos", { waitUntil: "networkidle" });
    await page.waitForSelector(".sheet h2");
    ok("/proyecto/<id> abre esa ficha", (await page.locator(".sheet h2").textContent()).includes("NetSuite"));
    await page.goto(BASE + "/nave", { waitUntil: "networkidle" });
    await page.waitForSelector(".sheet h2");
    ok("/nave abre la ficha de la nave", (await page.locator(".sheet h2").textContent()).includes("La nave"));
    await page.goto(BASE + "/video", { waitUntil: "networkidle" });
    await page.waitForSelector("#video");
    ok("/video es una página propia con el video de presentación embebido (YouTube)", await page.locator(".universe").count() === 0 && await page.locator("dialog").count() === 0 && await page.locator("#video iframe[src*='youtube-nocookie.com/embed/kB4uux4evWQ']").count() === 1);
    ok("/video: barra de navegación visible y contacto debajo", await page.locator(".topbar").isVisible() && await page.locator("#contacto").isVisible());
    ok("/video: enlace para abrirlo en YouTube", await page.locator("#video a[href*='youtube.com/watch?v=kB4uux4evWQ']").count() === 1);
    ok("/video: título del documento", (await page.title()).includes("Video de presentación"));
    await page.goto(BASE + "/sobremi", { waitUntil: "networkidle" });
    await page.waitForSelector("#video");
    ok("/sobremi (ruta antigua) redirige a la página del video", new URL(page.url()).pathname === "/video" && await page.locator("#video iframe").count() === 1);
    ok("No queda ningún enlace ni texto «Sobre mí» en la página del video", await page.locator('a[href="/sobremi"]').count() === 0 && await page.getByText("Sobre mí", { exact: true }).count() === 0);
    await page.locator(".topnav").getByText("Proyectos").click();
    await page.waitForSelector(".u-canvas, .pcard", { timeout: 15000 });
    ok("Desde la página del video, «Proyectos» regresa al universo", await page.locator(".universe").count() === 1 && await page.locator(".u-canvas, .pcard").count() >= 1);
    ok("Tampoco hay enlaces a «Sobre mí» en la página principal (barra, menú y pie)", await page.locator('a[href="/sobremi"]').count() === 0 && await page.getByText("Sobre mí", { exact: true }).count() === 0);
    await page.locator(".topnav").getByText("Contacto").click();
    // El desplazamiento es suave: se espera a que llegue (hasta 8 s si la máquina va cargada).
    await page.waitForFunction(() => document.querySelector("#contacto").getBoundingClientRect().top < 700, null, { timeout: 8000 }).catch(() => {});
    const yc = await page.evaluate(() => document.querySelector("#contacto").getBoundingClientRect().top);
    ok("Barra: «Contacto» lleva al contacto", yc < 700, `top=${yc}`);
    ok("Barra: Proyectos · Contacto · Video (sin «Inicio» ni «Sobre mí»)", await page.locator(".topnav").getByText("Inicio", { exact: true }).count() === 0 && await page.locator(".topnav a").count() === 3);
    await page.locator(".topnav").getByText("Video", { exact: true }).click();
    await page.waitForSelector("#video");
    ok("Barra: «Video» abre la página del video (no la nave)", await page.locator(".sheet").count() === 0 && await page.locator("#video iframe").count() === 1 && new URL(page.url()).pathname === "/video");
    await page.close();
  }

  // ---------- Página del video y música ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: "es-MX" });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator(".hero .music-btn").click();
    await page.waitForTimeout(500);
    const started = await page.evaluate(() => !document.querySelector("audio").paused);
    await page.locator('.hero-contact a[href="/video"]').click();
    await page.waitForSelector("#video");
    ok("«Video de presentación» del encabezado abre la página del video", await page.locator("#video iframe").count() === 1 && new URL(page.url()).pathname === "/video");
    const paused = await page.waitForFunction(() => document.querySelector("audio").paused, null, { timeout: 5000 }).then(() => true).catch(() => false);
    ok("La página del video pausa la música de fondo", started && paused, `sonaba=${started} pausada=${paused}`);
    await page.getByRole("link", { name: /Ver mis proyectos/ }).click();
    const resumed = await page.waitForFunction(() => !document.querySelector("audio").paused, null, { timeout: 5000 }).then(() => true).catch(() => false);
    ok("Al salir de la página del video la música se reanuda", resumed);
    ok("Sin falso aviso de «música no disponible» tras pausar y reanudar", await page.locator(".music.is-error").count() === 0);
    await page.close();
  }

  // ---------- Video nativo (build de prueba) ----------
  if (VIDEO_TEST) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: "es-MX" });
    const errors = [];
    watch(page, errors);
    let videoRequests = 0;
    page.on("request", (r) => { if (r.url().includes("/videos/")) videoRequests++; });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok("Ningún video se descarga al cargar la página", videoRequests === 0, `peticiones=${videoRequests}`);
    await page.goto(BASE + "/proyecto/robot-6dof", { waitUntil: "networkidle" });
    await page.waitForSelector(".sheet h2");
    ok("Ficha sin abrir el video: 0 descargas", videoRequests === 0);
    await page.getByRole("button", { name: /^Ver videos?/ }).click();
    await page.waitForSelector("dialog video");
    await page.waitForFunction(() => document.querySelector("dialog video").readyState >= 1, null, { timeout: 10000 });
    const dur = await page.evaluate(() => document.querySelector("dialog video").duration);
    ok("Video nativo carga metadatos (duración)", dur > 1, `duración=${dur}`);
    ok("Controles nativos activos", await page.evaluate(() => document.querySelector("dialog video").controls));
    await page.evaluate(() => { const v = document.querySelector("dialog video"); v.muted = true; return v.play(); });
    await page.waitForTimeout(800);
    const t1 = await page.evaluate(() => document.querySelector("dialog video").currentTime);
    ok("Reproduce", t1 > 0.2, `t=${t1}`);
    await page.evaluate(() => { document.querySelector("dialog video").currentTime = 2; });
    await page.waitForTimeout(300);
    ok("Avanzar en la línea de tiempo", await page.evaluate(() => document.querySelector("dialog video").currentTime >= 2));
    await page.evaluate(() => { document.querySelector("dialog video").volume = 0.3; });
    ok("Ajustar volumen", await page.evaluate(() => document.querySelector("dialog video").volume === 0.3));
    await page.screenshot({ path: `${SHOTS}/d5-video.png` });
    // pausa al cerrar: espiamos pause()
    await page.evaluate(async () => {
      window.__v = document.querySelector("dialog video");
      window.__v.currentTime = 0.5;
      await window.__v.play();
      window.__wasPlaying = !window.__v.paused;
    });
    await page.getByRole("button", { name: "Cerrar visor" }).click();
    await page.waitForTimeout(200);
    ok("Al cerrar, el video se pausa", await page.evaluate(() => window.__wasPlaying && window.__v.paused));
    ok("Al cerrar, vuelve a la ficha", await page.locator(".sheet").count() === 1 && await page.locator("dialog").count() === 0);

    // estado de error: fuente inexistente
    await page.route("**/videos/prueba.mp4", (r) => r.fulfill({ status: 404, body: "" }));
    await page.getByRole("button", { name: /^Ver videos?/ }).click();
    await page.waitForSelector(".video-status.is-error", { timeout: 10000 });
    ok("Estado de error visible si el video no carga", true);
    await page.keyboard.press("Escape");
    await page.close();
  }

  // ---------- Evidencias de la ficha (V6.8) ----------
  // Imágenes y videos no van incrustados en la ficha: «Ver video» y «Ver imágenes» abren el visor
  // (carrusel sobre la página) con flechas, teclado, deslizar y Escape; el foco vuelve al botón.
  // El reproductor de YouTube se sustituye por una página mínima en la misma dirección: la prueba es
  // del visor, no de YouTube, y así no depende de la red (y la captura con el iframe no se cuelga).
  const FAKE_YT = "<!doctype html><html><body style='margin:0;height:100vh;display:grid;place-items:center;background:#000;color:#fff;font:700 20px sans-serif'>YouTube (simulado)</body></html>";
  const fakeYouTube = (page) => page.route("https://www.youtube-nocookie.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: FAKE_YT }));
  // Con un iframe de otro origen en pantalla, la captura de Chromium sin GPU a veces no entrega el cuadro:
  // esas capturas son solo ilustrativas y no detienen la prueba (las comprobaciones ya se hicieron).
  const shotSoft = (page, path) => page.screenshot({ path, timeout: 8000 }).catch(() => {});
  {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
    watch(page, errors);
    await fakeYouTube(page);
    let imageRequests = 0;
    page.on("request", (r) => { if (r.url().includes("/images/proyectos/")) imageRequests++; });
    await page.goto(BASE + "/proyecto/robot-6dof", { waitUntil: "networkidle" });
    await page.waitForSelector(".sheet h2");
    await uiRest(page);
    const heads = await page.locator(".sheet-section h3").allTextContents();
    ok("V6.8 evidencias: la sección «Evidencia» va justo después de «Tecnologías»", heads.indexOf("Evidencia") === heads.indexOf("Tecnologías") + 1 && heads.indexOf("Tecnologías") >= 0, heads.join(" | "));
    ok("V6.8 evidencias: la ficha no incrusta imágenes ni videos", await page.locator(".sheet img, .sheet iframe, .sheet video").count() === 0);
    ok("V6.8 evidencias: ninguna imagen se descarga antes de abrir el visor", imageRequests === 0, `peticiones=${imageRequests}`);
    const btnVideo = page.getByRole("button", { name: "Ver video", exact: true });
    const btnImages = page.getByRole("button", { name: "Ver imágenes (2)", exact: true });
    ok("V6.8 evidencias: botones «Ver video» y «Ver imágenes (2)»", await btnVideo.count() === 1 && await btnImages.count() === 1 && await btnVideo.isVisible() && await btnImages.isVisible());
    await page.evaluate(() => document.querySelector(".sheet .evidence-actions").scrollIntoView({ block: "center" }));
    await page.screenshot({ path: `${SHOTS}/d6-evidencias-ficha.png` });

    const shown = (pg = page) => pg.evaluate(() => {
      const d = document.querySelector("dialog.evidence-modal[open]");
      const img = d?.querySelector(".evidence-view img");
      const ifr = d?.querySelector(".evidence-view iframe");
      return {
        count: d?.querySelector(".evidence-count [aria-hidden]")?.textContent.replace(/\s+/g, " ").trim() || "",
        img: img ? img.getAttribute("src") : null,
        ifr: ifr ? ifr.getAttribute("src") : null,
        caption: d?.querySelector(".evidence-caption")?.textContent || "",
        title: d?.querySelector("#evidence-title")?.textContent || "",
        locked: document.body.style.overflow === "hidden",
      };
    });
    const imgLoaded = (pg = page) => until(pg, () => { const i = document.querySelector("dialog.evidence-modal img"); return i && i.complete && i.naturalWidth > 0; }, null, 10000)
      .then(async (r) => { await pg.evaluate(() => document.querySelector("dialog.evidence-modal img")?.decode().catch(() => {})); return r; });
    const boxFits = (pg = page) => pg.evaluate(() => { const r = document.querySelector("dialog.evidence-modal .evidence-box").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 0.5 && r.left >= 0 && r.right <= innerWidth + 0.5 && document.documentElement.scrollWidth <= innerWidth; });
    const imgContained = (pg = page) => pg.evaluate(() => { const v = document.querySelector("dialog.evidence-modal .evidence-view").getBoundingClientRect(); const i = document.querySelector("dialog.evidence-modal img").getBoundingClientRect(); return i.height > 50 && i.width > 50 && i.height <= v.height + 1 && i.width <= v.width + 1; });
    const frameRects = () => page.evaluate(() => ["dialog.evidence-modal .evidence-box", ".evidence-arrow.is-prev", ".evidence-arrow.is-next"].map((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [Math.round(r.top), Math.round(r.left), Math.round(r.width), Math.round(r.height)].join(","); }).join(" | "));

    // Imágenes
    await btnImages.click();
    await page.waitForSelector("dialog.evidence-modal[open]");
    let s = await shown();
    ok("V6.8 visor: «Ver imágenes» abre en la primera imagen (2 / 3), sin montar el video", s.img?.endsWith("/app-y-robot.jpg") && s.count.includes("2 / 3") && !s.ifr, JSON.stringify(s));
    ok("V6.8 visor: título y pie de la imagen", s.title === "Evidencia: Control y monitoreo de un robot industrial con RoboSCADA" && s.caption.length > 20, JSON.stringify(s));
    ok("V6.8 visor: la imagen se carga y cabe entera en el escenario", await imgLoaded() && await imgContained());
    ok("V6.8 visor: la ventana cabe en la pantalla", await boxFits());
    const rects0 = await frameRects();
    ok("V6.8 visor: el foco empieza en Cerrar y la página de atrás queda quieta", s.locked && await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Cerrar visor"));
    await page.screenshot({ path: `${SHOTS}/d6-evidencias-imagen.png` });
    await page.getByRole("button", { name: "Evidencia siguiente" }).click();
    s = await shown();
    ok("V6.8 visor: la flecha pasa a la segunda imagen (3 / 3)", s.img?.endsWith("/diagrama.png") && s.count.includes("3 / 3"), JSON.stringify(s));
    ok("V6.8 visor: la segunda imagen (casi cuadrada) también se carga, cabe entera y no se recorta", await imgLoaded() && await imgContained() && await boxFits());
    ok("V6.8 visor: la ventana y las flechas no se mueven al cambiar de imagen", await frameRects() === rects0, `${rects0} → ${await frameRects()}`);
    await page.keyboard.press("ArrowRight");
    s = await shown();
    ok("V6.8 visor: → da la vuelta al video (1 / 3), iframe de YouTube sin cookies", s.ifr?.includes("youtube-nocookie.com/embed/TdU0hq1quLo") && s.count.includes("1 / 3") && !s.img, JSON.stringify(s));
    ok("V6.8 visor: el video dice dónde está alojado y ofrece abrirlo en YouTube", await page.locator("dialog.evidence-modal .video-foot a[href='https://www.youtube.com/watch?v=TdU0hq1quLo']").count() === 1);
    ok("V6.8 visor: con el video, la ventana sigue cabiendo y nada se mueve", await boxFits() && await frameRects() === rects0, `${rects0} → ${await frameRects()}`);
    ok("V6.8 visor: al cargar el video desaparece «Cargando video…»", await until(page, () => !document.querySelector("dialog.evidence-modal .video-status"), null, 8000));
    await shotSoft(page, `${SHOTS}/d6-evidencias-video.png`);
    await page.keyboard.press("ArrowLeft");
    s = await shown();
    ok("V6.8 visor: ← vuelve a la última imagen y desmonta el video", s.img?.endsWith("/diagrama.png") && !s.ifr && s.count.includes("3 / 3"), JSON.stringify(s));
    // Deslizar con el ratón sobre la imagen (el mismo gesto que con el dedo)
    const box = await page.locator("dialog.evidence-modal .evidence-view").boundingBox();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    s = await shown();
    ok("V6.8 visor: deslizar hacia la izquierda pasa a la siguiente", s.ifr?.includes("TdU0hq1quLo") && s.count.includes("1 / 3"), JSON.stringify(s));
    await page.keyboard.press("Escape");
    await until(page, () => !document.querySelector("dialog[open]"), null, 4000);
    // El foco vuelve en el siguiente cuadro de animación: se espera la condición, no un tiempo fijo.
    ok("V6.8 visor: Escape cierra y el foco vuelve a «Ver imágenes (2)»", await page.locator("dialog.evidence-modal").count() === 0 && await until(page, () => document.activeElement?.textContent.trim() === "Ver imágenes (2)", null, 3000), await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)));
    ok("V6.8 visor: al cerrar, la página vuelve a poder desplazarse", await page.evaluate(() => document.body.style.overflow !== "hidden"));

    // Video
    await btnVideo.click();
    await page.waitForSelector("dialog.evidence-modal[open]");
    s = await shown();
    ok("V6.8 visor: «Ver video» abre en el video (1 / 3)", s.ifr?.includes("TdU0hq1quLo") && s.count.includes("1 / 3"), JSON.stringify(s));
    await page.locator("dialog.evidence-modal .evidence-arrow.is-prev").click();
    s = await shown();
    ok("V6.8 visor: desde el video, «anterior» da la vuelta a la última imagen", s.img?.endsWith("/diagrama.png") && s.count.includes("3 / 3"), JSON.stringify(s));
    await page.getByRole("button", { name: "Cerrar visor" }).click();
    await until(page, () => !document.querySelector("dialog[open]"), null, 4000);
    ok("V6.8 visor: la X cierra y el foco vuelve a «Ver video»", await page.locator("dialog").count() === 0 && await until(page, () => document.activeElement?.textContent.trim() === "Ver video", null, 3000), await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)));
    await btnVideo.click();
    await page.waitForSelector("dialog.evidence-modal[open]");
    await page.mouse.click(8, 8);
    await until(page, () => !document.querySelector("dialog[open]"), null, 4000);
    ok("V6.8 visor: tocar fuera cierra", await page.locator("dialog").count() === 0 && await page.locator(".sheet").count() === 1);

    // Música: se pausa solo mientras lo que se ve es un video, y vuelve con una imagen o al cerrar.
    const musicBtn = page.locator(".top-actions .music-btn").first();
    const audioPaused = () => page.evaluate(() => document.querySelector("audio").paused);
    if (await audioPaused()) await musicBtn.click();
    const m = { started: await until(page, () => !document.querySelector("audio").paused, null, 5000) };
    await btnVideo.click();
    await page.waitForSelector("dialog.evidence-modal[open]");
    m.pausedOnVideo = await until(page, () => document.querySelector("audio").paused, null, 5000);
    await page.keyboard.press("ArrowRight"); // → imagen
    m.backOnImage = await until(page, () => !document.querySelector("audio").paused, null, 5000);
    await page.keyboard.press("ArrowLeft"); // → video otra vez
    m.pausedAgain = await until(page, () => document.querySelector("audio").paused, null, 5000);
    await page.keyboard.press("Escape");
    await until(page, () => !document.querySelector("dialog[open]"), null, 4000);
    m.resumedOnClose = await until(page, () => !document.querySelector("audio").paused, null, 5000);
    ok("V6.8 visor: la música se pausa con el video, vuelve con una imagen y vuelve al cerrar", Object.values(m).every(Boolean), JSON.stringify(m));
    await musicBtn.click(); // apagarla
    ok("V6.8 evidencias: sin errores", errors.length === 0, errors.join(" | "));
    await page.close();

    // ---------- V6.9: proyectos con solo imágenes (varias y una sola) y textos en párrafos ----------
    // En un contexto nuevo: en la página anterior, tras encender y apagar la música, Chromium deja abiertas las
    // conexiones de musica.mp3 (el servidor de pruebas no maneja rangos) y una navegación más puede quedarse esperando.
    const ctx9 = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
    const p9 = await ctx9.newPage();
    const err9 = [];
    watch(p9, err9);
    await p9.goto(BASE + "/proyecto/finanzas-datos", { waitUntil: "networkidle" });
    await p9.waitForSelector(".sheet h2");
    await uiRest(p9);
    const pCount = await p9.evaluate(() => {
      const sec = [...document.querySelectorAll(".sheet-section")].find((x) => x.querySelector("h3")?.textContent === "Mi contribución");
      return sec ? sec.querySelectorAll("p").length : 0;
    });
    ok("V6.9 ficha: «Mi contribución» se muestra en varios párrafos (2 desde la V6.14)", pCount >= 2, `párrafos=${pCount}`);
    ok("V6.9 evidencias: Finanzas y datos solo ofrece «Ver imágenes (3)»", await p9.getByRole("button", { name: "Ver imágenes (3)", exact: true }).count() === 1 && await p9.getByRole("button", { name: /^Ver videos?/ }).count() === 0);
    await p9.getByRole("button", { name: "Ver imágenes (3)", exact: true }).click();
    await p9.waitForSelector("dialog.evidence-modal[open]");
    let s9 = await shown(p9);
    ok("V6.9 visor: abre en 1 / 3 con el primer dashboard, su título y su pie", s9.count.includes("1 / 3") && s9.img?.endsWith("/dashboard-comercial-ventas.png") && s9.title === "Evidencia: Integración serverless de NetSuite con Power BI y dashboards web" && /pixelad/.test(s9.caption), JSON.stringify(s9));
    ok("V6.9 visor: el dashboard (apaisado y ancho) se carga y cabe entero", await imgLoaded(p9) && await imgContained(p9) && await boxFits(p9));
    await p9.screenshot({ path: `${SHOTS}/d6-evidencias-dashboard.png` });
    await p9.keyboard.press("ArrowRight");
    await p9.keyboard.press("ArrowRight");
    s9 = await shown(p9);
    ok("V6.9 visor: → → llega al tercer dashboard (3 / 3)", s9.count.includes("3 / 3") && s9.img?.endsWith("/control-almacen.png"), JSON.stringify(s9));
    ok("V6.9 visor: el tercer dashboard también cabe entero", await imgLoaded(p9) && await imgContained(p9));
    await p9.keyboard.press("Escape");
    await until(p9, () => !document.querySelector("dialog[open]"), null, 4000);
    await p9.close();

    // MealFlow en una pestaña nueva del mismo contexto (una navegación más en la misma pestaña se quedó esperando una vez).
    const p9b = await ctx9.newPage();
    watch(p9b, err9);
    await p9b.goto(BASE + "/proyecto/mealflow", { waitUntil: "networkidle" });
    await until(p9b, () => !!document.querySelector(".sheet h2"), null, 15000);
    await uiRest(p9b);
    // V6.17: MealFlow pasa de una imagen a tres (las capturas de «Desayunos» y «Pedidos» que mandó JC).
    ok("V6.17 evidencias: MealFlow ofrece «Ver imágenes (3)» y nada de video", await p9b.getByRole("button", { name: "Ver imágenes (3)", exact: true }).count() === 1 && await p9b.getByRole("button", { name: /^Ver videos?/ }).count() === 0);
    await p9b.getByRole("button", { name: "Ver imágenes (3)", exact: true }).click();
    await p9b.waitForSelector("dialog.evidence-modal[open]");
    s9 = await shown(p9b);
    const meal1 = s9.img?.endsWith("/precios.png") && s9.count.includes("1 / 3") && await imgLoaded(p9b) && await imgContained(p9b);
    await p9b.keyboard.press("ArrowRight");
    s9 = await shown(p9b);
    const meal2 = s9.img?.endsWith("/mealflow/desayunos.jpg") && s9.count.includes("2 / 3") && /desayunos/i.test(s9.caption) && /cámara/.test(s9.caption) && await imgLoaded(p9b) && await imgContained(p9b);
    await p9b.keyboard.press("ArrowRight");
    s9 = await shown(p9b);
    ok("V6.17 visor: MealFlow muestra precios (1 / 3), desayunos (2 / 3) y pedidos (3 / 3), enteras y con su pie", meal1 && meal2 && s9.img?.endsWith("/mealflow/pedidos.jpg") && s9.count.includes("3 / 3") && /Pedidos/.test(s9.caption) && await imgLoaded(p9b) && await imgContained(p9b), JSON.stringify(s9));
    await p9b.screenshot({ path: `${SHOTS}/d6-evidencias-mealflow.png` });
    await p9b.keyboard.press("Escape");
    await until(p9b, () => !document.querySelector("dialog[open]"), null, 4000);
    // V6.10: Supply Chain Hub con una imagen y Mantenimiento KIA con dos
    const p10 = await ctx9.newPage();
    watch(p10, err9);
    await p10.goto(BASE + "/proyecto/supply-chain-hub", { waitUntil: "networkidle" });
    await until(p10, () => !!document.querySelector(".sheet h2"), null, 15000);
    await uiRest(p10);
    ok("V6.10 evidencias: Supply Chain Hub ofrece «Ver imagen» y «El problema» va en su sitio", await p10.getByRole("button", { name: "Ver imagen", exact: true }).count() === 1 && (await p10.locator(".sheet-section h3").allTextContents()).indexOf("El problema") === 0);
    await p10.getByRole("button", { name: "Ver imagen", exact: true }).click();
    await p10.waitForSelector("dialog.evidence-modal[open]");
    let s10 = await shown(p10);
    ok("V6.10 visor: el catálogo de Supply Chain Hub se carga y cabe entero", s10.img?.endsWith("/catalogo.jpg") && await imgLoaded(p10) && await imgContained(p10), JSON.stringify(s10));
    // Una sola evidencia (desde la V6.17 es el único caso: MealFlow ya tiene tres).
    ok("V6.9 visor: una sola evidencia: sin contador ni flechas", s10.count === "" && await p10.locator("dialog.evidence-modal .evidence-count, dialog.evidence-modal .evidence-arrow").count() === 0, JSON.stringify(s10));
    await p10.keyboard.press("ArrowRight");
    s10 = await shown(p10);
    ok("V6.9 visor: con una sola evidencia, → no cambia nada", s10.img?.endsWith("/catalogo.jpg") && await p10.locator("dialog.evidence-modal[open]").count() === 1, JSON.stringify(s10));
    await p10.keyboard.press("Escape");
    await until(p10, () => !document.querySelector("dialog[open]"), null, 4000);
    await p10.close();
    const p10b = await ctx9.newPage();
    watch(p10b, err9);
    await p10b.goto(BASE + "/proyecto/mantenimiento-kia", { waitUntil: "networkidle" });
    await until(p10b, () => !!document.querySelector(".sheet h2"), null, 15000);
    await uiRest(p10b);
    const pKia = await p10b.evaluate(() => { const sec = [...document.querySelectorAll(".sheet-section")].find((x) => x.querySelector("h3")?.textContent === "Mi contribución"); return sec ? sec.querySelectorAll("p").length : 0; });
    ok("V6.10 ficha: Mantenimiento KIA con «Mi contribución» en 2 párrafos (más puntual desde la V6.14) y «Ver imágenes (2)»", pKia === 2 && await p10b.getByRole("button", { name: "Ver imágenes (2)", exact: true }).count() === 1, `párrafos=${pKia}`);
    await p10b.getByRole("button", { name: "Ver imágenes (2)", exact: true }).click();
    await p10b.waitForSelector("dialog.evidence-modal[open]");
    s10 = await shown(p10b);
    const kia1 = s10.img?.endsWith("/qbams-login.png") && s10.count.includes("1 / 2") && await imgLoaded(p10b) && await imgContained(p10b);
    await p10b.keyboard.press("ArrowRight");
    s10 = await shown(p10b);
    ok("V6.10 visor: login de QBAMS (1 / 2) e incidencias de instalaciones (2 / 2), ambas enteras", kia1 && s10.img?.endsWith("/incidencias-instalaciones.png") && s10.count.includes("2 / 2") && await imgLoaded(p10b) && await imgContained(p10b), JSON.stringify(s10));
    await p10b.screenshot({ path: `${SHOTS}/d6-evidencias-kia.png` });
    await p10b.keyboard.press("Escape");
    await until(p10b, () => !document.querySelector("dialog[open]"), null, 4000);
    ok("V6.9 evidencias: sin errores en Finanzas y datos, MealFlow, Supply Chain Hub ni Mantenimiento KIA", err9.length === 0, err9.join(" | "));
    await ctx9.close();

    // ---------- V6.14: proyectos 06 y 07 con el contexto de JC, fichas puntuales y sus evidencias ----------
    // Cada ficha en una pestaña nueva (en esta máquina, una navegación más tras el visor puede tardar mucho).
    const ctx14 = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
    const err14 = [];
    // V6.16: el hospital pasa de 2 a 4 fotos (la del «10» más nítida y otra sesión con la cara pixelada).
    for (const [id, titulo, img1, img2, nImg] of [
      ["scada-planta", "SCADA de mantenimiento en operación 24/7", "/scada-robots-vista-general.jpg", "/scada-robots-detalle.jpg", 2],
      ["hospital-uanl", "Señales EEG y EMG para rehabilitación", "/adquisicion-eeg.jpg", "/sesion-eeg.jpg", 4],
    ]) {
      const pg = await ctx14.newPage();
      watch(pg, err14);
      await pg.goto(BASE + `/proyecto/${id}`, { waitUntil: "networkidle" });
      await until(pg, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pg);
      const f = await pg.evaluate(() => {
        const sec = (t) => [...document.querySelectorAll(".sheet-section")].find((x) => x.querySelector("h3")?.textContent === t);
        const c = sec("Mi contribución"), k = sec("Puntos clave");
        return { h2: document.querySelector(".sheet h2")?.textContent.trim(), sections: [...document.querySelectorAll(".sheet-section h3")].map((h) => h.textContent), parrafos: c ? c.querySelectorAll("p").length : 0, puntos: k ? k.querySelectorAll("li").length : 0 };
      });
      ok(`V6.14 ficha ${id}: título nuevo, «El problema», «Mi contribución» en 2 párrafos y 4 puntos clave`, f.h2 === titulo && f.sections[0] === "El problema" && f.parrafos === 2 && f.puntos === 4, JSON.stringify(f));
      ok(`V6.14 evidencias ${id}: «Ver imágenes (${nImg})» y nada de video`, await pg.getByRole("button", { name: `Ver imágenes (${nImg})`, exact: true }).count() === 1 && await pg.getByRole("button", { name: /^Ver videos?/ }).count() === 0);
      await pg.getByRole("button", { name: `Ver imágenes (${nImg})`, exact: true }).click();
      await pg.waitForSelector("dialog.evidence-modal[open]");
      let s = await shown(pg);
      const first = s.img?.endsWith(img1) && s.count.includes(`1 / ${nImg}`) && s.caption.length > 20 && await imgLoaded(pg) && await imgContained(pg);
      await pg.keyboard.press("ArrowRight");
      s = await shown(pg);
      let rest = s.img?.endsWith(img2) && s.count.includes(`2 / ${nImg}`) && s.caption.length > 20 && await imgLoaded(pg) && await imgContained(pg);
      for (let k = 3; k <= nImg; k++) {
        await pg.keyboard.press("ArrowRight");
        const sk = await shown(pg);
        rest = rest && sk.count.includes(`${k} / ${nImg}`) && sk.caption.length > 20 && await imgLoaded(pg) && await imgContained(pg);
      }
      ok(`V6.14 visor ${id}: las ${nImg} imágenes se cargan, caben enteras y llevan su pie`, first && rest, JSON.stringify(s));
      await pg.screenshot({ path: `${SHOTS}/d6-evidencias-${id}.png` });
      await pg.keyboard.press("Escape");
      await until(pg, () => !document.querySelector("dialog[open]"), null, 4000);
      await pg.close();
    }
    ok("V6.14 evidencias: sin errores en SCADA y planta ni en Hospital UANL", err14.length === 0, err14.join(" | "));
    await ctx14.close();

    // ---------- V6.15: proyecto 08 (VR y la nave) con el contexto de JC, su video de YouTube y dos imágenes ----------
    {
      const ctx15 = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
      const pg = await ctx15.newPage();
      const err15 = [];
      watch(pg, err15);
      await fakeYouTube(pg);
      await pg.goto(BASE + "/proyecto/vr-nave", { waitUntil: "networkidle" });
      await until(pg, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pg);
      const f = await pg.evaluate(() => {
        const sec = (t) => [...document.querySelectorAll(".sheet-section")].find((x) => x.querySelector("h3")?.textContent === t);
        const c = sec("Mi contribución"), k = sec("Puntos clave"), tc = sec("Tecnologías");
        return { h2: document.querySelector(".sheet h2")?.textContent.trim(), sections: [...document.querySelectorAll(".sheet-section h3")].map((h) => h.textContent), parrafos: c ? c.querySelectorAll("p").length : 0, puntos: k ? k.querySelectorAll("li").length : 0, chips: tc ? tc.querySelectorAll("li, .chip").length : 0, propuesta: /hoy trabajo en/.test(c?.textContent || "") && /Propuesta:/.test(c?.textContent || "") };
      });
      ok("V6.15 ficha 08: título nuevo, «El problema», «Mi contribución» en 2 párrafos (lo de hoy y la «Propuesta» por separado), 4 puntos clave y 13 tecnologías", f.h2 === "Teleoperación robótica en realidad virtual" && f.sections[0] === "El problema" && f.parrafos === 2 && f.propuesta && f.puntos === 4 && f.chips === 13, JSON.stringify(f));
      await pg.getByRole("button", { name: "Ver video", exact: true }).click();
      await pg.waitForSelector("dialog.evidence-modal[open]");
      let s = await shown(pg);
      ok("V6.15 visor 08: abre en el video de YouTube (1 / 3), con su pie de prototipo en proceso", (s.ifr || "").startsWith("https://www.youtube-nocookie.com/embed/FvwiXazVh-8") && s.count.includes("1 / 3") && /en proceso/.test(s.caption) && await pg.locator("dialog.evidence-modal .video-foot a[href='https://www.youtube.com/watch?v=FvwiXazVh-8']").count() === 1, JSON.stringify(s));
      await pg.keyboard.press("ArrowRight");
      s = await shown(pg);
      // V6.18: la imagen de Meshy AI salió; tras la captura de Unity sigue el modelo 3D (3 / 3), que se prueba más abajo.
      ok("V6.15 visor 08: la captura de Unity (2 / 3) se carga y cabe entera; ya no está la imagen de Meshy AI (V6.18)", s.img?.endsWith("/vr-nave/unity-entorno.jpg") && s.count.includes("2 / 3") && /Unity/.test(s.caption) && await imgLoaded(pg) && await imgContained(pg), JSON.stringify(s));
      await shotSoft(pg, `${SHOTS}/d6-evidencias-vr-nave.png`);
      await pg.keyboard.press("Escape");
      await until(pg, () => !document.querySelector("dialog[open]"), null, 4000);
      ok("V6.15 evidencias 08: sin errores", err15.length === 0, err15.join(" | "));
      await ctx15.close();
    }

    // ---------- V6.16: el brazo del 08 en 3D dentro del visor (desde la V6.17, el GLB de 6 DOF de JC convertido a glTF) ----------
    // El modelo solo se descarga al abrir esa evidencia, se dibuja con la CSP de producción (sin blob: ni
    // WebAssembly), gira al arrastrar sin pasar de evidencia, se libera al cerrar y, sin WebGL, deja la imagen.
    {
      const modelState = (pg) => pg.evaluate(() => {
        const d = document.querySelector("dialog.evidence-modal[open]");
        const R = (q) => { const e = d?.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), l: Math.round(r.left), b: Math.round(r.bottom), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
        return {
          count: d?.querySelector(".evidence-count [aria-hidden]")?.textContent.replace(/\s+/g, " ").trim() || "",
          frame: d?.querySelector(".model-frame")?.className || "", badge: d?.querySelector(".model-badge")?.textContent || "",
          hint: d?.querySelector(".model-hint")?.textContent || null, caption: d?.querySelector(".evidence-caption")?.textContent || "",
          canvas: R(".model-canvas"), view: R(".evidence-view"), badgeBox: R(".model-badge"), box: R(".evidence-box"),
          aria: d?.querySelector(".model-canvas")?.getAttribute("aria-label") || "", vw: document.documentElement.clientWidth, vh: innerHeight,
          scrollW: document.documentElement.scrollWidth, csp: window.__csp16 || [],
        };
      });
      // Fracción del lienzo que no es el fondo azul noche (#0b1022): el modelo dibujado ocupa bastante más que la etiqueta y la pista.
      // Ojo: en este Chromium sin GPU una captura no termina mientras el modelo gira solo (cada cuadro tarda mucho
      // con SwiftShader); por eso la medición y las capturas se hacen con movimiento reducido, donde el modelo
      // no gira solo y solo se redibuja al arrastrarlo.
      const litShare = async (pg) => {
        const r = await pg.evaluate(() => { const b = document.querySelector("dialog.evidence-modal .model-canvas").getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; });
        const b64 = (await pg.screenshot({ clip: r, timeout: 8000 })).toString("base64");
        return pg.evaluate(async (b64) => {
          const img = new Image();
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/png;base64," + b64; });
          const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
          const g = c.getContext("2d"); g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, c.width, c.height).data;
          let lit = 0;
          for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 11) + Math.abs(d[i + 1] - 16) + Math.abs(d[i + 2] - 34) > 60) lit++;
          return lit / (d.length / 4);
        }, b64);
      };
      // Huella del lienzo (24×24 tonos de gris, sin la etiqueta ni la pista encima): sirve para saber si el
      // modelo se volvió a dibujar girado. Sin amortiguación, OrbitControls aplica el arrastre por su cuenta y,
      // si el visor solo dibujara cuando su update() del cuadro ve cambios, el modelo se quedaría quieto.
      const canvasSig = async (pg) => {
        const r = await pg.evaluate(() => {
          for (const e of document.querySelectorAll("dialog.evidence-modal .model-badge, dialog.evidence-modal .model-hint")) e.style.visibility = "hidden";
          const b = document.querySelector("dialog.evidence-modal .model-canvas").getBoundingClientRect();
          return { x: b.left, y: b.top, width: b.width, height: b.height };
        });
        const b64 = (await pg.screenshot({ clip: r, timeout: 8000 })).toString("base64");
        return pg.evaluate(async (b64) => {
          for (const e of document.querySelectorAll("dialog.evidence-modal .model-badge, dialog.evidence-modal .model-hint")) e.style.visibility = "";
          const img = new Image();
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/png;base64," + b64; });
          const N = 24, c = document.createElement("canvas"); c.width = N; c.height = N;
          const g = c.getContext("2d"); g.drawImage(img, 0, 0, N, N);
          const d = g.getImageData(0, 0, N, N).data, out = [];
          for (let i = 0; i < d.length; i += 4) out.push(Math.round(0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]));
          return out;
        }, b64);
      };
      const sigDiff = (a, b) => (a && b && a.length === b.length ? a.reduce((t, v, i) => t + Math.abs(v - b[i]), 0) / a.length : -1);
      const cspWatch = (pg) => pg.addInitScript(() => { window.__csp16 = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp16.push(`${e.violatedDirective} ${e.blockedURI}`)); });
      const modelReqs = (pg, bag) => pg.on("request", (r) => { if (/\/modelos\/|ModelViewer-/.test(r.url())) bag.push(r.url().replace(BASE, "")); });

      // Escritorio: ratón.
      const ctx16 = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
      const pg = await ctx16.newPage();
      const err16 = [], req16 = [];
      watch(pg, err16);
      modelReqs(pg, req16);
      await cspWatch(pg);
      await pg.goto(BASE + "/proyecto/vr-nave", { waitUntil: "networkidle" });
      await until(pg, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pg);
      const btnModel = pg.getByRole("button", { name: "Ver modelo 3D", exact: true });
      const labels = await pg.locator(".evidence-actions .btn").allTextContents();
      ok("V6.16 ficha 08: botón «Ver modelo 3D» junto a «Ver video» y «Ver imagen» (V6.18)", await btnModel.count() === 1 && labels.map((t) => t.trim()).join("|") === "Ver video|Ver imagen|Ver modelo 3D", labels.join("|"));
      const before = req16.length;
      await btnModel.click();
      await pg.waitForSelector("dialog.evidence-modal[open] .model-frame");
      let m = await modelState(pg);
      ok("V6.16 visor 3D: abre en el modelo (3 / 3 desde la V6.18) con la etiqueta «Modelo de demostración · en proceso», su pie y su texto alternativo", m.count === "3 / 3" && m.badge === "Modelo de demostración · en proceso" && /demostración en proceso/.test(m.caption) && /Modelo 3D interactivo/.test(m.aria), JSON.stringify(m));
      const ready = await until(pg, () => !!document.querySelector("dialog.evidence-modal .model-frame.is-ready"), null, 60000);
      m = await modelState(pg);
      const canvasFits = m.canvas && m.view && m.canvas.w >= m.view.w - 2 && m.canvas.h >= m.view.h - 2 && m.canvas.b <= m.vh && m.badgeBox.r <= m.canvas.r;
      // V6.17: el brazo de 6 DOF de JC no lleva texturas (los colores van en sus materiales): solo glTF y .bin.
      ok("V6.16 visor 3D: el modelo se descarga solo al abrirlo (glTF y .bin, sin texturas desde la V6.17) y su lienzo llena el escenario", before === 0 && req16.some((u) => u.endsWith("/brazo.gltf")) && req16.some((u) => u.endsWith("/brazo.bin")) && req16.filter((u) => /\.(jpe?g|png|webp)$/.test(u)).length === 0 && ready && canvasFits, JSON.stringify({ before, req16, ready, canvas: m.canvas, view: m.view }));
      const c16 = m.canvas;
      await pg.mouse.move(c16.l + c16.w / 2 - 90, c16.t + c16.h / 2);
      await pg.mouse.down();
      for (let i = 1; i <= 12; i++) { await pg.mouse.move(c16.l + c16.w / 2 - 90 + i * 15, c16.t + c16.h / 2); await pg.waitForTimeout(25); }
      await pg.mouse.up();
      await pg.waitForTimeout(400);
      m = await modelState(pg);
      ok("V6.16 visor 3D: arrastrar con el ratón gira el modelo (se va la pista «Arrastra para girarlo») sin pasar de evidencia", m.count === "3 / 3" && m.frame.includes("is-ready") && m.hint === null, JSON.stringify(m));
      await pg.keyboard.press("Escape");
      const closed16 = await until(pg, () => !document.querySelector("dialog[open]") && !document.querySelector(".model-canvas"), null, 4000);
      const back16 = await until(pg, () => document.activeElement?.textContent?.trim() === "Ver modelo 3D", null, 3000);
      ok("V6.16 visor 3D: al cerrar se libera el lienzo y el foco vuelve a «Ver modelo 3D»", closed16 && back16);
      const csp16 = await pg.evaluate(() => window.__csp16 || []);
      ok("V6.16 visor 3D: sin errores ni bloqueos de la CSP", err16.length === 0 && csp16.length === 0, [...err16, ...csp16].join(" | "));
      await ctx16.close();

      // Movimiento reducido: el modelo no gira solo (la pista sigue a la vista) y se ve dibujado.
      const ctx16r = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX", reducedMotion: "reduce" });
      const pr = await ctx16r.newPage();
      const err16r = [];
      watch(pr, err16r);
      await pr.goto(BASE + "/proyecto/vr-nave", { waitUntil: "networkidle" });
      await until(pr, () => !!document.querySelector(".sheet h2"), null, 15000);
      await pr.getByRole("button", { name: "Ver modelo 3D", exact: true }).click();
      const readyR = await until(pr, () => !!document.querySelector("dialog.evidence-modal .model-frame.is-ready"), null, 60000);
      await pr.waitForTimeout(1500);
      const litR = readyR ? await litShare(pr).catch(() => 0) : 0;
      const mr = await modelState(pr);
      ok("V6.16 movimiento reducido: el modelo no gira solo y se ve dibujado en el lienzo", readyR && litR > 0.06 && mr.hint === "Arrastra para girarlo" && err16r.length === 0, JSON.stringify({ readyR, litR: +litR.toFixed(3), hint: mr.hint, err16r }));
      await shotSoft(pr, `${SHOTS}/d7-modelo-3d-vr-nave.png`);
      const sR1 = readyR ? await canvasSig(pr).catch(() => null) : null;
      await pr.waitForTimeout(1200);
      const sR2 = readyR ? await canvasSig(pr).catch(() => null) : null;
      const cR = mr.canvas;
      if (cR) {
        const dx = Math.round(cR.h / 4); // un cuarto del alto del lienzo = 90° con OrbitControls
        await pr.mouse.move(cR.l + cR.w / 2 - dx / 2, cR.t + cR.h / 2);
        await pr.mouse.down();
        for (let i = 1; i <= 10; i++) { await pr.mouse.move(cR.l + cR.w / 2 - dx / 2 + (i * dx) / 10, cR.t + cR.h / 2); await pr.waitForTimeout(25); }
        await pr.mouse.up();
      }
      await pr.waitForTimeout(500);
      const sR3 = readyR ? await canvasSig(pr).catch(() => null) : null;
      const stillR = sigDiff(sR1, sR2), turnR = sigDiff(sR2, sR3);
      ok("V6.16 movimiento reducido: quieto mientras nadie lo toca, y al arrastrarlo se vuelve a dibujar girado", readyR && stillR >= 0 && stillR < 0.5 && turnR > 2, JSON.stringify({ stillR: +stillR.toFixed(2), turnR: +turnR.toFixed(2) }));
      await ctx16r.close();

      // Celular: deslizar el dedo sobre el modelo lo gira y no cambia de evidencia.
      const ctx16m = await browser.newContext({ viewport: { width: 411, height: 891 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX", reducedMotion: "reduce" });
      const pm = await ctx16m.newPage();
      const err16m = [];
      watch(pm, err16m);
      await cspWatch(pm);
      await pm.goto(BASE + "/proyecto/vr-nave", { waitUntil: "load" });
      await until(pm, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pm);
      await pm.getByRole("button", { name: "Ver modelo 3D", exact: true }).tap();
      const readyM = await until(pm, () => !!document.querySelector("dialog.evidence-modal .model-frame.is-ready"), null, 60000);
      let mm = await modelState(pm);
      const fitsM = mm.box && mm.box.t >= 0 && mm.box.b <= mm.vh + 0.5 && mm.box.l >= 0 && mm.box.r <= mm.vw + 0.5 && mm.scrollW <= mm.vw && mm.canvas.w >= 300 && mm.badgeBox.r <= mm.canvas.r;
      const sM1 = readyM ? await canvasSig(pm).catch(() => null) : null;
      const cdp16 = await ctx16m.newCDPSession(pm);
      const tch = (type, x, y) => cdp16.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
      const cy = mm.canvas.t + mm.canvas.h / 2, x0 = mm.canvas.l + 60;
      await tch("touchStart", x0, cy);
      for (let i = 1; i <= 12; i++) { await tch("touchMove", x0 + i * 18, cy); await pm.waitForTimeout(25); }
      for (let i = 0; i < 3; i++) { await tch("touchMove", x0 + 216, cy); await pm.waitForTimeout(60); }
      await tch("touchEnd");
      await pm.waitForTimeout(500);
      mm = await modelState(pm);
      const turnM = sigDiff(sM1, readyM ? await canvasSig(pm).catch(() => null) : null);
      ok("V6.16 celular 411×891: el modelo cabe en el visor y deslizar el dedo lo gira (se redibuja girado) sin pasar de evidencia", readyM && fitsM && turnM > 2 && mm.count === "3 / 3" && mm.hint === null && err16m.length === 0 && mm.csp.length === 0, JSON.stringify({ readyM, fitsM, turnM: +turnM.toFixed(2), mm, err16m }));
      await shotSoft(pm, `${SHOTS}/m12-modelo-3d-vr-nave.png`);
      await ctx16m.close();

      // Sin WebGL (un navegador aparte con WebGL apagado): la imagen del brazo con un aviso, y el modelo ni se pide.
      const bNoGL = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis", "--disable-gpu"] });
      const ctx16n = await bNoGL.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
      const pn = await ctx16n.newPage();
      const err16n = [], req16n = [];
      watch(pn, err16n);
      modelReqs(pn, req16n);
      await pn.goto(BASE + "/proyecto/vr-nave", { waitUntil: "networkidle" });
      await until(pn, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pn);
      await pn.getByRole("button", { name: "Ver modelo 3D", exact: true }).click();
      const fallback = await until(pn, () => { const f = document.querySelector("dialog.evidence-modal .model-frame.is-error"); const im = f?.querySelector(".model-poster"); return !!f && im?.complete && im.naturalWidth > 0 && /No se pudo mostrar/.test(f.textContent) && /en proceso/.test(f.querySelector(".model-badge")?.textContent || ""); }, null, 8000);
      ok("V6.16 sin WebGL: se queda la imagen del brazo con un aviso y la etiqueta, y el modelo no se descarga", fallback && req16n.length === 0 && err16n.length === 0, JSON.stringify({ fallback, req16n, err16n }));
      await bNoGL.close();
    }

    // ---------- V6.16: Esc en pantalla completa cierra lo de encima y no saca de pantalla completa ----------
    // (En Chrome y Edge la página recibe Esc gracias a Keyboard Lock; aquí, sin interfaz, el Esc de Playwright llega
    // siempre a la página, así que se prueba el orden: visor, ficha y, sin nada abierto, salir.)
    {
      const ctxE = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
      const pe = await ctxE.newPage();
      const errE = [];
      watch(pe, errE);
      const fsOn = () => pe.evaluate(() => !!document.querySelector(".universe-wrap.is-fullscreen"));
      await pe.goto(BASE + "/proyecto/robot-6dof", { waitUntil: "networkidle" });
      await until(pe, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pe);
      // Fuera de pantalla completa, con el foco fuera de la ficha (en la V6.15 Esc no hacía nada ahí).
      await pe.evaluate(() => document.activeElement?.blur());
      await pe.keyboard.press("Escape");
      ok("V6.16 Esc: sin pantalla completa también cierra la ficha aunque el foco esté fuera de ella", await until(pe, () => !document.querySelector(".sheet"), null, 4000));
      await pe.locator('[data-planet="robot-6dof"]').click();
      await until(pe, () => !!document.querySelector(".sheet h2"), null, 8000);
      await uiRest(pe);
      await pe.getByRole("button", { name: "Pantalla completa" }).first().click();
      await until(pe, () => !!document.querySelector(".universe-wrap.is-fullscreen"), null, 5000);
      await pe.getByRole("button", { name: "Ver imágenes (2)", exact: true }).click();
      await pe.waitForSelector("dialog.evidence-modal[open]");
      await pe.keyboard.press("Escape");
      const e1 = await until(pe, () => !document.querySelector("dialog[open]"), null, 4000);
      const st1 = { fs: await fsOn(), sheet: await pe.locator(".sheet").count() };
      ok("V6.16 Esc en pantalla completa: con el visor abierto lo cierra y deja la ficha y la pantalla completa", e1 && st1.fs && st1.sheet === 1, JSON.stringify(st1));
      await pe.evaluate(() => document.activeElement?.blur());
      await pe.keyboard.press("Escape");
      const e2 = await until(pe, () => !document.querySelector(".sheet"), null, 4000);
      ok("V6.16 Esc en pantalla completa: después cierra la ficha (con el foco donde sea) y sigue en pantalla completa", e2 && await fsOn());
      await pe.keyboard.press("Escape");
      ok("V6.16 Esc en pantalla completa: sin nada abierto, sale", await until(pe, () => !document.querySelector(".universe-wrap.is-fullscreen") && !document.fullscreenElement, null, 5000));
      ok("V6.16 Esc: sin errores", errE.length === 0, errE.join(" | "));
      await ctxE.close();

      // Sin Keyboard Lock (Firefox, Safari): el navegador sale de pantalla completa con su Esc sin dárselo a la
      // página; al salir así, la ficha se cierra también. Solo se puede probar donde la API nativa responde.
      const ctxF = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-MX" });
      await ctxF.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, "keyboard", { get: () => undefined, configurable: true }); } catch { /* */ } });
      const pf = await ctxF.newPage();
      await pf.goto(BASE + "/proyecto/robot-6dof", { waitUntil: "networkidle" });
      await until(pf, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(pf);
      await pf.getByRole("button", { name: "Pantalla completa" }).first().click();
      const nativeF = await until(pf, () => !!document.fullscreenElement, null, 4000);
      let closedF = true;
      if (nativeF) {
        await pf.evaluate(() => document.exitFullscreen()); // lo que hace el Esc del navegador
        closedF = await until(pf, () => !document.querySelector(".universe-wrap.is-fullscreen") && !document.querySelector(".sheet"), null, 5000);
      }
      ok(`V6.16 sin Keyboard Lock: si el navegador sale de pantalla completa por su cuenta, la ficha se cierra también${nativeF ? "" : " (sin API nativa aquí: no aplica)"}`, closedF);
      await ctxF.close();
    }

    // ---------- V6.16: los botones + y − no quedan detrás de la ficha ----------
    // Escritorio: a la izquierda, encima de la lista de planetas. 901–959 px: arriba a la derecha. Celular: igual que
    // antes; se mide en pantalla completa, que es donde se usa (fuera de ella la hoja inferior cubre el escenario).
    for (const [w, h, touch] of [[1366, 768, false], [1920, 1080, false], [1280, 720, false], [1280, 520, false], [1024, 768, false], [930, 800, false], [393, 851, true], [851, 393, true]]) {
      const ctxZ = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch, locale: "es-MX" });
      const pz = await ctxZ.newPage();
      const errZ = [];
      watch(pz, errZ);
      await pz.goto(BASE + "/proyecto/mantenimiento-kia", { waitUntil: "networkidle" });
      await until(pz, () => !!document.querySelector(".sheet h2") && !!document.querySelector(".u-canvas") && !document.querySelector(".universe-status"), null, 20000);
      await uiRest(pz);
      if (touch) {
        await pz.locator(".zoom .fs-icon").tap();
        await until(pz, () => !!document.querySelector(".universe-wrap.is-fullscreen"), null, 5000);
        await uiRest(pz);
      }
      await pz.waitForTimeout(400);
      const z = await pz.evaluate(() => {
        const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }; };
        const over = (a, b) => !!a && !!b && a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
        const btns = [...document.querySelectorAll(".zoom .icon-btn")].filter((b) => getComputedStyle(b).display !== "none");
        const sheet = R(document.querySelector(".sheet")), pi = R(document.querySelector(".planet-index"));
        const chips = [...document.querySelectorAll(".universe-tools .chip-btn")].filter((b) => getComputedStyle(b).display !== "none").map(R);
        const boxes = btns.map(R);
        const hit = btns.map((b) => { const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return "fuera"; const e = document.elementFromPoint(x, y); return !!e && b.contains(e); });
        return { boxes, hit, sheet, pi, chips, overSheet: boxes.some((b) => over(b, sheet)), overList: boxes.some((b) => over(b, pi)), overTools: boxes.some((b) => chips.some((c) => over(b, c))), vw: innerWidth };
      });
      const visible = z.hit.every((v) => v === true);
      const leftSide = w >= 960 ? z.boxes.every((b) => b.r < z.sheet.l && b.l < z.vw / 2) : true;
      ok(`V6.16 botones + y − con la ficha abierta en ${w}×${h}${touch ? " (pantalla completa)" : ""}: a la vista, sin quedar bajo la ficha, la lista de planetas ni los controles${w >= 960 ? " (a la izquierda, sobre la lista)" : ""}`, z.boxes.length >= 2 && visible && !z.overSheet && !z.overList && !z.overTools && leftSide && errZ.length === 0, JSON.stringify(z));
      await ctxZ.close();
    }

    // V6.12. Celular estrecho: el asa para contraer la ficha mide lo suyo aunque el texto sea largo (con los
    // proyectos reescritos se encogía a 1–3 px y el toque caía en la cabecera) y contrae y vuelve a abrir la ficha.
    {
      const ctx12 = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX" });
      const p12 = await ctx12.newPage();
      const err12 = [];
      watch(p12, err12);
      await p12.goto(BASE + "/proyecto/finanzas-datos", { waitUntil: "load" });
      await until(p12, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(p12);
      const grip = await p12.evaluate(() => { const g = document.querySelector(".sheet-grip-btn"); const r = g.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), top: Math.round(r.top), onTop: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === g }; });
      ok("V6.12 celular 320×568: el asa de la ficha mide 26 px y recibe el toque aunque el texto sea largo", grip.h >= 24 && grip.onTop, JSON.stringify(grip));
      await p12.locator(".sheet-grip-btn").tap();
      const collapsed = await until(p12, () => document.querySelector(".sheet")?.classList.contains("is-collapsed"), null, 4000);
      const geo = await p12.evaluate(() => { const r = document.querySelector(".sheet").getBoundingClientRect(); return { h: Math.round(r.height), vh: innerHeight, bodyHidden: getComputedStyle(document.querySelector(".sheet-body")).display === "none" }; });
      ok("V6.12 celular 320×568: un toque en el asa contrae la ficha a su título", collapsed && geo.bodyHidden && geo.h < geo.vh * 0.5, JSON.stringify(geo));
      await p12.locator(".sheet-grip-btn").tap();
      ok("V6.12 celular 320×568: otro toque la vuelve a abrir", await until(p12, () => !document.querySelector(".sheet")?.classList.contains("is-collapsed"), null, 4000));
      ok("V6.12 celular 320×568: sin errores", err12.length === 0, err12.join(" | "));
      await ctx12.close();
    }

    // V6.13. Más espacio para la descripción en la ficha del celular. En pantalla completa la ficha llega a
    // ~60 % del alto (antes 44 %) con una cabecera compacta; en horizontal pasa a un panel a la derecha, a todo
    // lo alto, en lugar de una franja baja de 1–2 líneas. La escena y el zoom siguen a la vista y el asa la contrae.
    for (const [w, h] of [[393, 851], [851, 393]]) {
      const land = w > h;
      const ctx13 = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX" });
      const p13 = await ctx13.newPage();
      const err13 = [];
      watch(p13, err13);
      const geo13 = () => p13.evaluate(() => {
        const R = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width) }; };
        const body = document.querySelector(".sheet-body");
        const cs = getComputedStyle(body);
        const lh = parseFloat(getComputedStyle(body.querySelector(".sheet-section p")).lineHeight);
        const zoom = R(".zoom"), sheet = R(".sheet");
        const zoomShown = !!zoom && zoom.w > 0 && getComputedStyle(document.querySelector(".zoom")).visibility !== "hidden";
        return {
          vw: innerWidth, vh: innerHeight, fs: !!document.querySelector(".universe-wrap.is-fullscreen"), sheet, head: R(".sheet-head").h,
          lines: Math.floor((body.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / lh),
          zoomFree: !zoomShown || zoom.right <= sheet.left || zoom.left >= sheet.right || zoom.bottom <= sheet.top,
        };
      });
      await p13.goto(BASE + "/proyecto/finanzas-datos", { waitUntil: "load" });
      await until(p13, () => !!document.querySelector(".sheet h2"), null, 15000);
      await uiRest(p13);
      if (land) {
        const g = await geo13();
        ok(`V6.13 celular horizontal ${w}×${h}: la ficha es un panel a la derecha, bajo la barra y hasta abajo`, g.sheet.left >= g.vw * 0.45 && g.sheet.right <= g.vw - 4 && g.sheet.top <= 90 && g.sheet.bottom >= g.vh - 12, JSON.stringify(g));
        ok(`V6.13 celular horizontal ${w}×${h}: la descripción muestra 4 líneas o más (antes 2) y el zoom queda libre`, g.lines >= 4 && g.zoomFree, JSON.stringify(g));
      }
      await p13.locator(".fs-icon").tap();
      await until(p13, () => !!document.querySelector(".universe-wrap.is-fullscreen"), null, 6000);
      await uiRest(p13);
      if (!(await p13.locator(".sheet h2").count())) {
        await p13.locator('[data-planet="finanzas-datos"]').tap();
        await until(p13, () => !!document.querySelector(".sheet h2"), null, 6000);
        await uiRest(p13);
      }
      await p13.waitForTimeout(400);
      const g = await geo13();
      if (land) {
        ok(`V6.13 celular horizontal ${w}×${h} en pantalla completa: el panel va de arriba abajo a la derecha`, g.fs && g.sheet.left >= g.vw * 0.45 && g.sheet.top <= 12 && g.sheet.bottom >= g.vh - 12, JSON.stringify(g));
        ok(`V6.13 celular horizontal ${w}×${h} en pantalla completa: 6 líneas de descripción o más (antes ninguna) y el zoom libre`, g.lines >= 6 && g.zoomFree, JSON.stringify(g));
      } else {
        ok(`V6.13 celular ${w}×${h} en pantalla completa: la ficha llega a ~60 % del alto y deja la escena arriba`, g.fs && g.sheet.h >= g.vh * 0.5 && g.sheet.h <= g.vh * 0.62 && Math.abs(g.sheet.bottom - g.vh) < 2, JSON.stringify(g));
        ok(`V6.13 celular ${w}×${h} en pantalla completa: cabecera compacta y 10 líneas de descripción o más (antes 4)`, g.head <= 120 && g.lines >= 10, JSON.stringify(g));
      }
      await p13.screenshot({ path: `${SHOTS}/m7-ficha-v613-${w}x${h}.png` });
      await p13.locator(".sheet-grip-btn").tap();
      const col = await until(p13, () => document.querySelector(".sheet")?.classList.contains("is-collapsed"), null, 4000);
      await uiRest(p13);
      const gc = await p13.evaluate(() => ({ h: Math.round(document.querySelector(".sheet").getBoundingClientRect().height), vh: innerHeight, bodyHidden: getComputedStyle(document.querySelector(".sheet-body")).display === "none" }));
      ok(`V6.13 celular ${w}×${h} en pantalla completa: el asa contrae la ficha a su título`, col && gc.bodyHidden && gc.h < gc.vh * 0.6, JSON.stringify(gc));
      await p13.locator(".sheet-grip-btn").tap();
      ok(`V6.13 celular ${w}×${h} en pantalla completa: y la vuelve a abrir`, await until(p13, () => !document.querySelector(".sheet")?.classList.contains("is-collapsed"), null, 4000));
      ok(`V6.13 celular ${w}×${h}: ficha sin errores`, err13.length === 0, err13.join(" | "));
      await ctx13.close();
    }

    // En inglés
    const ctxEn = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "en-US" });
    const pen = await ctxEn.newPage();
    const errEn = [];
    watch(pen, errEn);
    await fakeYouTube(pen);
    await pen.goto(BASE + "/proyecto/robot-6dof", { waitUntil: "networkidle" });
    await pen.waitForSelector(".sheet h2");
    await uiRest(pen);
    const headsEn = await pen.locator(".sheet-section h3").allTextContents();
    ok("V6.8 evidencias en inglés: sección «Evidence» y botones «Watch video» y «See images (2)»", headsEn.includes("Evidence") && await pen.getByRole("button", { name: "Watch video", exact: true }).count() === 1 && await pen.getByRole("button", { name: "See images (2)", exact: true }).count() === 1, headsEn.join(" | "));
    await pen.getByRole("button", { name: "See images (2)", exact: true }).click();
    await pen.waitForSelector("dialog.evidence-modal[open]");
    // El pie se acortó en la V6.14 («Live test: …»; antes, «The live test: …»).
    const sEn = await pen.evaluate(() => ({ title: document.querySelector("#evidence-title")?.textContent, caption: document.querySelector(".evidence-caption")?.textContent || "", close: document.activeElement?.getAttribute("aria-label"), next: document.querySelector(".evidence-arrow.is-next")?.getAttribute("aria-label") }));
    ok("V6.8 visor en inglés: título, pie y etiquetas traducidos", sEn.title === "Evidence: Control and monitoring of an industrial robot with RoboSCADA" && /^Live test/.test(sEn.caption) && sEn.close === "Close viewer" && sEn.next === "Next item", JSON.stringify(sEn));
    ok("V6.8 evidencias en inglés: sin errores", errEn.length === 0, errEn.join(" | "));
    await ctxEn.close();
  }

  // ---------- V6.13: el «Video de presentación» del pie lleva al principio de su página ----------
  // El pie es el mismo en todas las páginas: desde abajo, el enlace cambiaba la página pero seguía viéndose
  // el pie y no había señal de que algo hubiera pasado. Ahora la página del video sube de inmediato, como
  // «Inicio» y «Proyectos», y «Volver al inicio» deja en el encabezado (antes, en el pie de la principal).
  for (const [w, h, mobile] of [[1280, 800, false], [390, 844, true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "es-MX", ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    await fakeYouTube(page);
    const press = (sel) => (mobile ? page.locator(sel).tap() : page.locator(sel).click());
    const where = () => page.evaluate(() => ({ path: location.pathname + location.hash, y: Math.round(scrollY), title: Math.round(document.querySelector("#videopage-title")?.getBoundingClientRect().top ?? -9999), hero: Math.round(document.querySelector("#perfil")?.getBoundingClientRect().top ?? -9999), vh: innerHeight }));
    const label = mobile ? `celular ${w}×${h}` : `PC ${w}×${h}`;
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await scrollRest(page);
    const y0 = await page.evaluate(() => Math.round(scrollY));
    await press('.footer-nav a[href="/video"]');
    await page.waitForSelector("#video");
    const s1 = await where();
    ok(`V6.13 ${label}: «Video de presentación» del pie, desde abajo, abre la página del video ya arriba (título a la vista)`, y0 > 200 && s1.path === "/video" && s1.y === 0 && s1.title > 0 && s1.title < s1.vh / 2, JSON.stringify({ y0, ...s1 }));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await scrollRest(page);
    await press('.footer-nav a[href="/video"]');
    await page.waitForTimeout(150);
    await scrollRest(page);
    const s2 = await where();
    ok(`V6.13 ${label}: estando ya en el video, el mismo enlace del pie también sube al principio`, s2.path === "/video" && s2.y === 0, JSON.stringify(s2));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await scrollRest(page);
    await press(".page-actions a.btn-ghost");
    await until(page, () => location.pathname === "/" && !!document.querySelector("#perfil"), null, 8000);
    await scrollRest(page);
    const s3 = await where();
    ok(`V6.13 ${label}: «Volver al inicio» deja en el encabezado de la página principal (no en su pie)`, s3.path === "/#perfil" && Math.abs(s3.hero) < 4, JSON.stringify(s3));
    ok(`V6.13 ${label}: enlaces del video sin errores`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // Celular: la ventana cabe sin desbordes, las flechas van debajo y se desliza con el dedo.
  for (const [w, h] of [[393, 851], [851, 393]]) {
    const errors = [];
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX" });
    const page = await ctx.newPage();
    watch(page, errors);
    await fakeYouTube(page);
    await page.goto(BASE + "/proyecto/robot-6dof", { waitUntil: "networkidle" });
    await page.waitForSelector(".sheet h2");
    await uiRest(page);
    await page.getByRole("button", { name: "Ver imágenes (2)", exact: true }).tap();
    await page.waitForSelector("dialog.evidence-modal[open]");
    await until(page, () => { const i = document.querySelector("dialog.evidence-modal img"); return i && i.complete && i.naturalWidth > 0; }, null, 10000);
    await page.evaluate(() => document.querySelector("dialog.evidence-modal img")?.decode().catch(() => {}));
    await uiRest(page);
    const fit = await page.evaluate(() => {
      const box = document.querySelector("dialog.evidence-modal .evidence-box").getBoundingClientRect();
      const img = document.querySelector("dialog.evidence-modal img").getBoundingClientRect();
      const view = document.querySelector("dialog.evidence-modal .evidence-view").getBoundingClientRect();
      const prev = document.querySelector(".evidence-arrow.is-prev").getBoundingClientRect();
      const next = document.querySelector(".evidence-arrow.is-next").getBoundingClientRect();
      return {
        fits: box.left >= 0 && box.right <= innerWidth + 0.5 && box.top >= 0 && box.bottom <= innerHeight + 0.5,
        contained: img.height <= view.height + 1 && img.width <= view.width + 1,
        noScrollX: document.documentElement.scrollWidth <= innerWidth,
        imgW: Math.round(img.width), imgH: Math.round(img.height), boxW: Math.round(box.width),
        arrowsBelow: prev.top >= img.bottom - 1 && next.top >= img.bottom - 1 && Math.abs(prev.top - next.top) < 2,
        arrowsBeside: prev.right <= img.left + 1 && next.left >= img.right - 1,
        big: prev.width >= 44 && next.width >= 44 && prev.height >= 44,
        nextTop: Math.round(next.top), nextLeft: Math.round(next.left),
      };
    });
    ok(`V6.8 visor, celular ${w}×${h}: la ventana cabe en la pantalla y no hay desplazamiento horizontal`, fit.fits && fit.noScrollX, JSON.stringify(fit));
    ok(`V6.8 visor, celular ${w}×${h}: la imagen se ve entera y las flechas (44 px o más) van ${w < 700 ? "debajo" : "a los lados"}`, fit.imgW > 100 && fit.imgH > 60 && fit.contained && fit.big && (w < 700 ? fit.arrowsBelow && fit.imgW >= fit.boxW - 40 : fit.arrowsBeside), JSON.stringify(fit));
    await page.screenshot({ path: `${SHOTS}/m6-evidencias-imagen-${w}x${h}.png` });
    // Deslizar con el dedo
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
    const r = await page.locator("dialog.evidence-modal .evidence-view").boundingBox();
    await touch("touchStart", r.x + r.width * 0.8, r.y + r.height / 2);
    for (let i = 1; i <= 8; i++) { await touch("touchMove", r.x + r.width * (0.8 - 0.6 * i / 8), r.y + r.height / 2); await page.waitForTimeout(16); }
    // El dedo se detiene antes de soltar: si suelta a toda velocidad, Chromium lo toma por un «fling» y se
    // traga como «parar el fling» el toque que viene justo después (sin clic), cosa que una persona no hace.
    for (let i = 0; i < 3; i++) { await touch("touchMove", r.x + r.width * 0.2, r.y + r.height / 2); await page.waitForTimeout(60); }
    await touch("touchEnd", 0, 0);
    ok(`V6.8 visor, celular ${w}×${h}: deslizar con el dedo pasa a la siguiente imagen`, await until(page, () => /^3 \/ 3$/.test(document.querySelector("dialog.evidence-modal .evidence-count [aria-hidden]")?.textContent.trim() || "") && !!document.querySelector("dialog.evidence-modal img[src$='diagrama.png']"), null, 3000));
    await until(page, () => { const i = document.querySelector("dialog.evidence-modal img"); return i && i.complete && i.naturalWidth > 0; }, null, 10000);
    const arrows2 = await page.evaluate(() => { const n = document.querySelector(".evidence-arrow.is-next").getBoundingClientRect(); return { top: Math.round(n.top), left: Math.round(n.left) }; });
    ok(`V6.8 visor, celular ${w}×${h}: las flechas no saltan al pasar a una imagen de otro formato`, arrows2.top === fit.nextTop && arrows2.left === fit.nextLeft, JSON.stringify({ antes: [fit.nextTop, fit.nextLeft], despues: arrows2 }));
    ok(`V6.8 visor, celular ${w}×${h}: la segunda imagen (casi cuadrada) cabe entera, sin recorte`, await page.evaluate(() => { const v = document.querySelector("dialog.evidence-modal .evidence-view").getBoundingClientRect(); const i = document.querySelector("dialog.evidence-modal img").getBoundingClientRect(); return i.height > 50 && i.height <= v.height + 1 && i.width <= v.width + 1; }));
    await page.getByRole("button", { name: "Evidencia siguiente" }).tap();
    await until(page, () => !!document.querySelector("dialog.evidence-modal iframe"), null, 4000);
    await uiRest(page);
    const vfit = await page.evaluate(() => {
      const box = document.querySelector("dialog.evidence-modal .evidence-box").getBoundingClientRect();
      const f = document.querySelector("dialog.evidence-modal .video-frame").getBoundingClientRect();
      return { fits: box.top >= 0 && box.bottom <= innerHeight + 0.5 && box.right <= innerWidth + 0.5, noScrollX: document.documentElement.scrollWidth <= innerWidth, frameW: Math.round(f.width), frameH: Math.round(f.height), boxW: Math.round(box.width) };
    });
    ok(`V6.8 visor, celular ${w}×${h}: el video también cabe`, vfit.fits && vfit.noScrollX && vfit.frameH > 60 && (w < 700 ? vfit.frameW >= vfit.boxW - 40 : true), JSON.stringify(vfit));
    await shotSoft(page, `${SHOTS}/m6-evidencias-video-${w}x${h}.png`);
    await page.getByRole("button", { name: "Cerrar visor" }).tap();
    await until(page, () => !document.querySelector("dialog[open]"), null, 4000);
    ok(`V6.8 visor, celular ${w}×${h}: cierra y la ficha sigue ahí`, await page.locator("dialog").count() === 0 && await page.locator(".sheet").count() === 1);
    ok(`V6.8 visor, celular ${w}×${h}: sin errores`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ---------- Escritorio con ventana baja (V4.6) ----------
  {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView({ block: "start" }));
    await page.waitForTimeout(1200);
    const low = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const idx = r(".planet-index"), head = r(".universe-head"), tools = r(".universe-tools"), stage = r(".universe-stage"), zoom = r(".zoom");
      const over = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const buttons = [...document.querySelectorAll(".planet-index button")].map((b) => b.getBoundingClientRect());
      const lastVisible = buttons.length && buttons[buttons.length - 1].bottom <= idx.bottom + 1;
      return { overHead: over(idx, head), overZoom: over(idx, zoom), idxTop: Math.round(idx.top), toolsBottom: Math.round(tools.bottom), idxBottom: Math.round(idx.bottom), stageTop: Math.round(stage.top), stageBottom: Math.round(stage.bottom), stageHeight: Math.round(stage.height), radius: getComputedStyle(document.querySelector(".universe")).borderTopLeftRadius, layout: getComputedStyle(document.querySelector(".planet-index ol")).display, items: buttons.length, lastVisible, oneColumn: buttons.every((b) => Math.abs(b.left - buttons[0].left) < 2) };
    });
    ok("Ventana baja: la lista de planetas no se monta sobre el título ni los controles", !low.overHead && low.idxTop >= low.toolsBottom + 8, JSON.stringify(low));
    // V6.2: el lienzo queda pegado a la barra (sin franja de fondo) y entra completo en la ventana.
    ok("Ventana baja: la lista sigue siendo una columna (compacta), completa y a la vista, sin pisar el zoom", low.layout === "grid" && low.oneColumn && low.items === 9 && low.lastVisible && !low.overZoom && low.idxBottom <= 606 && low.stageBottom <= 607, JSON.stringify(low));
    ok("Ventana baja: el lienzo 3D empieza justo bajo la barra y entra completo", low.stageTop === 62 && low.stageHeight >= 520 && low.stageBottom <= 606, JSON.stringify(low));
    ok("El lienzo 3D no tiene esquinas redondeadas", low.radius === "0px", JSON.stringify(low));
    // Rueda del ratón: al detenerse cerca del universo la página se pega sola a la barra; al alejarse no la retiene.
    const flushY = await page.evaluate(() => document.querySelector("#universo").getBoundingClientRect().top + scrollY - 62);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.mouse.move(683, 300);
    await page.mouse.wheel(0, flushY - 150);
    await page.waitForTimeout(1500);
    const snapped = await page.evaluate(() => Math.round(document.querySelector("#universo").getBoundingClientRect().top));
    ok("Ventana baja: al bajar con la rueda y parar cerca, el lienzo se pega a la barra", snapped === 62, `top=${snapped}`);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(1500);
    const left = await page.evaluate(() => Math.round(document.querySelector("#universo").getBoundingClientRect().top));
    ok("Ventana baja: al seguir bajando no lo devuelve a la barra", left === -38, `top=${left}`);
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(1500);
    const back = await page.evaluate(() => Math.round(document.querySelector("#universo").getBoundingClientRect().top));
    ok("Ventana baja: al volver a subir cerca, se pega otra vez", back === 62, `top=${back}`);
    await page.locator('[data-planet="mealflow"]').click();
    await page.waitForSelector(".sheet");
    await page.waitForTimeout(500);
    const withSheet = await page.evaluate(() => { const i = document.querySelector(".planet-index").getBoundingClientRect(), s = document.querySelector(".sheet").getBoundingClientRect(); return { gap: Math.round(s.left - i.right) }; });
    ok("Ventana baja: con la ficha abierta la columna no toca la ficha", withSheet.gap >= 8, JSON.stringify(withSheet));
    ok("Ventana baja sin errores", errors.length === 0, errors.join(" | "));
    await page.close();
  }

  // ---------- Vuelo con estrellitas (V4.6) ----------
  {
    // Reloj controlado por Playwright: el tiempo avanza a mano para capturar siempre el mismo instante del vuelo
    // (con el renderizado por software las capturas normales llegan tarde). La captura va por CDP porque
    // page.screenshot espera un cuadro de animación que con el reloj en pausa no llega.
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "es-MX" });
    watch(page, errors);
    await page.clock.install();
    const cdp = await page.context().newCDPSession(page);
    // Cuenta píxeles blancos (los núcleos de las estrellitas) en la franja del lienzo libre de ficha y lista.
    const bright = async (file) => {
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      if (file) fs.writeFileSync(`${SHOTS}/${file}`, Buffer.from(data, "base64"));
      return page.evaluate(async (b64) => {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/png;base64," + b64; });
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const g = c.getContext("2d"); g.drawImage(img, 0, 0);
        const d = g.getImageData(230, 120, 700, 420).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 240) n++;
        return n;
      }, data);
    };
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView({ block: "start" }));
    await page.waitForTimeout(2000);
    await page.locator('.planet-index [data-planet="robot-6dof"]').click();
    await page.waitForTimeout(3000);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 4000);
    await page.waitForTimeout(300);
    const rest = await bright();
    await page.locator('.planet-index [data-planet="scada-planta"]').click();
    await page.clock.runFor(850); // a media travesía (el viaje dura 1,7 s)
    await page.waitForTimeout(300);
    const mid = await bright("v1-vuelo-estrellitas.png");
    await page.clock.runFor(1400); // ya aterrizó
    await page.waitForTimeout(300);
    const after = await bright("v2-vuelo-aterrizo.png");
    const counts = JSON.stringify({ rest, mid, after });
    ok("Vuelo: a media travesía el principito va colgado de sus estrellitas (brillan sobre el lienzo)", mid > rest + 150 && mid > after + 150, counts);
    ok("Vuelo: al aterrizar las estrellitas se sueltan y desaparecen", after < 100, counts);
    ok("Vuelo sin errores", errors.length === 0, errors.join(" | "));
    await page.close();
  }

  // ---------- Móvil ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "es-MX" });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${SHOTS}/m1-hero.png` });
    ok("Móvil: barra oculta al inicio", await page.locator(".topbar").evaluate((e) => e.classList.contains("is-hidden")));
    ok("Móvil: CV, correo y LinkedIn en el encabezado", await page.locator(".hero").getByText("CV en español").isVisible() && await page.locator('.hero a[href^="mailto:"]').isVisible() && await page.locator('.hero a[href*="linkedin.com"]').isVisible());
    ok("Móvil: botón de idioma y de música visibles arriba", await page.locator(".hero .lang").isVisible() && await page.locator(".hero .music-btn").isVisible());
    ok("Móvil: la música solo ofrece encender/apagar (sin control de volumen)", await page.locator(".music-vol").first().isVisible().then((v) => !v));
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    ok("Móvil: sin desplazamiento horizontal", noHScroll);
    ok("Móvil: el video de presentación está junto al correo", await page.locator('.hero-contact a[href="/video"]').isVisible());
    {
      const b = page.locator(".hero-actions .btn");
      const [x1, e1, e2] = await Promise.all([b.nth(0).boundingBox(), b.nth(1).boundingBox(), b.nth(2).boundingBox()]);
      ok("Móvil: «Explorar» arriba y los dos CV en una fila", x1.y < e1.y && Math.abs(e1.y - e2.y) < 2 && e1.x + e1.width <= e2.x + 1, `x=${JSON.stringify(x1)} es=${JSON.stringify(e1)} en=${JSON.stringify(e2)}`);
    }
    await page.locator(".hero .lang button[lang='en']").tap();
    await page.waitForTimeout(300);
    ok("Móvil: el botón EN traduce el encabezado", await page.locator(".hero").getByText("Explore my projects").isVisible(), await page.locator(".hero-actions").innerText());
    await page.locator(".hero .lang button[lang='es']").tap();
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(700);
    ok("Móvil: al bajar aparece la barra", await page.locator(".topbar").evaluate((e) => !e.classList.contains("is-hidden")));
    await page.getByRole("button", { name: "Abrir menú" }).tap();
    ok("Móvil: menú abre con enlaces", await page.locator("#menu-movil").isVisible());
    ok("Móvil: menú sin «Inicio» y con el video de presentación", await page.locator("#menu-movil nav").getByText("Inicio", { exact: true }).count() === 0 && await page.locator('#menu-movil a[href="/video"]').count() === 1);
    await page.screenshot({ path: `${SHOTS}/m2-menu.png` });
    await page.getByRole("button", { name: "Cerrar menú" }).tap();
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOTS}/m3-universo.png` });
    await page.locator('[data-planet="hospital-uanl"]').tap();
    await page.waitForSelector(".sheet h2");
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${SHOTS}/m4-ficha.png` });
    const sb = await page.locator(".sheet").boundingBox();
    ok("Móvil: la ficha ocupa el ancho completo", sb.width >= 389);
    await page.locator(".sheet-close").tap();
    ok("Móvil: la ficha se cierra", await page.locator(".sheet").count() === 0);
    await page.locator(".fs-icon").tap();
    await page.waitForTimeout(700);
    ok("Móvil: pantalla completa del universo", await page.locator(".universe-wrap.is-fullscreen").count() === 1);
    await page.screenshot({ path: `${SHOTS}/m5-pantalla-completa.png` });
    await page.locator(".fs-icon").tap();
    await page.waitForFunction(() => !document.fullscreenElement && !document.querySelector(".universe-wrap").classList.contains("is-fullscreen"), null, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(200);
    ok("Móvil: se sale de pantalla completa con el botón", await page.locator(".universe-wrap.is-fullscreen").count() === 0);

    // ---------- V4.4: pantalla completa automática y ficha discreta en móvil ----------
    // La salida anterior bloqueó la entrada automática en esta visita; se recarga para probarla.
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    const mcb = await page.locator(".u-canvas").boundingBox();
    await page.touchscreen.tap(mcb.x + mcb.width / 2, mcb.y + mcb.height / 2);
    await page.waitForTimeout(900);
    ok("Móvil: tocar el lienzo entra solo en pantalla completa", await page.locator(".universe-wrap.is-fullscreen").count() === 1);
    await page.locator('[data-planet="robot-6dof"]').tap();
    await page.waitForSelector(".sheet h2");
    await page.waitForTimeout(1500);
    // V6.13: la ficha pasó de menos de media pantalla a ~60 % del alto para dar espacio a la descripción;
    // sigue abajo y deja la escena a la vista arriba.
    ok("Móvil: en pantalla completa la ficha va abajo, ocupa ~60 % del alto y deja ver la escena arriba", await page.evaluate(() => {
      const r = document.querySelector(".sheet").getBoundingClientRect();
      return r.height >= innerHeight * 0.5 && r.height <= innerHeight * 0.62 && Math.abs(r.bottom - innerHeight) < 2;
    }), await page.evaluate(() => JSON.stringify(document.querySelector(".sheet").getBoundingClientRect())));
    await page.locator(".sheet-grip-btn").tap();
    await page.waitForTimeout(500);
    ok("Móvil: el asa contrae la ficha a solo su título y deja ver la escena", await page.evaluate(() => {
      const sh = document.querySelector(".sheet");
      return sh.classList.contains("is-collapsed") && sh.getBoundingClientRect().height < 220;
    }));
    await page.locator(".sheet-grip-btn").tap();
    await page.waitForTimeout(400);
    ok("Móvil: el asa vuelve a expandirla", await page.evaluate(() => !document.querySelector(".sheet").classList.contains("is-collapsed")));
    await page.locator(".fs-icon").tap();
    await page.waitForFunction(() => !document.fullscreenElement && !document.querySelector(".universe-wrap").classList.contains("is-fullscreen"), null, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(400);
    ok("Móvil: al salir de pantalla completa la ficha desaparece y no tapa el lienzo reducido", await page.locator(".universe-wrap.is-fullscreen").count() === 0 && await page.locator(".sheet").count() === 0);
    const mcb2 = await page.locator(".u-canvas").boundingBox();
    await page.touchscreen.tap(mcb2.x + 60, mcb2.y + mcb2.height / 2);
    await page.waitForTimeout(700);
    ok("Móvil: tras salir, tocar el lienzo no reentra solo", await page.locator(".universe-wrap.is-fullscreen").count() === 0);
    ok("Móvil sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ---------- Modo oscuro (V4.4) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-MX", colorScheme: "dark" });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    ok("Oscuro: el documento declara ambos esquemas de color", await page.evaluate(() => document.querySelector('meta[name="color-scheme"]')?.content === "light dark"));
    ok("Oscuro: el papel se vuelve cielo azul noche", await page.evaluate(() => getComputedStyle(document.body).backgroundColor === "rgb(16, 24, 49)"));
    ok("Oscuro: el nombre se lee en crema", await page.evaluate(() => getComputedStyle(document.querySelector(".hero h1")).color === "rgb(243, 234, 214)"));
    ok("Oscuro: el botón dorado conserva texto oscuro (contraste sobre oro)", await page.evaluate(() => getComputedStyle(document.querySelector(".hero .btn-gold")).color === "rgb(31, 42, 68)"));
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(700);
    ok("Oscuro: la barra superior acompaña el tema", await page.evaluate(() => getComputedStyle(document.querySelector(".topbar")).backgroundColor.startsWith("rgba(14, 21, 44")));
    // V4.5: el chip de música encendido es discreto de noche (anillo dorado suave, sin relleno marcado)
    ok("Oscuro: el chip de música encendido lleva un anillo dorado suave", await page.locator(".topbar .music").first().evaluate((e) => {
      e.classList.remove("is-silent"); e.classList.add("is-playing");
      const cs = getComputedStyle(e); const r = { b: cs.borderTopColor, bg: cs.backgroundColor };
      e.classList.remove("is-playing"); e.classList.add("is-silent");
      return r.b === "rgba(226, 176, 74, 0.45)" && r.bg === "rgba(226, 176, 74, 0.07)";
    }));
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.waitForTimeout(800);
    await page.locator('[data-planet="finanzas-datos"]').click();
    await page.waitForSelector(".sheet h2");
    ok("Oscuro: la ficha pasa a noche con texto crema", await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector(".sheet"));
      return cs.backgroundColor === "rgb(24, 35, 68)" && cs.color === "rgb(243, 234, 214)";
    }));
    ok("Oscuro: el universo conserva su cielo de siempre", await page.evaluate(() => getComputedStyle(document.querySelector(".universe")).color === "rgb(243, 234, 214)"));
    ok("Oscuro sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ---------- Movimiento reducido ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce", locale: "es-MX" });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    await page.goto(BASE + "/proyecto/scada-planta", { waitUntil: "networkidle" });
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/r1-reducido.png` });
    ok("Movimiento reducido: escena y ficha funcionan", await page.locator(".sheet").count() === 1 && errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ---------- V6.5: lo que encontró la auditoría ----------
  // Cada prueba repite el caso que fallaba en la V6.4 (detalle y mediciones en docs/INFORME.md, sección V6.5).

  // Arranque: ninguna tarea larga de la carga ni del arranque del 3D pasa de 1,5 s (en la V6.4 había una de
  // 2,3 s pintando las acuarelas en el portátil de JC). El margen es amplio: aquí el WebGL va por software.
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    await ctx.addInitScript(() => {
      window.__lt = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: "longtask", buffered: true });
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.waitForTimeout(1000);
    const lt = await page.evaluate(() => window.__lt);
    ok("V6.5 arranque: ninguna tarea larga de la carga ni del 3D pasa de 1,5 s", Math.max(0, ...lt) < 1500, `tareas largas (ms): ${JSON.stringify(lt)}`);
    await ctx.close();
  }

  // Asistente en un equipo lento (CPU ×4 mientras arranca el 3D): copiar el correo nada más cargar. El panel
  // tiene que aparecer ya en Contacto (en la V6.4 a veces aparecía arriba, antes del viaje) y, al subir,
  // contraerse en la burbuja (en esos casos se quedaba abierto).
  for (let run = 1; run <= 2; run++) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    await ctx.addInitScript(() => {
      window.__open = null;
      const look = () => {
        if (window.__open || !document.querySelector(".assistant-panel.is-open")) return;
        const top = document.getElementById("contacto").getBoundingClientRect().top;
        window.__open = { top: Math.round(top), end: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 3, y: Math.round(scrollY) };
      };
      document.addEventListener("DOMContentLoaded", () => new MutationObserver(look).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] }));
    });
    const page = await ctx.newPage();
    const errors = [];
    watch(page, errors);
    const cdp = await ctx.newCDPSession(page);
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.locator(".hero .email .icon-btn").click();
    await until(page, () => !!window.__open, null, 30000);
    const at = await page.evaluate(() => window.__open);
    await scrollRest(page, 15000);
    await uiRest(page, 10000);
    await page.mouse.move(683, 303);
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -90); await page.waitForTimeout(40); }
    const min = await until(page, () => document.documentElement.dataset.assistant === "min" && !!document.querySelector(".assistant-bubble.is-shown"), null, 15000);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    ok(`V6.5 asistente con la CPU ×4 (intento ${run}): aparece ya en Contacto y al subir se contrae`, !!at && at.top >= -400 && at.top < 303 && (Math.abs(at.top - 70) < 8 || at.end || at.top < 70) && min, JSON.stringify({ alAparecer: at, contraido: min }));
    ok(`V6.5 asistente con la CPU ×4 (intento ${run}) sin errores`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // Pantalla completa nativa + video + salir con Esc (el navegador sale sin avisar a la página): al cerrar el
  // video la página se vuelve a desplazar. En la V6.4 quedaba trabada hasta recargar.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "es-MX" });
    const errors = [];
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.getByRole("button", { name: "Pantalla completa" }).first().click();
    const native = await until(page, () => !!document.fullscreenElement, null, 5000);
    await page.locator('[data-planet="nave"]').click();
    await page.waitForSelector(".sheet h2");
    await uiRest(page);
    await page.getByRole("button", { name: /video de presentación/ }).click();
    await page.waitForSelector("dialog.video-modal[open]");
    if (native) {
      await page.evaluate(() => document.exitFullscreen()); // lo que hace Esc en el navegador
      await until(page, () => !document.fullscreenElement && !document.querySelector(".universe-wrap.is-fullscreen"), null, 5000);
      // V6.16: sin Keyboard Lock (Firefox, Safari) esa salida también cierra el video, que es lo que se pedía con Esc.
      ok("V6.5 pantalla completa: al salir con Esc y el video abierto, la página sigue quieta detrás del video (o el video se cierra, V6.16)", await page.evaluate(() => (document.body.style.overflow === "hidden" && !!document.querySelector("dialog[open]")) || !document.querySelector("dialog[open]")));
      if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) await page.keyboard.press("Escape"); // ahora sí cierra el video
    } else {
      // Sin la API nativa (algunos navegadores sin interfaz), Esc cierra de arriba abajo (V6.16): el video, la ficha
      // y, sin nada abierto, la pantalla completa.
      for (let k = 0; k < 4 && await page.evaluate(() => !!document.querySelector("dialog[open], .sheet, .universe-wrap.is-fullscreen")); k++) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
      }
    }
    await until(page, () => !document.querySelector("dialog[open]") && !document.querySelector(".universe-wrap.is-fullscreen"), null, 5000);
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.move(700, 300);
    await page.mouse.wheel(0, 500);
    await scrollRest(page);
    const after = await page.evaluate(() => ({ overflow: document.body.style.overflow, y: Math.round(scrollY) }));
    ok(`V6.5 pantalla completa ${native ? "nativa" : "(modo CSS)"} + video: al cerrarlos, la página se vuelve a desplazar`, after.overflow === "" && after.y > y0 + 100, JSON.stringify({ y0: Math.round(y0), ...after }));
    ok("V6.5 pantalla completa + video sin errores", errors.length === 0, errors.join(" | "));
    await page.close();
  }

  // Con el video abierto encima, el universo deja de dibujar y vuelve al cerrarlo. Y alternar lista ↔ 3D
  // muchas veces no acumula contextos WebGL (en la V6.4 quedaban vivos hasta el aviso «Too many active
  // WebGL contexts», con el que el navegador empieza a tirar los más viejos).
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-MX" });
    await ctx.addInitScript(glCounters);
    const page = await ctx.newPage();
    const errors = [], glWarn = [];
    watch(page, errors);
    page.on("console", (m) => { if (/too many active webgl contexts/i.test(m.text())) glWarn.push(m.text()); });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.locator('[data-planet="nave"]').click();
    await page.waitForSelector(".sheet h2");
    await uiRest(page);
    await page.getByRole("button", { name: /video de presentación/ }).click();
    await page.waitForSelector("dialog.video-modal[open]");
    await page.waitForTimeout(300);
    const d0 = await page.evaluate(() => window.__draws);
    await page.waitForTimeout(1200);
    const behind = (await page.evaluate(() => window.__draws)) - d0;
    ok("V6.5: con el video abierto, el universo de atrás no dibuja nada", behind === 0, `llamadas de dibujo en 1,2 s: ${behind}`);
    await page.keyboard.press("Escape");
    const d1 = await page.evaluate(() => window.__draws);
    const resumed = await until(page, (d1) => window.__draws > d1, d1, 5000);
    ok("V6.5: al cerrar el video el universo sigue donde iba", resumed && await page.locator(".sheet").count() === 1);
    await page.keyboard.press("Escape");
    const TOGGLES = 17; // más que los 16 contextos que Chromium deja vivos a la vez
    for (let i = 0; i < TOGGLES; i++) {
      await page.getByRole("button", { name: /Vista de lista/ }).click();
      await page.waitForSelector(".pcard");
      await page.getByRole("button", { name: /Vista 3D/ }).click();
      await page.waitForSelector(".u-canvas");
      await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    }
    const gl = await page.evaluate(() => ({ creados: window.__gls.length, vivos: window.__gls.filter((g) => !g.isContextLost()).length, lienzos: document.querySelectorAll(".u-canvas").length }));
    ok(`V6.5: tras ${TOGGLES} vueltas lista ↔ 3D queda un solo contexto WebGL vivo`, gl.vivos === 1 && gl.lienzos === 1, JSON.stringify(gl));
    ok("V6.5: sin el aviso «Too many active WebGL contexts»", glWarn.length === 0, glWarn.join(" | "));
    ok("V6.5: video y vueltas lista ↔ 3D sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // ES/EN no mueve lo que se está viendo: escritorio (el portátil de JC) y celular, con el anclaje del
  // navegador y sin él (Safari no lo tiene). Se mide dentro del universo y donde termina, de ida y de vuelta.
  for (const [w, h, mobile] of [[1366, 606, false], [390, 844, true]]) {
    for (const safari of [false, true]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "es-MX", bypassCSP: safari, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
      if (safari) await ctx.addInitScript(() => document.addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style");
        s.textContent = "*, html, body { overflow-anchor: none !important; }";
        document.head.appendChild(s);
      }));
      const page = await ctx.newPage();
      const errors = [];
      watch(page, errors);
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const shifts = [];
      for (const where of ["universo", "fin del universo"]) {
        await page.evaluate((where) => {
          const u = document.getElementById("universo");
          const top = u.getBoundingClientRect().top + scrollY;
          scrollTo(0, Math.round(where === "universo" ? top + 40 : top + u.offsetHeight - innerHeight / 2));
        }, where);
        await scrollRest(page);
        await page.waitForSelector(".u-canvas", { timeout: 15000 });
        await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
        await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
        await uiRest(page);
        for (let k = 0; k < 2; k++) {
          const m = await markCenter(page);
          const to = await switchLang(page, mobile);
          await scrollRest(page);
          await uiRest(page);
          shifts.push({ where, to, el: m && m.el, shift: m && to ? await centerShift(page, m) : null });
        }
      }
      const name = `V6.5 ES/EN ${w}×${h}${safari ? " sin anclaje del navegador (como Safari)" : ""}`;
      ok(`${name}: lo que se está viendo no se mueve`, shifts.every((s) => s.shift !== null && Math.abs(s.shift) <= 1), JSON.stringify(shifts));
      ok(`${name} sin errores`, errors.length === 0, errors.join(" | "));
      if (!safari) await page.screenshot({ path: `${SHOTS}/a1-idioma-${w}.png` });
      await ctx.close();
    }
  }

  // Recorrido completo con la política de seguridad de producción, si BASE la envía (tests/e2e/serve.cjs aplica
  // las cabeceras de vercel.json): ninguna violación. Y el video sin el aviso del iframe (allow/allowfullscreen).
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    const violations = [];
    await ctx.exposeFunction("__cspViolation", (v) => violations.push(v));
    await ctx.addInitScript(() => {
      if (window.top !== window) return; // solo la página: el iframe de YouTube trae su propia política
      document.addEventListener("securitypolicyviolation", (e) => window.__cspViolation(`${e.violatedDirective} ← ${e.blockedURI || "en línea"} @ ${location.pathname}`));
    });
    const page = await ctx.newPage();
    const errors = [], iframeWarn = [];
    watch(page, errors);
    page.on("console", (m) => { if (/allow attribute will take precedence/i.test(m.text())) iframeWarn.push(m.text()); });
    const policy = (await page.request.get(BASE + "/")).headers()["content-security-policy"] || "";
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok("V6.5: ningún enlace del sitio usa http sin cifrar", await page.locator('a[href^="http:"]').count() === 0);
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForSelector(".u-canvas", { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector(".universe-status"), null, { timeout: 20000 });
    await page.locator('[data-planet="nave"]').click();
    await page.waitForSelector(".sheet h2");
    // Que la ficha termine de entrar: si Playwright intenta el clic con la ficha aún deslizándose, al reintentar
    // alinea el botón con el borde de abajo de la ventana y sube la página ~300 px (eso lo hace la prueba, no una persona).
    await uiRest(page);
    await page.getByRole("button", { name: /video de presentación/ }).click();
    await page.waitForSelector("dialog.video-modal[open] iframe");
    await page.waitForTimeout(1200); // que el iframe intente cargar
    await page.keyboard.press("Escape");
    await until(page, () => !document.querySelector("dialog[open]"), null, 4000);
    await page.locator(".sheet-close").click(); // y la ficha
    await until(page, () => !document.querySelector(".sheet"), null, 4000);
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await scrollRest(page);
    await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
    const music = page.locator(".top-actions .music-btn");
    await music.click();
    await page.waitForTimeout(600);
    await music.click();
    ok("V6.5: cambiar de idioma en el recorrido", await switchLang(page, false) === "en" && await switchLang(page, false) === "es");
    await scrollRest(page);
    await page.getByRole("button", { name: /Vista de lista/ }).click();
    await page.waitForSelector(".pcard");
    await page.getByRole("button", { name: /Vista 3D/ }).click();
    await page.waitForSelector(".u-canvas");
    await page.evaluate(() => scrollTo(0, 0));
    await scrollRest(page);
    await page.locator(".hero .email .icon-btn").click();
    await page.waitForSelector(".assistant-panel.is-open", { timeout: 15000 });
    await page.locator(".assistant-input").fill("¿Qué proyectos tiene?");
    await page.keyboard.press("Enter");
    await page.waitForSelector(".msg-typing", { state: "detached", timeout: 4000 });
    await page.goto(BASE + "/video", { waitUntil: "networkidle" });
    await page.waitForSelector("#video iframe");
    await page.waitForTimeout(1200);
    ok("V6.5: el video (ventana y página /video) sin el aviso «Allow attribute will take precedence»", iframeWarn.length === 0, iframeWarn.join(" | "));
    if (policy) ok("V6.5: con la política de seguridad de producción, ninguna violación en todo el recorrido", violations.length === 0, violations.join(" | "));
    else console.log("· BASE no envía la política de seguridad (CSP): esa prueba se omite. Córrela con tests/e2e/serve.cjs.");
    ok("V6.5: recorrido completo sin errores", errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // Barra superior: la clara es opaca y no lleva desenfoque detrás (se recalculaba en cada desplazamiento sin
  // verse); la oscura, que es translúcida, lo tiene. Y los controles sobre el cielo 3D llevan el suyo, para que
  // las etiquetas que pasan por detrás no se lean a través. (Hasta la V6.4 la compilación dejaba solo la versión
  // -webkit- de esos dos desenfoques: Safari los mostraba, Chrome no.)
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 606 }, locale: "es-MX", colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const bar = await page.locator(".topbar").evaluate((e) => { const cs = getComputedStyle(e); return { filtro: cs.backdropFilter, fondo: cs.backgroundColor }; });
    if (scheme === "light") ok("V6.5 barra clara: opaca y sin desenfoque detrás", bar.filtro === "none" && bar.fondo === "rgb(248, 242, 228)", JSON.stringify(bar));
    else ok("V6.5 barra oscura: con su desenfoque también en Chrome", /blur\(12px\)/.test(bar.filtro), JSON.stringify(bar));
    if (scheme === "light") {
      const chips = await page.locator(".universe.is-3d .universe-tools .chip-btn:not(.is-on)").evaluateAll((els) => els.map((e) => getComputedStyle(e).backdropFilter));
      ok("V6.5 controles sobre el cielo 3D: con su desenfoque también en Chrome", chips.length >= 3 && chips.every((f) => /blur\(6px\)/.test(f)), JSON.stringify(chips));
    }
    await ctx.close();
  }

  // Celulares angostos (320 y 360 px) en los dos idiomas: sin desplazamiento horizontal y con los botones del
  // CV completos (en la V6.4, a 320 px en inglés la página se salía de lado y «CV in English» quedaba cortado).
  for (const [w, h] of [[320, 640], [360, 740]]) {
    for (const lang of ["en", "es"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: lang === "en" ? "en-US" : "es-MX" });
      const page = await ctx.newPage();
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const geo = () => page.evaluate(() => ({
        ancho: document.documentElement.scrollWidth,
        ventana: document.documentElement.clientWidth, // no innerWidth: en celular crece si algo se sale
        botones: [...document.querySelectorAll(".hero-actions .btn")].map((b) => { const r = b.getBoundingClientRect(); return { izq: Math.round(r.left), der: Math.round(r.right), cortado: b.scrollWidth > b.clientWidth + 1 }; }),
        // Idioma y música del encabezado («Music: off» es más ancho que «Música: no»).
        herramientas: [...document.querySelectorAll(".hero-tools > *")].map((b) => { const r = b.getBoundingClientRect(); return { izq: Math.round(r.left), der: Math.round(r.right) }; }),
        barra: (() => { const t = document.querySelector(".topbar-inner"); return t ? t.scrollWidth <= t.clientWidth + 1 : true; })(),
        // Los dos CV: en la misma fila o no, y el icono más angosto (en la V6.4 se aplastaba hasta 0 px).
        cv: (() => { const bs = [...document.querySelectorAll(".hero-cv .btn")]; return { juntos: bs.length === 2 && Math.abs(bs[0].getBoundingClientRect().top - bs[1].getBoundingClientRect().top) < 2, icono: Math.min(...bs.map((b) => b.querySelector("svg")?.getBoundingClientRect().width ?? 0)) }; })(),
        // El correo en una sola línea (en la V6.4, a 320 px quedaba «…gmail.co» y una «m» suelta abajo).
        correo: Math.round(document.querySelector(".hero-contact .email-link").getBoundingClientRect().height),
      }));
      const g = await geo();
      const inside = (b) => b.izq >= 0 && b.der <= g.ventana;
      ok(`V6.5 ${w}×${h} ${lang.toUpperCase()}: sin desplazamiento horizontal, con idioma, música y los botones del CV completos`, g.ancho <= g.ventana && g.botones.length === 3 && g.botones.every((b) => inside(b) && !b.cortado) && g.herramientas.length >= 2 && g.herramientas.every(inside), JSON.stringify(g));
      // Lado a lado como siempre; solo a 320 px en inglés («Résumé (English)» no cabe) cada CV va en su fila.
      const juntos = !(w === 320 && lang === "en");
      ok(`V6.5 ${w}×${h} ${lang.toUpperCase()}: correo en una línea y los CV ${juntos ? "lado a lado" : "uno sobre otro"}, con su icono completo`, g.correo <= 44 && g.cv.juntos === juntos && g.cv.icono >= 17, JSON.stringify({ correo: g.correo, cv: g.cv }));
      if (w === 320) await page.screenshot({ path: `${SHOTS}/a2-320-${lang}.png` });
      await page.evaluate(() => scrollTo(0, 900));
      await until(page, () => !document.querySelector(".topbar").classList.contains("is-hidden"), null, 4000);
      const g2 = await geo();
      ok(`V6.5 ${w}×${h} ${lang.toUpperCase()}: la barra cabe completa al bajar`, g2.barra && g2.ancho <= g2.ventana, JSON.stringify(g2));
      await ctx.close();
    }
  }

  // Sin JavaScript: el aviso con nombre, correo, LinkedIn y los CV se lee centrado. Su estilo va en una clase:
  // con la política de seguridad de producción, un estilo en línea se ignoraría.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-MX", javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    const ns = page.locator(".noscript");
    const has = (await ns.count()) === 1;
    const box = has ? await ns.boundingBox() : null;
    const css = has ? await ns.evaluate((d) => getComputedStyle(d).maxWidth) : null;
    ok("V6.5 sin JavaScript: el aviso se ve centrado y sin enlaces http", !!box && css === "640px" && Math.abs(box.x - (1280 - box.x - box.width)) <= 2 && await page.locator('.noscript a[href^="http:"]').count() === 0 && await page.locator('.noscript a[href^="https://www.linkedin.com/in/jonathan-corpus"]').count() === 1, JSON.stringify({ box, css }));
    await ctx.close();
  }

  await browser.close();

  // ---------- Sin WebGL ----------
  {
    const b = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis", "--disable-gpu"] });
    const page = await b.newPage({ viewport: { width: 1280, height: 800 }, locale: "es-MX" });
    const errors = [];
    watch(page, errors);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector("#universo").scrollIntoView());
    await page.waitForTimeout(500);
    ok("Sin WebGL: no se crea canvas", await page.locator(".u-canvas").count() === 0);
    ok("Sin WebGL: aviso y lista de proyectos", await page.locator(".pcard").count() === 9 && await page.getByText(/no muestra gráficos 3D/).isVisible());
    await page.screenshot({ path: `${SHOTS}/n1-sin-webgl.png` });
    await page.locator(".pcard").nth(6).click();
    ok("Sin WebGL: las fichas abren", (await page.locator(".sheet h2").textContent()).includes("EEG"));
    ok("Sin WebGL: datos de contacto visibles", await page.locator('.hero a[href^="mailto:"]').isVisible());
    ok("Sin WebGL sin errores", errors.length === 0, errors.join(" | "));
    await b.close();
  }

  process.exit(resumen() ? 1 : 0);
})().catch((e) => {
  // Si algo revienta a mitad, se ve igual lo que ya pasó y dónde se detuvo.
  resumen();
  console.error("\nLa corrida se detuvo antes de terminar:", e);
  process.exit(1);
});
