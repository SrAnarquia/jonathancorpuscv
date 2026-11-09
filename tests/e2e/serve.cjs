// Sirve dist/ como lo haría Vercel: con las cabeceras y las reescrituras de vercel.json (incluida la
// política de seguridad), para probar el sitio de producción en local antes de publicarlo.
// Uso:  npm run build && node tests/e2e/serve.cjs [puerto]      (por omisión 4180)
//       BASE=http://localhost:4180 node tests/e2e/qa.cjs
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../../dist");
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "../../vercel.json"), "utf8"));
const PORT = Number(process.argv[2] || process.env.PORT || 4180);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".gltf": "model/gltf+json", ".bin": "application/octet-stream", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".pdf": "application/pdf", ".mp3": "audio/mpeg", ".mp4": "video/mp4",
  ".webm": "video/webm", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

// Las rutas de vercel.json («/assets/(.*)», «/((?!assets/)[^.]*)») son expresiones regulares ancladas.
const toRegex = (source) => new RegExp(`^${source}$`);
const rewrites = (CONFIG.rewrites || []).map((r) => ({ re: toRegex(r.source), to: r.destination }));
const headerRules = (CONFIG.headers || []).map((h) => ({ re: toRegex(h.source), headers: h.headers }));

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); } // %… mal formado
  const headers = {};
  for (const rule of headerRules) if (rule.re.test(pathname)) for (const { key, value } of rule.headers) headers[key] = value;
  let file = path.join(ROOT, pathname);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); } // nada fuera de dist/
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const hit = rewrites.find((r) => r.re.test(pathname));
    file = hit ? path.join(ROOT, hit.to) : path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) { res.writeHead(404, headers); return res.end("Not found"); }
  const body = fs.readFileSync(file);
  res.writeHead(200, { ...headers, "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Content-Length": body.length });
  res.end(req.method === "HEAD" ? undefined : body);
});
server.listen(PORT, () => console.log(`dist/ con las cabeceras de vercel.json en http://localhost:${PORT}`));
