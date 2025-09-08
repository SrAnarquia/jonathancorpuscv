export default function AboutMe() {
  return (
    <section
      id="sobremi"
      style={{
        textAlign: "center",      // centra todo horizontalmente
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      {/* Imagen y título en el mismo renglón */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <img
          src="/Me.jpg"
          alt="Jonathan Corpus"
          style={{
            width: "auto",
            height: "150px",
            
          }}
        />
        <h2 style={{ margin: 0, background: "linear-gradient(90deg, #2563eb, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Sobre mí
        </h2>
      </div>

      {/* Texto debajo */}
      <div>
        <p>
          Soy Ingeniero en Electrónica y Automatización con experiencia en desarrollo de sistemas embebidos, administración de sistemas y soluciones web. Mi trayectoria no se limita al desarrollo: también he trabajado en áreas técnicas como mecánica automotriz, análisis de datos, planeación e innovación tecnológica.
        </p>
        <p>
          Me especializo en proyectos que optimizan procesos internos y mejoran la comunicación en entornos industriales y de salud. He colaborado con empresas e instituciones como <strong>KIA México</strong>, <strong>Hospital Universitario UANL</strong> y <strong>AT&T</strong>, implementando herramientas digitales que incrementan la eficiencia y reducen tiempos.
        </p>
        <p>
          Amo lo que hago, disfruto enfrentar nuevos retos y siempre busco proponer mejoras mediante la tecnología, sin importar el contexto o la complejidad del proyecto. Mi enfoque combina pasión, creatividad y eficiencia para generar soluciones reales y de impacto.
        </p>
      </div>
    </section>
  );
}
