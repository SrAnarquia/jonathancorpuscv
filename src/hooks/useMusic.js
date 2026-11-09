import { useCallback, useEffect, useRef, useState } from "react";

// Música de fondo. El archivo public/musica.mp3 ya viene atenuado al 15 % del original
// (ver docs/CONTENIDO.md) y el control arranca al 35 %; de ahí se sube o se baja. Un clic
// silencia y, en escritorio, se ajusta el volumen. La preferencia se recuerda.
export const DEFAULT_VOLUME = 0.35;
const KEY = "jc-music-4"; // v4: la pista pasa a la versión al 15 %; se descartan los volúmenes guardados de versiones anteriores

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      muted: !!s.muted,
      volume: typeof s.volume === "number" && s.volume >= 0 && s.volume <= 1 ? s.volume : DEFAULT_VOLUME,
    };
  } catch {
    return { muted: false, volume: DEFAULT_VOLUME };
  }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
}

export function useMusic() {
  const audioRef = useRef(null);
  const [{ muted, volume }, setPref] = useState(load);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const pref = useRef({ muted, volume });
  pref.current = { muted, volume };
  const pausedForVideo = useRef(false);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a || pref.current.muted) return Promise.resolve(false);
    a.volume = pref.current.volume;
    if (!a.paused) return Promise.resolve(true);
    return a.play().then(() => { setPlaying(true); return true; }).catch(() => false);
  }, []);

  // Intenta sonar al abrir. Si el navegador lo bloquea, suena en el primer clic o tecla.
  useEffect(() => {
    play();
    // El primer gesto del visitante arranca la música, salvo sobre el propio control de música o si está
    // silenciada o pausada por un video: en esos casos se sigue esperando al siguiente gesto.
    const first = (e) => {
      if (e.target?.closest?.(".music")) return;
      if (pref.current.muted || pausedForVideo.current) return;
      play().then((ok) => { if (ok) off(); });
    };
    const off = () => {
      window.removeEventListener("pointerdown", first);
      window.removeEventListener("keydown", first);
    };
    window.addEventListener("pointerdown", first);
    window.addEventListener("keydown", first);
    return off;
  }, [play]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => { setError(true); setPlaying(false); };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("error", onError);
    };
  }, []);

  // Un clic silencia si está sonando y activa si no (incluido el caso de «esperando el primer gesto»).
  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    const sounding = !!a && !a.paused && !pref.current.muted;
    const next = sounding;
    setPref((p) => { const s = { ...p, muted: next }; save(s); return s; });
    pref.current = { ...pref.current, muted: next };
    if (next) { a?.pause(); setPlaying(false); }
    // Si el archivo no existe o no se puede reproducir, el evento `error` del <audio> ya marca el estado;
    // una promesa de play() rechazada por una pausa inmediata (p. ej. al abrir un video) no es un error.
    else play();
  }, [play]);

  const setVolume = useCallback((v) => {
    const vol = Math.min(1, Math.max(0, v));
    const a = audioRef.current;
    if (a) a.volume = vol;
    setPref((p) => { const s = { ...p, volume: vol, muted: false }; save(s); return s; });
    pref.current = { volume: vol, muted: false };
    if (a?.paused) play();
  }, [play]);

  // Pausa mientras se ve un video y reanuda al cerrarlo.
  const suspend = useCallback(() => {
    const a = audioRef.current;
    pausedForVideo.current = !!a && !a.paused;
    a?.pause();
  }, []);
  const resume = useCallback(() => {
    if (pausedForVideo.current && !pref.current.muted) play();
    pausedForVideo.current = false;
  }, [play]);

  return { audioRef, playing, muted, volume, error, toggleMute, setVolume, suspend, resume };
}
