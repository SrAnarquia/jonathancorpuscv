// Detecta si el navegador puede crear un contexto WebGL.
// ?vista=lista en la URL fuerza la alternativa sin 3D (útil para probarla).
export function hasWebGL() {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("vista") === "lista") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
