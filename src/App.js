import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Projects from "./components/Projects";
import AboutMe from "./components/AboutMe";
import Footer from "./components/Footer";
import Video from "./components/Video";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* Página principal */}
        <Route
          path="/"
          element={
            <main>
	      
              <Projects />
              
            </main>
          }
        />

      {/* Página de Video */}
      <Route path="/video" element={<Video />} />
      
      {/* Página de sobre mí*/}
      <Route path="/sobremi"  element={<AboutMe/>}/>	

      </Routes>
      <Footer />
    </>
  );
}
