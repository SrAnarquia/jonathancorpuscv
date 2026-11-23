# Jonathan Corpus · Portafolio (React + Vite + Three.js)

Portafolio profesional con dos capas:

- **Capa profesional** (HTML): nombre, título, propuesta de valor, correo (con botón de copiar), LinkedIn, video de presentación y descarga del CV en español e inglés, visibles desde el primer pantallazo. La barra de navegación (Proyectos · Contacto · Video, más CV, idioma y música) aparece solo cuando se baja, para no repetir lo que ya se ve arriba.
- **Capa inmersiva** (Three.js): un pequeño universo inspirado en *El principito* donde cada planeta es un proyecto real y la nave es el final del viaje (video de presentación, motivaciones, objetivos y contacto). La ficha de cada proyecto tiene una sección **Evidencia** (V6.8): «Ver video» y «Ver imágenes» abren un visor sobre la página con las imágenes y los videos (de YouTube) del proyecto en carrusel, con flechas, teclado y deslizar; nada se incrusta en la ficha ni se descarga antes de abrirlo. Entre planetas, el principito vuela colgado de un ramillete de estrellitas atadas a su mano (como en la ilustración de las aves) y la cámara lo acompaña; en ventanas de escritorio bajas la columna de planetas se compacta para no tapar los controles.

No hay backend ni base de datos: todo el contenido vive en `src/data/`.

## Idioma, música y pantalla completa

- **Idioma:** un solo botón **ES / EN** traduce toda la página (interfaz, proyectos, nave, página del video). No hay páginas separadas en inglés. Se recuerda la elección y, la primera vez, se usa el idioma del navegador. Lo que aún no tenga traducción se muestra en español. Textos en `src/i18n/strings.js`, `src/data/projects.en.js` y `src/data/profile.en.js`.
- **Pantalla completa automática:** la primera interacción directa con el lienzo 3D entra sola en pantalla completa (nativa o, donde no existe, el modo CSS equivalente). Salir queda a un gesto y la salida se respeta: no vuelve a entrar sola. En escritorio la ficha va anclada al lienzo (nunca rebasa sus bordes); en móvil con pantalla completa es una hoja inferior (hasta el 60 % del alto, con la escena arriba) contraíble con el asa; con el celular en horizontal pasa a un panel lateral a todo lo alto, y al salir de pantalla completa se cierra. En la vista de lista (escritorio) la ficha empuja la cabecera y las tarjetas en vez de taparlas, acompaña el desplazamiento pegada bajo la barra y no sale de la sección; dentro de pantalla completa, igual.
- **Modo oscuro:** con `prefers-color-scheme: dark` el papel marfil se vuelve cielo nocturno (azul profundo, estrellas, texto crema, oro claro). El universo 3D, el pie y el reproductor son iguales en ambos temas. `color-scheme: light dark` evita el oscurecido automático de Chrome en Android.
- **Música ambiental:** el archivo `public/musica.mp3` ya viene atenuado al **15 %** del original (el original está en `assets-src/`) y el control arranca al **35 %**; de ahí se sube o se baja. Suena desde el primer toque o tecla (los navegadores no permiten sonido automático). En escritorio, al pasar el cursor sobre el botón aparece el control de volumen y un clic silencia. En pantallas táctiles solo hay encender o apagar. La elección se recuerda y la música se pausa mientras se ve un video o se está en la página del video.
- **Cursor en el universo:** sobre el lienzo 3D el cursor es la mano de arrastrar (girar la vista); al pasar sobre un planeta o su etiqueta se convierte en una navecita, que indica que se puede hacer clic.
- **Pantalla completa del universo:** botón «Pantalla completa» (escritorio) o el ícono de esquinas junto a los controles de zoom (móvil). Se sale con **Espacio**, **Esc**, el botón de minimizar o **Atrás**, y la página vuelve al punto donde estaba (V6.22).
- **Atrás (V6.23 y V6.24):** con la ficha de un planeta abierta o en pantalla completa, el botón o el gesto Atrás las cierra sin salir del portafolio; un Atrás más ya lleva a la página anterior. Cerrar la ficha con la X no deja entradas de más en el historial. Con el visor de evidencias o el video abiertos encima, Atrás los cierra primero y la ficha sigue (V6.24).
- **Modelo 3D en las evidencias:** el brazo del 08 se gira con el dedo (1:1, sin inercia) o con el ratón (inercia breve) y se acerca con pellizco o rueda. Su luz de estudio viene precalculada (`public/modelos/entorno-estudio.bin`), así que abrirlo no congela la página (V6.22; ver `docs/CONTENIDO.md`, sección 17).
- **Asistente de contacto (prototipo):** «Contacto» (barra y menú), copiar el correo o LinkedIn, en el encabezado y en el propio Contacto, llevan a Contacto y abren un asistente propio del sitio con respuestas de ejemplo sacadas de `src/data/`; cada clic en LinkedIn abre además su página en otra pestaña y copia su enlace al portapapeles, y el asistente lo confirma. Al subir a explorar se recoge en una burbuja con una hadita, que se puede arrastrar a donde no estorbe (se pega al lado más cercano y recuerda su sitio durante la visita). No se conecta a ningún servicio todavía: el punto de cambio es `src/lib/assistant.js` (ver `docs/CONTENIDO.md`, sección 14).
- **Video:** página propia en `/video` con el video de presentación embebido (como en la primera versión del sitio). Se llega desde «Video de presentación», junto al correo, y desde «Video» en la barra. Sustituye a la antigua página «Sobre mí» (`/sobremi` redirige al video). La ficha de la nave, dentro del universo, tiene su ruta en `/nave`.

