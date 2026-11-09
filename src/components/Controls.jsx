import { useLang } from "../i18n";
import { IconMusic, IconVolume, IconVolumeOff } from "./Icons";

// Selector de idioma: un solo control que traduce toda la página.
export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang" role="group" aria-label={t("lang.label")}>
      <button type="button" lang="es" aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
      <button type="button" lang="en" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

// Control de música. Clic: silencia o activa. En escritorio, al pasar el cursor
// aparece el control de volumen. En pantallas táctiles solo se enciende o apaga (40 %).
export function MusicControl({ music, compact = false }) {
  const { t } = useLang();
  const { playing, muted, volume, error, toggleMute, setVolume } = music;
  const silent = muted || !playing || volume === 0;

  if (error) {
    return <span className="music is-error" title={t("music.unavailable")}><IconVolumeOff /> <span className="music-text">{t("music.unavailable")}</span></span>;
  }

  return (
    <div className={"music" + (silent ? " is-silent" : " is-playing") + (compact ? " is-compact" : "")}>
      <button
        type="button"
        className="music-btn"
        aria-pressed={!silent}
        aria-label={silent ? t("music.unmute") : t("music.mute")}
        title={silent ? t("music.unmute") : t("music.mute")}
        onClick={toggleMute}
      >
        {silent ? <IconVolumeOff /> : <IconMusic />}
        <span className="meter" aria-hidden="true"><i /><i /><i /><i /></span>
        {!compact && (
          // Ambas etiquetas ocupan el mismo sitio: el ancho de la píldora no cambia al encender o apagar,
          // así los controles vecinos no se mueven bajo el dedo (la música arranca con el primer toque).
          <span className="music-text" aria-hidden="true">
            <span className={silent ? "is-off" : ""}>{t("music.on")}</span>
            <span className={silent ? "" : "is-off"}>{t("music.off")}</span>
          </span>
        )}
      </button>
      <label className="music-vol">
        <span className="sr-only">{t("music.volume")}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          aria-valuetext={`${Math.round(volume * 100)} %`}
        />
        <IconVolume />
      </label>
    </div>
  );
}
