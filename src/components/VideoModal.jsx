import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { IconClose, IconExternal } from "./Icons";
import { lockScroll } from "../lib/scrollLock";

// Reproductor integrado. <video> nativo para archivos; iframe de vista previa
// para Drive y YouTube. Se monta solo al abrirse: nada se descarga antes.
export default function VideoModal({ source, title, onClose }) {
  const { t } = useLang();
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    const d = dialogRef.current;
    if (!d.open) d.showModal?.();
    const unlock = lockScroll();
    return () => {
      videoRef.current?.pause();
      unlock();
    };
  }, []);

  const close = () => {
    videoRef.current?.pause();
    onClose();
  };

  const onCancel = (e) => { e.preventDefault(); close(); };
  const onBackdrop = (e) => { if (e.target === dialogRef.current) close(); };

  return (
    <dialog ref={dialogRef} className="video-modal" aria-labelledby="video-title" onCancel={onCancel} onClick={onBackdrop}>
      <div className="video-box">
        <header className="video-head">
          <h2 id="video-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label={t("video.close")} autoFocus><IconClose /></button>
        </header>

        <div className="video-frame">
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
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setStatus("ready")}
            />
          )}
        </div>

        {source.kind === "embed" && source.external && (
          <p className="video-foot">
            {t("video.hostedOn", { provider: source.provider })}{" "}
            <a className="text-link" href={source.external} target="_blank" rel="noopener noreferrer">{t("video.openOn", { provider: source.provider })} <IconExternal /></a>
          </p>
        )}
      </div>
    </dialog>
  );
}
