import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { CvButtons, EmailCopy, ExtraLinks, LinkedInLink } from "./ContactActions";

// `contact` (V6.6): el botón de copiar el correo y LinkedIn abren el asistente también desde aquí, como en
// el encabezado (LinkedIn además abre su página en otra pestaña y copia su enlace). Sin él, son los de siempre.
export default function Footer({ contact }) {
  const { t, profile } = useLang();
  return (
    <footer id="contacto" className="footer" aria-labelledby="contact-title">
      <div className="footer-inner">
        <p className="eyebrow">{t("footer.eyebrow")}</p>
        <h2 id="contact-title">{t("footer.title")}</h2>
        <div className="footer-actions">
          <EmailCopy onAssistant={contact?.onCopy} />
          <LinkedInLink onAssistant={contact?.onLinkedIn} />
          <ExtraLinks />
        </div>
        <div className="footer-actions">
          <CvButtons />
        </div>
        <nav className="footer-nav" aria-label={t("footer.nav")}>
          <Link to="/#perfil">{t("nav.home")}</Link>
          <Link to="/#universo">{t("nav.projects")}</Link>
          <Link to="/video">{t("nav.videoLong")}</Link>
        </nav>
        <p className="foot">© {new Date().getFullYear()} {profile.name} · {t("footer.credit")} <em>El principito</em>.</p>
      </div>
    </footer>
  );
}
