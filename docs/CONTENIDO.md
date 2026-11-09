# Guía de contenido

Todo el contenido se edita en archivos de datos y no hace falta tocar componentes:

- `src/data/projects.js`: los planetas (proyectos).
- `src/data/profile.js`: tus datos, el CV, la nave y el video de presentación.
- `src/data/projects.en.js` y `src/data/profile.en.js`: la versión en inglés de los dos anteriores (ver sección 9).
- `src/i18n/strings.js`: los textos de la interfaz (botones, avisos, menús) en español e inglés.

Después de cualquier cambio ejecuta `npm test`: comprueba que no falten campos, que los ids no se repitan, que los videos estén bien configurados y que los archivos locales que mencionas existan en `public/`.

---

## 1. Añadir un proyecto (y su planeta)

Agrega un objeto al arreglo `PROJECTS`. El orden del arreglo es el orden del recorrido guiado y de la numeración (01, 02…). La nave siempre va al final, después del último proyecto.

```js
{
  id: "mi-proyecto",                         // único, minúsculas y guiones. URL: /proyecto/mi-proyecto
  planet: {
    name: "Mi proyecto",                     // nombre corto que aparece junto al planeta
    kind: "generic",                         // escena 3D: robot | finance | meal | supply | factory | scada | health | vr | generic
    color: "#86c9a8", color2: "#4f9c7b",     // color principal y sombra de la acuarela
    icon: "🛰️",                              // icono de la ficha y de la vista de lista
  },
  tag: "Empresa o tipo de proyecto",
  title: "Título de la ficha",
  summary: "Descripción breve (una o dos frases).",
  problem: "Qué problema resolvía.",          // opcional
  contribution: "Qué hice yo exactamente.",   // opcional; varios párrafos: sepáralos con "\n\n"
  tech: ["Tecnología 1", "Tecnología 2"],     // opcional
  highlights: ["Resultado verificable", "…"], // opcional: «Puntos clave»
  learnings: "Lo que aprendí.",               // opcional
  images: [],                                 // opcional, ver sección 3
  video: null,                                // opcional, ver sección 4
  models: [],                                 // opcional: modelo 3D que se gira, ver sección 17
  links: [{ label: "Repositorio", href: "https://…" }], // opcional, solo https
  story: "Frase corta para el recorrido guiado.",       // opcional
}
```

Los campos opcionales vacíos no se muestran, así que una ficha nunca tiene secciones en blanco.

`problem`, `contribution` y `learnings` admiten varios párrafos: escribe una línea en blanco entre ellos (`"Primer párrafo.\n\n" + "Segundo párrafo."`); la ficha los muestra como párrafos separados (V6.9). Lo mismo vale para su traducción en `projects.en.js`.

**Fichas puntuales (V6.14, regla de Jonathan):** cada ficha deja solo lo que importa y las tecnologías. El resumen es una frase; el problema, una o dos; «Mi contribución», uno o dos párrafos cortos; los puntos clave, de 4 a 5, cada uno con una sola idea y, si la hay, su cifra; y `tech` lleva la lista completa de tecnologías. Registro formal, sin diminutivos ni expresiones coloquiales. `npm test` lo comprueba en español y en inglés: hasta 180 palabras entre resumen, problema, contribución y puntos clave, hasta 2 párrafos, hasta 5 puntos clave y hasta 18 palabras por punto.

### Vincular el planeta con una escena

`planet.kind` elige la pequeña escena que se dibuja sobre el planeta. Las existentes:

| kind | Escena | Proyecto actual |
|---|---|---|
| `robot` | brazo robótico articulado | Robot 6-DOF |
| `finance` | columnas de datos y anillo | Finanzas y datos |
| `meal` | letrero con patrón tipo QR, árboles y tazón | MealFlow |
| `supply` | cajas apiladas y cinturón de cajas en órbita | Supply Chain Hub |
| `factory` | fábrica con humo y engrane | Mantenimiento KIA |
| `scada` | antena con ondas de señal | SCADA y planta |
| `health` | rosa bajo campana de cristal y onda tipo EEG | Hospital UANL |
| `vr` | jaula de malla virtual y visor VR | VR y la nave |
| `generic` | planeta con anillo sencillo | (para nuevos proyectos) |

Para crear una escena nueva, añade una función en `src/three/worlds.js` siguiendo el patrón de las demás (devuelve `{ group, update(t) }`), regístrala en `SCENES` y, si quieres, dale un tamaño en `SIZES`. Agrega el nuevo `kind` a la lista `KINDS` de `tests/data.test.js`.

Las órbitas se calculan solas según la posición en el arreglo; no hay coordenadas que mantener.

---

## 2. Datos personales, CV y nave

En `src/data/profile.js`:

- `email`, `linkedin`, `links` (otros enlaces profesionales, por ejemplo `{ label: "GitHub", href: "https://github.com/…" }`).
- `cv.es.href` y `cv.en.href`: rutas a los PDF dentro de `public/`.
- `ship`: textos de la escena final (introducción, motivación, objetivos).
- `presentationVideo`: el video personal (ver sección 5).

---

## 3. Evidencias de un proyecto: imágenes (V6.8)

