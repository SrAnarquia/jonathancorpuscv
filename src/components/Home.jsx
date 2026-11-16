import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useLang } from "../i18n";
import Hero from "./Hero";
import Universe from "./Universe";
import ProjectPanel from "./ProjectPanel";
import { PROJECTS, SHIP_ID } from "../data/projects";
import { hasWebGL } from "../lib/webgl";
import { useMedia, useReducedMotion } from "../hooks/useMedia";
import { useFullscreen } from "../hooks/useFullscreen";

const ORDER = [...PROJECTS.map((p) => p.id), SHIP_ID];
const sheetPath = (id) => (id === SHIP_ID ? "/nave" : `/proyecto/${id}`);
const isSheetPath = (path) => path === "/nave" || /^\/proyecto\/[\w-]+/.test(path);

// Atrás con la ficha abierta (V6.23). Hasta la V6.22 abrir la ficha reemplazaba la entrada del historial, así que
// Atrás (botón o gesto) sacaba del portafolio. Ahora la ficha y la pantalla completa son «capas»: abrir la primera
// crea una entrada propia, marcada con `layer` en su estado; cambiar de planeta o abrir la otra capa la reemplaza
// (un solo Atrás basta, se hayan visto los planetas que sea), y cerrar la última desde la página regresa a la
// entrada de antes, sin dejar entradas repetidas. Atrás hasta una entrada sin capas cierra la ficha y sale de la
// pantalla completa. Se lee del historial mismo (lo que React Router guarda en history.state), que está al día
// en el acto, aunque React todavía no haya vuelto a pintar.
const onLayerEntry = () => window.history.state?.usr?.layer === true;

