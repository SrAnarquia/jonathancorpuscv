import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll } from "../lib/scrollLock";

// Pantalla completa de un elemento. Usa la API del navegador cuando existe y, si no
// (por ejemplo iPhone), un modo equivalente con CSS. Se sale con Esc, con Espacio o con el botón.
// `want` guarda la intención vigente: si la transición nativa llega tarde (p. ej. se pidió
// salir cuando la entrada aún no se había confirmado), el cambio tardío se deshace solo,
// para que el estado de la página y el del navegador nunca queden en desacuerdo.
//
// Esc en pantalla completa nativa (V6.16): el navegador se queda con la tecla y sale de pantalla completa
// sin avisar a la página, así que lo que estaba abierto encima (la ficha, el visor) seguía ahí. En Chrome y
// Edge, Keyboard Lock le devuelve a la página la pulsación corta de Esc: cierra lo de encima y, sin nada
// abierto, sale (Home.jsx); mantener Esc presionada sigue saliendo de pantalla completa. Donde no existe
// (Firefox, Safari), Esc siempre sale de pantalla completa, y `onNativeExit` cierra además lo de encima.
export function useFullscreen(ref, { onNativeExit } = {}) {
  const [active, setActive] = useState(false);
  const want = useRef(false);
  const locked = useRef(false); // Esc en manos de la página (Keyboard Lock activo)
  const lastEsc = useRef(-Infinity); // última vez que la página recibió Esc
  const nativeExit = useRef(onNativeExit);
  nativeExit.current = onNativeExit;

  // Al salir se vuelve al mismo punto de la página (V6.22). Mientras dura, el contenedor es `position: fixed` y
  // deja de ocupar su lugar: la página se acorta y el navegador recorta el desplazamiento, así que al salir la
  // página quedaba cientos de píxeles más arriba (en iPhone siempre, por el modo con CSS). Al entrar se anota
  // dónde estaba el contenedor en la ventana y, ya fuera de pantalla completa, se desplaza para que vuelva ahí
  // (también si mientras tanto se giró el celular).
  const anchor = useRef(null);
  const restoreScroll = useCallback(() => {
    const top = anchor.current;
    const el = ref.current;
    if (top == null || document.fullscreenElement) return; // la salida nativa todavía no termina
    if (el?.isConnected && getComputedStyle(el).position === "fixed") return; // aún no vuelve a su lugar
    anchor.current = null;
    if (!el?.isConnected) return;
    const delta = el.getBoundingClientRect().top - top;
    if (Math.abs(delta) >= 1) window.scrollTo(window.scrollX, window.scrollY + delta);
  }, [ref]);

  const unlockEsc = useCallback(() => {
    if (!locked.current) return;
    locked.current = false;
    try { navigator.keyboard?.unlock?.(); } catch { /* sin Keyboard Lock */ }
  }, []);

  const lockEsc = useCallback(() => {
    const kb = navigator.keyboard;
    if (!kb?.lock || !document.fullscreenElement) return;
    kb.lock(["Escape"]).then(
      () => {
        locked.current = true;
        if (!want.current || !document.fullscreenElement) unlockEsc(); // se salió mientras tanto
      },
      () => { locked.current = false; },
    );
  }, [unlockEsc]);

  const enter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (!want.current) anchor.current = el.getBoundingClientRect().top;
    want.current = true;
    setActive(true);
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).then(lockEsc, () => {});
    el.focus?.({ preventScroll: true });
  }, [ref, lockEsc]);

  const exit = useCallback(() => {
    want.current = false;
    setActive(false);
    unlockEsc();
    if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => {});
  }, [unlockEsc]);

  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement) {
        // Entrada nativa confirmada después de pedir la salida: se deshace al momento.
        if (!want.current) document.exitFullscreen?.().catch?.(() => {});
      } else {
        // Salida nativa (Esc del navegador, gesto del sistema): también es la intención.
        const byBrowser = want.current;
        const hadLock = locked.current;
        setActive(false);
        want.current = false;
        unlockEsc();
        // Si la página ya había salido (exit()), aquí termina la salida nativa: se vuelve al mismo punto.
        requestAnimationFrame(restoreScroll);
        // Sin Keyboard Lock, el Esc que sacó de pantalla completa no llegó a la página: se cierra también
        // lo que estaba abierto encima. Si la página sí recibió el Esc, ya lo atendió ella.
        if (byBrowser && !hadLock && performance.now() - lastEsc.current > 600) nativeExit.current?.();
      }
    };
    const onKey = (e) => { if (e.key === "Escape") lastEsc.current = performance.now(); };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [unlockEsc, restoreScroll]);

  // Mientras dure, la página no se desplaza (candado compartido con el reproductor de video). Al terminar,
  // con el contenedor ya de vuelta en su lugar, se recupera la posición (en la salida nativa, si el navegador
  // todavía no salió, lo hace el aviso `fullscreenchange`).
  useEffect(() => {
    if (active) return lockScroll();
    restoreScroll();
    return undefined;
  }, [active, restoreScroll]);

  return { active, enter, exit, toggle: active ? exit : enter };
}
