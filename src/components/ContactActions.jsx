import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { useAsset } from "../hooks/useAsset";
import { IconCheck, IconCopy, IconDownload, IconLinkedIn, IconMail } from "./Icons";

export function CvLink({ lang, variant = "primary", compact = false }) {
  const { t, profile } = useLang();
  const cv = profile.cv[lang];
  const state = useAsset(cv.href, "pdf");
  const label = compact ? cv.short : cv.label;
  if (state === "missing") {
    return (
      <span className={`btn btn-${variant} is-unavailable`} title={t("contact.pendingTitle")} aria-disabled="true">
        <IconDownload /> {label} <small>{t("contact.pending")}</small>
      </span>
    );
  }
  return (
    <a className={`btn btn-${variant}`} href={cv.href} download hrefLang={lang} type="application/pdf">
      <IconDownload /> {label}
    </a>
  );
}

// Los dos CV; el del idioma activo va primero.
export function CvButtons({ compact = false, variants = ["primary", "secondary"] }) {
  const { lang } = useLang();
  const order = lang === "en" ? ["en", "es"] : ["es", "en"];
  return (
    <>
      <CvLink lang={order[0]} variant={variants[0]} compact={compact} />
      <CvLink lang={order[1]} variant={variants[1]} compact={compact} />
    </>
  );
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

// Copia dentro del mismo clic, antes de que el navegador pase a la pestaña nueva (LinkedIn, V6.19). Primero con
// execCommand, que es síncrono y no depende del foco; navigator.clipboard escribe después y puede rechazarlo si
// la página ya quedó detrás de la pestaña nueva. Si execCommand no copia, se intenta con navigator.clipboard.
// Devuelve una promesa: true si se copió.
export function copyInClick(text) {
  const prev = document.activeElement;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.setAttribute("aria-hidden", "true");
  ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0";
  ta.style.opacity = "0"; ta.style.fontSize = "12pt"; // 12pt: iOS no hace zoom al seleccionar
  document.body.appendChild(ta);
  let ok = false;
  try {
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  if (prev && prev !== document.body) prev.focus?.({ preventScroll: true });
  if (ok) return Promise.resolve(true);
  return navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).then(() => true, () => false) : Promise.resolve(false);
}

// El correo solo se parte antes de la @: si no cabe en una línea (celulares muy angostos) baja
// «@gmail.com» entero, en vez de dejar una letra suelta en la segunda línea.
function EmailText({ email }) {
  const at = email.indexOf("@");
  return <span className="email-text">{at > 0 ? <>{email.slice(0, at)}<wbr />{email.slice(at)}</> : email}</span>;
}

// Un clic normal con el botón principal: con Ctrl/⌘/Shift/Alt o el botón central se deja al navegador
// (abrir en otra pestaña, etc.).
export const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// `onAssistant(copiado)`: además de copiar, lleva a Contacto y abre el asistente (encabezado, menú móvil y,
// desde la V6.6, también el propio Contacto). Sin él es solo el botón de copiar.
export function EmailCopy({ showAddress = true, onAssistant }) {
  const { t, profile } = useLang();
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onCopy = async () => {
    const done = await copyText(profile.email);
    if (done) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    }
    onAssistant?.(done);
  };
  const label = onAssistant ? t("contact.copyAssist") : t("contact.copy");
  return (
    <span className="email">
      <a className="email-link" href={`mailto:${profile.email}`}>
        <IconMail /> {showAddress ? <EmailText email={profile.email} /> : t("nav.email")}
      </a>
      <button type="button" className="icon-btn" onClick={onCopy} aria-label={copied ? t("contact.copied") : label} title={label}>
        {copied ? <IconCheck /> : <IconCopy />}
      </button>
      <span className="sr-only" role="status">{copied ? t("contact.copiedStatus") : ""}</span>
    </span>
  );
}

// `onAssistant(copiado)` (V6.19, pedido de JC): cada clic abre LinkedIn en otra pestaña (lo hace el propio
// enlace, con target="_blank", así ningún bloqueador de ventanas lo detiene) y, en esta página, copia el enlace
// al portapapeles y abre el asistente en Contacto, que confirma la copia. Hasta la V6.18 el primer clic no
// salía del sitio y los siguientes iban directo a LinkedIn sin copiar nada. Ctrl/⌘ + clic, Shift o clic
// central: solo el enlace.
export function LinkedInLink({ label = "LinkedIn", className = "text-link", onAssistant }) {
  const { t, profile } = useLang();
  const onClick = onAssistant && ((e) => {
    if (!plainClick(e)) return;
    copyInClick(profile.linkedin).then(onAssistant);
  });
  return (
    <a className={className} href={profile.linkedin} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      <IconLinkedIn /> {label}
      <span className="sr-only"> {onAssistant ? t("contact.linkedInAssist") : t("contact.newTab")}</span>
    </a>
  );
}

export function ExtraLinks() {
  const { profile } = useLang();
  if (!profile.links.length) return null;
  return profile.links.map((l) => (
    <a key={l.href} className="text-link" href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
  ));
}
