import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <h1>Jonathan Corpus</h1>
      <p className="subtitle">
        Developer | Electronics & Automation Engineer | Systems Administrator
      </p>

      <div className="contact">
        <a href="mailto:Jonathan.Ecorpus@gmail.com">
          Jonathan.Ecorpus@gmail.com
        </a>{" "}
        |{" "}
        <a
          href="http://www.linkedin.com/in/jonathan-corpus-462067237"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
      </div>

      <nav>
        <Link to="/">Proyectos</Link>
        <Link to="/sobremi">Sobre mí</Link>
        <Link to="/video">Video</Link>

        <div className="cv-dropdown">
          <button className="cv-button">Mi CV ▾</button>

          <div className="cv-menu">
            <a href="/JonathanCorpusCV_ESP.pdf" download>
              CV Español
            </a>
            <a href="/JonathanCorpusCV_ENG.pdf" download>
              CV English
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}