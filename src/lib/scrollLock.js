// Bloqueo del desplazamiento de la página, compartido. La pantalla completa del universo y el
// reproductor de video lo piden por separado y pueden cerrarse en cualquier orden (p. ej. Esc sale
// de la pantalla completa con el video todavía abierto): la página se libera cuando ya nadie lo pide.
// Cada llamada devuelve su propia liberación; llamarla dos veces no descuenta de más.
let holders = 0;
let saved = "";

export function lockScroll(body = typeof document !== "undefined" ? document.body : null) {
  if (!body) return () => {};
  if (holders++ === 0) {
    saved = body.style.overflow;
    body.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--holders === 0) body.style.overflow = saved;
  };
}
