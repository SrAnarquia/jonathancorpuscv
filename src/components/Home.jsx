import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../i18n";
import Hero from "./Hero";
import Universe from "./Universe";
import ProjectPanel from "./ProjectPanel";
import { PROJECTS, SHIP_ID } from "../data/projects";
import { hasWebGL } from "../lib/webgl";
import { useMedia, useReducedMotion } from "../hooks/useMedia";
import { useFullscreen } from "../hooks/useFullscreen";

const ORDER = [...PROJECTS.map((p) => p.id), SHIP_ID];

// Página principal: encabezado profesional + universo 3D + ficha del planeta elegido.
export default function Home({ music, videoOpen, onOpenVideo, onOpenEvidence, onHeroVisible, contact, assistantOpen }) {
  const { projects, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const coarse = useMedia("(pointer: coarse)");
  const webglOk = useMemo(() => hasWebGL(), []);
  const wrapRef = useRef(null);
  const nativeExit = useRef(null);
  const fs = useFullscreen(wrapRef, { onNativeExit: () => nativeExit.current?.() });

  const [selectedId, setSelectedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tour, setTour] = useState(false);
  const [view, setView] = useState(webglOk ? "3d" : "list");
  const latest = useRef({});
  latest.current = { selectedId, panelOpen, fsActive: fs.active };

  useEffect(() => { document.title = t("doc.title"); }, [t]);


  const scrollTo = useCallback((hash) => {
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [reducedMotion]);

  // La URL sigue al estado (no al revés). React Router aplica la navegación con retraso, así que
  // se recuerdan las rutas propias pendientes para no tratar su eco como si fuera un enlace externo
  // (de lo contrario una ficha cerrada con Esc podía reabrirse sola).
  const pending = useRef([]);
  const go = useCallback((path) => {
    pending.current = pending.current.filter((p) => Date.now() - p.at < 4000);
    pending.current.push({ path, at: Date.now() });
    navigate(path, { replace: true });
  }, [navigate]);

  const select = useCallback((id) => {
    setSelectedId(id);
    setPanelOpen(true);
    go(id === SHIP_ID ? "/nave" : `/proyecto/${id}`);
  }, [go]);

  const focusReturn = useRef(null);
  const closePanel = useCallback(() => {
    focusReturn.current = selectedId;
    setPanelOpen(false);
    setTour(false);
    // La nave sin su ficha desorienta (el principito queda a bordo sin explicación):
    // cerrar la ficha de la nave devuelve la cámara al centro.
    if (selectedId === SHIP_ID) { setSelectedId(null); go("/"); }
  }, [selectedId, go]);

  // Al cerrar la ficha, el foco vuelve al botón del planeta (o a su tarjeta en la vista de lista).
  useLayoutEffect(() => {
    if (panelOpen || !focusReturn.current) return;
    const id = focusReturn.current;
    focusReturn.current = null;
    (document.querySelector(`[data-planet="${id}"]`) || document.querySelector(".pcard.is-active"))?.focus();
  }, [panelOpen]);

  const center = useCallback(() => {
    setSelectedId(null);
    setPanelOpen(false);
    setTour(false);
    go("/");
  }, [go]);

  // Pantalla completa automática: la primera interacción directa con el lienzo 3D
  // (tocar, hacer clic o arrastrar) entra en pantalla completa, en móvil y en escritorio.
  // Si el navegador no permite la API nativa, `enter` usa el modo equivalente con CSS,
  // y salir siempre queda a un gesto (X, Esc, Espacio o atrás). Cuando la persona sale,
  // no se vuelve a entrar solo en toda la visita: su salida es una decisión.
  const autoFsBlocked = useRef(false);
  const engageCanvas = useCallback(() => {
    if (autoFsBlocked.current || latest.current.fsActive) return;
    fs.enter();
  }, [fs]);

  // Al salir de pantalla completa: se bloquea la entrada automática y, en pantallas
  // táctiles, la ficha abierta se cierra (fuera de pantalla completa taparía el lienzo reducido).
  const prevFs = useRef(fs.active);
  useEffect(() => {
    const was = prevFs.current;
    prevFs.current = fs.active;
    if (was && !fs.active) {
      autoFsBlocked.current = true;
      if (coarse && latest.current.panelOpen) closePanel();
    }
  }, [fs.active, coarse, closePanel]);

  const step = useCallback((dir) => {
    const i = ORDER.indexOf(selectedId);
    const next = ORDER[Math.max(0, Math.min(ORDER.length - 1, (i < 0 ? (dir > 0 ? -1 : 1) : i) + dir))];
    select(next);
  }, [selectedId, select]);

  const startTour = () => {
    if (tour) { setTour(false); return; }
    setTour(true);
    select(ORDER[0]);
  };

  // Rutas de entrada y enlaces internos: /proyecto/<id>, /nave (abre la nave) y /#sección.
  useEffect(() => {
    const path = location.pathname;
    // Eco de una navegación propia (ver `go`): ya está reflejada en el estado.
    if (!location.hash) {
      const i = pending.current.findIndex((p) => p.path === path);
      if (i >= 0) { pending.current = pending.current.slice(i + 1); return; }
    }
    const jump = (hash) => (document.fonts?.ready || Promise.resolve()).then(() => document.querySelector(hash)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
    const m = path.match(/^\/proyecto\/([\w-]+)/);
    const wanted = m ? (ORDER.includes(m[1]) ? m[1] : null) : path === "/nave" ? SHIP_ID : null;
    if (wanted) {
      if (wanted !== latest.current.selectedId || !latest.current.panelOpen) { select(wanted); jump("#universo"); }
    } else {
      // Navegación a otra sección del sitio: la ficha abierta se cierra para no tapar el contenido
      // (y la nave se suelta: nunca queda enfocada sin su ficha).
      if (latest.current.panelOpen) {
        setPanelOpen(false); setTour(false);
        if (latest.current.selectedId === SHIP_ID) setSelectedId(null);
      }
      if (location.hash) jump(location.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash, location.key]);

  // En pantallas donde la ficha es una hoja inferior fija (< 960 px), abrir el asistente la cierra:
  // los dos ocuparían el mismo sitio. Sin devolver el foco al planeta (eso movería la página).
  useEffect(() => {
    if (!assistantOpen || !latest.current.panelOpen || window.matchMedia("(min-width: 960px)").matches) return;
    setPanelOpen(false);
    setTour(false);
    if (latest.current.selectedId === SHIP_ID) { setSelectedId(null); go("/"); }
  }, [assistantOpen, go]);

  // Escape cierra lo que esté abierto encima, de arriba abajo (V6.16), también en pantalla completa y sin
  // salir de ella: el visor o el video (los cierra su propio diálogo), después la ficha, esté donde esté el
  // foco. Sin nada abierto, sale de pantalla completa o devuelve la cámara al centro. Mantener Esc presionada
  // (repeticiones) no encadena cierres: en Chrome eso es salir de pantalla completa.
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.repeat || videoOpen || document.querySelector("dialog[open]")) return;
      if (panelOpen) { e.preventDefault(); closePanel(); return; }
      if (fs.active) fs.exit();
      else if (selectedId) center();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [panelOpen, videoOpen, selectedId, center, fs, closePanel]);

  // El navegador salió de pantalla completa con su propio Esc sin dárselo a la página (Firefox, Safari):
  // se cierra también lo de encima, que es lo que se pedía. En pantallas táctiles esa salida es un gesto
  // del sistema, no Esc, y ya tiene su regla (abajo).
  nativeExit.current = () => {
    if (coarse) return;
    const dialog = document.querySelector("dialog[open]");
    if (dialog) dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    else if (latest.current.panelOpen) closePanel();
  };

  // Espacio sale de pantalla completa, esté donde esté el foco (salvo en campos, video o el reproductor).
  // El keyup siguiente se descarta para que un botón enfocado no se active al soltar la tecla.
  useEffect(() => {
    if (!fs.active) return;
    const skip = (el) => el.closest?.("input, textarea, select, video, dialog") || el.isContentEditable;
    const onDown = (e) => {
      if (e.key !== " " || videoOpen || skip(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      window.addEventListener("keyup", (up) => { if (up.key === " ") { up.preventDefault(); up.stopPropagation(); } }, { capture: true, once: true });
      fs.exit();
    };
    window.addEventListener("keydown", onDown, true);
    return () => window.removeEventListener("keydown", onDown, true);
  }, [fs, videoOpen]);

  // Teclado: ← → recorren los planetas cuando el foco está en el universo o en la ficha.
  const onKeyDown = (e) => {
    if (videoOpen) return;
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "VIDEO") return;
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  const index = ORDER.indexOf(selectedId);
  const isShip = selectedId === SHIP_ID;
  const item = isShip ? null : projects.find((p) => p.id === selectedId);

  return (
    <main id="contenido">
      <Hero music={music} contact={contact} onVisible={onHeroVisible} onExplore={(e) => { e.preventDefault(); scrollTo("#universo"); }} />

      <div ref={wrapRef} className={"universe-wrap" + (fs.active ? " is-fullscreen" : "") + (view === "3d" && webglOk ? " is-3d" : "") + (panelOpen && (isShip || item) ? " has-sheet" : "")} onKeyDown={onKeyDown} tabIndex={-1}>
        <Universe
          projects={projects}
          shipId={SHIP_ID}
          selectedId={selectedId}
          panelOpen={panelOpen}
          view={view}
          webglOk={webglOk}
          tour={tour}
          reducedMotion={reducedMotion}
          coarse={coarse}
          fullscreen={fs.active}
          paused={videoOpen}
          onSelect={select}
          onCenter={center}
          onStartTour={startTour}
          onToggleView={() => setView((v) => (v === "3d" ? "list" : "3d"))}
          onToggleFullscreen={fs.toggle}
          onEngage={engageCanvas}
        />

        {panelOpen && (isShip || item) && (
          <ProjectPanel
            item={item}
            isShip={isShip}
            index={index}
            total={ORDER.length}
            tour={tour}
            onClose={closePanel}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onOpenVideo={onOpenVideo}
            onOpenEvidence={onOpenEvidence}
            compact={coarse}
          />
        )}
      </div>
    </main>
  );
}