Las imágenes y los videos de un proyecto **no se incrustan en la ficha** (en un celular serían un desastre). La ficha muestra, justo después de «Tecnologías», una sección **«Evidencia»** con dos botones, **«Ver video»** (o «Ver videos (n)») y **«Ver imagen»** (o «Ver imágenes (n)»), que abren el **visor**: una ventana sobre la página, como la del video de la nave, donde todas las evidencias del proyecto (primero los videos, luego las imágenes y al final los modelos 3D) pasan como carrusel con flechas, con ← → en el teclado o deslizando con el dedo o el ratón. Arriba va el título del proyecto y el contador (por ejemplo «2 / 3»); abajo, el pie de cada imagen o el título del video. Se cierra con Escape, con la X o tocando fuera, y el foco vuelve al botón. Nada se descarga hasta que el visitante abre el visor, y solo se monta lo que se está viendo (una imagen o un video). Si un proyecto no tiene evidencias, la sección no aparece. Desde la V6.16 puede haber un tercer botón, **«Ver modelo 3D»**, para un modelo que se gira dentro del visor (sección 17).

Para añadir imágenes:

1. Guarda la imagen en `public/images/proyectos/<id-del-proyecto>/` (JPG o WebP para fotos y capturas, PNG para diagramas con texto; idealmente de 1600 px de ancho o menos y menos de 400 KB; sin metadatos). Por ejemplo, las del Robot 6-DOF están en `public/images/proyectos/robot-6dof/`.
2. Añádela al proyecto, con su texto alternativo (`alt`, lo que leen los lectores de pantalla; obligatorio) y su pie (`caption`, lo que se ve bajo la imagen en el visor):

```js
images: [
  { src: "/images/proyectos/robot-6dof/app-y-robot.jpg", alt: "Captura de la prueba: la app de escritorio…", caption: "La prueba en vivo: …" },
  { src: "/images/proyectos/robot-6dof/diagrama.png", alt: "Diagrama de arquitectura: …", caption: "Arquitectura: …" },
],
```

3. Traduce `alt` y `caption` en `src/data/projects.en.js`: los arreglos se sustituyen completos, así que ahí se repite el `src` de cada imagen (ver sección 9).
4. `npm test` comprueba que cada archivo exista en `public/`, que esté en `/images/` y que tenga `alt`.

Las fotos y capturas que incluyan a otras personas o datos ajenos (nombres, correos, cifras de la empresa) conviene recortarlas o difuminarlas antes de subirlas.

---

## 4. Evidencias de un proyecto: videos

Los videos van en el campo `videos` (una lista, para poder poner varios) y se abren en el mismo visor que las imágenes, con el reproductor correspondiente (controles nativos para archivos; el de YouTube o Drive en un iframe). Lo recomendable es **subirlos a YouTube** (pueden ser «No listados») y poner aquí solo el enlace: así la página no carga ningún video hasta que alguien lo abre y el sitio sigue siendo ligero.

```js
videos: [
  { type: "youtube", id: "TdU0hq1quLo", title: "Demostración del robot controlado desde la app" },
],
```

El `title` es lo que se lee bajo el video en el visor (y el título del iframe); se traduce en `projects.en.js` repitiendo `type` e `id`. El campo antiguo `video` (un solo video, sin lista) sigue funcionando y se muestra antes que los de `videos`.

Hay cuatro tipos de fuente. Cambiar de una a otra solo requiere editar la entrada.

### a) YouTube (`youtube`), el recomendado

```js
{ type: "youtube", id: "TdU0hq1quLo", title: "…" },   // o url: "https://www.youtube.com/watch?v=TdU0hq1quLo" o "https://youtu.be/…"
```

Se usa `youtube-nocookie.com`. Si el video es «No listado», funciona igual; si es «Privado», no.

### b) Archivo incluido en el sitio (`file`)

Solo para videos cortos y ligeros (por ejemplo, menos de 20–30 MB), en `public/videos/`.

```js
{ type: "file", src: "/videos/robot.mp4", poster: "/videos/robot.jpg", title: "Robot respondiendo desde la app" },
```

### c) URL pública directa a un archivo (`url`)

Para videos grandes alojados en un almacenamiento de objetos con CDN (Cloudflare R2, Bunny, S3 + CloudFront…). Debe ser un enlace **directo** al archivo `.mp4`/`.webm` y con `https://`.

```js
{ type: "url", src: "https://media.tudominio.com/robot.mp4", title: "…" },
```

### d) Google Drive (`drive`)

Se muestra con el reproductor de vista previa de Drive dentro de un iframe. No se trata como un MP4, porque una página de vista previa no es un archivo de video.

```js
{ type: "drive", url: "https://drive.google.com/file/d/ID_DEL_ARCHIVO/view?usp=sharing", title: "…" },
// o bien: { type: "drive", id: "ID_DEL_ARCHIVO" }
```

En Drive, el archivo debe estar compartido como **«Cualquier persona con el enlace: Lector»**. Drive puede tardar en procesar videos recién subidos y a veces limita la reproducción de archivos muy vistos; por eso no se recomienda como única opción.

### Sin video

```js
videos: [],
```

Si añades otro proveedor de video (Vimeo, por ejemplo), hay que permitir su dominio en la política de contenido de `vercel.json` (sección 15); YouTube y Drive ya están.

---

## 5. Cambiar el video de presentación

El video de presentación se muestra en la página `/video` (embebido, como en la primera versión del sitio) y en la ficha de la nave (en una ventana). Se configura una sola vez:

En `src/data/profile.js`, `presentationVideo` acepta exactamente las mismas fuentes que un video de evidencia. Hoy apunta al video de YouTube que ya tenías (`kB4uux4evWQ`). Para usar un archivo propio:

```js
presentationVideo: { type: "file", src: "/videos/presentacion.mp4", poster: "/videos/presentacion.jpg", title: "Video de presentación de Jonathan Corpus" },
```

