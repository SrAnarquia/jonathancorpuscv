import { useEffect, useState } from "react";
import { assetStatus } from "../lib/assetStatus";

// Comprueba que un archivo estático exista antes de ofrecerlo como descarga.
// Devuelve "checking" | "ok" | "missing" | "unknown" (ver src/lib/assetStatus.js). Solo "missing" cambia el
// enlace por «pendiente»: mientras comprueba, y si no se pudo saber, el enlace se muestra normal (V6.22).
// Se guarda solo una respuesta clara; si no se pudo saber, la próxima vez que se muestre se vuelve a preguntar.
const cache = new Map();

function check(href, expectedType) {
  if (!cache.has(href)) {
    const request = fetch(href, { method: "HEAD", cache: "no-cache" })
      .then((r) => assetStatus(r, expectedType), () => assetStatus(null))
      .then((state) => {
        if (state === "unknown") cache.delete(href);
        return state;
      });
    cache.set(href, request);
  }
  return cache.get(href);
}

export function useAsset(href, expectedType) {
  const [state, setState] = useState("checking");
  useEffect(() => {
    let alive = true;
    check(href, expectedType).then((s) => alive && setState(s));
    return () => { alive = false; };
  }, [href, expectedType]);
  return state;
}
