// Asistente de contacto: respuestas de demostración, escritas a mano.
// No hay IA ni conexión a ningún servicio: se reconocen unas cuantas preguntas frecuentes por
// palabras clave y se responde con los datos del propio sitio (src/data/profile.js y projects.js),
// así que nunca inventa nada. La interfaz no importa este archivo: habla con src/lib/assistant.js,
// que hoy lo usa y que es el único que hay que cambiar para conectar la integración real.
//
// Una respuesta es { text, actions?, suggestions?, meta? }:
//   text         texto plano; las líneas que empiezan con «✦ » se muestran como lista
//   actions      botones bajo el mensaje:
//                { type: "copy", value, label }                         copia al portapapeles
//                { type: "link", href, label, icon?, download?, external? }   enlace (LinkedIn, correo, CV)
//                { type: "go", to, label }                              navega dentro del sitio y contrae el chat
//   suggestions  preguntas rápidas que se ofrecen debajo de la respuesta
//   meta         { project } recuerda de qué proyecto se habló (para «¿qué tecnologías usó?»)

const TEXT = {
  es: {
    hello: "¡Hola! Soy el asistente de {first}, en versión de demostración.",
    offer: "Puedo contarte sobre su experiencia, sus proyectos o cómo contactarlo.",
    greetEmail: "Ya tienes su correo en el portapapeles, listo para escribirle. Mientras tanto, puedo contarte sobre su experiencia o sus proyectos.",
    greetEmailFail: "No pude copiar su correo automáticamente; aquí lo tienes: {email}. También puedo contarte sobre su experiencia o sus proyectos.",
    greetLinkedIn: "Su LinkedIn se abrió en otra pestaña y el enlace quedó copiado en tu portapapeles; también está en este botón y aquí abajo, en Contacto. Si quieres saber algo de su experiencia o sus proyectos, pregúntame.",
    greetLinkedInFail: "Su LinkedIn se abrió en otra pestaña. No pude copiar el enlace automáticamente, pero lo tienes en este botón y aquí abajo, en Contacto. Si quieres saber algo de su experiencia o sus proyectos, pregúntame.",
    greetContact: "Aquí tienes sus medios de contacto; también puedo contarte sobre su experiencia o sus proyectos.",
    againLinkedIn: "Su LinkedIn se abrió en otra pestaña y el enlace quedó copiado en tu portapapeles; aquí está también:",
    againLinkedInFail: "Su LinkedIn se abrió en otra pestaña, pero no pude copiar el enlace; aquí lo tienes:",
    againEmailFail: "No pude copiar el correo automáticamente; aquí lo tienes: {email}",
    helloAgain: "¡Hola! ¿Qué te gustaría saber de {first}?",
    about: "{name} es {title} y hoy trabaja como {role}. En sus palabras: «{value}»",
    experience: "Su experiencia, en resumen:",
    experienceCv: "El detalle completo está en su CV.",
    projects: "En su universo hay {n} proyectos, y la nave al final del viaje:",
    projectsGo: "Puedes recorrerlos uno por uno en el universo de arriba.",
    project: "{planet}: {title}.\n{summary}",
    projectTech: "En «{planet}» usó: {tech}.",
    tech: "Algunas tecnologías con las que ha trabajado en sus proyectos: {tech}.",
    cv: "Aquí tienes su CV para descargar, en español y en inglés:",
    contact: "La forma más directa es escribirle a {email} o buscarlo en LinkedIn; los dos están aquí, en Contacto.",
    phone: "Su teléfono no está publicado en el sitio. Lo más rápido es escribirle por correo o por LinkedIn:",
    message: "En esta demostración todavía no puedo enviarle mensajes; muy pronto podrás dejárselo aquí mismo. Mientras tanto, escríbele directo:",
    video: "Tiene un video de presentación para conocerlo más allá del currículum.",
    bot: "Soy un asistente de demostración: por ahora respondo con información fija de este sitio, sin inteligencia artificial ni conexión a ningún servicio. Más adelante podré responder con más detalle.",
    thanks: "¡Con gusto! Si quieres seguir explorando, sus proyectos te esperan en el universo de arriba.",
    fallback: "Esa todavía no sé responderla: soy una versión de demostración con respuestas fijas. Puedes preguntárselo directo a {first}:",
    error: "No pude responder en este momento. Puedes escribirle directo a {first}:",
    // acciones y sugerencias
    aCopy: "Copiar correo",
    aMail: "Escribir un correo",
    aLinkedIn: "LinkedIn",
    aExplore: "Explorar el universo",
    aProject: "Ver su ficha",
    aVideo: "Ver el video",
    sWho: "¿Quién es {first}?",
    sProjects: "¿Qué proyectos tiene?",
    sWork: "¿Dónde ha trabajado?",
    sContact: "¿Cómo lo contacto?",
    sCv: "Quiero su CV",
    sTech: "¿Qué tecnologías usa?",
    sProjectTech: "¿Qué tecnologías usó?",
    sVideo: "¿Tiene un video?",
  },
  en: {
    hello: "Hi! I'm {first}'s assistant, a demo version.",
    offer: "I can tell you about his experience, his projects or how to reach him.",
    greetEmail: "His email is on your clipboard, ready for you to write to him. Meanwhile, I can tell you about his experience or his projects.",
    greetEmailFail: "I couldn't copy his email automatically; here it is: {email}. I can also tell you about his experience or his projects.",
    greetLinkedIn: "His LinkedIn opened in another tab and the link is on your clipboard; it's also on this button and right below, under Contact. If you'd like to know about his experience or projects, just ask.",
    greetLinkedInFail: "His LinkedIn opened in another tab. I couldn't copy the link automatically, but it's on this button and right below, under Contact. If you'd like to know about his experience or projects, just ask.",
    greetContact: "Here are his contact details; I can also tell you about his experience or his projects.",
    againLinkedIn: "His LinkedIn opened in another tab and the link is on your clipboard; here it is as well:",
    againLinkedInFail: "His LinkedIn opened in another tab, but I couldn't copy the link; here it is:",
    againEmailFail: "I couldn't copy the email automatically; here it is: {email}",
    helloAgain: "Hi! What would you like to know about {first}?",
    about: "{name} is an {title} and currently works as an {role}. In his own words: “{value}”",
    experience: "His experience, in short:",
    experienceCv: "His résumé has the full detail.",
    projects: "There are {n} projects in his universe, plus the ship at the end of the journey:",
    projectsGo: "You can visit them one by one in the universe above.",
    project: "{planet}: {title}.\n{summary}",
    projectTech: "For “{planet}” he used: {tech}.",
    tech: "Some technologies he has worked with in his projects: {tech}.",
    cv: "Here's his résumé to download, in Spanish and in English:",
    contact: "The most direct way is to email {email} or find him on LinkedIn; both are right here, under Contact.",
    phone: "His phone number isn't published on the site. The quickest way is to reach him by email or LinkedIn:",
    message: "In this demo I can't send him messages yet; soon you'll be able to leave one right here. Meanwhile, reach him directly:",
    video: "He has an introduction video so you can get to know him beyond the résumé.",
    bot: "I'm a demo assistant: for now I answer with fixed information from this site, with no artificial intelligence and no connection to any service. Later on I'll be able to answer in more detail.",
    thanks: "My pleasure! If you'd like to keep exploring, his projects are waiting in the universe above.",
    fallback: "I can't answer that one yet: I'm a demo with fixed answers. You can ask {first} directly:",
    error: "I couldn't answer right now. You can reach {first} directly:",
    aCopy: "Copy email",
    aMail: "Write an email",
    aLinkedIn: "LinkedIn",
    aExplore: "Explore the universe",
    aProject: "Open its card",
    aVideo: "Watch the video",
    sWho: "Who is {first}?",
    sProjects: "What projects has he built?",
    sWork: "Where has he worked?",
    sContact: "How can I reach him?",
    sCv: "I'd like his résumé",
    sTech: "What technologies does he use?",
    sProjectTech: "What technologies did he use?",
    sVideo: "Does he have a video?",
  },
};

