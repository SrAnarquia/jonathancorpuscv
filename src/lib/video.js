// Normaliza la configuración de un video en algo que el reproductor sabe mostrar.
//
// Fuentes admitidas:
//   { type: "file",    src: "/videos/robot.mp4", poster?: "/videos/robot.jpg" }   archivo en /public
//   { type: "url",     src: "https://cdn.ejemplo.com/robot.mp4", poster? }       archivo multimedia público (R2, CDN…)
//   { type: "drive",   url: "https://drive.google.com/file/d/<ID>/view" }  o  { type: "drive", id: "<ID>" }
//   { type: "youtube", id: "<ID>" }  o  { type: "youtube", url: "https://youtu.be/<ID>" }
//   null / undefined   sin video (el botón no se muestra)
//
// Devuelve { kind: "native" | "embed", src, poster?, mime?, external?, title }
// o null si no hay video o la configuración no es válida.

const MIME = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", ogv: "video/ogg" };

export function driveId(input = "") {
  const s = String(input).trim();
  if (/^[\w-]{20,}$/.test(s)) return s;
  const m = s.match(/\/file\/d\/([\w-]+)/) || s.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}

export function youtubeId(input = "") {
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    s.match(/youtu\.be\/([\w-]{11})/) ||
    s.match(/[?&]v=([\w-]{11})/) ||
    s.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
  return m ? m[1] : null;
}

function mimeOf(src) {
  const ext = String(src).split(/[?#]/)[0].split(".").pop().toLowerCase();
  return MIME[ext];
}

export function resolveVideo(video) {
  if (!video || typeof video !== "object") return null;
  const title = video.title || "Video";

  switch (video.type) {
    case "file": {
      if (!video.src || !String(video.src).startsWith("/")) return null;
      return { kind: "native", src: video.src, poster: video.poster, mime: mimeOf(video.src), title, external: video.src };
    }
    case "url": {
      if (!/^https:\/\//.test(video.src || "")) return null;
      // Una página de vista previa (Drive, YouTube…) no es un archivo multimedia.
      if (/drive\.google\.com|youtube\.com|youtu\.be/.test(video.src)) return null;
      return { kind: "native", src: video.src, poster: video.poster, mime: mimeOf(video.src), title, external: video.src };
    }
    case "drive": {
      const id = driveId(video.id || video.url);
      if (!id) return null;
      return {
        kind: "embed",
        provider: "Google Drive",
        src: `https://drive.google.com/file/d/${id}/preview`,
        external: `https://drive.google.com/file/d/${id}/view`,
        title,
      };
    }
    case "youtube": {
      const id = youtubeId(video.id || video.url);
      if (!id) return null;
      return {
        kind: "embed",
        provider: "YouTube",
        src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
        external: `https://www.youtube.com/watch?v=${id}`,
        title,
      };
    }
    default:
      return null;
  }
}
