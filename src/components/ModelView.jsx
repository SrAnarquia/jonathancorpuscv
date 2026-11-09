import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { hasWebGL } from "../lib/webgl";

// Un modelo 3D dentro del visor de evidencias (V6.16). El código 3D (three.js y su cargador) se
// descarga solo al llegar a esta evidencia; mientras carga se ve la imagen fija del modelo, y si el
// navegador no tiene WebGL o el archivo falla, la imagen se queda con un aviso. Siempre lleva la
// etiqueta de modelo de demostración en proceso, como pidió JC.
export default function ModelView({ item }) {
  const { t } = useLang();
  const canvasRef = useRef(null);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // Sin WebGL ni se descarga el código 3D: se queda la imagen con el aviso.
    if (!hasWebGL()) { setState("error"); return undefined; }
    let viewer = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    import("../three/ModelViewer.js").then(
      ({ createModelViewer }) => {
        if (cancelled || !canvasRef.current) return;
        viewer = createModelViewer(canvasRef.current, {
          src: item.src,
          reducedMotion,
          onReady: () => { if (!cancelled) setState("ready"); },
          onError: () => { if (!cancelled) setState("error"); },
          onInteract: () => { if (!cancelled) setTouched(true); },
        });
      },
      () => { if (!cancelled) setState("error"); },
    );
    return () => {
      cancelled = true;
      viewer?.dispose();
    };
  }, [item.src]);

  // Girar el modelo arrastrando no debe pasar a la evidencia siguiente (el visor cambia de evidencia
  // con un deslizamiento horizontal).
  const keep = (e) => e.stopPropagation();

  return (
    <div className={`model-frame is-${state}`} onPointerDown={keep} onPointerUp={keep}>
      {item.poster && state !== "ready" && <img className="model-poster" src={item.poster} alt="" draggable="false" />}
      <canvas ref={canvasRef} className="model-canvas" role="img" aria-label={item.alt} hidden={state === "error"} />
      <p className="model-badge">{t("evidence.modelBadge")}</p>
      {state === "loading" && <p className="model-status" role="status">{t("evidence.modelLoading")}</p>}
      {state === "ready" && !touched && <p className="model-hint" aria-hidden="true">{t("evidence.modelHint")}</p>}
      {state === "error" && <p className="model-status is-error" role="alert">{t("evidence.modelError")}</p>}
    </div>
  );
}
