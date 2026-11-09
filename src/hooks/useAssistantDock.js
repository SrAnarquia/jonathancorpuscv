import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { keyboardInset, onScrollSettled, pickLift } from "../lib/assistantDock";

// Cómo convive el asistente con la página:
//  1. al abrirse lleva la página a Contacto (el mismo salto que el enlace «Contacto») y el panel
//     aparece al llegar, sin competir con el desplazamiento;
//  2. le hace sitio: en escritorio el contenido del contacto se aparta del panel y en móvil se añade
//     espacio bajo el pie para que el correo y LinkedIn queden por encima del panel;
//  3. se contrae solo cuando la persona vuelve a subir de verdad por la página (no por movimientos
//     mínimos, ni por leer la conversación, ni por el teclado del móvil);
//  4. en móvil se apoya sobre el teclado;
//  5. ya contraído, la burbuja no tapa controles: sube lo justo o se aparta mientras no haya sitio
//     (salvo que la persona la haya arrastrado a otro sitio, ver useBubbleDrag: entonces se queda ahí).

const GAP = 10;
// Lo que la burbuja no debe tapar al quedar quieta: controles, enlaces y títulos (las etiquetas de los
// planetas se mueven solas: no cuentan).
const AVOID = 'a[href], button, input, select, textarea, iframe, video, [role="button"], .zoom, .planet-index, .sheet, h1, h2, h3';
// La pista «¿Hablamos?», que es más ancha, tampoco debe tapar el texto corrido.
const HINT_AVOID = `${AVOID}, p, li`;

// Rectángulo de la burbuja en su sitio de reposo (sin elevar ni mover), según su posición fija en el CSS.
export function restingSpot(bubble) {
  const cs = getComputedStyle(bubble);
  const size = bubble.offsetWidth;
  const right = document.documentElement.clientWidth - parseFloat(cs.right);
  const bottom = window.innerHeight - parseFloat(cs.bottom);
  return { left: right - size, right, top: bottom - size, bottom };
}

// Elementos visibles de la página (no del asistente) que se cruzan con `rect` más un margen.
function elementsNear(rect, root, margin, selector) {
  const found = [];
  for (const el of document.querySelectorAll(selector)) {
    if (root.contains(el) || el.closest(".u-labels")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.right <= rect.left - margin || r.left >= rect.right + margin || r.bottom <= rect.top - margin || r.top >= rect.bottom + margin) continue;
    if (getComputedStyle(el).visibility === "hidden") continue;
    found.push(r);
  }
  return found;
}

const cssPx = (el, name) => parseFloat(el.style.getPropertyValue(name)) || 0;

// Rectángulo de la burbuja donde está ahora: su sitio de reposo más lo que la persona la movió
// (--dx, --dy) y menos lo que subió para no tapar nada (--lift).
export function bubbleSpot(bubble) {
  const rest = restingSpot(bubble);
  const dx = cssPx(bubble, "--dx");
  const dy = cssPx(bubble, "--dy") - cssPx(bubble, "--lift");
  return { left: rest.left + dx, right: rest.right + dx, top: rest.top + dy, bottom: rest.bottom + dy };
}

// ¿Cabe la pista «¿Hablamos?» junto a la burbuja (ya colocada) sin tapar controles ni texto? Va a su
// izquierda; si la burbuja está pegada al borde izquierdo, a su derecha.
export function hintFits(bubble, root) {
  const hint = bubble?.querySelector(".assistant-hint");
  if (!hint || !root || bubble.hasAttribute("data-away")) return false;
  const spot = bubbleSpot(bubble);
  const mid = (spot.top + spot.bottom) / 2;
  const atLeft = bubble.dataset.side === "left";
  const left = atLeft ? spot.right + 10 : spot.left - 10 - hint.offsetWidth;
  const rect = { left, right: left + hint.offsetWidth, top: mid - hint.offsetHeight / 2, bottom: mid + hint.offsetHeight / 2 };
  return rect.left >= 0 && rect.right <= document.documentElement.clientWidth && elementsNear(rect, root, 4, HINT_AVOID).length === 0;
}

export const isFullscreen = () => !!(document.fullscreenElement || document.querySelector(".universe-wrap.is-fullscreen"));
export const topbarHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar")) || 62;
// Cuánto tiene que bajar Contacto en la pantalla (es decir, cuánto hay que subir) para contraerse.
const awayThreshold = () => Math.max(140, Math.min(260, window.innerHeight * 0.22));
// Teclas con las que la persona desplaza la página por su cuenta.
const SCROLL_KEYS = new Set(["PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End", " "]);