## Ejecutar en local

Requisitos: Node.js 20.19+ o 22.12+ (lo pide Vite 8).

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # valida datos, CV, fuentes de video, modelos 3D y traducciones
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

Pruebas de navegador (opcional, usan Playwright):

```bash
npm i -D playwright && npx playwright install chromium
npm run build && node tests/e2e/serve.cjs         # en otra terminal: dist/ con las cabeceras de vercel.json
BASE=http://localhost:4180 npm run test:e2e
```

`tests/e2e/serve.cjs` sirve `dist/` como lo hará Vercel (misma política de seguridad y mismas reescrituras), así las pruebas también comprueban que la política no bloquee nada. Con `npx vite preview --port 4173` y `BASE=http://localhost:4173` corren igual, pero sin esas cabeceras. Las pruebas esperan a que pase lo que comprueban (que la página se detenga, que termine una animación), no tiempos fijos, así que en una máquina lenta tardan más pero no dan falsos fallos.

## Archivos que debes copiar a `public/`

| Archivo | Para qué | Estado |
|---|---|---|
| `JonathanCorpusCV_ESP.pdf` | Botón «CV en español» | Incluido (CV aprobado el 1 de noviembre de 2026, versión 6.7; desde la 6.20 con el enlace al portafolio en lugar de la ubicación, desde la 6.21 con los íconos de contacto en vector y desde la 6.25 con tu foto nueva). Si falta, el botón se marca como *(pendiente)* |
| `JonathanCorpusCV_ENG.pdf` | Botón «CV in English» | Incluido (CV aprobado el 1 de noviembre de 2026, versión 6.7; desde la 6.20 con el enlace al portafolio en lugar de la ubicación, desde la 6.21 con los íconos de contacto en vector y desde la 6.25 con tu foto nueva) |
| `Me.jpg` | (ya no se usa) | La página «Sobre mí» se quitó; queda una copia recortada en `assets-src/Me.jpg` por si se quiere usar |
| `musica.mp3` | Música de fondo | Incluida, atenuada al 15 % del original (ver `docs/CONTENIDO.md`, sección 10) |

El sitio pregunta al servidor por cada PDF antes de ofrecer la descarga y solo marca el botón como *(pendiente)* si el servidor responde que no está; si la pregunta falla por la red, el enlace se muestra igual (V6.22). `npm test` comprueba además que los dos PDF existan y sean PDF.