// Página principal: encabezado profesional + universo 3D + ficha del planeta elegido.
export default function Home({ music, videoOpen, onOpenVideo, onOpenEvidence, onHeroVisible, contact, assistantOpen }) {
  const { projects, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
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
  // `push`: entrada nueva (abrir la primera capa). Si no, se reemplaza la actual, que conserva su marca de capa.
  const go = useCallback((path, { push = false } = {}) => {
    pending.current = pending.current.filter((p) => Date.now() - p.at < 4000);
    pending.current.push({ path, at: Date.now() });
    navigate(path, { replace: !push, state: push || onLayerEntry() ? { layer: true } : null });
  }, [navigate]);

  // Abrir la primera capa. La entrada de abajo deja de restaurar el desplazamiento por su cuenta: al volver a
  // ella (con Atrás o al cerrar) la página se queda donde está, en vez de brincar a donde estaba al abrir.
  const openLayer = useCallback((path) => {
    if (onLayerEntry()) { go(path); return; }
    try { window.history.scrollRestoration = "manual"; } catch { /* sin soporte */ }
    go(path, { push: true });
  }, [go]);

  // Ya no queda ninguna capa: de vuelta a la entrada de antes. Si no hay una del sitio (se llegó por un enlace
  // directo a la ficha), solo cambia la dirección.
  const closeLayers = useCallback(() => {
    if (onLayerEntry()) navigate(-1);
    else if (isSheetPath(window.location.pathname)) go("/");
  }, [go, navigate]);

  // La ficha se cerró desde la página: la dirección deja de ser la de la ficha. Si sigue la pantalla completa,
  // en la misma entrada.
  const leaveSheet = useCallback(() => {
    if (latest.current.fsActive) go("/");
    else closeLayers();
  }, [go, closeLayers]);

  // `fromUrl`: la dirección ya es la de la ficha (enlace directo, Atrás o Adelante); no se navega.
  const select = useCallback((id, { fromUrl = false } = {}) => {
    const { panelOpen: open, fsActive } = latest.current;
    setSelectedId(id);
    setPanelOpen(true);
    if (fromUrl) return;
    if (!open && !fsActive) openLayer(sheetPath(id));
    else go(sheetPath(id));
  }, [go, openLayer]);

  const focusReturn = useRef(null);
  const closePanel = useCallback(() => {
    focusReturn.current = selectedId;
    setPanelOpen(false);
    setTour(false);
    // La nave sin su ficha desorienta (el principito queda a bordo sin explicación):
    // cerrar la ficha de la nave devuelve la cámara al centro.
    if (selectedId === SHIP_ID) setSelectedId(null);
    leaveSheet();
  }, [selectedId, leaveSheet]);

  // Al cerrar la ficha, el foco vuelve al botón del planeta (o a su tarjeta en la vista de lista).
  useLayoutEffect(() => {
    if (panelOpen || !focusReturn.current) return;
    const id = focusReturn.current;
    focusReturn.current = null;
    (document.querySelector(`[data-planet="${id}"]`) || document.querySelector(".pcard.is-active"))?.focus();
  }, [panelOpen]);

  const center = useCallback(() => {
    const hadSheet = latest.current.panelOpen;
    setSelectedId(null);
    setPanelOpen(false);
    setTour(false);
    if (hadSheet) leaveSheet();
    else if (isSheetPath(window.location.pathname)) go("/");
  }, [go, leaveSheet]);

  // Pantalla completa automática: la primera interacción directa con el lienzo 3D
  // (tocar, hacer clic o arrastrar) entra en pantalla completa, en móvil y en escritorio.
  // Si el navegador no permite la API nativa, `enter` usa el modo equivalente con CSS,
  // y salir siempre queda a un gesto (X, Esc, Espacio o atrás). Cuando la persona sale,
  // no se vuelve a entrar solo en toda la visita: su salida es una decisión.
  // Desde la V6.23 la pantalla completa también es una capa: Atrás sale de ella (en el iPhone, el gesto de
  // volver ya no saca del sitio).
  const enterFs = useCallback(() => {
    if (!latest.current.panelOpen && !latest.current.fsActive) openLayer(window.location.pathname);
    fs.enter();
  }, [fs, openLayer]);
  const autoFsBlocked = useRef(false);
  const engageCanvas = useCallback(() => {
    if (autoFsBlocked.current || latest.current.fsActive) return;
    enterFs();
  }, [enterFs]);

  // Al salir de pantalla completa: se bloquea la entrada automática y, en pantallas
  // táctiles, la ficha abierta se cierra (fuera de pantalla completa taparía el lienzo reducido).
  // Sin ninguna capa abierta, se vuelve a la entrada de antes.
  const prevFs = useRef(fs.active);
  useEffect(() => {
    const was = prevFs.current;
    prevFs.current = fs.active;
    if (!was || fs.active) return;
    autoFsBlocked.current = true;
    if (coarse && latest.current.panelOpen) closePanel();
    else if (!latest.current.panelOpen) closeLayers();
  }, [fs.active, coarse, closePanel, closeLayers]);

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

  // Rutas de entrada y enlaces internos: /proyecto/<id>, /nave (abre la nave) y /#sección. También Atrás y
  // Adelante (`pop`): la ficha sigue a la dirección y, sin capa, se sale de la pantalla completa (V6.23).
  const mounted = useRef(false);
  useEffect(() => {
    const path = location.pathname;
    const pop = mounted.current && navType === "POP";
    mounted.current = true;
    // Eco de una navegación propia (ver `go`): ya está reflejada en el estado. Atrás y Adelante nunca lo son.
    if (!location.hash && !pop) {
      const i = pending.current.findIndex((p) => p.path === path);
      if (i >= 0) { pending.current = pending.current.slice(i + 1); return; }
    }
    if (pop && location.state?.layer !== true) {
      // De vuelta en una entrada sin capas: la página vuelve a restaurar su desplazamiento como siempre.
      try { window.history.scrollRestoration = "auto"; } catch { /* sin soporte */ }
      if (latest.current.fsActive) fs.exit();
    }
    const jump = (hash) => (document.fonts?.ready || Promise.resolve()).then(() => document.querySelector(hash)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
    const m = path.match(/^\/proyecto\/([\w-]+)/);
    const wanted = m ? (ORDER.includes(m[1]) ? m[1] : null) : path === "/nave" ? SHIP_ID : null;
    if (wanted) {
      if (wanted !== latest.current.selectedId || !latest.current.panelOpen) {
        select(wanted, { fromUrl: true });
        if (!pop) jump("#universo");
      }
    } else {
      // Navegación a otra sección del sitio, o Atrás con la ficha abierta: la ficha se cierra (y la nave se
      // suelta: nunca queda enfocada sin su ficha).
      if (latest.current.panelOpen) {
        setPanelOpen(false); setTour(false);
        if (latest.current.selectedId === SHIP_ID) setSelectedId(null);
      }
      if (location.hash && !pop) jump(location.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash, location.key]);

  // En pantallas donde la ficha es una hoja inferior fija (< 960 px), abrir el asistente la cierra:
  // los dos ocuparían el mismo sitio. Sin devolver el foco al planeta (eso movería la página).
  useEffect(() => {
    if (!assistantOpen || !latest.current.panelOpen || window.matchMedia("(min-width: 960px)").matches) return;
    setPanelOpen(false);
    setTour(false);
    if (latest.current.selectedId === SHIP_ID) setSelectedId(null);
    leaveSheet();
  }, [assistantOpen, leaveSheet]);

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
          onToggleFullscreen={fs.active ? fs.exit : enterFs}
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
