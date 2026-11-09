import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../i18n";
import { useAsset } from "../hooks/useAsset";
import { useMedia, useReducedMotion } from "../hooks/useMedia";
import { hintFits, useAssistantDock } from "../hooks/useAssistantDock";
import { useBubbleDrag } from "../hooks/useBubbleDrag";
import { askAssistant, fallbackReply, greet } from "../lib/assistant";
import { copyText } from "./ContactActions";
import { IconArrowR, IconCheck, IconCopy, IconDownload, IconLinkedIn, IconMail, IconMinus, IconSend } from "./Icons";

// Asistente de contacto flotante (prototipo). Tres estados, que decide App.jsx:
//   "hidden"  todavía no se ha abierto en la visita (no se muestra nada);
//   "open"    panel de conversación junto a Contacto;
//   "min"     contraído en una hadita que flota en la esquina (y que se puede arrastrar a otro sitio).
// Esta parte solo es la interfaz: quién responde está en src/lib/assistant.js (hoy, respuestas de
// demostración), cómo convive con la página (desplazamiento, burbuja, teclado) en useAssistantDock y el
// arrastre de la hadita en useBubbleDrag.

// Igual que en index.css: en estas ventanas el panel es una hoja inferior (móvil y tableta vertical).
export const SHEET_QUERY = "(max-width: 760px), (max-width: 900px) and (min-height: 501px)";
const MAX_LENGTH = 400;
const MAX_MESSAGES = 80;
const ICONS = { mail: IconMail, linkedin: IconLinkedIn, download: IconDownload };

// La hadita: una estrellita con alas y moño, de la misma paleta que el principito.
export function Fairy({ className = "fairy" }) {
  const glow = `fairy-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={glow} cx="50%" cy="52%" r="50%">
          <stop offset="0" stopColor="#f2c86a" stopOpacity=".55" />
          <stop offset="1" stopColor="#f2c86a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="25" r="18" fill={`url(#${glow})`} />
      <g className="fairy-wings" fill="#dcecf7" fillOpacity=".88" stroke="#f3ead6" strokeWidth="1.1" strokeLinejoin="round">
        <path d="M22.4 23.6 C16.6 13.4 7.2 14.4 8.9 21.8 C10.1 26.1 16.4 26.3 22.4 23.6Z" />
        <path d="M25.6 23.6 C31.4 13.4 40.8 14.4 39.1 21.8 C37.9 26.1 31.6 26.3 25.6 23.6Z" />
      </g>
      <path d="M24 20.8 L26.3 28.4 L33.6 30.7 L26.3 33 L24 40.6 L21.7 33 L14.4 30.7 L21.7 28.4Z" fill="#f2c84b" stroke="#b9822a" strokeWidth=".8" strokeLinejoin="round" />
      <circle cx="24" cy="10.6" r="2.2" fill="#f0c35a" stroke="#b9822a" strokeWidth=".6" />
      <circle cx="24" cy="16.6" r="4.4" fill="#f6dcc0" stroke="#1f2a44" strokeWidth="1.1" />
      <path d="M19.7 16.3 C19.6 12.6 21.6 11.6 24 11.6 C26.4 11.6 28.4 12.6 28.3 16.3 C26.9 14.6 25.4 14.1 24 14.1 C22.6 14.1 21.1 14.6 19.7 16.3Z" fill="#f0c35a" stroke="#b9822a" strokeWidth=".6" strokeLinejoin="round" />
      <path className="fairy-spark" d="M36 11.2 L36.6 13 L38.4 13.6 L36.6 14.2 L36 16 L35.4 14.2 L33.6 13.6 L35.4 13Z" fill="#fffaf0" />
      <circle cx="12.4" cy="32" r=".95" fill="#fffaf0" opacity=".8" />
    </svg>
  );
}

// Texto de una respuesta: las líneas que empiezan con «✦ » forman una lista; el resto, párrafos.
function MessageText({ text }) {
  const blocks = [];
  for (const line of String(text).split("\n")) {
    if (line.startsWith("✦ ")) {
      const last = blocks[blocks.length - 1];
      if (last?.items) last.items.push(line.slice(2));
      else blocks.push({ items: [line.slice(2)] });
    } else if (line.trim()) blocks.push({ text: line });
  }
  return blocks.map((b, i) => (b.items
    ? <ul key={i}>{b.items.map((x, j) => <li key={j}>{x}</li>)}</ul>
    : <p key={i}>{b.text}</p>));
}

