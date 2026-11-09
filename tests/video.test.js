import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveVideo, driveId, youtubeId } from "../src/lib/video.js";
import { lockScroll } from "../src/lib/scrollLock.js";

test("sin video → null (el botón se oculta)", () => {
  assert.equal(resolveVideo(null), null);
  assert.equal(resolveVideo(undefined), null);
  assert.equal(resolveVideo({ type: "desconocido", src: "/x.mp4" }), null);
});

test("archivo local en /public", () => {
  const v = resolveVideo({ type: "file", src: "/videos/robot.mp4", poster: "/videos/robot.jpg" });
  assert.equal(v.kind, "native");
  assert.equal(v.src, "/videos/robot.mp4");
  assert.equal(v.mime, "video/mp4");
  assert.equal(v.poster, "/videos/robot.jpg");
  assert.equal(resolveVideo({ type: "file", src: "videos/robot.mp4" }), null, "la ruta debe empezar con /");
});

test("URL pública directa (R2, CDN…)", () => {
  const v = resolveVideo({ type: "url", src: "https://media.ejemplo.com/robot.webm" });
  assert.equal(v.kind, "native");
  assert.equal(v.mime, "video/webm");
  assert.equal(resolveVideo({ type: "url", src: "http://inseguro.com/a.mp4" }), null, "solo https");
});

test("una vista previa de Drive NO se trata como archivo MP4", () => {
  assert.equal(resolveVideo({ type: "url", src: "https://drive.google.com/file/d/abc/view" }), null);
});

test("Google Drive: enlace de compartir o id → iframe /preview", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
  for (const input of [
    { type: "drive", url: `https://drive.google.com/file/d/${id}/view?usp=sharing` },
    { type: "drive", url: `https://drive.google.com/open?id=${id}` },
    { type: "drive", id },
  ]) {
    const v = resolveVideo(input);
    assert.equal(v.kind, "embed");
    assert.equal(v.src, `https://drive.google.com/file/d/${id}/preview`);
  }
  assert.equal(driveId("no es un enlace"), null);
});

test("YouTube: id o enlaces habituales", () => {
  for (const s of ["kB4uux4evWQ", "https://youtu.be/kB4uux4evWQ", "https://www.youtube.com/watch?v=kB4uux4evWQ&t=3", "https://www.youtube.com/shorts/kB4uux4evWQ"]) {
    assert.equal(youtubeId(s), "kB4uux4evWQ", s);
  }
  const v = resolveVideo({ type: "youtube", id: "kB4uux4evWQ" });
  assert.equal(v.kind, "embed");
  assert.match(v.src, /youtube-nocookie\.com\/embed\/kB4uux4evWQ/);
});

test("pantalla completa y video comparten el candado de desplazamiento: se libera al cerrar ambos, en cualquier orden", () => {
  const body = { style: { overflow: "auto" } };
  // Entra la pantalla completa, se abre el video, sale la pantalla completa (Esc) y luego se cierra el video.
  const fullscreen = lockScroll(body);
  const video = lockScroll(body);
  assert.equal(body.style.overflow, "hidden");
  fullscreen();
  assert.equal(body.style.overflow, "hidden", "con el video abierto la página sigue quieta");
  video();
  assert.equal(body.style.overflow, "auto", "al cerrar los dos vuelve lo que había");
  // En el orden contrario, y liberar dos veces no descuenta de más.
  const a = lockScroll(body), b = lockScroll(body);
  b(); b();
  assert.equal(body.style.overflow, "hidden");
  a();
  assert.equal(body.style.overflow, "auto");
});