## Dónde está cada cosa

```
src/
  data/profile.js      ← nombre, título, correo, LinkedIn, CV, la nave y el video de presentación
  data/projects.js     ← los planetas / proyectos (un objeto por proyecto)
  data/*.en.js         ← traducción al inglés de los dos archivos anteriores
  i18n/                ← textos de la interfaz (strings.js) y selector de idioma
  fonts.css            ← las tipografías (Fraunces y Nunito Sans), alojadas en el sitio desde la V6.23
  assets/fonts/        ← sus archivos .woff2 y sus licencias (OFL)
  lib/video.js         ← convierte la configuración de un video en algo reproducible
  lib/evidence.js      ← las evidencias de un proyecto (videos, imágenes y modelos 3D) tal como las recibe el visor
  lib/assistant*.js    ← asistente de contacto: respuestas de ejemplo (assistantDemo.js) y punto de cambio (assistant.js)
  lib/assetStatus.js   ← cuándo un archivo que se ofrece (el CV) cuenta como «pendiente»
  lib/scrollLock.js    ← candado de desplazamiento compartido (pantalla completa y video)
  lib/viewAnchor.js    ← al cambiar de idioma, lo que estás viendo se queda en su sitio
  three/               ← escena 3D (UniverseScene.js), planetas y nave (worlds.js), texturas generadas (textures.js)
                          y el visor de modelos 3D de las evidencias (ModelViewer.js)
  hooks/               ← música (useMusic), pantalla completa (useFullscreen) y si existe un archivo (useAsset)
  components/          ← interfaz HTML: barra superior, encabezado, universo, ficha, reproductor, visor de evidencias y página del video
public/modelos/        ← modelos 3D (glTF + .bin) y la luz precalculada del visor (entorno-estudio.bin)
assets-src/            ← música original sin atenuar, foto recortada y el script que genera la luz del visor 3D
                          (entorno/hornear-entorno.cjs); nada de esto se publica
tests/                 ← pruebas de datos, video, evidencias, traducciones y asistente (npm test), e2e opcional (tests/e2e/qa.cjs)
                          y el servidor local con las cabeceras de producción (tests/e2e/serve.cjs)
docs/CONTENIDO.md      ← guía para añadir proyectos y sus evidencias (imágenes, videos y modelos 3D)
docs/INFORME.md        ← informe de la auditoría y de los cambios
```

## Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub (sin `node_modules` ni `dist`; `.gitignore` ya los deja fuera). Si el repositorio ya tiene otra versión del sitio, súbela encima sin borrar su historial ni forzar nada, desde la carpeta del proyecto:

   ```
   git remote add origin https://github.com/SrAnarquia/jonathancorpuscv.git
   git fetch origin
   git reset --soft origin/main
   git add -A
   git commit -m "Nueva versión del portafolio"
   git push origin HEAD:main
   ```

   El commit queda con los archivos de esta carpeta, exactamente; lo que solo existía en la versión anterior sale del repositorio (sigue en su historial). Si la carpeta no tiene `.git`, corre antes `git init -b main`.
2. En Vercel: *Add New → Project*, importa el repositorio. `vercel.json` ya define Framework **Vite**, comando `npm run build` y salida `dist`.
3. `vercel.json` también redirige las rutas del sitio (`/proyecto/…`, `/nave`, `/video`, `/sobremi`) a `index.html`, sin tocar los archivos con extensión: un PDF que falte da 404 en lugar de la página.
4. Y manda cabeceras de seguridad en cada respuesta: una política de contenido a la medida del sitio (solo sus propios scripts, estilos y tipografías, más YouTube y Drive), protección para que nadie meta el portafolio dentro de otra página, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. Si agregas otro proveedor de video o, más adelante, el captcha del chat, hay que añadir su dominio: ver `docs/CONTENIDO.md`, sección 15.

Consulta `docs/CONTENIDO.md` para los límites de tamaño y dónde alojar videos grandes.
