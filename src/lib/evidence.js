import { resolveVideo } from "./video.js";

// Evidencias de un proyecto para el visor (V6.8): primero los videos (el campo `videos` y, por
// compatibilidad, el antiguo `video`), después las imágenes y al final los modelos 3D (V6.16). Una
// configuración inválida se omite sin romper la ficha. Cada elemento es
//   { kind: "video", source: <resolveVideo>, caption },   { kind: "image", src, alt, caption }
//   o { kind: "model", src (.gltf), poster, alt, caption }
export function evidenceItems(project) {
  if (!project) return [];
  const videos = [project.video, ...(Array.isArray(project.videos) ? project.videos : [])]
    .map((cfg) => ({ cfg, source: resolveVideo(cfg) }))
    .filter((x) => x.source)
    .map(({ cfg, source }) => ({ kind: "video", source, caption: cfg.caption || cfg.title || "" }));
  const images = (Array.isArray(project.images) ? project.images : [])
    .filter((img) => img && typeof img.src === "string" && img.src.trim())
    .map((img) => ({ kind: "image", src: img.src, alt: img.alt || "", caption: img.caption || "" }));
  const models = (Array.isArray(project.models) ? project.models : [])
    .filter((m) => m && typeof m.src === "string" && /\.gltf$/i.test(m.src.trim()))
    .map((m) => ({ kind: "model", src: m.src.trim(), poster: m.poster || "", alt: m.alt || "", caption: m.caption || "" }));
  return [...videos, ...images, ...models];
}

// Cuántas evidencias hay de cada tipo y dónde empieza cada una (para los botones de la ficha).
export function evidenceSummary(items) {
  const count = (kind) => items.filter((it) => it.kind === kind).length;
  return {
    videos: count("video"),
    images: count("image"),
    models: count("model"),
    firstVideo: items.findIndex((it) => it.kind === "video"),
    firstImage: items.findIndex((it) => it.kind === "image"),
    firstModel: items.findIndex((it) => it.kind === "model"),
  };
}
