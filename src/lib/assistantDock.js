// Cálculos de la burbuja y del panel del asistente respecto a la página (sin React).

// Elige cuánto subir la burbuja para que no tape un control: la menor elevación (0 = su sitio)
// con la que no se monta sobre ningún obstáculo, dejando `gap` px de aire. Devuelve null si no
// hay sitio libre sin subir más de `max` (entonces la burbuja se aparta hasta que haya sitio).
// `spot` y cada obstáculo son rectángulos { left, right, top, bottom } en coordenadas de la ventana.
export function pickLift(spot, obstacles, { gap = 10, max = 240 } = {}) {
  const near = obstacles.filter((r) => r.left < spot.right + gap && r.right > spot.left - gap);
  const clear = (lift) => near.every((r) => r.bottom <= spot.top - lift - gap || r.top >= spot.bottom - lift + gap);
  const options = [0, ...near.map((r) => spot.bottom - r.top + gap)]
    .filter((l) => l >= 0 && l <= max)
    .sort((a, b) => a - b);
  for (const lift of options) if (clear(lift)) return Math.round(lift);
  return null;
}

// La burbuja se puede arrastrar (V6.6). Al soltarla se pega al lado más cercano de la ventana, como las
// burbujas de chat, a la altura donde se soltó y sin salirse de los márgenes: `margins.x` a los lados,
// `margins.top` bajo la barra y `margins.bottom` sobre el borde inferior. `x`, `y` son la esquina superior
// izquierda al soltar. Devuelve dónde queda y `frac`, su altura como fracción del recorrido posible, que es
// lo que se guarda: así se recoloca igual aunque cambie el alto de la ventana.
export function snapBubble({ x, y, size, width, height, margins }) {
  const side = x + size / 2 < width / 2 ? "left" : "right";
  const range = Math.max(0, height - size - margins.top - margins.bottom);
  const top = margins.top + Math.min(Math.max(y - margins.top, 0), range);
  return { side, left: side === "left" ? margins.x : width - size - margins.x, top, frac: range ? (top - margins.top) / range : 0 };
}

// Dónde va la burbuja guardada ({ side, frac }) en una ventana de `width` × `height`.
export function bubblePlacement({ side, frac }, { size, width, height, margins }) {
  const range = Math.max(0, height - size - margins.top - margins.bottom);
  return { left: side === "left" ? margins.x : width - size - margins.x, top: Math.round(margins.top + Math.min(Math.max(frac, 0), 1) * range) };
}

// Espacio que ocupa el teclado del móvil en la parte baja de la ventana (API VisualViewport).
// Solo cuenta mientras se escribe y sin zoom de pellizco; por debajo de 60 px se toma como 0
// (barras del navegador que aparecen y desaparecen, no un teclado).
export function keyboardInset(vv, innerHeight, typing) {
  if (!vv || !typing || Math.abs((vv.scale || 1) - 1) > 0.01) return { inset: 0, height: innerHeight };
  const inset = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
  return inset < 60 ? { inset: 0, height: innerHeight } : { inset, height: Math.round(vv.height) };
}

// Llama a `done` cuando la página deja de desplazarse, también si no llegó a moverse. Se decide por
// cuadros y no por reloj: hacen falta `frames` cuadros seguidos y al menos `idle` ms sin que cambie la
// posición. En un equipo lento (o mientras arranca el 3D) los cuadros llegan espaciados y un
// desplazamiento suave sigue a medio camino aunque pase el tiempo: un temporizador lo daba por
// terminado antes de llegar; contar cuadros quietos no se deja engañar. Donde existe «scrollend»
// (Chrome, Firefox) basta con el aviso del navegador más dos cuadros quietos. `max` es solo una red
// de seguridad, muy por encima de lo que dura un desplazamiento suave. Devuelve una función para cancelarlo.
export function onScrollSettled(done, { frames = 6, idle = 140, max = 8000, win = globalThis.window, now = () => performance.now() } = {}) {
  let finished = false;
  let raf = 0;
  let still = 0;
  let ended = false;
  let lastY = win.scrollY;
  let lastMove = now();
  const finish = () => {
    if (finished) return;
    finished = true;
    cancel();
    done();
  };
  const tick = () => {
    const y = win.scrollY;
    if (Math.abs(y - lastY) > 0.5) {
      lastY = y;
      lastMove = now();
      still = 0;
      ended = false; // el aviso era de un desplazamiento anterior: sigue moviéndose
    } else {
      still++;
    }
    if ((ended && still >= 2) || (still >= frames && now() - lastMove >= idle)) return finish();
    raf = win.requestAnimationFrame(tick);
  };
  const onEnd = () => { ended = true; };
  const maxTimer = win.setTimeout(finish, max);
  raf = win.requestAnimationFrame(tick);
  if ("onscrollend" in win) win.addEventListener("scrollend", onEnd);
  function cancel() {
    win.cancelAnimationFrame(raf);
    win.clearTimeout(maxTimer);
    win.removeEventListener("scrollend", onEnd);
  }
  return () => { finished = true; cancel(); };
}