// Palabras clave (sin acentos y en minúsculas). «x*» acepta cualquier palabra que empiece por x.
const INTENTS = [
  ["bot", ["eres un bot", "eres una ia", "eres ia", "inteligencia artificial", "chatgpt", "gemini", "eres real", "eres humano", "quien eres", "que eres", "are you a bot", "are you an ai", "are you ai", "artificial intelligence", "are you real", "are you human", "who are you", "what are you"]],
  ["message", ["mensaje*", "contrat*", "vacante*", "entrevista*", "disponib*", "propuesta*", "oferta*", "colabor*", "freelance", "message*", "hire", "hiring", "job offer", "interview*", "availab*", "proposal*", "collaborat*", "opportunit*", "oportunidad*"]],
  ["phone", ["telefono", "celular", "whatsapp", "llamar*", "phone", "call him", "cell"]],
  ["cv", ["cv", "curriculum", "resume", "hoja de vida"]],
  ["video", ["video*", "presentacion"]],
  ["projectTech", ["que tecnologias uso", "con que lo hizo", "que uso", "what technologies did he use", "what did he use", "built with"]],
  ["tech", ["tecnologia*", "stack", "lenguaje*", "herramienta*", "habilidad*", "skill*", "tech", "technolog*", "language*", "tool*", "programa en", "sabe usar"]],
  ["projects", ["proyecto*", "portafolio", "planeta*", "que ha hecho", "que hace", "project*", "portfolio", "planet*", "what has he built", "what has he done"]],
  ["work", ["experiencia*", "trabaj*", "empresa*", "empleo*", "puesto*", "carrera", "trayectoria", "experience*", "work*", "worked", "compan*", "job*", "career", "employ*"]],
  ["contact", ["contact*", "correo*", "email*", "mail", "e-mail", "escribirle", "linkedin", "reach", "get in touch", "localizar*"]],
  ["about", ["quien es", "sobre el", "sobre jonathan", "perfil", "a que se dedica", "who is", "about him", "about jonathan", "profile", "what does he do"]],
  ["thanks", ["gracias", "muchas gracias", "genial", "perfecto", "thanks", "thank you", "great", "perfect", "adios", "bye"]],
  ["hello", ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "hi", "hello", "good morning", "good afternoon"]],
];

