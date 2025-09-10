export default function Video() {
  return (
    <section id="video">
      <h2>Video de Presentación</h2>
      
      <div className="video-container">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/Ung1lMjrzko"
          title="Video de Jonathan Corpus"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
