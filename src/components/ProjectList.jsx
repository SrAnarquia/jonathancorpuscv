import { useLang } from "../i18n";

// Alternativa sin WebGL (o por preferencia): todos los proyectos como tarjetas HTML.
export default function ProjectList({ projects, selectedId, shipId, onSelect }) {
  const { t, profile } = useLang();
  return (
    <ol className="plist" aria-label={t("universe.projects")}>
      {projects.map((p, i) => (
        <li key={p.id}>
          <button type="button" data-planet={p.id} className={"pcard" + (selectedId === p.id ? " is-active" : "")} onClick={() => onSelect(p.id)}
            style={{ "--c": p.planet.color, "--c2": p.planet.color2 }} aria-current={selectedId === p.id ? "true" : undefined}>
            <span className="pcard-orb" aria-hidden="true">{p.planet.icon}</span>
            <span className="pcard-num">{String(i + 1).padStart(2, "0")} · {p.planet.name}</span>
            <strong className="pcard-title">{p.title}</strong>
            <span className="pcard-tag">{p.tag}</span>
            <span className="pcard-sum">{p.summary}</span>
          </button>
        </li>
      ))}
      <li>
        <button type="button" data-planet={shipId} className={"pcard pcard-ship" + (selectedId === shipId ? " is-active" : "")} onClick={() => onSelect(shipId)}
          style={{ "--c": "#ee9fb2", "--c2": "#d97d93" }}>
          <span className="pcard-orb" aria-hidden="true">✦</span>
          <span className="pcard-num">{t("sheet.end")}</span>
          <strong className="pcard-title">{profile.ship.title}</strong>
          <span className="pcard-sum">{t("sheet.shipSummary")}</span>
        </button>
      </li>
    </ol>
  );
}