// Devuelve `arrived`: el número de la última apertura (seq) que ya llegó a Contacto. El panel se
// muestra cuando arrived === seq.
export function useAssistantDock({ mode, seq, sheet, coarse, reducedMotion, rootRef, panelRef, bubbleRef, inputRef, onAway }) {
  const [arrived, setArrived] = useState(0);
  const hold = useRef(false); // desplazamiento propio o del navegador en curso: no cuenta como «subir»
  const base = useRef(null); // posición de Contacto en la ventana al llegar
  const lastScroll = useRef(-Infinity); // último desplazamiento de la página con el panel abierto
  const onAwayRef = useRef(onAway);
  onAwayRef.current = onAway;

  // Atributos en <html> que usa el CSS: data-assistant="open|min" (empuje del contacto, aire para la
  // burbuja) y data-assistant-space (espacio bajo el pie en móvil, del alto del panel).
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (mode === "hidden") return;
    root.dataset.assistant = mode;
    if (!sheet) delete root.dataset.assistantSpace;
    else if (mode === "open" && panelRef.current) {
      root.style.setProperty("--assistant-space", `${panelRef.current.offsetHeight}px`);
      root.dataset.assistantSpace = "";
    }
  }, [mode, sheet, panelRef]);

  useEffect(() => () => {
    const root = document.documentElement;
    delete root.dataset.assistant;
    delete root.dataset.assistantSpace;
    root.style.removeProperty("--assistant-space");
  }, []);

  // 1 y 2. Cada apertura (seq) lleva a Contacto. En móvil el destino deja la fila del correo y LinkedIn
  // por encima del panel. Al llegar se toma la posición de Contacto como referencia para el punto 3.
  useLayoutEffect(() => {
    if (mode !== "open" || !seq) return undefined;
    const contact = document.getElementById("contacto");
    if (!contact) { setArrived(seq); return undefined; }
    const destination = () => {
      const y = window.scrollY;
      // Igual que el salto a #contacto: bajo la barra, con los 8 px de aire del contacto.
      let top = contact.getBoundingClientRect().top + y - topbarHeight() - 8;
      if (sheet && panelRef.current) {
        const links = contact.querySelector(".footer-actions");
        const free = window.innerHeight - panelRef.current.offsetHeight - 12;
        if (links) top = Math.max(top, links.getBoundingClientRect().bottom + y - free);
      }
      return Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
    };
    const scroll = (top) => {
      const instant = reducedMotion || Math.abs(top - window.scrollY) < 2;
      window.scrollTo({ top, behavior: instant ? "auto" : "smooth" });
    };
    // Si la persona toma el control mientras baja (rueda, dedo o teclado), no se la persigue.
    let interrupted = false;
    let corrected = false;
    let stop = () => {};
    const onUser = (e) => { if (e.type !== "keydown" || SCROLL_KEYS.has(e.key)) interrupted = true; };
    const listen = (on) => {
      const method = on ? "addEventListener" : "removeEventListener";
      window[method]("wheel", onUser, { passive: true });
      window[method]("touchstart", onUser, { passive: true });
      window[method]("keydown", onUser);
    };
    const finish = () => {
      listen(false);
      base.current = contact.getBoundingClientRect().top;
      hold.current = false;
      setArrived(seq);
    };
    const settle = () => {
      const gap = destination() - window.scrollY;
      if (interrupted) {
        // Se quedó lejos de Contacto (subió por su cuenta): el asistente queda contraído.
        if (gap > awayThreshold()) onAwayRef.current?.();
        return finish();
      }
      // El empuje del contacto o las fuentes pueden reacomodar el pie mientras se baja: un ajuste final.
      if (Math.abs(gap) <= 2 || corrected) return finish();
      corrected = true;
      scroll(destination());
      stop = onScrollSettled(settle);
    };
    hold.current = true;
    const target = destination();
    // Ya estaba en Contacto: se abre en el acto.
    if (Math.abs(target - window.scrollY) <= 2) { finish(); return undefined; }
    listen(true);
    scroll(target);
    // Se da por llegado cuando la página de verdad se detiene (no a un tiempo fijo): así el panel no
    // aparece a medio camino y la referencia para contraerse se toma ya en Contacto.
    stop = onScrollSettled(settle);
    return () => { stop(); listen(false); };
    // Solo al abrirse: el resto de dependencias se leen en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  // 3. Contraerse al volver a subir: cuando Contacto baja en la pantalla más de un umbral (entre 140 y
  // 260 px según el alto de la ventana) respecto a donde estaba al llegar. Bajar y volver a subir dentro
  // del pie no lo contrae; leer la conversación no mueve la página.
  useEffect(() => {
    if (mode !== "open") return undefined;
    const contact = document.getElementById("contacto");
    if (!contact) return undefined;
    let raf = 0;
    let timer = 0;
    const check = () => {
      raf = 0;
      if (hold.current || base.current == null) return;
      if (contact.getBoundingClientRect().top - base.current > awayThreshold()) onAwayRef.current?.();
    };
    const onScroll = () => {
      if (!hold.current) lastScroll.current = performance.now(); // solo lo que desplaza la persona
      if (!raf) raf = requestAnimationFrame(check);
    };
    // Teclado del móvil, giro o cambio de tamaño: el navegador mueve la página por su cuenta. Ese
    // movimiento no cuenta y la posición en que queda pasa a ser la nueva referencia.
    const rebase = () => {
      hold.current = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        base.current = contact.getBoundingClientRect().top;
        hold.current = false;
      }, 450);
    };
    const onField = () => { if (coarse) rebase(); };
    const input = inputRef.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", rebase);
    window.visualViewport?.addEventListener("resize", rebase);
    input?.addEventListener("focus", onField);
    input?.addEventListener("blur", onField);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", rebase);
      window.visualViewport?.removeEventListener("resize", rebase);
      input?.removeEventListener("focus", onField);
      input?.removeEventListener("blur", onField);
    };
  }, [mode, coarse, inputRef]);

  // 4. Teclado del móvil: el panel se apoya sobre él y se ajusta a lo que queda visible.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = rootRef.current;
    if (mode !== "open" || !vv || !el) return undefined;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const { inset, height } = keyboardInset(vv, window.innerHeight, document.activeElement === inputRef.current);
      el.style.setProperty("--kb", `${inset}px`);
      el.style.setProperty("--vvh", `${height}px`);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const input = inputRef.current;
    apply();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    input?.addEventListener("focus", schedule);
    input?.addEventListener("blur", schedule);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      input?.removeEventListener("focus", schedule);
      input?.removeEventListener("blur", schedule);
      el.style.removeProperty("--kb");
      el.style.removeProperty("--vvh");
    };
  }, [mode, rootRef, inputRef]);

  // Al contraerse en móvil sobra el espacio bajo el pie. Si se contrajo con el botón (la página estaba
  // quieta), se recoge en el acto con una transición suave. Si se contrajo porque la persona está subiendo,
  // se espera a que ese espacio deje de verse: quitarlo a media subida movería lo que está leyendo.
  useEffect(() => {
    const root = document.documentElement;
    if (mode !== "min" || !("assistantSpace" in root.dataset)) return undefined;
    const footer = document.getElementById("contacto");
    let raf = 0;
    const done = () => { delete root.dataset.assistantSpace; window.removeEventListener("scroll", onScroll); };
    const check = () => {
      raf = 0;
      const space = parseFloat(root.style.getPropertyValue("--assistant-space")) || 0;
      if (!footer || footer.getBoundingClientRect().bottom - space >= window.innerHeight) done();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    if (performance.now() - lastScroll.current > 250) { done(); return undefined; }
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, [mode]);

  // 5. Burbuja: se recoloca cuando la página se detiene, cambia de tamaño o cambia lo que hay debajo
  // (se abre una ficha, pantalla completa…); nunca a cada cuadro ni mientras se desplaza. La primera
  // colocación es antes de pintarse, para que al contraerse no aparezca en un sitio y salte a otro.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const root = rootRef.current;
    if (mode !== "min" || !bubble || !root) return undefined;
    let raf = 0;
    let idle = 0;
    const place = () => {
      raf = 0;
      const fullscreen = isFullscreen();
      let lift = null;
      // Si la persona la arrastró a otro sitio (data-placed, ver useBubbleDrag), manda ella: ni sube ni se
      // aparta sola; solo la pantalla completa la esconde.
      if (!fullscreen && "placed" in bubble.dataset) lift = 0;
      else if (!fullscreen) {
        const spot = restingSpot(bubble);
        const max = Math.min(260, window.innerHeight * 0.42);
        // Todo lo que hay en la columna de la burbuja, desde su sitio hasta lo más alto que puede subir.
        const obstacles = elementsNear({ ...spot, top: spot.top - max }, root, GAP, AVOID);
        lift = pickLift(spot, obstacles, { gap: GAP, max });
      }
      bubble.style.setProperty("--lift", `${lift ?? 0}px`);
      if (lift === null) bubble.dataset.away = "";
      else delete bubble.dataset.away;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };
    const later = () => { clearTimeout(idle); idle = setTimeout(schedule, 160); };
    const mo = new MutationObserver((list) => { if (list.some((m) => !root.contains(m.target))) later(); });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
    window.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    document.addEventListener("fullscreenchange", schedule); // esconderse o volver sin esperar al reposo
    place();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      mo.disconnect();
      window.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      document.removeEventListener("fullscreenchange", schedule);
    };
  }, [mode, bubbleRef, rootRef]);

  return { arrived };
}
