import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import ProjectList from "./ProjectList";
import { IconCollapse, IconExpand, IconHome, IconList, IconMinus, IconOrbit, IconPlus, IconRoute } from "./Icons";

// Capa inmersiva. La escena Three.js se carga bajo demanda (import dinámico) cuando
// la sección se acerca a la pantalla; el resto de la página no la espera.
export default function Universe({
  projects, shipId, selectedId, panelOpen, view, webglOk, tour, reducedMotion, coarse, fullscreen, paused,
  onSelect, onCenter, onStartTour, onToggleView, onToggleFullscreen, onEngage,
}) {
  const { t } = useLang();
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const indexRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | lost | error
  const [attempt, setAttempt] = useState(0);
  const latest = useRef({});
  latest.current = { onSelect, selectedId, panelOpen };

  const show3D = view === "3d" && webglOk;

  // Alto de la lista de planetas en el escenario (--pi-h): con la ficha abierta en escritorio, los botones
  // + y − se colocan justo encima de ella (index.css, V6.16). Cambia con el idioma y con ventanas bajas.
  useEffect(() => {
    const nav = indexRef.current;
    const stage = nav?.parentElement;
    if (!nav || !stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => stage.style.setProperty("--pi-h", `${Math.round(nav.offsetHeight)}px`));
    ro.observe(nav);
    return () => ro.disconnect();
  }, [show3D]);

  // Crear / destruir la escena
  useEffect(() => {
    if (!show3D) return;
    const host = hostRef.current;
    let scene = null;
    let cancelled = false;

    const boot = () => {
      setStatus("loading");
      import("../three/UniverseScene.js")
        .then(async ({ UniverseScene, prepareScene }) => {
          await prepareScene(projects);
          if (cancelled) return;
          scene = new UniverseScene(host, {
            projects,
            shipId,
            reducedMotion,
            coarse,
            onSelect: (id) => latest.current.onSelect(id),
            onReady: () => setStatus("ready"),
            onContextLost: () => setStatus("lost"),
          });
          sceneRef.current = scene;
          if (latest.current.selectedId) scene.focus(latest.current.selectedId);
        })
        .catch((err) => {
          console.error("No se pudo iniciar la escena 3D", err);
          if (!cancelled) setStatus("error");
        });
    };

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); boot(); }
    }, { rootMargin: "400px" });
    io.observe(host);

    return () => {
      cancelled = true;
      io.disconnect();
      scene?.dispose();
      sceneRef.current = null;
    };
    // La escena no depende del idioma ni de projects (solo cambian los textos, ver abajo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show3D, attempt]);

  useEffect(() => { sceneRef.current?.focus(selectedId); }, [selectedId, status]);
  useEffect(() => { sceneRef.current?.setReducedMotion(reducedMotion); }, [reducedMotion]);
  // Con el video abierto encima, el universo deja de dibujar (sigue donde iba al cerrarlo).
  useEffect(() => { sceneRef.current?.setPaused(paused); }, [paused, status]);

  // Etiquetas de los planetas en el idioma activo.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const names = Object.fromEntries(projects.map((p) => [p.id, p.planet.name]));
    names[shipId] = t("universe.ship");
    s.setLabels(names, t("universe.aria"));
  }, [projects, shipId, t, status]);

  // Encuadre: centra el planeta en la parte del lienzo que la ficha deja libre.
  useEffect(() => {
    let raf = 0;
    const apply = () => {
      raf = 0;
      const s = sceneRef.current, host = hostRef.current;
      if (!s || !host) return;
      const wide = window.matchMedia("(min-width: 960px)").matches;
      const r = host.getBoundingClientRect();
      const sheet = panelOpen ? document.querySelector(".sheet")?.getBoundingClientRect() : null;
      const bar = fullscreen ? null : document.querySelector(".topbar:not(.is-hidden)")?.getBoundingClientRect();
      const top = Math.max(r.top, bar ? bar.bottom : 0);
      if (!sheet) return s.setViewShift(0, wide ? -40 : 0);
      // Celular en pantalla completa (V6.13): los controles del universo flotan sobre el cielo, así que la
      // franja libre empieza debajo de ellos, y la escena recibe su alto para alejar la cámara si el planeta
      // no cabe. En escritorio el encuadre sigue como estaba.
      const tools = fullscreen && !wide ? host.closest(".universe")?.querySelector(".universe-tools")?.getBoundingClientRect() : null;
      const underTools = tools?.height ? tools.bottom + 8 : 0;
      // Ficha a un lado (escritorio y, desde la V6.13, celular apaisado): el planeta se centra en lo que
      // queda a su izquierda. Si es la hoja inferior (empieza en el borde izquierdo), en lo que queda encima.
      if (wide || sheet.left > r.left + r.width * 0.3) {
        const free = Math.min(r.right, sheet.left) - r.left;
        const visTop = Math.max(top, underTools) - r.top, visBottom = Math.min(r.bottom, window.innerHeight) - r.top;
        s.setViewShift(r.width / 2 - free / 2, r.height / 2 - (visTop + visBottom) / 2, wide ? 0 : Math.max(1, visBottom - visTop));
      } else {
        const visTop = Math.max(top, underTools) - r.top;
        const visBottom = Math.min(r.bottom, sheet.top) - r.top;
        s.setViewShift(0, r.height / 2 - (visTop + visBottom) / 2, Math.max(1, visBottom - visTop));
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    const timer = setTimeout(apply, 350); // tras la animación de entrada de la ficha / pantalla completa
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [panelOpen, status, selectedId, fullscreen]);

  // Escritorio: si al bajar con la rueda el desplazamiento se detiene cerca del universo, la página termina
  // de acomodarse para que el lienzo quede pegado a la barra, sin franja de fondo entre ambos. Solo al
  // acercarse (bajando desde el encabezado o subiendo desde el contacto), nunca al alejarse, para no
  // «atrapar» el desplazamiento como haría scroll-snap. Y solo tras la rueda: un desplazamiento que no
  // viene de ella (el ajuste del navegador cuando cambia el alto de lo que hay arriba, p. ej. al cambiar
  // de idioma, o un scrollIntoView propio) no debe mover la página.
  useEffect(() => {
    if (!show3D || fullscreen || !window.matchMedia("(min-width: 901px)").matches) return;
    let dir = 0, timer = 0, lastWheel = -Infinity;
    const settle = () => {
      timer = 0;
      const host = hostRef.current;
      if (!host) return;
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar")) || 62;
      const offset = host.getBoundingClientRect().top - bar;
      const near = window.innerHeight * 0.35;
      const approaching = (dir > 0 && offset > 1 && offset <= near) || (dir < 0 && offset < -1 && -offset <= near);
      if (approaching) window.scrollTo({ top: window.scrollY + offset, behavior: reducedMotion ? "auto" : "smooth" });
    };
    const onWheel = (e) => {
      if (e.ctrlKey || !e.deltaY) return; // Ctrl + rueda acerca la escena, no desplaza
      lastWheel = performance.now();
      dir = e.deltaY > 0 ? 1 : -1;
    };
    const onScroll = () => {
      if (performance.now() - lastWheel > 400) return; // no lo movió la rueda: se deja el temporizador que hubiera
      clearTimeout(timer);
      timer = setTimeout(settle, 160);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("wheel", onWheel); window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [show3D, fullscreen, reducedMotion]);

  // En móvil, al abrir una ficha se lleva el escenario al inicio de la pantalla para que el planeta quede visible.
  useEffect(() => {
    if (!panelOpen || !show3D || fullscreen || window.matchMedia("(min-width: 960px)").matches) return;
    const r = hostRef.current?.getBoundingClientRect();
    if (r && Math.abs(r.top - 62) > 40) hostRef.current.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [panelOpen, selectedId, show3D, reducedMotion, fullscreen]);

  const highlight = (id) => sceneRef.current?.setHighlight(id);
  const zoom = (f) => sceneRef.current?.zoomBy(f);
  const order = [...projects.map((p) => ({ id: p.id, name: p.planet.name })), { id: shipId, name: t("universe.ship") }];

  return (
    <section
      id="universo"
      className={"universe" + (show3D ? " is-3d" : " is-list") + (selectedId ? " is-focused" : "") + (fullscreen ? " is-fs" : "")}
      aria-labelledby="universe-title"
    >
      <div className="universe-head">
        <p className="eyebrow">{t("universe.eyebrow")}</p>
        <h2 id="universe-title">{t("universe.title")}</h2>
        <p className="universe-sub">{t("universe.sub")}</p>
        <div className="universe-tools" role="group" aria-label={t("universe.controls")}>
          <button type="button" className={"chip-btn" + (tour ? " is-on" : "")} aria-pressed={tour} onClick={onStartTour}>
            <IconRoute /> {tour ? t("universe.tourOn") : t("universe.tour")}
          </button>
          <button type="button" className="chip-btn" onClick={onCenter} disabled={!selectedId && !panelOpen}>
            <IconHome /> {t("universe.center")}
          </button>
          {webglOk && (
            <button type="button" className="chip-btn" onClick={onToggleView} aria-pressed={view === "list"}>
              {view === "3d" ? <><IconList /> {t("universe.listView")}</> : <><IconOrbit /> {t("universe.view3d")}</>}
            </button>
          )}
          <button type="button" className={"chip-btn fs-btn" + (fullscreen ? " is-on" : "")} aria-pressed={fullscreen} onClick={onToggleFullscreen}>
            {fullscreen ? <><IconCollapse /> {t("universe.exitFullscreen")}</> : <><IconExpand /> {t("universe.fullscreen")}</>}
          </button>
        </div>
        {fullscreen && !coarse && <p className="fs-hint">{t("universe.fsHint")}</p>}
      </div>

      {show3D ? (
        <div className="universe-stage">
          <div ref={hostRef} className="universe-canvas" key={attempt} onPointerUp={onEngage} />

          {status !== "ready" && status !== "idle" && (
            <div className="universe-status" role="status">
              {status === "loading" && <p>{t("universe.loading")}</p>}
              {(status === "lost" || status === "error") && (
                <>
                  <p>{status === "lost" ? t("universe.lost") : t("universe.error")}</p>
                  <div className="row-actions">
                    <button type="button" className="btn btn-gold" onClick={() => setAttempt((a) => a + 1)}>{t("universe.retry")}</button>
                    <button type="button" className="btn btn-secondary" onClick={onToggleView}>{t("universe.asList")}</button>
                  </div>
                </>
              )}
            </div>
          )}

          <nav ref={indexRef} className="planet-index" aria-label={t("universe.planets")}>
            <ol>
              {order.map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    data-planet={o.id}
                    className={selectedId === o.id ? "is-active" : ""}
                    aria-current={selectedId === o.id ? "true" : undefined}
                    onClick={() => onSelect(o.id)}
                    onMouseEnter={() => highlight(o.id)}
                    onMouseLeave={() => highlight(null)}
                    onFocus={() => highlight(o.id)}
                    onBlur={() => highlight(null)}
                  >
                    <span className="pi-num" aria-hidden="true">{o.id === shipId ? "✦" : String(i + 1).padStart(2, "0")}</span>
                    <span className="pi-name">{o.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="zoom" role="group" aria-label={t("universe.zoom")}>
            <button type="button" className="icon-btn" onClick={() => zoom(0.85)} aria-label={t("universe.zoomIn")}><IconPlus /></button>
            <button type="button" className="icon-btn" onClick={() => zoom(1.18)} aria-label={t("universe.zoomOut")}><IconMinus /></button>
            <button type="button" className="icon-btn fs-icon" onClick={onToggleFullscreen} aria-label={fullscreen ? t("universe.exitFullscreen") : t("universe.fullscreen")} aria-pressed={fullscreen}>
              {fullscreen ? <IconCollapse /> : <IconExpand />}
            </button>
          </div>

          <p className="universe-hint" aria-hidden="true">
            {coarse ? t("universe.hintTouch") : t("universe.hintMouse")}
          </p>
        </div>
      ) : (
        <div className="universe-listwrap">
          {!webglOk && <p className="note">{t("universe.noWebgl")}</p>}
          <ProjectList projects={projects} selectedId={selectedId} shipId={shipId} onSelect={onSelect} />
        </div>
      )}
    </section>
  );
}
