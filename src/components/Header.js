import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <h1>Jonathan Corpus</h1>
      <p className="subtitle">Developer | Electronics & Automation Engineer | Systems Administrator </p>
      <div class="contact">
      	<a href="mailto:Jonathan.Ecorpus@gmail.com">Jonathan.Ecorpus@gmail.com</a> | 
      	<a href="http://www.linkedin.com/in/jonathan-corpus-462067237" target="_blank">LinkedIn</a>
      </div>
      <nav>
        <Link to="/">Proyectos</Link>
        <Link to="/sobremi">Sobre mí </Link>
        <Link to="/video">Video</Link>
	<a class="" href="/JonathanCorpusCV.pdf" download>
  		Mi CV
	</a>
      </nav>
    </header>
  );
}