Si lo pones en `null`, la nave muestra «El video de presentación se publicará pronto» en lugar de un botón roto.

---

## 6. Añadir un video desde tu celular

1. **Pásalo a la computadora** (AirDrop, cable, Google Fotos, Drive…).
2. **Compáctalo para la web.** Un video de celular suele pesar 100–400 MB por minuto; para la web basta 1080p o 720p. Con [HandBrake](https://handbrake.fr) (gratis): preset *Web → Creator 1080p60* o *720p30*, formato MP4, activa *Web Optimized*. Con ffmpeg:

   ```bash
   ffmpeg -i IMG_1234.MOV -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -movflags +faststart robot.mp4
   ffmpeg -i robot.mp4 -ss 00:00:02 -frames:v 1 -q:v 3 robot.jpg     # imagen de portada (opcional)
   ```

   Los `.MOV` del iPhone en HEVC no se reproducen en todos los navegadores; conviértelos siempre a MP4 (H.264).
3. **Elige dónde alojarlo:**
   - Si pesa poco (≈ menos de 20–30 MB): cópialo a `public/videos/` y usa `type: "file"`.
   - Si pesa más: súbelo a Cloudflare R2 (sección 7) y usa `type: "url"`.
   - Alternativa rápida: súbelo a Drive o como «No listado» a YouTube y usa `type: "drive"` o `type: "youtube"`.
4. Edita el campo `video` del proyecto, ejecuta `npm test` y `npm run dev` para verlo.

### Por qué no meter videos pesados en Git ni en el despliegue

- GitHub rechaza archivos de más de 100 MB y avisa a partir de 50 MB; además, cada versión del video queda para siempre en el historial.
- En el plan Hobby de Vercel, la subida de archivos estáticos por CLI está limitada a 100 MB por despliegue (1 GB en Pro), según su [página de límites](https://vercel.com/docs/limits) consultada en octubre de 2026. Revisa esa página antes de añadir muchos videos, porque los límites cambian.

---

## 7. Configurar una URL pública (Cloudflare R2)

R2 es almacenamiento de objetos sin costo de salida de datos. Según la [página de precios de R2](https://developers.cloudflare.com/r2/pricing) (octubre de 2026), el plan gratuito incluye 10 GB-mes de almacenamiento, 1 millón de operaciones clase A y 10 millones clase B al mes, y la salida de datos es gratuita.

1. Crea una cuenta de Cloudflare y, en el panel, entra en **R2 Object Storage → Create bucket** (por ejemplo `portafolio-media`).
2. Sube tus `.mp4` y portadas `.jpg` desde el panel (*Upload*).
3. Haz el bucket público:
   - Opción simple: en *Settings → Public access*, activa el dominio **r2.dev**. Cloudflare lo recomienda solo para pruebas (tiene límites de uso).
   - Opción recomendada: conecta un **dominio propio** (*Settings → Custom Domains*, p. ej. `media.tudominio.com`). Requiere que el dominio esté en Cloudflare y activa la caché de su CDN.
4. Copia la URL pública del archivo (`https://media.tudominio.com/robot.mp4`) y úsala con `type: "url"`.
5. Si el navegador muestra un error de CORS al reproducir, añade en *Settings → CORS policy* una regla que permita `GET` y `HEAD` desde el dominio de tu portafolio.

No subas archivos privados ni pongas credenciales de R2 en el código: el sitio solo necesita la URL pública.

---

## 8. Ejecutar y desplegar

Ver el `README.md` en la raíz del proyecto.

---

## 9. Traducciones (botón ES / EN)

El botón de idioma cambia todo el sitio sin crear páginas aparte. El contenido base está en español y el inglés se **superpone campo por campo**: si un texto no tiene traducción, se muestra en español, nunca en blanco.

- **Proyecto nuevo:** después de agregarlo en `projects.js`, añade en `projects.en.js` un bloque con el mismo `id` y traduce solo los campos de texto (`tag`, `title`, `summary`, `problem`, `contribution`, `highlights`, `tech`, `learnings`, `story`, `planet.name`, `links[].label`, `images[].alt`, `images[].caption`, `videos[].title`, `models[].alt`, `models[].caption`). Las listas deben tener el mismo número de elementos que en español; `images`, `videos` y `models` se sustituyen completos, así que en inglés se repiten `src`, `type`, `id` y `poster`. `npm test` avisa si falta alguna traducción o si una evidencia traducida no coincide con la original.
- **Perfil y nave:** `profile.en.js` (mismos nombres de campo que `profile.js`).
- **Interfaz:** `strings.js` tiene una sección `es` y otra `en` con las mismas claves; `npm test` comprueba que no falte ninguna.
- **Idioma inicial:** el que el visitante eligió la última vez; si es la primera visita, el del navegador (inglés si empieza por «en», español en los demás casos).
- **Orden de los CV:** en inglés, el botón «CV EN» pasa a ser el principal.

## 10. Música

- Archivo que suena: `public/musica.mp3`. Es el original atenuado al **15 %** (−17 dB). El control de volumen arranca al **35 %** (tu ajuste) (`DEFAULT_VOLUME` en `src/hooks/useMusic.js`) y de ahí se sube o se baja. El original sin atenuar está en `assets-src/musica-original.mp3` (no se publica).
- Para cambiar el porcentaje del archivo, vuelve a generarlo desde el original (por ejemplo al 40 %):

  ```bash
  ffmpeg -i assets-src/musica-original.mp3 -map_metadata 0 -af "volume=0.40" -c:a libmp3lame -b:a 128k -ar 44100 public/musica.mp3
  ```

  Si cambias el archivo, cambia también la clave `KEY` en `src/hooks/useMusic.js` (por ejemplo a `jc-music-5`) para que los visitantes que ya tenían un volumen guardado arranquen de nuevo con el valor inicial.
- El navegador solo deja sonar tras un gesto del visitante, así que arranca al primer toque o tecla.
- Escritorio: al pasar el cursor aparece el control de volumen; un clic en el botón silencia o reactiva. Móvil y tabletas táctiles: solo encender o apagar.
- La música se pausa mientras se ve un video (ventana o página `/video`) y se reanuda al salir.
- El estado (silenciada y volumen) se guarda en el navegador del visitante.

## 11. Pantalla completa, overlay y modo oscuro (V4.4)

- **Entrada automática:** `Home.jsx` (`engageCanvas`) escucha `pointerup` del lienzo (`Universe.jsx`, prop `onEngage`). Un desplazamiento de página sobre el lienzo emite `pointercancel`, no `pointerup`, así que no dispara nada. Tras salir una vez, `autoFsBlocked` impide reentrar en toda la visita.
- **Ficha anclada (escritorio):** el contenedor `.universe-wrap` lleva la clase `is-3d`; con `min-width: 960px`, `.universe-wrap.is-3d .sheet` pasa a `position: absolute` dentro de la sección. En móvil la regla de escritorio `top: 16px` de pantalla completa quedó limitada a `min-width: 960px` (era la que dejaba la ficha arriba tapando la escena).
- **Ficha móvil:** en pantalla completa `max-height: min(60svh, 600px)` (V6.13; antes 44svh). Cabecera compacta (icono, etiqueta y X en una fila y el título debajo) solo en fichas angostas: hasta 599 px de ancho o celular en horizontal. Con el celular en horizontal (hasta 959 × 500 px) la ficha es un panel lateral de `--side-sheet: min(400px, 52vw)` y el zoom y la lista se recorren; la cámara encuadra el planeta en el espacio libre entre los controles y la ficha (`setViewShift(x, y, banda)` en `Universe.jsx`, `bandFit()` en `UniverseScene.js`). El asa es un botón (`.sheet-grip-btn`) que alterna `is-collapsed` (oculta cuerpo y navegación). Al salir de pantalla completa en pantalla táctil, `Home.jsx` cierra la ficha.
- **Modo oscuro:** todo vive en variables de `:root` en `src/index.css`; el bloque `@media (prefers-color-scheme: dark)` redefine papel/tinta/línea, aclara `--gold-deep` (ahí es texto) y añade `--stars`. El texto sobre oro usa `--on-gold`, constante en ambos temas. `index.html` declara `color-scheme: light dark` y dos `theme-color`. Para probar en el navegador: DevTools → Rendering → Emulate CSS prefers-color-scheme.

## 12. La ficha en la vista de lista y el chip de música de noche (V4.5)

- **Rejilla superpuesta:** con `min-width: 960px`, `.universe-wrap:not(.is-3d)` es `display: grid` de una sola celda (`grid-template-rows: max-content`); la sección y la ficha comparten esa celda (`grid-area: 1 / 1`). La ficha pasa a `position: sticky` (`top: calc(var(--topbar) + 14px)`; en pantalla completa `16px`) con `justify-self: end` y alto de la ventana menos la barra. Al ser pegajosa dentro de la celda, nunca sale de la sección.
- **Por qué `max-content`:** en pantalla completa el contenedor tiene alto fijo (100 %); con una fila `auto` la sección quedaba recortada a esa altura y la lista no se podía desplazar.
- **Empuje:** `Home.jsx` añade `has-sheet` al contenedor cuando hay ficha abierta; con esa clase `.universe-head` y `.universe-listwrap` reciben `padding-right: calc(min(590px, 50vw) - 50vw + min(460px, 40vw) + 44px)` (bloque centrado de 1180 px, ancho de la ficha `min(460px, 40vw)`, su margen de 16 px y 28 px de aire), con transición. La rejilla `auto-fill` reacomoda las columnas sola.
- **Móvil (< 960 px):** nada de esto aplica; la ficha sigue siendo la hoja inferior fija.
- **Música de noche:** el chip encendido toma borde y fondo de `--music-on-border` y `--music-on-bg`; el bloque oscuro los baja a oro al 45 % y al 7 %. De día no cambia nada.
- **Pista:** `public/musica.mp3` es la versión al 15 %; `KEY = "jc-music-4"` en `src/hooks/useMusic.js`.

## 13. La lista de planetas en ventanas bajas y el vuelo con estrellitas (V4.6)

- **Ventana baja (ajustado en la V6):** en `src/index.css`, el bloque `@media (min-width: 901px) and (max-height: 760px)` mantiene la columna `.planet-index` en su sitio (abajo a la izquierda) pero compacta: filas de 27 px y 0.8rem, menos aire en la cápsula, y `max-height: calc(100% - 225px)` con `overflow-y: auto` (sin barra visible) para que, si la ventana es aún más baja, la columna se desplace en vez de salirse. El encabezado del universo se recoge en esas ventanas (menos `padding-top`, título `clamp(1.5rem, 2.4vw, 1.9rem)`, subtítulo 0.92rem) para dejar sitio; la pista de uso (`.universe-hint`) se oculta y el alto del escenario es `100vh − barra − 8px` (los 8 px son el `scroll-padding-top` de `html`), mínimo 520 px. Para cambiar el umbral de «ventana baja», cambia el `max-height: 760px` del bloque. En la 4.6 este bloque convertía la lista en una fila horizontal; se descartó.
- **Botones con fondo:** `.universe.is-3d .universe-tools .chip-btn:not(.is-on)` lleva `background: rgba(20, 29, 54, 0.42)` y `backdrop-filter: blur(6px)` en escritorio; el encendido (dorado) no cambia.
- **Los brazos del principito (V6):** `buildPrince()` en `src/three/worlds.js` construye dos brazos con `buildArm(side)`: hombro (esfera), brazo (cilindro de 0.15), grupo `elbow` con antebrazo (0.13), puño dorado y mano. `pose(fly)` fija los ángulos: en reposo el brazo cae 22° separado del cuerpo (`ARM_DOWN`) y el antebrazo gira hacia dentro (`ELBOW_Z`) y al frente (`ELBOW_X`); con `fly` → 1 el derecho se alza recto (`ARM_UP`) y el izquierdo va un poco hacia atrás. La mano derecha (`hand`) es el origen de los hilos. Para cambiar la pose, toca esas cuatro constantes.
- **Las estrellitas:** `buildStarKite()` (mismo archivo) crea 11 sprites con la textura `starTexture()` (estrella de cinco puntas con halo, generada en `textures.js`) y un `LineSegments` con un hilo por estrella desde la mano. Vive en coordenadas de mundo; `update(t, hand, dir, up, fly, release, e)` lo coloca en la mano, lo orienta con el «arriba» del principito y el rumbo, mece y titila las estrellas, y con `release` (al final) las eleva mientras los hilos se desvanecen. Para cambiar cuántas son o cuánto se abren, edita `N` y el vector `base` de cada una; los colores están en el `SpriteMaterial`. La inclinación del ramillete respecto al principito sale de la componente `z` de `base` (en la V6, `0.5 + 0.35·|spread| + …`, antes `0.7 + 0.5·|spread| + …`: menos adelantadas, unos 60° a media travesía) y del `rotateX(-0.18 + 0.36·e)` (antes `-0.3 + 0.65·e`); la inclinación del cuerpo en vuelo es el `0.28` de `updatePrince` en `UniverseScene.js` (antes `0.4`).
- **El vuelo:** en `UniverseScene.js`, `focus(id)` arranca el vuelo (`princeT0`, `arcH`: altura del arco, 22 % de la distancia hasta 7 unidades) y `updatePrince(now)` lo lleva con el mismo reloj y duración (1,7 s) que la cámara, en arco y con el cuerpo inclinado hacia el rumbo; `fly` sube en el primer 12 % del viaje y baja en el último 18 % (`release`). Si llamas a `focus` en pleno vuelo, sigue desde la posición actual.
- **Cámara:** en `updateCamera`, mientras hay vuelo el punto al que mira sube con el arco (`follow`: 70 % de `arcH`; 100 % cuando la ficha deja poca franja visible, medido con `bandK` a partir del desplazamiento de encuadre). Con poca franja el ramillete se escala a 0,65. Para que el principito suba más o menos, cambia el 0.22 y el 7 de `arcH`; para que la cámara lo siga más, el 0.7 de `follow`.
- **Prueba del vuelo (`tests/e2e/qa.cjs`):** usa `page.clock` de Playwright para avanzar el tiempo a mano y `Page.captureScreenshot` por CDP (con el reloj en pausa `page.screenshot` se queda esperando un cuadro). Cuenta píxeles blancos en la franja libre del lienzo (x 230–930, y 120–540 a 1440 × 900): en vuelo deben ser al menos 150 más que en reposo y que tras aterrizar, y tras aterrizar menos de 100. Si cambias el encuadre o el color de las estrellitas, revisa esos umbrales.


## 14. Asistente de contacto (V6.4, prototipo sin conexiones; V6.6: entradas y hadita móvil)

- **Cambiar las respuestas:** todo está en `src/lib/assistantDemo.js`. `TEXT` tiene los textos en español (`es`) y en inglés (`en`), con las mismas claves (una prueba lo comprueba); lo que va entre llaves (`{first}`, `{email}`, `{planet}`…) se rellena con datos del sitio. `INTENTS` son las palabras clave de cada tipo de pregunta, sin acentos y en minúsculas (`trabaj*` acepta cualquier palabra que empiece así); el orden importa: gana la primera que coincida. `PROJECT_KEYS` son las palabras que identifican cada proyecto, además del nombre de su planeta. Los datos (nombre, puesto, proyectos, CV, correo, LinkedIn) salen de `src/data/`, así que si cambias un proyecto el asistente lo sabe sin tocar nada más. Tras editar, corre `npm test`: comprueba que cada sugerencia siga teniendo respuesta propia y que contacto siempre ofrezca el correo y LinkedIn.
- **Textos de la interfaz** (título, «Demo», «Respuestas de ejemplo», «¿Hablamos?», etiquetas para lectores de pantalla): claves `assistant.*` de `src/i18n/strings.js`.
- **Conectar la integración real (cuando toque):** la interfaz solo usa `askAssistant({ text, ctx, history, signal })` de `src/lib/assistant.js`, que debe devolver una promesa con `{ text, actions?, suggestions? }` (formato al inicio de `assistantDemo.js`). Basta con cambiar su cuerpo por una llamada a una función de Vercel (por ejemplo `/api/contacto`) pasando `signal` para poder cancelarla; si la promesa falla, la interfaz ya muestra una salida amable con el correo y LinkedIn (`fallbackReply`). Las claves (Gemini, captcha, Apps Script) viven solo en la función, como variables de entorno de Vercel, nunca con prefijo `VITE_` (todo lo que lleva `VITE_` acaba en el navegador). Al hacerlo: cambia `ASSISTANT_MODE` y los textos `assistant.badge`/`assistant.subtitle` para que ya no diga «Demo», y actualiza a conciencia la prueba «en esta fase no hay conexiones externas» de `tests/assistant.test.js`, que hoy falla a propósito si aparece un `fetch`. Si la ruta `/api/...` acabara sirviendo `index.html`, añade `api/` a la exclusión del `rewrites` de `vercel.json`.
- **Por dónde se abre (V6.6):** «Contacto» en la barra y en el menú del celular, el botón de copiar el correo y LinkedIn, tanto en el encabezado como en el propio Contacto (y en el menú del celular). Todo eso está en el objeto `contact` de `src/App.jsx` (`onContact`, `onCopy`, `onLinkedIn`), que reciben `TopBar`, `Home` y `Footer`. «Contacto» sigue siendo el enlace a `/#contacto` (cierra la ficha abierta y deja la dirección) y además abre el asistente; con Ctrl/⌘ o clic central es solo el enlace. El saludo depende de la entrada (`demoGreeting` en `assistantDemo.js`: `email`, `linkedin`, `contact` o la burbuja) y solo la primera vez por visita; después cada entrada solo añade lo que aporte algo (LinkedIn, el enlace; el resto, nada).
- **LinkedIn: otra pestaña, enlace copiado y asistente (V6.19):** cada clic en cualquier LinkedIn de la página (encabezado, menú del celular y Contacto) abre LinkedIn en otra pestaña (lo hace el propio enlace, con `target="_blank"`, así que ningún bloqueador de ventanas lo detiene) y, en esta pestaña, copia la URL al portapapeles dentro del mismo clic, lleva a Contacto y abre el asistente. La copia es `copyInClick` en `src/components/ContactActions.jsx`: primero `execCommand("copy")`, que es síncrono y no depende del foco, y si falla `navigator.clipboard`, que puede rechazarlo cuando la página ya quedó detrás de la pestaña nueva. El asistente lo confirma con el aviso «Enlace de LinkedIn copiado» (`assistant.copiedLinkedIn`) y en el saludo (`greetLinkedIn`), y ofrece el enlace. El aviso dura 2,6 s a la vista; mientras la página está oculta (la persona está en LinkedIn) su tiempo no corre, así que lo ve al volver. Los clics siguientes hacen lo mismo y el asistente añade un mensaje corto con el enlace (`againLinkedIn`). Si el navegador no deja copiar, lo dice (`assistant.copyLinkedInFailed`, `greetLinkedInFail`, `againLinkedInFail`) y ofrece el enlace igual. Con Ctrl/⌘, Shift o clic central es solo el enlace. Hasta la V6.18 el primer clic no salía del sitio y los siguientes iban directo a LinkedIn sin copiar nada.
- **La hadita se puede mover (V6.6):** con el dedo o el ratón; al soltarla se pega al lado más cercano de la ventana, a esa altura, sin salirse ni meterse bajo la barra, y ahí se queda el resto de la visita (también al reabrir y contraer, y al recargar: `sessionStorage`, clave `jc-assistant-bubble`, con `{ side, frac }`, la altura como fracción del recorrido para que sirva en otra ventana). Un toque sin arrastre la sigue abriendo (umbral de 6 px, `DRAG_START` en `src/hooks/useBubbleDrag.js`). Mientras no se mueva, sigue apartándose sola de los controles; una vez movida manda la persona (`data-placed`) y solo la pantalla completa la esconde. Los cálculos puros (`snapBubble`, `bubblePlacement`) están en `src/lib/assistantDock.js` y tienen prueba unitaria. En el CSS, `--dx`/`--dy` son el desplazamiento desde su esquina y `[data-dragging]` el aspecto mientras se arrastra (atributos `data-*` y no clases, porque la clase del botón la escribe React en cada render); con `data-side="left"` la pista «¿Hablamos?» pasa a su derecha.
- **Comportamiento ajustable:** cuánto hay que subir para que se minimice es `awayThreshold` en `src/hooks/useAssistantDock.js` (hoy el 22 % del alto de la ventana, entre 140 y 260 px); los elementos que la burbuja no debe tapar, `AVOID` en el mismo archivo; la pausa de «escribiendo», `typingDelay` en `src/lib/assistant.js`; tamaños y colores, la sección «Asistente de contacto» al final de `src/index.css` (`.assistant-panel`, `.assistant-bubble` y el bloque de celular).
- **Pruebas e2e del asistente:** en `tests/e2e/qa.cjs`, secciones «Asistente» (escritorio, con los casos V6.6 de la barra y del pie), «LinkedIn», el bucle de celular (menú: correo y «Contacto»), «V6.6: «Contacto» como primera entrada» y «V6.6: la hadita se puede mover» (ratón y toques reales por CDP en dos celulares); `assistantProbe()` mide si está abierto o minimizado, si Contacto está a la vista y si la burbuja tapa algo.

## 15. Seguridad al publicar: cabeceras y política de contenido (V6.5)

- **Dónde está:** la primera regla de `headers` en `vercel.json` (la de `"source": "/(.*)"`) manda en cada respuesta la política de contenido (`Content-Security-Policy`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` (sin cámara, micrófono, ubicación, pagos ni USB). Las reglas de caché de `/assets/` y `/videos/` siguen igual. `npm run dev` no aplica estas cabeceras; Vercel sí, y también el servidor de prueba (abajo).
- **Qué permite cada parte de la política:**

  | Directiva | Qué deja cargar |
  |---|---|
  | `default-src 'self'` | Por omisión, solo archivos del propio sitio. |
  | `script-src 'self'` | Solo los scripts del sitio (el paquete de Vite). Ningún script en línea ni de otro dominio. |
  | `style-src 'self' https://fonts.googleapis.com` | La hoja de estilos del sitio y la de Google Fonts. Un `<style>` o un atributo `style="…"` escritos en el HTML se ignoran (por eso el aviso sin JavaScript de `index.html` usa la clase `.noscript`); los estilos que pone React desde JavaScript (`style={{…}}`) sí funcionan. |
  | `font-src 'self' https://fonts.gstatic.com` | Las tipografías (Fraunces y Nunito Sans). |
  | `img-src 'self' data: https:` | Imágenes del sitio, las incrustadas en el CSS (el cursor de la nave) y las de cualquier dominio con https (por si una imagen de proyecto vive fuera). |
  | `media-src 'self' https:` | La música y los videos de `public/`, y los videos por URL pública (`type: "url"`, p. ej. Cloudflare R2). |
  | `frame-src https://www.youtube-nocookie.com https://drive.google.com` | Los reproductores incrustados: YouTube (sin cookies) y Google Drive. |
  | `connect-src 'self'` | Peticiones solo al propio sitio (hoy, la comprobación de que los PDF existen; mañana, `/api/contacto`). |
  | `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` | Nada de complementos antiguos, ni cambiar la base de los enlaces, ni formularios hacia fuera. |
  | `frame-ancestors 'none'` | Ninguna otra página puede meter el portafolio dentro de un marco (protege contra el *clickjacking*). |
  | `upgrade-insecure-requests` | Si algo se pidiera por `http://`, el navegador lo pide por `https://`. |

- **Modelos 3D (V6.16):** la política no permite direcciones `blob:` ni WebAssembly. Por eso los modelos van en glTF con su `.bin` y sus texturas en archivos aparte, sin Draco ni meshopt (sección 17), y se descargan del propio sitio (`connect-src 'self'`). No hace falta abrir la política para un modelo nuevo.
- **Añadir otro proveedor de video:** agrega su dominio a `frame-src`, separado por un espacio. Vimeo: `https://player.vimeo.com`; Loom: `https://www.loom.com`. Un video por URL directa (R2 u otro https) ya está cubierto por `media-src`.
- **Si algún día quieres mostrar el portafolio dentro de otra página** (un marco en otro sitio): cambia `frame-ancestors 'none'` por los dominios que sí puedan hacerlo (por ejemplo `frame-ancestors https://ejemplo.com`) y quita la cabecera `X-Frame-Options`. Los enlaces y las vistas previas al compartir (LinkedIn, WhatsApp) no usan marcos y funcionan igual.
- **Cuando llegue el chat real:** Cloudflare Turnstile necesita `https://challenges.cloudflare.com` en `script-src` y en `frame-src`. Gemini se llama desde la función de Vercel (`/api/contacto`), nunca desde el navegador, así que `connect-src 'self'` ya alcanza y la clave no sale del servidor.
- **Probarla en tu equipo antes de publicar:** `npm run build && node tests/e2e/serve.cjs` sirve `dist/` en http://localhost:4180 con las mismas cabeceras y reescrituras de `vercel.json`. Abre la consola del navegador: cualquier cosa que la política bloquee aparece como «Refused to …». Las pruebas e2e contra ese servidor (`BASE=http://localhost:4180 npm run test:e2e`) recorren el sitio y fallan si hay una sola violación.

## 16. Rendimiento y robustez (V6.5)

- **Bloquear el desplazamiento de la página:** siempre con `lockScroll()` de `src/lib/scrollLock.js`, que devuelve su propia función para liberar. Lo usan la pantalla completa y el reproductor de video; si algún día hay otra capa que tape la página (un menú, otro diálogo), que lo use también. No escribas `document.body.style.overflow` a mano: dos capas que se cierran en distinto orden dejaban la página congelada.
- **Cambiar de idioma sin mover la página:** `setLang` (`src/i18n/index.jsx`) mide lo que hay en el centro de la pantalla antes del cambio y lo devuelve a su sitio antes de pintar (`src/lib/viewAnchor.js`). Funciona igual en Safari, que no tiene el anclaje de desplazamiento de Chrome.
- **El universo 3D:** `prepareScene()` (en `UniverseScene.js`) pinta las acuarelas de los planetas una por una, dejando respirar a la página entre una y otra, y las guarda: al volver de la lista a 3D ya no se repintan. Los shaders se compilan en segundo plano si el navegador lo permite. La escena se pausa con `setPaused(true)` mientras el video está abierto encima (`Universe.jsx`, prop `paused`) y al cerrarse suelta su contexto WebGL (`dispose()` → `forceContextLoss()`).
- **El viaje del asistente a Contacto:** se da por llegado cuando la página de verdad se detiene (`onScrollSettled` en `src/lib/assistantDock.js`: unos cuadros quieta, o el evento `scrollend` donde existe), no tras un tiempo fijo, así que en un equipo lento no se adelanta.
- **Encabezado en celulares angostos:** los dos CV van lado a lado mientras quepan enteros (`min-width: max-content`, relleno lateral corto que solo se nota cuando van justos) y, si no, cada uno en su fila; nunca se encogen sus iconos. El correo se parte solo antes de la @ (`EmailText` en `ContactActions.jsx`). Si cambias los textos de esos botones, revisa 320 y 360 px en los dos idiomas (las pruebas e2e lo hacen).
- **Propiedades con prefijo en el CSS:** escribe solo la estándar (por ejemplo `backdrop-filter`); la compilación añade la versión `-webkit-` para Safari. Si las escribes las dos a mano con la de Safari al final, la compilación se queda solo con esa y Chrome pierde el efecto (pasaba con el desenfoque de la barra oscura y de los controles sobre el 3D).
- **Pruebas e2e:** esperan condiciones (que la página se detenga con `scrollRest`, que terminen las animaciones con `uiRest`, `until` para cualquier otra), no tiempos fijos; si algo revienta a mitad imprimen igual el resumen de lo que ya pasó. El bloque «V6.5» repite cada caso de la auditoría.

## 17. Evidencias de un proyecto: modelo 3D (V6.16; modelo nuevo en la V6.17)

Un proyecto puede tener un modelo 3D que el visitante gira arrastrando con el dedo o el ratón y acerca con pellizco o con la rueda. Va en el campo `models` y aparece en el mismo visor, después de los videos y las imágenes, con su botón «Ver modelo 3D» en la ficha. Hoy lo tiene el 08, con tu brazo de 6 DOF (V6.17; en la V6.16 era el de Meshy AI).

```js
models: [
  { src: "/modelos/vr-nave/brazo.gltf",                       // el .gltf; su .bin (y sus texturas, si tiene) van en la misma carpeta
    poster: "/images/proyectos/vr-nave/modelo-brazo-3d.jpg",  // imagen fija mientras carga, o si no se puede mostrar
    alt: "Modelo 3D interactivo del brazo robótico de 6 DOF…", // obligatorio, para lectores de pantalla
    caption: "Modelo 3D del brazo de 6 DOF…: gíralo…" },       // el pie bajo el modelo
],
```

Cómo se comporta:

- Ni el código 3D (three.js y su cargador) ni el modelo se descargan hasta que alguien llega a esa evidencia. Mientras carga se ve el `poster` con «Cargando el modelo 3D…».
- Al abrirse gira solo, despacio, hasta que la persona lo toca. Con «reducir movimiento» activado en el sistema no gira solo.
- Arrastrar sobre el modelo lo gira y no cambia de evidencia. Para pasar a otra quedan las flechas y el teclado.
- Si el navegador no tiene WebGL o el modelo no carga, se queda el `poster` con un aviso.
- Siempre lleva la etiqueta «Modelo de demostración · en proceso» (`evidence.modelBadge` en `src/i18n/strings.js`). Si algún día es el modelo final, cambia ese texto.
- Al cerrar el visor o cambiar de evidencia se libera todo, también el contexto WebGL.

El formato importa, por la política de contenido del sitio (sección 15):

- **glTF con archivos aparte:** el `.gltf`, su `.bin` y las texturas en `.jpg` o `.png`, todo en `public/modelos/<id-del-proyecto>/`. **No uses `.glb`:** three.js abre las texturas que van dentro de un `.glb` con una dirección `blob:`, la política no la permite y el modelo se vería sin texturas o no cargaría.
- **Sin compresión Draco ni meshopt, ni texturas KTX2 o Basis:** sus decodificadores usan WebAssembly, que la política tampoco permite. Para que pese poco se usa la cuantización (`KHR_mesh_quantization`), que three.js lee sin decodificador.
- **Con normales** (la información de sombreado de cada vértice). Sin ellas, three.js muestra el modelo facetado, como de papel doblado. El exportador glTF de Blender las incluye (opción «Normals»); con «Shade Auto Smooth» antes de exportar, las curvas se ven suaves y las aristas, marcadas.
- **Menos de 2.5 MB en total.** `npm test` comprueba el peso, que existan los archivos y que el modelo no use nada de lo anterior. Para el 08 también comprueba que sea tu brazo (sus piezas por nombre), con normales y sin texturas.

Desde Blender: Archivo → Exportar → glTF 2.0, con el formato «glTF Separate (.gltf + .bin + textures)» y sin «Compression». Conviene reducir antes las texturas a 1024 px y los triángulos con el modificador «Decimate».

Cómo se preparó el brazo del 08 (V6.17): tu archivo `brazo_robot_6dof_v2 1.glb` (453 KB, unos 26 mil triángulos, sin texturas) no traía normales. Se le calcularon con pliegue a 35° (las caras que se unen con menos de 35° se ven continuas; las demás, como arista) y se pasó a glTF con su `.bin`. Después, con gltf-transform: `weld`, `center` (la base en el suelo), `dedup`, `prune` y `quantize` (posiciones a 14 bits y normales a 8). Quedó en 490 KB sin perder ningún triángulo; las normales son lo que suma. La imagen fija (`modelo-brazo-3d.jpg`) es un render del mismo modelo, con la misma vista con la que abre el visor.

El de la V6.16 (Meshy AI) partía de un FBX de 18.8 MB con tres texturas: se leyó con el `FBXLoader` de three.js, las texturas se bajaron a 1024 px en JPG y se simplificó al 20 % de los triángulos. Quedó en 1.6 MB. Su render, que era la imagen 3 del 08, salió en la V6.18 porque ya no era el mismo modelo.
