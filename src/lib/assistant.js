// Asistente de contacto: el único punto de unión entre la interfaz (ContactAssistant.jsx)
// y quien responde. Hoy responde la demostración local (assistantDemo.js), con una pausa
// breve para que la conversación se sienta natural; no hay IA, claves ni servicios externos.
//
// Para conectar la integración real basta con cambiar el cuerpo de `askAssistant` (por ejemplo,
// un `fetch` a una función /api/asistente que guarde la conversación y responda con un modelo):
// la interfaz solo espera una promesa que resuelva { text, actions?, suggestions? } (formato en
// assistantDemo.js) y, si la promesa falla, muestra una salida amable hacia el correo y LinkedIn.
// El saludo y las sugerencias pueden seguir saliendo de aquí aunque las respuestas vengan de fuera.

import { demoErrorReply, demoGreeting, demoReply } from "./assistantDemo.js";

// "demo" mientras las respuestas sean simuladas: la interfaz lo indica en su encabezado.
export const ASSISTANT_MODE = "demo";

// Pausa de «escribiendo…»: más larga cuanto más larga la respuesta, sin hacer esperar de más.
export function typingDelay(text = "", reduced = false) {
  const ms = 420 + Math.min(String(text).length, 160) * 4.5;
  return Math.round(reduced ? Math.min(ms, 450) : Math.min(ms, 1150));
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Cancelado", "AbortError"));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(id); reject(new DOMException("Cancelado", "AbortError")); }, { once: true });
  });
}

// Mensaje con que se recibe a la persona según por dónde llegó (ver `demoGreeting`). null si no hay nada que decir.
export function greet(ctx, entry) {
  return demoGreeting(ctx, entry);
}

// Responde una pregunta. `ctx` = { lang, profile, projects }; `history` = mensajes anteriores.
export async function askAssistant({ text, ctx, history = [], signal, reduced = false }) {
  const reply = demoReply(text, ctx, history);
  await wait(typingDelay(reply.text, reduced), signal);
  return reply;
}

// Lo que se muestra si `askAssistant` falla: nunca un error alarmante, siempre una salida directa.
export function fallbackReply(ctx) {
  return demoErrorReply(ctx);
}
