// Mantener en su sitio lo que la persona está viendo cuando cambia el alto de lo que hay arriba
// (p. ej. al cambiar de idioma el encabezado ocupa otras líneas). Chrome y Edge de escritorio lo hacen
// solos con el anclaje de desplazamiento, pero Safari no lo tiene y en celular, dentro del universo,
// Chrome no lo aplicaba: se hace a mano y, mientras tanto, se apaga el del navegador para no corregir
// dos veces.
//
//   const a = captureViewAnchor();   // antes del cambio
//   …el DOM cambia…
//   restoreViewAnchor(a);            // después (en un efecto de layout, antes de pintar)

const PINNED = new Set(["fixed", "sticky"]);

// Fijo o pegajoso (barra, asistente, ficha): no se mueve con la página, así que no sirve de ancla.
function pinned(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (PINNED.has(getComputedStyle(n).position)) return true;
  }
  return false;
}

// Lo que se mueve solo (etiquetas del universo, la ilustración que flota) tampoco: se sube hasta un
// contenedor quieto.
function steady(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.transform === "none" && (cs.translate || "none") === "none") return n;
  }
  return null;
}

export function captureViewAnchor() {
  if (typeof document === "undefined" || !document.elementsFromPoint) return null;
  const root = document.documentElement;
  const x = window.innerWidth / 2;
  for (const f of [0.5, 0.35, 0.65]) {
    for (const hit of document.elementsFromPoint(x, window.innerHeight * f)) {
      if (hit === root || hit === document.body) break;
      if (pinned(hit)) continue; // se mira lo que hay detrás
      const el = steady(hit);
      if (!el) break;
      const prev = root.style.overflowAnchor;
      root.style.overflowAnchor = "none";
      return { el, top: el.getBoundingClientRect().top, prev };
    }
  }
  return null;
}

export function restoreViewAnchor(a) {
  if (!a) return;
  const root = document.documentElement;
  if (a.el.isConnected) {
    const delta = a.el.getBoundingClientRect().top - a.top;
    if (Math.abs(delta) >= 1) window.scrollTo(window.scrollX, window.scrollY + delta);
  }
  // El anclaje del navegador vuelve en el siguiente cuadro, con la página ya en su sitio.
  requestAnimationFrame(() => { root.style.overflowAnchor = a.prev; });
}
