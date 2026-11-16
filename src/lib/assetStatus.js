// Qué dice la respuesta del servidor sobre un archivo que se ofrece como descarga, como el CV (V6.22).
//
//   "ok"       el archivo está;
//   "missing"  el servidor dice claramente que no está: 404 o 410, o responde una página en lugar del archivo
//              (un hosting de SPA puede contestar 200 con index.html);
//   "unknown"  no se puede saber: un fallo de red, un 403 del firewall, un error del servidor, un HEAD no
//              admitido o una respuesta sin tipo.
//
// Solo "missing" cambia el botón por «pendiente». Hasta la V6.21 cualquier fallo contaba como «no está» y,
// como el resultado se guardaba, un corte de red de un segundo dejaba el CV sin enlace toda la visita.
// `response` es la respuesta de fetch, o null si la petición falló.
export function assetStatus(response, expectedType) {
  if (!response) return "unknown";
  if (response.status === 404 || response.status === 410) return "missing";
  if (!response.ok) return "unknown";
  if (!expectedType) return "ok";
  const type = (response.headers?.get("content-type") || "").toLowerCase();
  if (type.includes(expectedType)) return "ok";
  if (type.includes("text/html")) return "missing";
  return "unknown";
}
