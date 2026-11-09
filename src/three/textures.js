import * as THREE from "three";

// Texturas generadas en un <canvas>: no hay imágenes externas que descargar ni licencias de terceros.

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Superficie de planeta con manchas suaves, como acuarela sobre papel. Pintarla es lo más caro del
// arranque del universo, así que cada lienzo se pinta una sola vez (por colores, semilla y tamaño) y
// se reutiliza; prepareWatercolors los pinta por adelantado sin congelar la página.
const watercolors = new Map();
const watercolorKey = (color, color2, seed, size) => `${color}|${color2}|${seed}|${size}`;

function paintWatercolor(color, color2, seed, size) {
  const w = size, h = size / 2;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  // Lienzo en la CPU: el grano de papel lee y reescribe los píxeles, y en un lienzo de la tarjeta
  // gráfica esa lectura es una espera costosa (unas 8 veces más lento). Es la misma imagen que ya se
  // pintaba en equipos sin aceleración.
  const g = cv.getContext("2d", { willReadFrequently: true });
  const r = rng(seed * 9973);
  const c1 = hexToRgb(color), c2 = hexToRgb(color2);
  const light = mix(c1, [255, 248, 232], 0.45);
  const dark = mix(c2, [40, 36, 70], 0.25);

  g.fillStyle = rgba(c1, 1);
  g.fillRect(0, 0, w, h);

  // Cada mancha se pinta también a un ancho de distancia a cada lado para que la textura empate al dar
  // la vuelta al planeta. Las copias que caen del todo fuera del lienzo no se pintan (casi siempre son
  // las dos), pero sus números aleatorios se consumen igual: el resultado es idéntico píxel a píxel.
  const blot = (x, y, rad, col, a) => {
    for (const dx of [-w, 0, w]) {
      const ry = rad * (0.45 + r() * 0.4), rot = r() * 0.6;
      if (x + dx + rad <= 0 || x + dx - rad >= w) continue;
      const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, rad);
      gr.addColorStop(0, rgba(col, a));
      gr.addColorStop(0.65, rgba(col, a * 0.55));
      gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(x + dx, y, rad, ry, rot, 0, Math.PI * 2);
      g.fill();
    }
  };

  // Bandas horizontales muy suaves
  for (let i = 0; i < 7; i++) {
    const y = r() * h;
    g.fillStyle = rgba(i % 2 ? light : c2, 0.08 + r() * 0.08);
    g.fillRect(0, y, w, 4 + r() * 18);
  }
  for (let i = 0; i < 46; i++) blot(r() * w, r() * h, 12 + r() * 70, r() > 0.55 ? c2 : light, 0.1 + r() * 0.22);
  for (let i = 0; i < 14; i++) blot(r() * w, r() * h, 6 + r() * 20, dark, 0.12 + r() * 0.12);

  // Grano de papel
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 16;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return cv;
}

export function watercolorTexture(color, color2, seed = 1, size = 512) {
  const key = watercolorKey(color, color2, seed, size);
  let cv = watercolors.get(key);
  if (!cv) watercolors.set(key, (cv = paintWatercolor(color, color2, seed, size)));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Cede el turno al navegador (clics, desplazamiento, cuadros) entre un trabajo pesado y el siguiente.
const yieldToMain = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((r) => setTimeout(r, 0)));

// Pinta por adelantado los lienzos de `list` ([color, color2, seed, size?] por planeta), uno por tarea,
// para que el arranque del universo no bloquee la página de golpe.
export async function prepareWatercolors(list) {
  for (const [color, color2, seed = 1, size = 512] of list) {
    const key = watercolorKey(color, color2, seed, size);
    if (watercolors.has(key)) continue;
    watercolors.set(key, paintWatercolor(color, color2, seed, size));
    await yieldToMain();
  }
}

// Halo radial para atmósferas, el centro del universo y la estela de la nave.
let glow;
let star;
export function glowTexture() {
  if (glow) return glow;
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d");
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,.55)");
  gr.addColorStop(0.6, "rgba(255,255,255,.12)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, s, s);
  glow = new THREE.CanvasTexture(cv);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

// Patrón decorativo tipo QR (no codifica nada).
export function qrTexture(seed = 7) {
  const n = 21, px = 8, s = n * px + 16;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d");
  const r = rng(seed);
  g.fillStyle = "#fbf6ea";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#2b2f4a";
  const finder = (x, y) => {
    g.fillRect(8 + x * px, 8 + y * px, 7 * px, 7 * px);
    g.fillStyle = "#fbf6ea"; g.fillRect(8 + (x + 1) * px, 8 + (y + 1) * px, 5 * px, 5 * px);
    g.fillStyle = "#2b2f4a"; g.fillRect(8 + (x + 2) * px, 8 + (y + 2) * px, 3 * px, 3 * px);
  };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    if (!inFinder && r() > 0.52) g.fillRect(8 + x * px, 8 + y * px, px, px);
  }
  finder(0, 0); finder(14, 0); finder(0, 14);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Estrella de cinco puntas con halo suave: las estrellitas amarradas que llevan al principito.
export function starTexture() {
  if (star) return star;
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d");
  const c = s / 2;
  const gr = g.createRadialGradient(c, c, 0, c, c, c);
  gr.addColorStop(0, "rgba(255,255,255,.5)");
  gr.addColorStop(0.35, "rgba(255,255,255,.16)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, s, s);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? c * 0.3 : c * 0.72;
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    g[i ? "lineTo" : "moveTo"](c + Math.cos(a) * r, c + Math.sin(a) * r);
  }
  g.closePath();
  g.fillStyle = "rgba(255,255,255,1)";
  g.fill();
  star = new THREE.CanvasTexture(cv);
  star.colorSpace = THREE.SRGBColorSpace;
  return star;
}
