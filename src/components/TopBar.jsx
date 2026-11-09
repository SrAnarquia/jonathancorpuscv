import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { CvLink, EmailCopy, LinkedInLink, plainClick } from "./ContactActions";
import { LangToggle, MusicControl } from "./Controls";
import { IconClose, IconMenu } from "./Icons";

// Barra de navegación. Está oculta mientras se ve el encabezado (ahí ya está todo)
// y aparece al bajar, para cambiar de sección sin perderse.
export default function TopBar({ visible, music, contact }) {
  const { t, lang, profile } = useLang();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  // Sin «Inicio» (el logotipo ya lleva al inicio) y sin «Sobre mí» (el video lo cubre). «Contacto» sigue
  // llevando a #contacto (y cierra la ficha que esté abierta) y además abre ahí el asistente (V6.6); con
  // Ctrl/⌘ o clic central es solo el enlace.
  const NAV = [
    { to: "/#universo", label: t("nav.projects") },
    { to: "/#contacto", label: t("nav.contact"), onClick: contact?.onContact && ((e) => { if (plainClick(e)) contact.onContact(); }) },
  ];

  useEffect(() => { if (!visible) setOpen(false); }, [visible]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); setOpen(false); btnRef.current?.focus(); } }; // preventDefault: Esc cierra solo el menú
    const onClick = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onClick); };
  }, [open]);

  const cvOrder = lang === "en" ? ["en", "es"] : ["es", "en"];

  return (
    <header className={"topbar" + (visible ? "" : " is-hidden")} inert={visible ? undefined : ""}>
      <div className="topbar-inner">
        <Link className="brand" to="/#perfil" aria-label={`${profile.name}, ${t("nav.brand")}`}>
          <span className="brand-mark" aria-hidden="true">{profile.initials}</span>
          <span className="brand-text">
            <strong>{profile.name}</strong>
            <span>{profile.title}</span>
          </span>
        </Link>

        <nav className="topnav" aria-label={t("nav.main")}>
          {NAV.map((n) => <Link key={n.to} to={n.to} onClick={n.onClick}>{n.label}</Link>)}
          <Link to="/video">{t("nav.video")}</Link>
        </nav>

        <div className="top-actions">
          <CvLink lang={cvOrder[0]} compact />
          <CvLink lang={cvOrder[1]} variant="secondary" compact />
          <LangToggle />
          <span className="desk-only"><MusicControl music={music} compact /></span>
          <button ref={btnRef} type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="menu-movil"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")} onClick={() => setOpen((o) => !o)}>
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      <div id="menu-movil" ref={menuRef} className="mobile-menu" hidden={!open}>
        <nav aria-label={t("nav.menu")}>
          {NAV.map((n) => <Link key={n.to} to={n.to} onClick={(e) => { setOpen(false); n.onClick?.(e); }}>{n.label}</Link>)}
          <Link to="/video" onClick={() => setOpen(false)}>{t("nav.videoLong")}</Link>
        </nav>
        {/* Como en el encabezado: copiar el correo y LinkedIn llevan al asistente en Contacto (LinkedIn abre además otra pestaña). */}
        <div className="mobile-menu-actions">
          <EmailCopy onAssistant={contact && ((copied) => { setOpen(false); contact.onCopy(copied); })} />
          <LinkedInLink onAssistant={contact?.onLinkedIn && ((copied) => { setOpen(false); contact.onLinkedIn(copied); })} />
          <MusicControl music={music} />
        </div>
      </div>
    </header>
  );
}
