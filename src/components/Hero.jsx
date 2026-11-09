import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { CvButtons, EmailCopy, ExtraLinks, LinkedInLink } from "./ContactActions";
import { LangToggle, MusicControl } from "./Controls";
import { IconOrbit, IconPlay } from "./Icons";

// Capa profesional: todo en HTML real, visible sin interacción.
export default function Hero({ onExplore, onVisible, music, contact }) {
  const { t, profile } = useLang();
  const ref = useRef(null);

  // Avisa cuando el encabezado sale de la pantalla para mostrar la barra de navegación.
  useEffect(() => {
    const el = ref.current;
    if (!el || !onVisible) return;
    const io = new IntersectionObserver(([e]) => onVisible(e.isIntersecting), { rootMargin: "-120px 0px 0px 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [onVisible]);

  return (
    <section id="perfil" ref={ref} className="hero" aria-labelledby="hero-name">
      <div className="hero-tools">
        <LangToggle />
        <MusicControl music={music} />
      </div>

      <div className="hero-copy">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 id="hero-name">{profile.name}</h1>
        <p className="hero-title">
          {profile.title}
          {profile.roles.map((r) => <span key={r}> · {r}</span>)}
        </p>
        <p className="hero-value">{profile.valueProp}</p>

        <ul className="facts" aria-label={t("hero.experience")}>
          {profile.highlights.map((h) => <li key={h}>{h}</li>)}
        </ul>

        {/* Correo · LinkedIn · Video de presentación. Copiar el correo y LinkedIn llevan a Contacto y abren el
            asistente; LinkedIn además abre su página en otra pestaña y copia su enlace. */}
        <div className="hero-contact">
          <EmailCopy onAssistant={contact?.onCopy} />
          <LinkedInLink onAssistant={contact?.onLinkedIn} />
          <Link className="text-link hero-video" to="/video"><IconPlay /> {t("hero.video")}</Link>
          <ExtraLinks />
        </div>

        {/* Una sola fila: «Explorar» y los dos CV (si no caben, los CV bajan juntos). */}
        <div className="hero-actions">
          <a className="btn btn-gold btn-lg" href="#universo" onClick={onExplore}>
            <IconOrbit /> {t("hero.explore")}
          </a>
          <div className="hero-cv">
            <CvButtons variants={["secondary", "secondary"]} />
          </div>
        </div>
      </div>

      <figure className="hero-art" aria-hidden="true">
        <svg viewBox="0 0 420 380" role="presentation">
          <defs>
            <radialGradient id="hp" cx="38%" cy="32%" r="70%">
              <stop offset="0" stopColor="#f6e2b8" />
              <stop offset="1" stopColor="#d9a86a" />
            </radialGradient>
            <radialGradient id="hs" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#f2c86a" stopOpacity=".55" />
              <stop offset="1" stopColor="#f2c86a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="210" cy="226" r="150" fill="url(#hs)" />
          <ellipse cx="210" cy="232" rx="196" ry="58" fill="none" stroke="#1f2a44" strokeOpacity=".22" strokeDasharray="2 7" transform="rotate(-12 210 232)" />
          <ellipse cx="210" cy="232" rx="150" ry="40" fill="none" stroke="#b9822a" strokeOpacity=".45" transform="rotate(-12 210 232)" />
          <circle cx="352" cy="190" r="13" fill="#7fb4d8" />
          <circle cx="74" cy="282" r="9" fill="#e98a76" />
          {/* asteroide */}
          <circle cx="210" cy="250" r="92" fill="url(#hp)" stroke="#1f2a44" strokeWidth="2.5" />
          <path d="M150 230c14-8 30-6 40 4M232 290c16-4 28 2 34 12M240 210c8 6 20 6 26 0" fill="none" stroke="#1f2a44" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" />
          {/* volcán */}
          <path d="M266 170 l14 -22 h14 l14 22z" fill="#c9786a" stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" transform="rotate(28 286 160)" />
          {/* rosa */}
          <g transform="translate(150 166) rotate(-22)">
            <path d="M0 0 v-34" stroke="#4f7d5c" strokeWidth="2.5" />
            <path d="M0 -16 q-10 -4 -14 4 q10 2 14 -4z" fill="#6f9e78" />
            <circle cx="0" cy="-40" r="8" fill="#c9455a" />
            <path d="M-8 -40 q8 -12 16 0" fill="#a83246" />
          </g>
          {/* principito */}
          <g transform="translate(210 160)">
            <path d="M-4 -6 q30 -12 52 -2 q-22 4 -46 12z" fill="#f2c84b" stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" />
            <path d="M-14 0 h28 l6 34 h-40z" fill="#4f8a6a" stroke="#1f2a44" strokeWidth="2.2" strokeLinejoin="round" />
            <rect x="-13" y="34" width="10" height="10" rx="3" fill="#efe6d8" stroke="#1f2a44" strokeWidth="2" />
            <rect x="3" y="34" width="10" height="10" rx="3" fill="#efe6d8" stroke="#1f2a44" strokeWidth="2" />
            <circle cx="0" cy="-18" r="13" fill="#f6dcc0" stroke="#1f2a44" strokeWidth="2.2" />
            <path d="M-13 -20 l-3 -12 l7 5 l4 -10 l5 8 l5 -8 l4 10 l7 -5 l-3 12 q-13 -9 -26 0z" fill="#f0c35a" stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" />
          </g>
          {/* estrellas */}
          {[[48, 60, 5], [372, 70, 6], [320, 30, 3.5], [96, 150, 3], [392, 300, 4], [26, 200, 3]].map(([x, y, s]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y - s * 2} L${x + s * 0.5} ${y - s * 0.5} L${x + s * 2} ${y} L${x + s * 0.5} ${y + s * 0.5} L${x} ${y + s * 2} L${x - s * 0.5} ${y + s * 0.5} L${x - s * 2} ${y} L${x - s * 0.5} ${y - s * 0.5}Z`} fill="#e2b04a" />
          ))}
        </svg>
      </figure>
    </section>
  );
}