// Palabras que identifican cada proyecto (además del nombre de su planeta).
const PROJECT_KEYS = {
  "robot-6dof": ["robot*", "6-dof", "6dof", "maui", "stm32", "esp32", "bluetooth", "brazo robotico", "robotic arm"],
  "finanzas-datos": ["netsuite", "power bi", "powerbi", "suiteql", "finanzas", "finance", "dashboard*"],
  mealflow: ["mealflow", "qr", "alimentos", "comida", "comedor", "food", "meal*"],
  "supply-chain-hub": ["supply chain", "supply", "suministro", "logistic*", "envio*", "700,000", "700000"],
  "mantenimiento-kia": ["mantenimiento", "qbams", "maintenance"],
  "scada-planta": ["scada", "planta", "hmi", "plc", "plant", "kawasaki", "filling", "llenadora", "opc"],
  "hospital-uanl": ["hospital", "eeg", "emg", "rehabilitacion", "rehabilitation", "salud", "health", "pacientes", "patients", "bci", "matlab", "cerebrovascular", "stroke"],
  "vr-nave": ["vr", "realidad virtual", "virtual reality", "unity", "quest", "meta quest", "gemelo digital", "digital twin", "teleoper*", "blender"],
};

// Tecnologías demasiado genéricas para el resumen general.
const GENERIC_TECH = new Set([
  "app movil", "plataforma web", "backend api", "nube", "desarrollo web", "codigos qr",
  "mobile app", "web platform", "cloud", "web development", "qr codes",
  "lm35", "bluetooth", "eeg", "emg", "oauth 1.0",
]);

export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+#,.\s-]/g, " ")
    .replace(/[.,](?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ¿Aparece la clave (palabra o frase completa) en el texto normalizado?
export function hasKey(norm, key) {
  if (key.endsWith("*")) {
    const stem = key.slice(0, -1);
    return stem.includes(" ") ? ` ${norm}`.includes(` ${stem}`) : norm.split(" ").some((w) => w.startsWith(stem));
  }
  return ` ${norm} `.includes(` ${key} `);
}

const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));

function words(ctx) {
  const lang = ctx.lang === "en" ? "en" : "es";
  const p = ctx.profile;
  const vars = { name: p.name, first: p.name.split(" ")[0], email: p.email, title: p.title, role: p.currentRole, value: p.valueProp };
  const T = TEXT[lang];
  return { lang, T, say: (k, extra) => fill(T[k], { ...vars, ...extra }), vars };
}