function CopyAction({ action }) {
  const { t } = useLang();
  const [state, setState] = useState(null); // null | "ok" | "fail"
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onClick = async () => {
    setState((await copyText(action.value)) ? "ok" : "fail");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(null), 2200);
  };
  return (
    <>
      <button type="button" className="assistant-chip is-action" onClick={onClick}>
        {state === "ok" ? <IconCheck /> : <IconCopy />} {state === "ok" ? t("assistant.copiedShort") : action.label}
      </button>
      <span className="sr-only" role="status">{state === "ok" ? t("assistant.copied") : state === "fail" ? t("assistant.copyFailed") : ""}</span>
    </>
  );
}

// El CV se ofrece solo si el archivo existe (igual que los botones del sitio).
function DownloadAction({ action }) {
  const { t } = useLang();
  const state = useAsset(action.href, "pdf");
  if (state === "missing") {
    return (
      <span className="assistant-chip is-action is-unavailable" aria-disabled="true">
        <IconDownload /> {action.label} <small>{t("assistant.pending")}</small>
      </span>
    );
  }
  return <a className="assistant-chip is-action" href={action.href} download type="application/pdf"><IconDownload /> {action.label}</a>;
}

function Actions({ actions, onGo }) {
  const { t } = useLang();
  return (
    <div className="msg-actions">
      {actions.map((a, i) => {
        if (a.type === "copy") return <CopyAction key={i} action={a} />;
        if (a.type === "go") {
          return <button key={i} type="button" className="assistant-chip is-action" onClick={() => onGo(a.to)}>{a.label} <IconArrowR /></button>;
        }
        if (a.download) return <DownloadAction key={i} action={a} />;
        const Icon = ICONS[a.icon];
        return (
          <a key={i} className="assistant-chip is-action" href={a.href} {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {Icon && <Icon />} {a.label}
            {a.external && <span className="sr-only"> {t("contact.newTab")}</span>}
          </a>
        );
      })}
    </div>
  );
}

export default function ContactAssistant({ mode, seq, entry, onOpen, onMinimize }) {
  const { t, lang, profile, projects } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const sheet = useMedia(SHEET_QUERY);
  const coarse = useMedia("(pointer: coarse)");
  const uid = useId();
  const ids = { panel: `${uid}panel`, title: `${uid}title`, sub: `${uid}sub`, input: `${uid}input` };

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const bubbleRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const [toast, setToast] = useState(null);
  const [hint, setHint] = useState(false);

  const ctx = useMemo(() => ({ lang, profile, projects }), [lang, profile, projects]);
  const latest = useRef({});
  latest.current = { ctx, messages, reducedMotion };
  const nextId = useRef(0);
  const busyRef = useRef(false);
  const abortRef = useRef(null);
  const focusBubble = useRef(false);
  const greeted = useRef(false);
  const handledSeq = useRef(0);
  const shownSeq = useRef(0);
  const shownOnce = useRef(false);
  const hinted = useRef(false);

  // Contraerse: con el botón, Esc o una acción del chat, el foco pasa a la burbuja. Si se contrae solo
  // (al subir por la página) el foco no se mueve: quien desplaza la página no está escribiendo.
  const minimize = useCallback((byUser) => {
    focusBubble.current = byUser;
    onMinimize();
  }, [onMinimize]);
  const onAway = useCallback(() => minimize(false), [minimize]);

  const { arrived } = useAssistantDock({ mode, seq, sheet, coarse, reducedMotion, rootRef, panelRef, bubbleRef, inputRef, onAway });
  // El panel aparece al llegar a Contacto; mientras tanto, si ya existía, se ve la burbuja.
  const open = mode === "open" && arrived === seq;
  if (open) shownOnce.current = true;
  const bubbleShown = mode === "min" || (mode === "open" && !open && shownOnce.current);
  // La hadita se arrastra; un toque sin arrastre la abre (de ahí que el botón no lleve onClick).
  useBubbleDrag({ bubbleRef, active: bubbleShown, onOpen });
  const openRef = useRef(open);
  openRef.current = open;

  const push = useCallback((msg) => {
    nextId.current += 1;
    const item = { id: nextId.current, ...msg };
    setMessages((list) => [...list, item].slice(-MAX_MESSAGES));
  }, []);

  // Cada apertura: el saludo según por dónde llegó la persona (correo, LinkedIn, «Contacto» o la burbuja).
  // Se añade en cuanto se pide abrir, así la conversación ya está lista cuando el panel aparece en Contacto.
  useEffect(() => {
    if (mode !== "open" || !seq || handledSeq.current === seq) return;
    handledSeq.current = seq;
    const how = entry && { source: entry.source, copied: entry.copied !== false, first: !greeted.current };
    const msg = how && greet(latest.current.ctx, how);
    greeted.current = true;
    if (msg) push({ from: "bot", ...msg, greeting: how });
  }, [mode, seq, entry, push]);

  // Si se cambia de idioma, los saludos se vuelven a decir en el nuevo (las respuestas ya dadas se quedan).
  const firstLang = useRef(lang);
  useEffect(() => {
    if (firstLang.current === lang) return;
    firstLang.current = lang;
    setMessages((list) => list.map((m) => (m.greeting ? { id: m.id, from: "bot", greeting: m.greeting, ...greet(ctx, m.greeting) } : m)));
  }, [lang, ctx]);

  // Al aparecer el panel: confirmación discreta de lo copiado (el correo o el enlace de LinkedIn), foco y
  // sin avisos pendientes. En pantallas táctiles el foco va al panel y no al campo, para no abrir el
  // teclado sin pedirlo.
  useEffect(() => {
    if (!open || shownSeq.current === seq) return;
    shownSeq.current = seq;
    setUnread(false);
    const copyToast = { email: ["assistant.copied", "assistant.copyFailed"], linkedin: ["assistant.copiedLinkedIn", "assistant.copyLinkedInFailed"] }[entry?.source];
    if (copyToast) setToast(entry.copied === false ? { text: t(copyToast[1]), ok: false } : { text: t(copyToast[0]), ok: true });
    (coarse ? panelRef.current : inputRef.current)?.focus({ preventScroll: true });
  }, [open, seq, entry, coarse, t]);

  // Ya contraído: el foco que estaba en el panel pasa a la burbuja.
  useLayoutEffect(() => {
    if (mode !== "min" || !focusBubble.current) return;
    focusBubble.current = false;
    bubbleRef.current?.focus({ preventScroll: true });
  }, [mode]);

  // La primera vez que se contrae, la hadita dice «¿Hablamos?» un momento (luego, solo al pasar el
  // cursor o al enfocarla), para que se sepa dónde quedó la conversación.
  useEffect(() => {
    if (mode !== "min" || hinted.current) return undefined;
    hinted.current = true;
    if (!hintFits(bubbleRef.current, rootRef.current)) return undefined; // taparía un control o texto
    setHint(true);
    const id = setTimeout(() => setHint(false), 3200);
    return () => { clearTimeout(id); setHint(false); };
  }, [mode]);

  // El aviso dura 2,6 s a la vista. Con la página oculta su tiempo no corre (V6.19): LinkedIn se abre en otra
  // pestaña y el aviso de que su enlace se copió espera a que la persona vuelva.
  useEffect(() => {
    if (!toast) return undefined;
    let id = 0;
    const arm = () => { clearTimeout(id); id = setTimeout(() => setToast(null), 2600); };
    const onVisibility = () => (document.visibilityState === "hidden" ? clearTimeout(id) : arm());
    if (document.visibilityState !== "hidden") arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearTimeout(id); document.removeEventListener("visibilitychange", onVisibility); };
  }, [toast]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(async (raw) => {
    const text = String(raw).trim().slice(0, MAX_LENGTH);
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const { ctx: now, messages: history, reducedMotion: reduced } = latest.current;
    push({ from: "me", text });
    setDraft("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let reply;
    try {
      reply = await askAssistant({ text, ctx: now, history, signal: ctrl.signal, reduced });
    } catch {
      reply = fallbackReply(now);
    }
    if (ctrl.signal.aborted) return;
    busyRef.current = false;
    setBusy(false);
    push({ from: "bot", ...reply });
    if (!openRef.current) setUnread(true);
  }, [push]);

  // Tras enviar, el foco vuelve al campo (en táctil solo si ya estaba ahí: el botón no se lo quita).
  const sendAndRefocus = (text) => {
    send(text);
    if (!coarse) inputRef.current?.focus({ preventScroll: true });
  };

  // Acciones que llevan a otra parte del sitio: el asistente se contrae y la página va hacia allá.
  const go = useCallback((to) => {
    minimize(true);
    const path = to.split("#")[0] || "/";
    const same = path === location.pathname;
    navigate(to);
    if (path === "/video") window.scrollTo(0, 0);
    else if (same && path.startsWith("/proyecto/")) {
      document.getElementById("universo")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [minimize, navigate, location.pathname, reducedMotion]);

  // La conversación sigue al último mensaje; una respuesta larga se muestra desde su principio.
  useLayoutEffect(() => {
    const log = logRef.current;
    const items = log?.querySelectorAll(".msg");
    const last = items?.[items.length - 1];
    if (!last) return;
    const tall = last.classList.contains("msg-bot") && last.offsetHeight > log.clientHeight - 48;
    log.scrollTo({ top: tall ? last.offsetTop - 12 : log.scrollHeight, behavior: reducedMotion || !openRef.current ? "auto" : "smooth" });
  }, [messages, busy, reducedMotion]);

  // El campo crece con el texto (hasta unas cinco líneas).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + el.offsetHeight - el.clientHeight, 132)}px`;
  }, [draft, mode]);

  if (mode === "hidden") return null;

  const last = messages[messages.length - 1];
  const suggestions = !busy && last?.from === "bot" ? last.suggestions || [] : [];

  const onSubmit = (e) => {
    e.preventDefault();
    sendAndRefocus(draft);
  };
  const onInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };
  const onPanelKeyDown = (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    minimize(true);
  };

  return (
    <div className="assistant" ref={rootRef}>
      <section
        id={ids.panel}
        ref={panelRef}
        className={"assistant-panel" + (open ? " is-open" : "")}
        role="dialog"
        aria-modal="false"
        aria-labelledby={ids.title}
        aria-describedby={ids.sub}
        tabIndex={-1}
        inert={open ? undefined : ""}
        onKeyDown={onPanelKeyDown}
      >
        <header className="assistant-head">
          <span className="assistant-avatar" aria-hidden="true"><Fairy /></span>
          <div className="assistant-id">
            <h2 id={ids.title} className="assistant-title">
              {t("assistant.title")} <span className="assistant-badge">{t("assistant.badge")}</span>
            </h2>
            <p id={ids.sub} className="assistant-sub">{t("assistant.subtitle")}</p>
          </div>
          <button type="button" className="icon-btn assistant-min" onClick={() => minimize(true)} aria-label={t("assistant.minimize")} title={t("assistant.minimize")}>
            <IconMinus />
          </button>
        </header>

        <div className="assistant-body">
          <p className={"assistant-toast" + (toast ? " is-shown" : "") + (toast?.ok === false ? " is-error" : "")} aria-hidden="true">
            {toast?.ok && <IconCheck />} {toast?.text}
          </p>
          <div ref={logRef} className="assistant-log" role="log" aria-live="polite" aria-label={t("assistant.log")} tabIndex={0}>
            <div className="assistant-feed">
              {messages.map((m) => (
                <div key={m.id} className={m.from === "me" ? "msg msg-me" : "msg msg-bot"}>
                  <span className="sr-only">{m.from === "me" ? t("assistant.whoMe") : t("assistant.whoBot")} </span>
                  {m.from === "me" ? <p>{m.text}</p> : <MessageText text={m.text} />}
                  {m.actions?.length > 0 && <Actions actions={m.actions} onGo={go} />}
                </div>
              ))}
              {busy && (
                <div className="msg msg-bot msg-typing" aria-hidden="true" title={t("assistant.typing")}>
                  <i /><i /><i />
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="assistant-suggest" role="group" aria-label={t("assistant.suggestions")}>
                  {suggestions.map((s) => (
                    <button key={s} type="button" className="assistant-chip" onClick={() => sendAndRefocus(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <form className="assistant-form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor={ids.input}>{t("assistant.inputLabel")}</label>
          <textarea
            id={ids.input}
            ref={inputRef}
            className="assistant-input"
            rows={1}
            maxLength={MAX_LENGTH}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("assistant.placeholder")}
            enterKeyHint="send"
            autoComplete="off"
          />
          {/* Al tocarlo no se lleva el foco: en móvil el teclado sigue abierto para el siguiente mensaje. */}
          <button type="submit" className="assistant-send" disabled={busy || !draft.trim()} aria-label={t("assistant.send")} title={t("assistant.send")} onPointerDown={(e) => e.preventDefault()}>
            <IconSend />
          </button>
        </form>
      </section>

      <button
        ref={bubbleRef}
        type="button"
        className={"assistant-bubble" + (bubbleShown ? " is-shown" : "") + (hint ? " is-hinting" : "")}
        aria-label={unread ? t("assistant.openUnread") : t("assistant.open")}
        aria-controls={ids.panel}
        aria-haspopup="dialog"
        inert={bubbleShown ? undefined : ""}
      >
        <Fairy />
        <span className="assistant-hint" aria-hidden="true">{t("assistant.hint")}</span>
        {unread && <span className="assistant-dot" aria-hidden="true" />}
      </button>
    </div>
  );
}
