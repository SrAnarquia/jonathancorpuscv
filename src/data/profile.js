// Datos profesionales de Jonathan Corpus.
// Todo lo que aparece en el encabezado, la nave y el pie se lee desde aquí.

export const PROFILE = {
  name: "Jonathan Corpus",
  initials: "JC",
  title: "Ingeniero en Electrónica y Automatización",
  roles: ["Desarrollador", "Sistemas y datos"],
  currentRole: "Analista de ERP Finanzas",
  valueProp:
    "Integro sistemas industriales, datos, ERP y desarrollo web para que la información sea útil para quien toma decisiones.",
  email: "Jonathan.Ecorpus@gmail.com",
  linkedin: "https://www.linkedin.com/in/jonathan-corpus-462067237",
  // Otros enlaces profesionales (GitHub, portafolio, etc.). Vacío hasta que existan.
  links: [],
  // Lugares donde ha trabajado (aparecen como datos rápidos en el encabezado).
  highlights: ["Analista de ERP Finanzas (actual)", "KIA México", "Hospital Universitario UANL"],
  // Archivos en /public. El sitio comprueba que existan antes de mostrarlos como descarga.
  cv: {
    es: { href: "/JonathanCorpusCV_ESP.pdf", label: "CV en español", short: "CV ES" },
    en: { href: "/JonathanCorpusCV_ENG.pdf", label: "CV in English", short: "CV EN" },
  },
  // Escena final: la nave.
  ship: {
    title: "La nave: el viaje continúa",
    intro:
      "Aquí el principito encontró su nave. Representa lo que sigue: la curiosidad que me trajo de los talleres a la ingeniería y los proyectos que quiero construir.",
    motivation:
      "Me motiva enfrentar nuevos retos técnicos, desarrollar habilidades y aportar valor dondequiera que esté. Me apasiona la investigación y el desarrollo (R&D), y estoy abierto a distintos roles en los que pueda seguir creciendo y contribuyendo.",
    goals: [
      "Llevar mi robot 6-DOF al entorno virtual como gemelo digital (en desarrollo, Unity + Meta Quest 3S).",
      "Seguir creciendo junto a equipos técnicos fuertes y asumir retos nuevos.",
    ],
  },
  // Video de presentación personal. Mismo formato que los videos de evidencia
  // (ver src/lib/video.js y docs/CONTENIDO.md). Usa null si todavía no existe.
  presentationVideo: {
    type: "youtube",
    id: "kB4uux4evWQ",
    title: "Video de presentación de Jonathan Corpus",
  },
};
