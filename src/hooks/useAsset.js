import { useEffect, useState } from "react";

// Comprueba que un archivo estático exista antes de ofrecerlo como descarga.
// Devuelve "checking" | "ok" | "missing". Mientras comprueba, el enlace se muestra normal.
// Se valida el tipo de contenido porque un hosting de SPA puede responder 200 con index.html.
const cache = new Map();

function check(href, expectedType) {
  if (!cache.has(href)) {
    cache.set(href, fetch(href, { method: "HEAD", cache: "no-cache" })
      .then((r) => {
        const type = r.headers.get("content-type") || "";
        return r.ok && (!expectedType || type.includes(expectedType)) ? "ok" : "missing";
      })
      .catch(() => "missing"));
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
