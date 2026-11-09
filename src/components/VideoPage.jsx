import { useEffect, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../i18n";
import { resolveVideo } from "../lib/video";
import { IconArrowL, IconExternal, IconOrbit } from "./Icons";

// Página del video de presentación (ruta /video), como en la versión original:
// el video va embebido en la propia página, sin ventana emergente. Sustituye al antiguo «Sobre mí».
export default function VideoPage() {
  const { t, profile } = useLang();
  const video = resolveVideo(profile.presentationVideo);
  const { key } = useLocation();

  // Al llegar (desde el pie, la barra o el menú, o con el mismo enlace estando ya aquí) la página sube de
  // inmediato al principio, antes de pintarse, como hacen Inicio y Proyectos con su sección (V6.13). El pie
  // es el mismo en todas las páginas: sin esto, desde abajo cambiaba la página pero seguía viéndose el pie
  // y no había señal de que algo hubiera pasado.
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [key]);

  useEffect(() => {
    const prev = document.title;
    document.title = t("doc.videoTitle");
    return () => { document.title = prev; };
  }, [t]);

  return (
    <section id="video" className="videopage" aria-labelledby="videopage-title">
      <div className="videopage-head">
        <p className="eyebrow">{t("videoPage.eyebrow")}</p>
        <h2 id="videopage-title">{t("videoPage.title")}</h2>
        <p className="videopage-sub">{t("videoPage.sub")}</p>
      </div>

      {video ? (
        <div className="videopage-player">
          <div className="video-frame">
            {video.kind === "native" ? (
              <video controls playsInline preload="metadata" poster={video.poster} src={video.src}>
                {t("video.unsupported")}
              </video>
            ) : (
              <iframe
                src={video.src}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            )}
          </div>
          {video.kind === "embed" && video.external && (
            <p className="video-foot">
              {t("video.hostedOn", { provider: video.provider })}{" "}
              <a className="text-link" href={video.external} target="_blank" rel="noopener noreferrer">{t("video.openOn", { provider: video.provider })} <IconExternal /></a>
            </p>
          )}
        </div>
      ) : (
        <p className="note">{t("videoPage.missing")}</p>
      )}

      <div className="page-actions">
        <Link className="btn btn-gold" to="/#universo"><IconOrbit /> {t("videoPage.explore")}</Link>
        {/* A /#perfil, como «Inicio» del pie y el logotipo: con «/» a secas la página principal se quedaba en
            su pie (V6.13). */}
        <Link className="btn btn-ghost" to="/#perfil"><IconArrowL /> {t("videoPage.back")}</Link>
      </div>
    </section>
  );
}
