import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import Home from "./components/Home";
import VideoPage from "./components/VideoPage";
import Footer from "./components/Footer";
import VideoModal from "./components/VideoModal";
import EvidenceViewer from "./components/EvidenceViewer";
import ContactAssistant from "./components/ContactAssistant";
import { useMusic } from "./hooks/useMusic";
import { useLang } from "./i18n";

// El visor de evidencias y el video, capa del historial (V6.24). Hasta la V6.23, con uno de ellos abierto encima
// de una ficha, Atrás cerraba la ficha de abajo y el visor seguía abierto (y el Atrás siguiente ya sacaba del
// sitio). Ahora abrirlos agrega una entrada con la misma dirección, marcada con `overlay` en su estado: Atrás
// (botón, gesto o tecla) los cierra primero y la ficha sigue como estaba; cerrarlos desde la página (X, Esc o
// tocar fuera) regresa a la entrada de la ficha, sin dejar entradas de más. Home no hace nada con esas entradas.
const onOverlayEntry = () => window.history.state?.usr?.overlay === true;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();
  const music = useMusic();
  const [heroVisible, setHeroVisible] = useState(true);
  const [video, setVideo] = useState(null);
  const videoReturn = useRef(null);
  const [evidence, setEvidence] = useState(null);
  const evidenceReturn = useRef(null);
  // Qué capa está abierta, al día en el acto (el estado de React llega un poco después).
  const overlay = useRef({ video: false, evidence: false });

  const pushOverlay = useCallback(() => {
    if (onOverlayEntry()) return;
    const usr = window.history.state?.usr;
    const { pathname, search, hash } = window.location;
    navigate(pathname + search + hash, { state: { ...(usr && typeof usr === "object" ? usr : {}), overlay: true } });
  }, [navigate]);
  // Cerrado desde la página: de vuelta a la entrada de la ficha. Si lo cerró Atrás, ya se está ahí.
  const popOverlay = useCallback(() => {
    if (onOverlayEntry()) navigate(-1);
  }, [navigate]);

  // Página propia (sin el universo): en ella la barra de navegación siempre está visible.
  const isVideoPage = location.pathname === "/video";

  // ---------- asistente de contacto ----------
  // mode: "hidden" (aún no se abre), "open" o "min" (burbuja). Cada apertura incrementa seq, que es lo
  // que lleva la página a Contacto; entry dice por dónde llegó la persona (para el saludo).
  const [assistant, setAssistant] = useState({ mode: "hidden", seq: 0, entry: null });
  const openAssistant = useCallback((source, extra) => {
    setAssistant((a) => ({ mode: "open", seq: a.seq + 1, entry: { source, ...extra } }));
  }, []);
  const minimizeAssistant = useCallback(() => setAssistant((a) => (a.mode === "open" ? { ...a, mode: "min" } : a)), []);
  const reopenAssistant = useCallback(() => openAssistant("bubble"), [openAssistant]);
  // Lo que hacen «Contacto» (barra y menú móvil), el botón de copiar correo y LinkedIn en toda la página
  // (encabezado, menú móvil y el propio Contacto): llevan a Contacto y abren el asistente. LinkedIn, en cada
  // clic (V6.19), además abre su página en otra pestaña y copia el enlace (LinkedInLink); el asistente
  // confirma la copia.
  const contact = useMemo(() => ({
    onContact: () => openAssistant("contact"),
    onCopy: (copied) => openAssistant("email", { copied }),
    onLinkedIn: (copied) => openAssistant("linkedin", { copied }),
  }), [openAssistant]);

  // ---------- reproductor (ventana) ----------
  const openVideo = useCallback((source, title, trigger) => {
    videoReturn.current = trigger;
    music.suspend();
    overlay.current.video = true;
    setVideo({ source, title });
    pushOverlay();
  }, [music, pushOverlay]);

  // `fromHistory`: lo cerró Atrás (la entrada del video ya se dejó atrás).
  const closeVideo = useCallback(({ fromHistory = false } = {}) => {
    if (!overlay.current.video) return;
    overlay.current.video = false;
    setVideo(null);
    music.resume();
    if (!fromHistory) popOverlay();
    requestAnimationFrame(() => videoReturn.current?.focus());
  }, [music, popOverlay]);

  // ---------- visor de evidencias (V6.8) ----------
  // Imágenes y videos de un proyecto, en carrusel sobre la página. La música se pausa mientras lo
  // que se ve es un video y vuelve al pasar a una imagen o al cerrar; el foco regresa al botón.
  const openEvidence = useCallback((items, start, title, trigger) => {
    evidenceReturn.current = trigger;
    overlay.current.evidence = true;
    setEvidence({ items, start, title });
    pushOverlay();
  }, [pushOverlay]);
  const onEvidenceItem = useCallback((item) => {
    if (item?.kind === "video") music.suspend();
    else music.resume();
  }, [music]);
  const closeEvidence = useCallback(({ fromHistory = false } = {}) => {
    if (!overlay.current.evidence) return;
    overlay.current.evidence = false;
    setEvidence(null);
    music.resume();
    if (!fromHistory) popOverlay();
    requestAnimationFrame(() => evidenceReturn.current?.focus());
  }, [music, popOverlay]);

  // Atrás y Adelante con el visor o el video (V6.24). Atrás desde su entrada los cierra sin volver a navegar.
  // Adelante hasta una entrada de visor que ya se cerró no tiene nada que mostrar: se regresa en el acto, para
  // que no quede un Atrás «muerto» (que no cambie nada en pantalla).
  useEffect(() => {
    const onPop = () => {
      const { video: v, evidence: ev } = overlay.current;
      if (onOverlayEntry()) {
        if (!v && !ev) window.history.back();
        return;
      }
      if (ev) closeEvidence({ fromHistory: true });
      if (v) closeVideo({ fromHistory: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [closeEvidence, closeVideo]);

  // Recargar con el visor abierto deja la página en la entrada del visor, sin visor: se regresa a la de la ficha.
  const checkedReload = useRef(false);
  useEffect(() => {
    if (checkedReload.current) return;
    checkedReload.current = true;
    if (onOverlayEntry()) window.history.back();
  }, []);

  // En la página del video la música de fondo se pausa (como en el reproductor) y se reanuda al salir.
  const { suspend, resume } = music;
  useEffect(() => {
    if (!isVideoPage) return undefined;
    suspend();
    return resume;
  }, [isVideoPage, suspend, resume]);

  return (
    <>
      <a className="skip" href="#contenido">{t("nav.skip")}</a>
      <TopBar visible={isVideoPage || !heroVisible} music={music} contact={contact} />

      <Routes>
        <Route path="/video" element={<main id="contenido" className="page-plain page-video"><VideoPage /></main>} />
        {/* «Sobre mí» se quitó (el video lo cubre); la ruta antigua lleva al video. */}
        <Route path="/sobremi" element={<Navigate to="/video" replace />} />
        <Route path="*" element={<Home music={music} videoOpen={!!video || !!evidence} onOpenVideo={openVideo} onOpenEvidence={openEvidence} onHeroVisible={setHeroVisible} contact={contact} assistantOpen={assistant.mode === "open"} />} />
      </Routes>

      <Footer contact={contact} />

      <ContactAssistant mode={assistant.mode} seq={assistant.seq} entry={assistant.entry} onOpen={reopenAssistant} onMinimize={minimizeAssistant} />

      {video && <VideoModal source={video.source} title={video.title} onClose={closeVideo} />}
      {evidence && <EvidenceViewer items={evidence.items} start={evidence.start} title={evidence.title} onClose={closeEvidence} onItemChange={onEvidenceItem} />}

      <audio ref={music.audioRef} src="/musica.mp3" loop preload="none" />
    </>
  );
}
