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
    // Pantalla táctil: el modelo gira lo mismo que el dedo, sin inercia, y se dibuja a menos resolución (V6.22).
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    import("../three/ModelViewer.js").then(
      ({ createModelViewer }) => {
        if (cancelled || !canvasRef.current) return;
        viewer = createModelViewer(canvasRef.current, {
          src: item.src,
          reducedMotion,
          coarse,
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

  // El marco deja pasar los eventos del puntero (V6.22). Hasta la V6.21 los detenía para que girar el modelo
  // no pasara a la evidencia siguiente, pero así OrbitControls, que escucha el «soltar» en el documento, no se
  // enteraba de que el dedo o el botón se habían levantado: en celular el toque siguiente se leía como un
  // pellizco (el modelo saltaba de tamaño y dejaba de responder) y en PC el modelo seguía al ratón sin
  // presionar. Ahora es el visor de evidencias el que no cuenta como deslizamiento un gesto sobre el modelo.
  return (
    <div className={`model-frame is-${state}`}>
      {item.poster && state !== "ready" && <img className="model-poster" src={item.poster} alt="" draggable="false" />}
      <canvas ref={canvasRef} className="model-canvas" role="img" aria-label={item.alt} hidden={state === "error"} />
      <p className="model-badge">{t("evidence.modelBadge")}</p>
      {state === "loading" && <p className="model-status" role="status">{t("evidence.modelLoading")}</p>}
      {state === "ready" && !touched && <p className="model-hint" aria-hidden="true">{t("evidence.modelHint")}</p>}
      {state === "error" && <p className="model-status is-error" role="alert">{t("evidence.modelError")}</p>}
    </div>
  );
}
