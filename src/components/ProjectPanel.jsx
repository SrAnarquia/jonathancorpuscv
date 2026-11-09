import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { resolveVideo } from "../lib/video";
import { evidenceItems, evidenceSummary } from "../lib/evidence";
import { CvButtons, EmailCopy, LinkedInLink, ExtraLinks } from "./ContactActions";
import { IconArrowL, IconArrowR, IconClose, IconCube, IconExternal, IconImage, IconPlay, IconRoute } from "./Icons";

function Section({ title, children }) {
  return (
    <section className="sheet-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

// Un texto con líneas en blanco (\n\n) se muestra como varios párrafos.
function Paragraphs({ text }) {
  return String(text).split(/\n\s*\n/).map((part, i) => <p key={i}>{part.trim()}</p>);
}

// Evidencias (V6.8): imágenes y videos del proyecto no se incrustan en la ficha (en un celular
// serían un desastre); van detrás de «Ver video» y «Ver imágenes», que abren el visor sobre la
// página, con flechas para pasar de una a otra. Si el proyecto no tiene, la sección no aparece.
function Evidence({ project, onOpenEvidence }) {
  const { t } = useLang();
  const items = evidenceItems(project);
  if (items.length === 0) return null;
  const { videos, images, models, firstVideo, firstImage, firstModel } = evidenceSummary(items);
  const open = (start, e) => onOpenEvidence(items, start, t("sheet.evidenceTitle", { title: project.title }), e.currentTarget);
  return (
    <Section title={t("sheet.evidence")}>
      <div className="row-actions evidence-actions">
        {videos > 0 && (
          <button type="button" className="btn btn-gold" onClick={(e) => open(firstVideo, e)}>
            <IconPlay /> {videos > 1 ? t("sheet.seeVideos", { n: videos }) : t("sheet.seeVideo")}
          </button>
        )}
        {images > 0 && (
          <button type="button" className="btn btn-secondary" onClick={(e) => open(firstImage, e)}>
            <IconImage /> {images > 1 ? t("sheet.seeImages", { n: images }) : t("sheet.seeImage")}
          </button>
        )}
        {models > 0 && (
          <button type="button" className="btn btn-secondary" onClick={(e) => open(firstModel, e)}>
            <IconCube /> {t("sheet.seeModel")}
          </button>
        )}
      </div>
    </Section>
  );
}

function ProjectContent({ project, onOpenEvidence }) {
  const { t } = useLang();
  return (
    <>
      <p className="sheet-summary">{project.summary}</p>

      {project.problem && <Section title={t("sheet.problem")}><Paragraphs text={project.problem} /></Section>}
      {project.contribution && <Section title={t("sheet.contribution")}><Paragraphs text={project.contribution} /></Section>}
      {project.highlights?.length > 0 && (
        <Section title={t("sheet.highlights")}>
          <ul className="ticks">{project.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        </Section>
      )}
      {project.tech?.length > 0 && (
        <Section title={t("sheet.tech")}>
          <ul className="tags">{project.tech.map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>
      )}
      <Evidence project={project} onOpenEvidence={onOpenEvidence} />
      {project.learnings && <Section title={t("sheet.learnings")}><Paragraphs text={project.learnings} /></Section>}
      {project.links?.length > 0 && (
        <Section title={t("sheet.links")}>
          <ul className="link-list">
            {project.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} <IconExternal /><span className="sr-only"> {t("sheet.newTab")}</span></a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function ShipContent({ onOpenVideo }) {
  const { t, profile } = useLang();
  const video = resolveVideo(profile.presentationVideo);
  const s = profile.ship;
  return (
    <>
      <p className="sheet-summary">{s.intro}</p>
      {video ? (
        <button type="button" className="btn btn-gold video-btn" onClick={(e) => onOpenVideo(video, video.title, e.currentTarget)}>
          <IconPlay /> {t("sheet.presentation")}
        </button>
      ) : (
        <p className="note">{t("sheet.presentationSoon")}</p>
      )}
      <Section title={t("sheet.motivation")}><p>{s.motivation}</p></Section>
      {s.goals?.length > 0 && (
        <Section title={t("sheet.goals")}>
          <ul className="ticks">{s.goals.map((g) => <li key={g}>{g}</li>)}</ul>
        </Section>
      )}
      <Section title={t("sheet.talk")}>
        <div className="stack">
          <EmailCopy />
          <LinkedInLink />
          <ExtraLinks />
        </div>
        <div className="row-actions"><CvButtons /></div>
      </Section>
    </>
  );
}

// Ficha lateral (escritorio) u hoja inferior (móvil). No es modal: la escena sigue
// disponible para elegir otro planeta.
export default function ProjectPanel({ item, isShip, index, total, tour, onClose, onPrev, onNext, onOpenVideo, onOpenEvidence, compact }) {
  const { t, profile } = useLang();
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const id = isShip ? "nave" : item.id;

  // En pantallas táctiles la ficha puede contraerse a solo su título, para que la
  // escena quede a la vista; el asa se vuelve botón. Se conserva al cambiar de planeta.
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => {
    setCollapsed((c) => !c);
    // El encuadre de la cámara mide la ficha al vuelo; avisarle del cambio de tamaño.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  };

  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
    bodyRef.current?.scrollTo?.(0, 0);
  }, [id]);

  const onKey = (e) => {
    // Mantener Esc presionada no cierra en cadena lo que haya detrás (en Chrome es salir de pantalla completa).
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) onClose(); }
  };

  const color = isShip ? "#ee9fb2" : item.planet.color;
  const color2 = isShip ? "#d97d93" : item.planet.color2;

  return (
    <aside className={"sheet" + (isShip ? " sheet-ship" : "") + (compact && collapsed ? " is-collapsed" : "")} role="dialog" aria-modal="false" aria-labelledby={`t-${id}`} onKeyDown={onKey}
      style={{ "--c": color, "--c2": color2 }}>
      {compact ? (
        <button type="button" className="sheet-grip sheet-grip-btn" aria-expanded={!collapsed} onClick={toggleCollapsed}>
          <span className="sr-only">{collapsed ? t("sheet.expand") : t("sheet.collapse")}</span>
        </button>
      ) : (
        <div className="sheet-grip" aria-hidden="true" />
      )}
      <header className="sheet-head">
        <span className="sheet-orb" aria-hidden="true">{isShip ? "✦" : item.planet.icon}</span>
        <div>
          <p className="sheet-tag">{isShip ? t("sheet.end") : `${String(index + 1).padStart(2, "0")} · ${item.planet.name} · ${item.tag}`}</p>
          <h2 id={`t-${id}`} ref={headRef} tabIndex={-1}>{isShip ? profile.ship.title : item.title}</h2>
        </div>
        <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label={t("sheet.close")}><IconClose /></button>
      </header>

      <div className="sheet-body" ref={bodyRef}>
        {tour && (
          <p className="tour-line"><IconRoute /> {t("sheet.tourStep", { n: index + 1, total })}</p>
        )}
        {!isShip && item.story && <p className="story">{item.story}</p>}
        {isShip ? <ShipContent onOpenVideo={onOpenVideo} /> : <ProjectContent project={item} onOpenEvidence={onOpenEvidence} />}
      </div>

      <footer className="sheet-nav">
        <button type="button" className="btn btn-ghost" onClick={onPrev} disabled={index === 0}><IconArrowL /> {t("sheet.prev")}</button>
        <span className="count" aria-live="polite">{index + 1} / {total}</span>
        <button type="button" className="btn btn-ghost" onClick={onNext} disabled={index === total - 1}>
          {index === total - 2 ? t("sheet.toShip") : t("sheet.next")} <IconArrowR />
        </button>
      </footer>
    </aside>
  );
}