function contactActions(ctx) {
  const { say } = words(ctx);
  const p = ctx.profile;
  return [
    { type: "copy", value: p.email, label: say("aCopy") },
    { type: "link", href: `mailto:${p.email}`, label: say("aMail"), icon: "mail" },
    { type: "link", href: p.linkedin, label: say("aLinkedIn"), icon: "linkedin", external: true },
  ];
}

function cvActions(ctx) {
  const order = ctx.lang === "en" ? ["en", "es"] : ["es", "en"];
  return order.map((l) => ({ type: "link", href: ctx.profile.cv[l].href, label: ctx.profile.cv[l].label, icon: "download", download: true }));
}

export function demoSuggestions(ctx, keys = ["sWho", "sProjects", "sWork", "sContact"]) {
  const { say } = words(ctx);
  return keys.map((k) => say(k));
}

// Mensaje con que el asistente recibe a la persona, según por dónde llegó:
// "email" (copió el correo; `copied` dice si se pudo), "linkedin" (se abrió en otra pestaña y se copió su
// enlace; ídem `copied`),
// "contact" (el enlace «Contacto» de la barra o del menú) o cualquier otra entrada (la burbuja).
// `first` indica si es la primera vez que se abre en la visita; si no, solo se añade
// lo que aporte algo nuevo (o nada).
export function demoGreeting(ctx, { source, copied = true, first = true } = {}) {
  const { say } = words(ctx);
  const p = ctx.profile;
  const linkedIn = [{ type: "link", href: p.linkedin, label: say("aLinkedIn"), icon: "linkedin", external: true }];
  if (!first) {
    if (source === "linkedin") return { text: say(copied ? "againLinkedIn" : "againLinkedInFail"), actions: linkedIn };
    if (source === "email" && !copied) return { text: say("againEmailFail"), actions: [{ type: "copy", value: p.email, label: say("aCopy") }] };
    return null; // «Contacto», la burbuja o el correo ya copiado: se retoma la conversación tal cual
  }
  const intro = say("hello");
  if (source === "email") {
    return copied
      ? { text: `${intro} ${say("greetEmail")}`, suggestions: demoSuggestions(ctx) }
      : { text: `${intro} ${say("greetEmailFail")}`, actions: [{ type: "copy", value: p.email, label: say("aCopy") }], suggestions: demoSuggestions(ctx) };
  }
  if (source === "linkedin") return { text: `${intro} ${say(copied ? "greetLinkedIn" : "greetLinkedInFail")}`, actions: linkedIn, suggestions: demoSuggestions(ctx) };
  if (source === "contact") return { text: `${intro} ${say("greetContact")}`, actions: contactActions(ctx), suggestions: demoSuggestions(ctx) };
  return { text: `${intro} ${say("offer")}`, suggestions: demoSuggestions(ctx) };
}

function findProject(norm, projects) {
  for (const p of projects) {
    const keys = [normalize(p.planet.name), ...(PROJECT_KEYS[p.id] || [])];
    if (keys.some((k) => k && hasKey(norm, k))) return p;
  }
  return null;
}

function lastProject(history, projects) {
  for (let i = (history?.length || 0) - 1; i >= 0; i--) {
    const id = history[i]?.meta?.project;
    if (id) return projects.find((p) => p.id === id) || null;
  }
  return null;
}

