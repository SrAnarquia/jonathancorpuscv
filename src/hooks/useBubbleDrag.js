import { useLayoutEffect, useRef } from "react";
import { bubblePlacement, snapBubble } from "../lib/assistantDock";
import { isFullscreen, restingSpot, topbarHeight } from "./useAssistantDock";

// La hadita (el asistente contraído) se puede arrastrar a otro sitio, con el dedo o el ratón, por si
// estorba donde está: al soltarla se pega al lado más cercano de la ventana, a esa altura, y ahí se
// queda el resto de la visita (también al abrir y volver a contraer el asistente, o al recargar). Un
// toque sin arrastre sigue abriendo el asistente. Mientras no se mueva, conserva su sitio de siempre y
// sigue apartándose sola de los controles (ver useAssistantDock); una vez movida, manda la persona.
//
// Se coloca con dos variables del CSS, --dx y --dy: el desplazamiento desde su sitio de reposo (abajo a
// la derecha), que es el que sigue teniendo en el CSS. Así, si cambia el tamaño de la ventana, se
// recalcula desde el sitio de reposo nuevo.

const KEY = "jc-assistant-bubble";
const DRAG_START = 6; // px de movimiento a partir de los cuales un toque pasa a ser un arrastre
const CLICK_GRACE = 400; // ms: el clic que sigue a un arrastre no abre el asistente

function readSpot() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY));
    if (v && (v.side === "left" || v.side === "right") && typeof v.frac === "number") return { side: v.side, frac: v.frac };
  } catch { /* sin almacenamiento */ }
  return null;
}

function saveSpot(spot) {
  try { sessionStorage.setItem(KEY, JSON.stringify(spot)); } catch { /* sin almacenamiento */ }
}

// Ventana y márgenes en que se mueve la burbuja: los mismos que su sitio de reposo (que ya incluye las
// zonas seguras del celular) y, arriba, la barra de navegación.
function bounds(bubble, rest) {
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  return { size: bubble.offsetWidth, width, height, margins: { x: width - rest.right, top: topbarHeight() + 10, bottom: height - rest.bottom } };
}

const offset = (bubble, name) => parseFloat(bubble.style.getPropertyValue(name)) || 0;

export function useBubbleDrag({ bubbleRef, active, onOpen }) {
  const spot = useRef(readSpot());
  const suppressUntil = useRef(0);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  // Antes de pintarse (useLayoutEffect): si hay un sitio guardado, la burbuja aparece ya ahí, sin saltar
  // desde la esquina. Va después del acomodo de useAssistantDock (orden de los hooks en ContactAssistant),
  // así la última palabra es del sitio guardado.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!active || !bubble) return undefined;

    // Lleva la burbuja al sitio guardado (o la deja en el de reposo si la persona no la ha movido).
    const apply = () => {
      if (!spot.current) {
        bubble.style.removeProperty("--dx");
        bubble.style.removeProperty("--dy");
        delete bubble.dataset.placed;
        delete bubble.dataset.side;
        return;
      }
      const rest = restingSpot(bubble);
      const { left, top } = bubblePlacement(spot.current, bounds(bubble, rest));
      bubble.style.setProperty("--dx", `${Math.round(left - rest.left)}px`);
      bubble.style.setProperty("--dy", `${Math.round(top - rest.top)}px`);
      bubble.style.setProperty("--lift", "0px"); // donde la dejó la persona no se sube ni se aparta sola
      bubble.dataset.placed = "";
      bubble.dataset.side = spot.current.side;
      if (!isFullscreen()) delete bubble.dataset.away;
    };

    let start = null; // al pulsar: punto, desplazamiento y elevación que tenía, y sitio de reposo
    let dragging = false;
    const onDown = (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      start = { x: e.clientX, y: e.clientY, dx: offset(bubble, "--dx"), dy: offset(bubble, "--dy"), lift: offset(bubble, "--lift"), rest: restingSpot(bubble) };
      dragging = false;
      try { bubble.setPointerCapture(e.pointerId); } catch { /* sin captura: el arrastre sigue mientras el puntero esté encima */ }
    };
    const onMove = (e) => {
      if (!start) return;
      const mx = e.clientX - start.x, my = e.clientY - start.y;
      if (!dragging) {
        if (Math.hypot(mx, my) < DRAG_START) return;
        dragging = true;
        // Atributo data-* y no una clase: la clase del botón la escribe React en cada render y borraría la nuestra.
        bubble.dataset.dragging = "";
        bubble.dataset.placed = "";
        // Lo que había subido para no tapar nada pasa a ser parte de su posición: no da un salto al empezar.
        start.dy -= start.lift;
        bubble.style.setProperty("--lift", "0px");
      }
      // Sigue al puntero sin salirse de la ventana.
      const { size, width, height, margins } = bounds(bubble, start.rest);
      const left = Math.min(Math.max(start.rest.left + start.dx + mx, margins.x), width - size - margins.x);
      const top = Math.min(Math.max(start.rest.top + start.dy + my, margins.top), height - size - margins.bottom);
      bubble.style.setProperty("--dx", `${Math.round(left - start.rest.left)}px`);
      bubble.style.setProperty("--dy", `${Math.round(top - start.rest.top)}px`);
    };
    const onUp = (e) => {
      if (!start) return;
      const { rest } = start;
      const moved = dragging;
      start = null;
      dragging = false;
      try { bubble.releasePointerCapture(e.pointerId); } catch { /* ya liberado */ }
      if (!moved) return; // un toque: el clic que sigue abre el asistente
      delete bubble.dataset.dragging;
      suppressUntil.current = performance.now() + CLICK_GRACE;
      const box = bounds(bubble, rest);
      const snapped = snapBubble({ x: rest.left + offset(bubble, "--dx"), y: rest.top + offset(bubble, "--dy"), ...box });
      spot.current = { side: snapped.side, frac: snapped.frac };
      saveSpot(spot.current);
      apply();
    };
    // El clic que el navegador dispara al soltar tras arrastrar no cuenta como «abrir».
    const onClick = (e) => {
      if (performance.now() < suppressUntil.current) { e.preventDefault(); e.stopPropagation(); return; }
      onOpenRef.current();
    };

    apply();
    bubble.addEventListener("pointerdown", onDown);
    bubble.addEventListener("pointermove", onMove);
    bubble.addEventListener("pointerup", onUp);
    bubble.addEventListener("pointercancel", onUp);
    bubble.addEventListener("click", onClick);
    window.addEventListener("resize", apply);
    return () => {
      bubble.removeEventListener("pointerdown", onDown);
      bubble.removeEventListener("pointermove", onMove);
      bubble.removeEventListener("pointerup", onUp);
      bubble.removeEventListener("pointercancel", onUp);
      bubble.removeEventListener("click", onClick);
      window.removeEventListener("resize", apply);
      delete bubble.dataset.dragging;
    };
  }, [active, bubbleRef]);
}
