import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { STRINGS, LANGS } from "./strings";
import { PROJECTS } from "../data/projects";
import { PROJECTS_EN } from "../data/projects.en";
import { PROFILE } from "../data/profile";
import { PROFILE_EN } from "../data/profile.en";
import { captureViewAnchor, restoreViewAnchor } from "../lib/viewAnchor";

// Idioma de la interfaz. El contenido base está en español; el inglés se superpone
// campo a campo, así que cualquier texto sin traducir se muestra en español.

const KEY = "jc-lang";
const LangContext = createContext(null);

function initialLang() {
  if (typeof window === "undefined") return "es";
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* almacenamiento no disponible */ }
  const nav = (navigator.language || "").toLowerCase();
  return nav.startsWith("en") ? "en" : "es";
}

// Mezcla una traducción sobre el objeto original (solo claves presentes; arreglos completos).
export function merge(base, over) {
  if (over == null) return base;
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (typeof base === "object" && base !== null && typeof over === "object") {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
    return out;
  }
  return over;
}

export function localizeProjects(lang) {
  if (lang === "es") return PROJECTS;
  return PROJECTS.map((p) => merge(p, PROJECTS_EN[p.id]));
}

export function localizeProfile(lang) {
  return lang === "es" ? PROFILE : merge(PROFILE, PROFILE_EN);
}

export function format(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const current = useRef(lang);
  const anchor = useRef(null);

  // Al cambiar de idioma los textos cambian de largo: lo que la persona está viendo se queda en su sitio
  // (se mide antes del cambio y se corrige antes de pintar, igual en todos los navegadores).
  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return;
    if (l !== current.current && !anchor.current) anchor.current = captureViewAnchor();
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* sin almacenamiento */ }
  }, []);

  useLayoutEffect(() => {
    current.current = lang;
    restoreViewAnchor(anchor.current);
    anchor.current = null;
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", STRINGS[lang]["doc.description"]);
  }, [lang]);

  const value = useMemo(() => {
    const dict = STRINGS[lang] || STRINGS.es;
    const t = (key, vars) => format(dict[key] ?? STRINGS.es[key] ?? key, vars);
    return {
      lang,
      setLang,
      toggle: () => setLang(lang === "es" ? "en" : "es"),
      t,
      projects: localizeProjects(lang),
      profile: localizeProfile(lang),
    };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LangProvider>");
  return ctx;
}