function allTech(projects) {
  const seen = new Set();
  const out = [];
  for (const p of projects) {
    for (const t of p.tech || []) {
      const k = normalize(t);
      if (GENERIC_TECH.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

const list = (items) => items.map((x) => `✦ ${x}`).join("\n");
const quote = (x, lang) => (lang === "en" ? `“${x}”` : `«${x}»`);

function joinWords(items, lang) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${lang === "en" ? "and" : "y"} ${items[items.length - 1]}`;
}

// Responde una pregunta. `history` son los mensajes anteriores (para recordar el último proyecto).
export function demoReply(input, ctx, history = []) {
  const { lang, T, say } = words(ctx);
  const projects = ctx.projects || [];
  const p = ctx.profile;
  const norm = normalize(input);
  const intent = (INTENTS.find(([, keys]) => keys.some((k) => hasKey(norm, k))) || [null])[0];
  const project = findProject(norm, projects);

  if (intent === "bot") return { text: say("bot"), suggestions: demoSuggestions(ctx, ["sWho", "sProjects", "sContact"]) };
  if (intent === "message") return { text: say("message"), actions: contactActions(ctx) };
  if (intent === "phone") return { text: say("phone"), actions: contactActions(ctx) };
  if (intent === "cv") return { text: say("cv"), actions: cvActions(ctx), suggestions: demoSuggestions(ctx, ["sWork", "sContact"]) };
  if (intent === "video") return { text: say("video"), actions: [{ type: "go", to: "/video", label: say("aVideo") }], suggestions: demoSuggestions(ctx, ["sProjects", "sContact"]) };

  // «¿Qué tecnologías usó?» se refiere al proyecto nombrado o al último del que se habló.
  if (intent === "projectTech" || (intent === "tech" && project)) {
    const target = project || lastProject(history, projects);
    if (target?.tech?.length) {
      return {
        text: say("projectTech", { planet: target.planet.name, tech: joinWords(target.tech, lang) }),
        actions: [{ type: "go", to: `/proyecto/${target.id}`, label: say("aProject") }],
        suggestions: demoSuggestions(ctx, ["sProjects", "sContact"]),
        meta: { project: target.id },
      };
    }
  }
  if (intent === "tech" || intent === "projectTech") {
    return { text: say("tech", { tech: joinWords(allTech(projects), lang) }), suggestions: demoSuggestions(ctx, ["sProjects", "sCv"]) };
  }

  // Un proyecto concreto (por su planeta o una palabra clave): su título y resumen.
  if (project && intent !== "contact" && intent !== "work") {
    return {
      text: say("project", { planet: project.planet.name, title: project.title, summary: project.summary }),
      actions: [{ type: "go", to: `/proyecto/${project.id}`, label: say("aProject") }],
      suggestions: demoSuggestions(ctx, ["sProjectTech", "sProjects", "sContact"]),
      meta: { project: project.id },
    };
  }

  if (intent === "projects") {
    const lines = projects.map((x) => `${x.planet.name}: ${x.title}`);
    return {
      text: `${say("projects", { n: projects.length })}\n${list(lines)}\n${say("projectsGo")}`,
      actions: [{ type: "go", to: "/#universo", label: say("aExplore") }],
      suggestions: demoSuggestions(ctx, ["sTech", "sWork", "sContact"]),
    };
  }

  if (intent === "work") {
    // Cada lugar de los datos rápidos del encabezado, con los proyectos que hizo ahí.
    const lines = p.highlights.map((h) => {
      const place = normalize(h.replace(/\(.*?\)/g, ""));
      const done = projects.filter((x) => { const tag = normalize(x.tag); return tag.includes(place) || place.includes(tag); }).map((x) => quote(x.title, lang));
      return done.length ? `${h}: ${joinWords(done, lang)}` : h;
    });
    return { text: `${say("experience")}\n${list(lines)}\n${say("experienceCv")}`, actions: cvActions(ctx), suggestions: demoSuggestions(ctx, ["sProjects", "sTech", "sContact"]) };
  }

  if (intent === "contact") return { text: say("contact"), actions: contactActions(ctx), suggestions: demoSuggestions(ctx, ["sCv", "sProjects"]) };
  if (intent === "about") return { text: say("about"), suggestions: demoSuggestions(ctx, ["sProjects", "sWork", "sCv"]) };
  if (intent === "thanks") return { text: say("thanks"), actions: [{ type: "go", to: "/#universo", label: say("aExplore") }] };
  if (intent === "hello") return { text: say("helloAgain"), suggestions: demoSuggestions(ctx) };

  return { text: say("fallback"), actions: contactActions(ctx), suggestions: demoSuggestions(ctx, ["sWho", "sProjects", "sCv"]) };
}

// Respuesta amable cuando el servicio falla (para la integración real): nunca un error alarmante.
export function demoErrorReply(ctx) {
  const { say } = words(ctx);
  return { text: say("error"), actions: contactActions(ctx) };
}

export { TEXT as DEMO_TEXT };
