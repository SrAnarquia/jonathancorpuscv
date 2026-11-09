import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { IconArrowL, IconArrowR, IconClose, IconExternal } from "./Icons";
import { lockScroll } from "../lib/scrollLock";
import ModelView from "./ModelView";

// Visor de evidencias de un proyecto (V6.8): imágenes, videos y, desde la V6.16, modelos 3D en un
// carrusel sobre la página.
// Se abre desde «Ver imágenes» o «Ver video» de la ficha. Solo se monta lo que se está viendo
// (una imagen o un video), así que nada se descarga antes de abrirlo y un video deja de sonar
// al pasar al siguiente. Se navega con las flechas, con ← →, deslizando con el dedo o el ratón;
// Escape, la X o tocar fuera cierran, y App devuelve el foco al botón que lo abrió.
export default function EvidenceViewer({ items, start = 0, title, onClose, onItemChange }) {
  const { t } = useLang();
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const swipe = useRef(null);
  const n = items.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(start, 0), n - 1));
  const [status, setStatus] = useState("loading"); // loading | ready | error (solo videos)
  const item = items[index];
  // El aviso a App se da una vez por elemento, no cada vez que App se vuelve a pintar (pausar la música
  // dos veces seguidas haría que no volviera al cerrar).
  const onItemChangeRef = useRef(onItemChange);
  onItemChangeRef.current = onItemChange;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d.open) d.showModal?.();
    const unlock = lockScroll();
    return () => {
      videoRef.current?.pause();
      unlock();
    };
  }, []);

  // Al cambiar de elemento se avisa a App (la música se pausa mientras se ve un video).
  useEffect(() => { onItemChangeRef.current?.(item); }, [item]);

  // Las imágenes vecinas se precargan para que las flechas respondan al instante.
  useEffect(() => {
    if (n < 2) return;
    for (const j of [index + 1, index - 1]) {
      const it = items[(j + n) % n];
      if (it.kind === "image") { const im = new Image(); im.src = it.src; }
    }
  }, [index, items, n]);

  const go = (d) => {
    if (n < 2) return;
    videoRef.current?.pause();
    setStatus("loading");
    setIndex((i) => (i + d + n) % n);
  };

  const close = () => {
    videoRef.current?.pause();
    onClose();
  };

  const onCancel = (e) => { e.preventDefault(); close(); };
  const onBackdrop = (e) => { if (e.target === dialogRef.current) close(); };
  const onKey = (e) => {
    if (e.target.tagName === "VIDEO") return; // en un video nativo las flechas adelantan y atrasan
    if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); go(-1); }
  };

  // Deslizar: un gesto horizontal de 40 px o más pasa de evidencia (dedo o ratón).
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };
  const onPointerCancel = () => { swipe.current = null; };

  const source = item.kind === "video" ? item.source : null;
  const caption = item.caption;

  return (
    <dialog ref={dialogRef} className="video-modal evidence-modal" aria-labelledby="evidence-title" onCancel={onCancel} onClick={onBackdrop} onKeyDown={onKey}>
      <div className="video-box evidence-box">
        <header className="video-head evidence-head">
          <h2 id="evidence-title">{title}</h2>
          {n > 1 && (
            <span className="evidence-count" aria-live="polite">
              <span className="sr-only">{t("evidence.position", { i: index + 1, n })}</span>
              <span aria-hidden="true">{index + 1} / {n}</span>
            </span>
          )}
          <button type="button" className="icon-btn" onClick={close} aria-label={t("evidence.close")} autoFocus><IconClose /></button>
        </header>

        <div className="evidence-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
          {n > 1 && (
            <button type="button" className="icon-btn evidence-arrow is-prev" onClick={() => go(-1)} aria-label={t("evidence.prev")}><IconArrowL /></button>
          )}
          <div className="evidence-view">
            {item.kind === "image" ? (
              <figure className="evidence-frame" key={`i${index}`}>
                <img src={item.src} alt={item.alt} decoding="async" draggable="false" />
              </figure>
            ) : item.kind === "model" ? (
              <ModelView item={item} key={`m${index}`} />
            ) : (
              <div className="video-frame" key={`v${index}`}>
                {status === "loading" && <p className="video-status" role="status">{t("video.loading")}</p>}
                {status === "error" && (
                  <div className="video-status is-error" role="alert">
                    <p>{t("video.error")}</p>
                    {source.external && <a className="text-link" href={source.external} target="_blank" rel="noopener noreferrer">{t("video.openDirect")} <IconExternal /></a>}
                  </div>
                )}
                {source.kind === "native" ? (
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    poster={source.poster}
                    onLoadedMetadata={() => setStatus("ready")}
                    onCanPlay={() => setStatus("ready")}
                    onError={() => setStatus("error")}
                    hidden={status === "error"}
                    src={source.src}
                  >
                    {t("video.unsupported")}
                  </video>
                ) : (
                  <iframe
                    src={source.src}
                    title={source.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => setStatus("ready")}
                  />
                )}
              </div>
            )}
          </div>
          {n > 1 && (
            <button type="button" className="icon-btn evidence-arrow is-next" onClick={() => go(1)} aria-label={t("evidence.next")}><IconArrowR /></button>
          )}
        </div>

        {caption && <p className="evidence-caption">{caption}</p>}
        {source?.kind === "embed" && source.external && (
          <p className="video-foot">
            {t("video.hostedOn", { provider: source.provider })}{" "}
            <a className="text-link" href={source.external} target="_blank" rel="noopener noreferrer">{t("video.openOn", { provider: source.provider })} <IconExternal /></a>
          </p>
        )}
      </div>
    </dialog>
  );
}
