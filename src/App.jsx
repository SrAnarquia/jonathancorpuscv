import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import TopBar from "./components/TopBar";
import Home from "./components/Home";
import VideoPage from "./components/VideoPage";
import Footer from "./components/Footer";
import VideoModal from "./components/VideoModal";
import EvidenceViewer from "./components/EvidenceViewer";
import ContactAssistant from "./components/ContactAssistant";
import { useMusic } from "./hooks/useMusic";
import { useLang } from "./i18n";

export default function App() {
  const location = useLocation();
  const { t } = useLang();
  const music = useMusic();
  const [heroVisible, setHeroVisible] = useState(true);
  const [video, setVideo] = useState(null);
  const videoReturn = useRef(null);
  const [evidence, setEvidence] = useState(null);
  const evidenceReturn = useRef(null);

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
    setVideo({ source, title });
  }, [music]);

  const closeVideo = useCallback(() => {
    setVideo(null);
    music.resume();
    requestAnimationFrame(() => videoReturn.current?.focus());
  }, [music]);

  // ---------- visor de evidencias (V6.8) ----------
  // Imágenes y videos de un proyecto, en carrusel sobre la página. La música se pausa mientras lo
  // que se ve es un video y vuelve al pasar a una imagen o al cerrar; el foco regresa al botón.
  const openEvidence = useCallback((items, start, title, trigger) => {
    evidenceReturn.current = trigger;
    setEvidence({ items, start, title });
  }, []);
  const onEvidenceItem = useCallback((item) => {
    if (item?.kind === "video") music.suspend();
    else music.resume();
  }, [music]);
  const closeEvidence = useCallback(() => {
    setEvidence(null);
    music.resume();
    requestAnimationFrame(() => evidenceReturn.current?.focus());
  }, [music]);

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
