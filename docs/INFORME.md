# Informe de entrega: portafolio de Jonathan Corpus

Fecha: 8 de noviembre de 2026. Base: `jonathancorpusV3.rar` (carpeta `portafolio-vite`). Última revisión: versión 6.20 (sobre la 6.19; la numeración salta de 4.6 a 6 a petición tuya; música: pista al 15 % y control al 35 %, sin cambios).

## Versión 6.20: «Portafolio» en lugar de la ubicación en tu CV

Lo que pediste el 8 de noviembre, sobre la V6.19: quitar la ubicación del CV para que todo ese espacio sea del portafolio.

| Qué pediste | Cómo queda |
|---|---|
| **«Portafolio» en lugar de la ubicación.** | La fila de contacto de tu CV queda con cuatro datos: teléfono, correo, «Video Introducción» y «Portafolio» («Portfolio» en inglés). El portafolio lleva su globo, va subrayado y enlaza a https://jonathancorpuscv.vercel.app/ en el PDF y en el Word. La ubicación salió.<br><br>• **Vuelve a 9 puntos**, el tamaño de tu CV aprobado. En la V6.19 había bajado a 8 para que cupieran cinco datos.<br>• **Parejo:** los cuatro ocupan la misma franja que en tu CV aprobado, de la orilla del teléfono a la orilla derecha, con el mismo espacio entre uno y otro.<br>• **Lo demás no se movió:** comparé tu CV aprobado con el nuevo píxel por píxel y solo cambia la fila de contacto. El QR, la foto, el nombre y el cuerpo quedan igual, y todo sigue en una página.<br><br>Los botones de descarga del portafolio ya entregan estos CV. |

Lo que no se tocó:

- El resto del sitio: lo compilado es idéntico al de la V6.19, salvo los dos PDF del CV.
- En tu experiencia, la línea de Alfa conserva «General Escobedo, N.L» como lugar de ese proyecto, igual que en tu CV aprobado.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `public/JonathanCorpusCV_ESP.pdf` y `_ENG.pdf`: los CV nuevos.
- `README.md` y este informe.
- Fuera del zip, en `entregas/cv-2026-11/`: `JonathanCorpusCV_ESP` y `_ENG` en PDF y Word, y `fuente-cv-2026-11.zip` con la fuente para regenerarlos (su `LEEME.md` explica el cambio y cómo volver a la versión con la ubicación).

Pruebas:

- Unitarias: 43/43 (`npm test`).
- e2e: 418/418 a la primera, contra el servidor con las cabeceras de producción y en PC y celular, incluidos los botones de descarga de los dos CV.
- CV: los dos idiomas en una página y sin bullets de más de una línea; el Word, revisado con su render de LibreOffice; los tres enlaces del PDF (correo, video y portafolio) apuntan a donde deben.
- Build y unitarias repetidas desde un extracto limpio del zip.

Qué verificar a mano:

- El encabezado de tu CV, en PDF y Word y en los dos idiomas.

## Versión 6.19: la captura de Pedidos, LinkedIn arriba y abajo, y el enlace al portafolio en tu CV

Lo que pediste el 8 de noviembre, sobre la V6.18:

- Corregir la captura de Pedidos, que salía recortada.
- Que LinkedIn, arriba y abajo, avise que copió el enlace, abra LinkedIn en otra pestaña y abra el asistente en tu página.
- Agregar a tu CV, en español y en inglés, el enlace a tu portafolio junto a tu ubicación, con su ícono, parejo y sin mover el QR.

| Qué pediste | Cómo queda |
|---|---|
| **La captura de Pedidos.** | Sí se veía recortada: el corte pasaba por en medio del formulario y dejaba medio campo de «Tipo de servicio». Ahora termina en el fondo limpio, justo debajo del recuadro de la cámara, así que se ve completa: el encabezado con el botón de regreso y el recuadro que lee el QR del gafete. El pie dice lo que se ve, en los dos idiomas.<br><br>El formulario no se puede mostrar entero con esta captura: la miniatura flotante que deja el celular al tomar otra captura quedó encima del campo «Seleccionar servicio». No la tapé ni la retoqué, para que la evidencia siga siendo auténtica. |
| **LinkedIn, arriba y abajo.** | Cada clic en LinkedIn, en el encabezado, en Contacto y en el menú del celular, hace las tres cosas:<br><br>• **Abre LinkedIn en otra pestaña.** Lo hace el propio enlace, así que ningún bloqueador de ventanas lo detiene.<br>• **Copia el enlace al portapapeles** en el mismo clic.<br>• **En tu página, abre el asistente en Contacto**, con el aviso «Enlace de LinkedIn copiado» y un mensaje que lo confirma y ofrece el enlace.<br><br>El aviso no se consume mientras la persona está en LinkedIn: espera a que vuelva a tu página y entonces dura sus 2,6 segundos. Si el navegador no deja copiar, el asistente lo dice y ofrece el enlace igual. Antes, el primer clic no salía de tu página y los siguientes iban directo a LinkedIn, sin aviso. |
| **El enlace al portafolio en tu CV.** | Junto a tu ubicación va «Portafolio» («Portfolio» en inglés), con un ícono de globo del mismo estilo de línea que los demás y subrayado como «Video Introducción». Lleva a https://jonathancorpuscv.vercel.app/ en el PDF y en el Word, en los dos idiomas.<br><br>• **Parejo:** los cinco datos ocupan la misma franja que antes, de la orilla del teléfono a la orilla derecha, con el mismo espacio entre uno y otro.<br>• **Para que quepan los cinco en una línea**, la fila de contacto bajó de 9 a 8 puntos (el tamaño de los bullets) y los íconos se ajustaron en proporción.<br>• **Lo demás no se movió:** comparé tu CV aprobado con el nuevo píxel por píxel y solo cambia la fila de contacto. El QR, la foto, el nombre y el cuerpo quedan igual, y todo sigue en una página.<br><br>Los botones de descarga del portafolio ya entregan los CV nuevos. |

Lo que no se tocó:

- El correo y su botón de copiar, el resto del asistente y las demás evidencias.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `public/images/proyectos/mealflow/pedidos.jpg`: el recorte nuevo. `src/data/projects.js` y `projects.en.js`: su descripción y su pie.
- `src/components/ContactActions.jsx`: LinkedIn abre la pestaña, copia el enlace y avisa al asistente (`copyInClick`). `src/App.jsx`: sin la regla de «solo la primera vez». `src/components/ContactAssistant.jsx`: el aviso espera mientras la página está oculta. `src/components/TopBar.jsx`, `Hero.jsx` y `Footer.jsx`: el menú del celular y comentarios.
- `src/lib/assistantDemo.js` y `src/i18n/strings.js`: los mensajes de LinkedIn y su texto para lectores de pantalla, en los dos idiomas.
- `public/JonathanCorpusCV_ESP.pdf` y `_ENG.pdf`: los CV nuevos.
- Pruebas: `tests/assistant.test.js` y `tests/e2e/qa.cjs`.
- `README.md`, `docs/CONTENIDO.md` (sección 14, LinkedIn) y este informe.
- Fuera del zip, en `entregas/cv-2026-11/`: `JonathanCorpusCV_ESP` y `_ENG` en PDF y Word, y `fuente-cv-2026-11.zip` con la fuente para regenerarlos (su `LEEME.md` explica el cambio y cómo volver a la fila de cuatro datos).

Pruebas:

- Unitarias: 43/43 (`npm test`). Las del asistente comprueban los mensajes nuevos de LinkedIn, con copia y sin ella, en los dos idiomas.
- e2e: 418/418 a la primera, contra el servidor con las cabeceras de producción y en PC y celular. Las comprobaciones de LinkedIn se reescribieron para lo nuevo, arriba y en Contacto:
  - cada clic abre LinkedIn en otra pestaña, deja el enlace en el portapapeles, muestra el aviso y abre el asistente en Contacto con su mensaje;
  - el aviso espera mientras la página está oculta y se va solo al volver;
  - un segundo clic hace lo mismo;
  - el texto para lectores de pantalla avisa las tres cosas.
- CV: los dos idiomas en una página y sin bullets de más de una línea; el Word, revisado con su render de LibreOffice; los tres enlaces del PDF (correo, video y portafolio) apuntan a donde deben.
- Build y unitarias repetidas desde un extracto limpio del zip.

Qué verificar a mano:

- LinkedIn, arriba y en Contacto, en Chrome de PC y en tu celular: se abre LinkedIn en otra pestaña y, al volver, ves el aviso y el asistente abierto en Contacto. Pega el enlace en cualquier lado para comprobar la copia.
- La captura de Pedidos en el 03 (imagen 3 de 3).
- El encabezado de tu CV, en PDF y Word y en los dos idiomas: «Portafolio» junto a tu ubicación y su enlace.

## Versión 6.18: el 08 sin la imagen de Meshy AI

Lo que pediste el 8 de noviembre, sobre la V6.17: quitar del 08 la imagen de Meshy AI, que ya no es tu modelo.

| Qué pediste | Cómo queda |
|---|---|
| **Quitar la imagen de Meshy AI.** | El 08 queda con tres evidencias: el video de YouTube, la captura de Unity y tu modelo 3D. La ficha ofrece «Ver video», «Ver imagen» y «Ver modelo 3D», en español y en inglés, y el visor cuenta de 1 / 3 a 3 / 3.<br><br>El archivo de la imagen también salió del sitio, así que ya no se publica. |

Lo que no se tocó:

- Todo lo demás de la V6.17.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `src/data/projects.js` y `projects.en.js`: la imagen fuera del 08. `public/images/proyectos/vr-nave/modelo-brazo.jpg`: borrada.
- Pruebas: `tests/evidence.test.js` y `tests/e2e/qa.cjs`, con las 3 evidencias del 08.
- `docs/CONTENIDO.md` (una línea en la sección 17) y este informe.

Pruebas:

- Unitarias: 43/43 (`npm test`). La del 08 ahora también comprueba que la imagen de Meshy AI ya no está.
- e2e: 418/418 a la primera, contra el servidor con las cabeceras de producción y en PC y celular. Las 7 comprobaciones del 08 cuentan ahora sus 3 evidencias («Ver imagen» en singular y el visor de 1 / 3 a 3 / 3).
- Build y unitarias repetidas desde un extracto limpio del zip.

Qué verificar a mano:

- El 08: los tres botones de «Evidencia» y el visor, de 1 / 3 a 3 / 3.

## Versión 6.17: tu brazo de 6 DOF en 3D, las capturas de MealFlow, la aleta de la nave y una auditoría visual

Lo que pediste el 8 de noviembre, sobre la V6.16:

- Usar en el visor del 08 el modelo 3D que mandaste (`brazo_robot_6dof_v2 1.glb`) en lugar del de Meshy AI.
- Usar las capturas de MealFlow que anexaste.
- Corregir la aleta de la nave que estaba mal diseñada.
- Auditar los elementos visuales de cada parte del proyecto y corregir lo que se vea raro.

| Qué pediste | Cómo queda |
|---|---|
| **Tu modelo 3D.** | Tu brazo de 6 DOF reemplaza al de Meshy AI en el visor del 08: base, seis servos, soportes de aluminio y pinza.<br><br>• **Se ve liso, con aristas definidas.** Tu archivo no traía normales (la información de sombreado), así que el navegador lo habría mostrado facetado. Las calculé con pliegue a 35°: las piezas curvas se ven suaves y las esquinas de los soportes, marcadas.<br>• **Pesa 490 KB**, contra 1.6 MB del anterior, con sus 26 mil triángulos completos. Va sin texturas, como tu archivo, con sus materiales (aluminio negro y plata, servos, tornillos, engranes y goma de la pinza).<br>• **Abre de tres cuartos**, centrado y completo, con la pinza a la derecha. Se gira, se acerca y lleva la etiqueta «Modelo de demostración · en proceso», como antes.<br>• **Imagen fija nueva:** un render del mismo modelo, que se ve mientras carga o si el navegador no puede mostrar 3D. |
| **Las capturas de MealFlow.** | Las dos capturas de tu celular van en el visor del 03, después de la de precios: ahora es «Ver imágenes (3)».<br><br>• **Desayunos:** la lectura del QR del gafete, el precio manual y los botones «Enviar» e «Historial».<br>• **Pedidos especiales:** la misma lectura del QR y el formulario, que empieza por el tipo de servicio.<br><br>Recorté la barra de estado del celular (hora, batería y notificaciones) y la de navegación; en la de pedidos, también la miniatura de captura que quedó abajo. El recuadro de la cámara aparece en negro en las capturas, y el pie lo aclara. |
| **La aleta de la nave.** | Era una de las de abajo: estaba girada hacia dentro y su punta salía por el centro de la parte trasera, en el resplandor del motor, donde la marcaste. Rehíce las tres:<br><br>• **Iguales y a 120°** (una arriba y dos abajo), con el mismo perfil y el borde biselado.<br>• **Nacen del casco en todo su largo:** la raíz sigue la curva de la nave, sin huecos ni puntas que la atraviesen.<br>• **Una tobera en la cola**, de donde ahora sale el resplandor del motor (antes salía del casco desnudo).<br>• **La ventanilla queda al ras del casco**, con su aro dorado parejo; antes se hundía más de un lado. |
| **La auditoría visual.** | Revisé de cerca cada planeta, el principito, la nave, las etiquetas y la interfaz, en PC y en celular. Corregí:<br><br>• **01 Robot:** la base dejaba una rendija bajo su borde; ahora asienta en el planeta.<br>• **02 Finanzas:** las barras de los extremos flotaban sobre la curva del planeta; ahora entran en él.<br>• **03 MealFlow:** el tazón era media esfera sola y, de lado, parecía un cráter; ahora tiene borde y comida.<br>• **05 KIA:** los techos de la fábrica estaban de cabeza (se veían tres bloques con ranuras) y el engranaje flotaba suelto; ahora son techos de dos aguas y el engranaje va montado en un eje con su poste.<br>• **06 SCADA:** el plato de la antena flotaba detrás del mástil y el alimentador era una bolita suelta; ahora el plato apoya en el mástil y un brazo sostiene el alimentador.<br>• **08 VR:** al flotar, la carcasa de los visores se despegaba de las lentes y la correa; ahora suben juntas.<br>• **El principito:** la bufanda era una barra que giraba por su centro y se separaba del cuello; ahora es una cinta que sale del nudo, se afina y ondea. Sobre la nave, sus pies ya no se hunden en el casco.<br>• **Las etiquetas de los planetas:** al orbitar asomaban a pedazos bajo la barra superior, los botones del universo, la lista de planetas, el zoom o la ficha; ahora se desvanecen mientras pasan por debajo.<br>• **La nave en PC:** al seleccionarla, la cola y las aletas quedaban bajo la lista de planetas; la cámara se aleja un poco y la nave se ve entera.<br>• **El visor en celular:** las capturas verticales (MealFlow y hospital) se veían chicas, con mucho espacio vacío debajo; la imagen crece alrededor de un 50 % en celulares altos y queda igual en los bajos (320×568), siempre con su pie visible.<br><br>El 04, el 07, el asistente de contacto, la barra y el resto de la interfaz estaban bien. |

Lo que noté, sin que sea una falla:

- **La evidencia 3 del 08 sigue siendo la imagen de Meshy AI**, que ya no es el mismo modelo del visor 3D. Si prefieres, la quito y el 08 queda con el video, la captura de Unity y tu modelo.

Lo que no se tocó:

- Los textos de las fichas, la música, los CV, el asistente y el diseño de la interfaz.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `public/modelos/vr-nave/`: tu modelo (`brazo.gltf` y `brazo.bin`); se quitaron las 3 texturas del de Meshy AI. `public/images/proyectos/vr-nave/modelo-brazo-3d.jpg`: su imagen fija.
- `public/images/proyectos/mealflow/`: `desayunos.jpg` y `pedidos.jpg`.
- `src/data/projects.js` y `projects.en.js`: el modelo del 08 y las capturas del 03, en los dos idiomas.
- `src/three/worlds.js`: la nave, los detalles de los planetas y la bufanda del principito.
- `src/three/UniverseScene.js`: las etiquetas tapadas, el encuadre de la nave y los pies del principito. `src/index.css`: las etiquetas tapadas y el visor en celular. `src/three/ModelViewer.js`: solo comentarios.
- Pruebas: `tests/evidence.test.js` y `tests/e2e/qa.cjs`.
- `docs/CONTENIDO.md` (sección 17: tu modelo, y por qué un modelo necesita normales) y este informe.

Pruebas:

- Unitarias: 43/43 (`npm test`), 1 nueva: el modelo del 08 es tu brazo (sus piezas por nombre), con normales y sin texturas.
- e2e: 418/418 a la primera, contra el servidor con las cabeceras de producción y en PC y celular. Se ajustaron 3 comprobaciones a lo nuevo:
  - MealFlow ofrece «Ver imágenes (3)» y el visor muestra sus 3 capturas enteras, en orden y con su pie;
  - el visor 3D descarga solo el glTF y su .bin, sin texturas;
  - las de «una sola evidencia» (sin contador ni flechas) pasaron al 04, que ahora es el caso con una imagen.
- Build y unitarias repetidas desde un extracto limpio del zip.
- Sin capturas, como pediste.

Qué verificar a mano:

- La nave: gira el universo alrededor de ella y revisa las tres aletas y la tobera.
- El 08: «Ver modelo 3D», y gíralo.
- En tu celular, el 03: «Ver imágenes (3)».
- Con una ficha abierta, deja orbitar los planetas: sus etiquetas ya no asoman bajo la ficha ni la lista.

## Versión 6.16: el brazo del 08 en 3D, Esc en pantalla completa, los botones + y −, textos y fotos del hospital

Lo que pediste el 8 de noviembre, sobre la V6.15:

- Poner el modelo 3D con el FBX que mandaste. La imagen «de Blender» era la de Meshy AI.
- Que Esc en pantalla completa cierre lo que está abierto sin sacarte de pantalla completa, y que también lo cierre fuera de ella.
- Mover los botones + y −, que quedaban detrás de la ficha, sin afectar los celulares.
- Quitar «tres veces por semana» y revisar que ningún texto suene poco profesional.
- Subir las fotos nuevas del hospital, con las caras de los pacientes censuradas y la del «10» más nítida.
- Revisar el código de MealFlow, correrlo y sacar más imágenes.
- Sin capturas de pantalla: entregar ya.

| Qué pediste | Cómo queda |
|---|---|
| **El modelo 3D del brazo.** | Es el mismo FBX de la V6.15. Va como cuarta evidencia del 08, con su botón «Ver modelo 3D» junto a «Ver video» y «Ver imágenes (2)».<br><br>• **Se gira** arrastrando con el dedo o el ratón y se acerca con pellizco o con la rueda. Al abrirlo gira solo, despacio, hasta que lo tocas.<br>• **Lleva siempre la etiqueta «Modelo de demostración · en proceso»**, y su pie dice que no es el resultado final.<br>• **Pesa 1.6 MB** con sus texturas (el FBX pesa 18.8 MB) y solo se descarga al abrir esa evidencia.<br>• **Arrastrar sobre el modelo lo gira** y no cambia de evidencia; para pasar a otra quedan las flechas y el teclado.<br>• **Si el navegador no puede mostrar 3D**, se queda la imagen del brazo con un aviso. Con «reducir movimiento» activado no gira solo.<br><br>La imagen de Meshy AI ya estaba como evidencia 3 (es idéntica); ahora también se ve mientras carga el modelo. |
| **Esc en pantalla completa.** | Esc cierra lo de encima, de uno en uno: primero el visor o el video, después la ficha. Sin nada abierto, sale de pantalla completa. Fuera de pantalla completa funciona igual, esté donde esté el foco; antes, con el foco fuera de la ficha, Esc no hacía nada.<br><br>• **Chrome y Edge:** la pantalla completa se mantiene. Para salir de golpe, mantén Esc presionada unos segundos, como indica el navegador.<br>• **Firefox y Safari** no dejan que una página use Esc en pantalla completa: ahí Esc sale de pantalla completa y ahora también cierra lo que estaba abierto. |
| **Los botones + y −.** | Con la ficha abierta en PC pasan a la izquierda, en fila, justo encima de la lista de planetas, donde marcaste. Se recorren solos si la lista cambia de alto (idioma o ventana baja).<br><br>Entre 901 y 959 px de ancho, donde la ficha sube desde abajo, van arriba a la derecha. En celular no cambia nada: en pantalla completa ya quedan arriba a la derecha, sobre la ficha. |
| **«Tres veces por semana» y el tono.** | Venía de tu texto («fallaba por lo menos 3 veces a la semana»), pero sonaba mal. El problema del 06 queda así: «SCADA heredados con unos 10 años en operación y sin soporte interno; las fallas frecuentes del servidor de base de datos del monitoreo de robots obligaban a reiniciar el sistema».<br><br>Revisé los 8 textos en español y en inglés. Además cambié:<br>• «me encargué del troubleshooting» por «diagnostiqué y resolví sus fallas»;<br>• «apagones» por «cortes de energía»;<br>• «catálogo estilo Amazon» por «catálogo de comercio electrónico»;<br>• «alguien del equipo» por «un integrante del equipo».<br><br>El resto ya estaba en registro formal y breve. |
| **Las fotos del hospital.** | El 07 pasa de 2 a 4 fotos:<br>• **La del «10» en pantalla**, ampliada y enfocada. Se ve más nítida, aunque la original es de baja resolución.<br>• **La sesión con la participante de frente**, con su cara pixelada. El integrante del equipo que opera la computadora se ve como en las otras fotos.<br><br>La tercera foto que mandaste es la misma toma que la del «10», con la pantalla en blanco, así que no la repetí. |
| **MealFlow.** | Revisé el código (AppScanner, en .NET MAUI 10): pantallas de precios, comida, desayuno, pedidos especiales e historial del día. La app toma la foto del QR con la cámara y la manda al backend por la red local. Sumé a las tecnologías las librerías que usa: XAML, CommunityToolkit.Maui (cámara) y Plugin.Maui.Audio.<br><br>**No se pudo ejecutar aquí.** .NET MAUI no tiene versión para Linux, y para un emulador de Android este servidor no tiene virtualización y bloquea la descarga del SDK de Android. Además, sin tu backend de la red local, las pantallas saldrían vacías. Si me mandas capturas desde tu celular (de preferencia con datos de prueba), las subo. |

Lo que noté, sin que sea una falla:

- **Un detalle que encontré y corregí:** con «reducir movimiento» activado, el modelo 3D no se volvía a dibujar al arrastrarlo. Ya se redibuja, y hay una prueba que lo vigila.
- **En celular horizontal** el visor mide unos 180 px de alto: el modelo cabe, pero se ve pequeño, y la pista «Arrastra para girarlo» tapa su base hasta que lo tocas.
- **El universo 3D descarga 7 KB más** (comprimido), porque ahora comparte three.js con el visor del modelo. No se nota.

Lo que no se tocó:

- El diseño, el universo, la música, los CV y el resto de las fichas, salvo las frases de arriba.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `public/modelos/vr-nave/`: el modelo (glTF, su .bin y 3 texturas). `src/three/ModelViewer.js` y `src/components/ModelView.jsx`: el visor 3D. `src/components/EvidenceViewer.jsx`, `ProjectPanel.jsx`, `Icons.jsx`, `src/lib/evidence.js` y `src/index.css`: el modelo como evidencia y su botón.
- `src/hooks/useFullscreen.js`, `src/components/Home.jsx`, `ProjectPanel.jsx` y `TopBar.jsx`: Esc.
- `src/components/Universe.jsx` y `src/index.css`: los botones + y −.
- `src/data/projects.js` y `projects.en.js`: el modelo del 08, los textos del 04, 06 y 07, las fotos del 07 y las tecnologías de MealFlow. `public/images/proyectos/hospital-uanl/`: las 2 fotos nuevas.
- `src/i18n/strings.js`: los textos del visor 3D en los dos idiomas.
- Pruebas: `tests/evidence.test.js`, `tests/data.test.js`, `tests/i18n.test.js`, `tests/e2e/qa.cjs` y `tests/e2e/serve.cjs` (tipos .gltf y .bin).
- `docs/CONTENIDO.md` (sección 17: cómo añadir un modelo 3D, también desde Blender), el `README.md` y este informe.

Pruebas:

- Unitarias: 42/42 (`npm test`), 2 nuevas (el modelo 3D funciona con la política de seguridad del sitio y pesa poco; los modelos van al final del visor).
- e2e: 417/417 a la primera contra el servidor con las cabeceras de producción, con 24 comprobaciones nuevas:
  - el visor 3D: abre en el modelo con su etiqueta, lo descarga solo al abrirlo, gira con ratón y con el dedo sin cambiar de evidencia, se redibuja con movimiento reducido, se libera al cerrar, sin errores ni bloqueos, y sin WebGL deja la imagen;
  - Esc: cierra el visor, después la ficha (con el foco donde sea) y por último sale, también fuera de pantalla completa;
  - los botones + y − con la ficha abierta, en 8 tamaños de PC y celular;
  - y la del visor del 07, ajustada a sus 4 fotos.
- Build y unitarias repetidas desde un extracto limpio del zip.
- Sin capturas, como pediste.

Qué verificar a mano:

- En Chrome, en pantalla completa: abre una ficha y su visor, y pulsa Esc tres veces (visor, ficha, salir).
- Con una ficha abierta en PC, revisa los botones + y − sobre la lista de planetas.
- En tu celular: el 08, «Ver modelo 3D», y gíralo con el dedo.
- Las fotos nuevas del 07 y los textos del 06.

## Versión 6.15: el proyecto 08 con tu contexto y sus evidencias, y una auditoría en PC y celular

Lo que pediste el 8 de noviembre, sobre la V6.14:

- Escribir el proyecto 08 con tu idea: un escenario de realidad virtual con robots manipulados a distancia.
- Subir como evidencia tu video de YouTube, la captura de Unity y la imagen 3D del modelo.
- Usar el FBX «por si lo llegas a ocupar», marcado como modelo de demostración en proceso.
- Revisar que nada truene en PC ni en celular, y que no se pierda la calidad UX/UI, incluido cuánto texto se ve en la ficha del celular.

| Qué pediste | Cómo queda |
|---|---|
| **08 · VR y la nave.** | Reescrito con tu texto y con lo que me confirmaste. Lo de hoy es el entorno en Unity, el modelo 3D y el conector con tu hardware; el resto va como propuesta. Título nuevo: «Teleoperación robótica en realidad virtual». La etiqueta pasa a «Proyecto personal».<br><br>• **Resumen:** un prototipo en desarrollo, en Unity para Meta Quest 3S, para operar a distancia el brazo del proyecto 01.<br>• **El problema** (sección nueva): las tareas de riesgo extremo, como maniobrar en una subestación eléctrica o en un reactor nuclear.<br>• **Mi contribución**, en 2 párrafos: primero lo de hoy y después la «Propuesta». La propuesta: las Quest enviarán los comandos a una URL de tu red local, la PC los recibirá por sockets y los reenviará al robot por Bluetooth, y junto al robot virtual habrá un panel con el SCADA (temperatura, paro y modo secuencial).<br>• **4 puntos clave y 13 tecnologías.** Son 174 palabras, dentro de la regla de 180.<br><br>Se quitó el entrenamiento virtual de KIA, que no aparece en tu texto. La frase del recorrido («El último planeta antes de la nave…») se conserva. |
| **Las evidencias.** | Las tres van en el visor, en este orden:<br>• **Tu video de YouTube**, con su enlace «Abrir en YouTube». Su pie dice que es un prototipo en proceso y no el resultado final.<br>• **La captura de Unity**, sin la barra de título de Windows ni la barra de menús. Mide 1600 px y pesa 220 KB.<br>• **La imagen 3D del brazo**, con el pie «Modelo 3D de demostración del brazo para el entorno virtual (en proceso; no es el resultado final)».<br><br>La imagen de Blender no llegó. Si la mandas, la añado. |
| **El FBX.** | En esta versión no se usó, porque la imagen 3D ya muestra el modelo. Ya probé convertirlo a un formato para la web: pasa de 18.8 MB a 1.8 MB con sus texturas. Así el brazo podría girarse con el dedo o el ratón dentro del visor, con la etiqueta «Modelo de demostración, en proceso». Si quieres, lo añado en la V6.16. |
| **Que nada truene en PC ni en celular.** | Revisé el sitio ya construido, con las mismas cabeceras de seguridad que en producción, en 17 tamaños: 6 de celular (4 en vertical y 2 en horizontal), 2 de tableta y 9 de PC. 4 de ellos también en inglés. En cada tamaño abrí los 8 proyectos y la nave, cada evidencia del visor y, en celular y tableta, la pantalla completa.<br><br>• **5,230 comprobaciones sin fallas reales.** La ficha cabe en la pantalla, sin desplazamiento horizontal ni texto cortado. El título, los botones y las tecnologías se ven completos. Cada evidencia se ve entera en el visor, con su pie, y el visor cierra sin perder la ficha. No hubo errores en la consola.<br>• **8 marcas en la tableta horizontal (1024×768).** Son el asa para agrandar la ficha, que ahí no existe porque la ficha va como panel lateral, igual que en PC. Ese diseño no cambió en esta versión.<br>• **Poco texto en celular:** en tu celular la ficha 08 muestra 13 líneas sin desplazar, en el rango de las otras fichas (tabla abajo). |

Líneas de texto de la ficha que se ven sin desplazar, en español. Primero va la ficha 08 y, entre paréntesis, el rango de las 8 fichas:

| Pantalla | Ficha | Pantalla completa |
|---|---|---|
| Celular pequeño (320×568) | 6 (4 a 6) | 5 (4 a 5) |
| Celular (393×851) | 12 (12) | 12 (12) |
| **Tu celular (411×891)** | **13 (13 a 14)** | **13 (13)** |
| Celular grande (430×932) | 14 (14 a 15) | 13 (13 a 14) |
| Celular horizontal (667×375) | 4 (3 a 4) | 6 (5 a 6) |
| Tu celular en horizontal (851×393) | 5 (4 a 5) | 7 (7) |
| Tableta (768×1024) | 17 (17) | 16 (16) |
| Tableta horizontal (1024×768) | 17 (16 a 18) | – |
| PC (1280×720) | 17 (15 a 17) | – |
| PC (1366×768) | 19 (17 a 19) | – |
| PC (1920×1080) | 31 (29 a 31) | – |

La pantalla completa se midió en celular y en la tableta vertical, que es donde la ficha sube desde abajo.

Lo que noté, sin que sea una falla:

- **En celular horizontal** la ficha muestra de 4 a 7 líneas, porque la pantalla mide menos de 400 px de alto. Pasa con las 8 fichas, con el mismo diseño de la V6.14. Si usas el celular así, puedo compactar la cabecera de la ficha en horizontal.
- **La captura de Unity es muy ancha:** en tu celular se ve de 368 × 187 px. Se distingue la escena, pero no los textos del editor.
- **Las etiquetas de los planetas:** en ventanas de PC muy bajas (1280×520 y 1600×500), la del 08 queda detrás de los botones «Volver al centro» y «Vista de lista». En celular horizontal pasan por detrás de los botones las de otros planetas. Ya pasaba en la V6.14 y los botones siguen funcionando. Si quieres, lo corrijo en la V6.16.

Para que lo confirmes:

- **La captura de Unity** muestra personajes y archivos con el nombre «StellarBlade…». Si son modelos de terceros y prefieres que no se vean en un sitio público, recorto la captura a la escena o la cambio por otra. Recortada a la escena, además, se vería más grande en celular.
- **El título del video:** desde aquí no puedo abrir YouTube, así que lo escribí yo: «Prototipo de realidad virtual en Unity (en proceso; no es el resultado final)». Si el video muestra otra cosa, lo ajusto.
- **El entrenamiento virtual de KIA** ya no aparece. Si quieres conservarlo, va mejor como punto clave en el proyecto 05.

Lo que no se tocó:

- Los proyectos 1 a 7, la nave, el diseño, el universo, la ficha en PC y en celular, la música y los CV.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `src/data/projects.js` y `src/data/projects.en.js`: el proyecto 08.
- `public/images/proyectos/vr-nave/`: la captura de Unity y la imagen 3D del brazo.
- `src/lib/assistantDemo.js`: el asistente reconoce las preguntas sobre teleoperación y Blender.
- `tests/evidence.test.js`: 2 pruebas nuevas (las evidencias del 08, y que los 8 proyectos tienen evidencias).
- `tests/e2e/qa.cjs`: 4 comprobaciones nuevas del 08. La que revisaba un proyecto sin evidencias ahora revisa los botones del 08, porque ya no queda ninguno sin ellas.
- Este informe.

Tu texto quedó guardado tal cual en `contexto-proyectos/Proyecto8.txt`.

Pruebas:

- Unitarias: 40/40 (`npm test`), 2 nuevas.
- e2e: 393/393 a la primera, contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), con Playwright y Chromium sin GPU. Hay 4 comprobaciones nuevas del 08:
  - La ficha: título, «El problema», «Mi contribución» en 2 párrafos (lo de hoy y la «Propuesta»), 4 puntos clave y 13 tecnologías.
  - El visor abre en tu video (1 / 3), con su pie de prototipo en proceso y el enlace a YouTube.
  - La captura de Unity y el modelo 3D cargan, caben enteros y el modelo dice que es de demostración.
  - Sin errores en la ficha ni en el visor.
- La auditoría de arriba: 5,230 comprobaciones en 17 tamaños, y 4 de ellos en inglés.
- Build y unitarias repetidas desde un extracto limpio del zip.

Capturas en `capturas-v6.15/`:

- `ficha-08-pc-antes-despues.jpg`: la ficha 08 completa en PC, la V6.14 junto a la V6.15.
- `ficha-08-pc-espanol-e-ingles.jpg`: la ficha 08 en los dos idiomas.
- `ficha-08-celular-411x891-antes-despues.jpg`: la ficha 08 en tu celular, en pantalla completa, antes y ahora.
- `ficha-08-celular-horizontal-851x393-antes-despues.jpg`: la ficha 08 en tu celular en horizontal, antes y ahora.
- `visor-08-1-pc.jpg`, `visor-08-2-pc.jpg` y `visor-08-3-pc.jpg`: el visor en PC, con el video, la captura de Unity y el modelo 3D. En lugar del video se ve una tarjeta, porque desde aquí no se llega a YouTube.
- `visor-08-celular.jpg`: las tres evidencias en tu celular.
- `auditoria-08-ficha-17-tamanos.jpg` y `auditoria-08-visor-17-tamanos.jpg`: la ficha 08 y su modelo 3D en el visor, en los 17 tamaños de la auditoría.

Qué verificar a mano:

- En tu celular, abre el proyecto 08 y su «Ver video» (el video sí carga en tu celular; aquí no).
- Lee la ficha 08 en español y en inglés.
- Revisa los tres puntos de «Para que lo confirmes».

## Versión 6.14: proyectos 06 y 07 con tu contexto y fichas más puntuales

Lo que pediste el 8 de noviembre, sobre la V6.13:

- Reescribir el proyecto 06 (SCADA y planta) con lo que realmente hiciste y el 07 (Hospital Universitario) con tu contexto.
- Usar como evidencia la foto del SCADA de Welding y las fotos del hospital.
- No tocar todavía el 08.
- Dejar los proyectos 1 a 5, y los dos nuevos, «muy puntuales», con «lo que importa y las tecnologías» («regla de énfasis absoluta»).

| Qué pediste | Cómo queda |
|---|---|
| **06 · SCADA y planta.** | Reescrito con tu texto y con lo que ya dice tu CV aprobado. Título nuevo: «SCADA de mantenimiento en operación 24/7».<br><br>• **Resumen:** administración y soporte de dos SCADA heredados, el de los robots de soldadura y el de la llenadora de líquido de frenos.<br>• **El problema** (sección nueva): sistemas con unos 10 años en operación que nadie sabía reparar; el servidor de base de datos fallaba unas tres veces por semana.<br>• **Mi contribución**, en 2 párrafos: los servidores web y de base de datos (Windows Server y SQL Server) del SCADA de robots Kawasaki (.NET Framework 3.5) y el troubleshooting; en ensamble, el SCADA de Filling Machine (C#, .NET Framework 4.5, OPC Server y HMI Mitsubishi) y el rastreo de sus fallas desde el PLC hasta los logs saturados en SQL Server.<br>• **4 puntos clave y 9 tecnologías.**<br><br>Se quitaron el prototipo con IA, «Current System Monitoring» y la evaluación de proveedores. No aparecen en tu texto, y el SCADA con IA quedó fuera de tu CV porque no se terminó («no pongas cosas que luego no se dieron»). Por lo mismo no se menciona el servidor nuevo, que solo se cotizó. La frase del recorrido («Una antena que escucha a la planta antes de que algo falle») se conserva. |
| **La foto del SCADA de Welding.** | Mandaste dos fotos de la pantalla y van las dos: la vista general y el detalle por zonas.<br><br>• La vista general se enderezó, porque la foto se tomó en ángulo.<br>• Se recortaron la barra del navegador, que mostraba la dirección IP interna del servidor, y la barra de tareas de Windows.<br>• Se quitaron los metadatos de las fotos (fecha, modelo del teléfono y, si la hubiera, la ubicación).<br>• Pesan 380 KB cada una, dentro del límite del sitio. |
| **07 · Hospital Universitario.** | Reescrito con tu texto, con tu CV (interfaz cerebro-computadora, random forest) y con lo que ya decía la ficha (apps en C#, prueba CPT). El título no cambia.<br><br>• **Resumen:** investigación biomédica para una interfaz cerebro-computadora (BCI) de rehabilitación tras un accidente cerebrovascular. Va escrito completo, no «EVC», como pediste para el CV.<br>• **El problema** (sección nueva): la pérdida del habla y de la movilidad, la depresión, y el sistema de rehabilitación y monitoreo que se buscaba.<br>• **Mi contribución**, en 2 párrafos: las interfaces en C# que guían los ejercicios y la adquisición de EEG y EMG con el protocolo (primero personas sanas y luego pacientes, sin mezclar diestros y zurdos); después, el filtrado, el preprocesamiento y la normalización, y las pruebas en MATLAB de los algoritmos (random forest) con su precisión en cada muestra, con miras a una publicación en IEEE.<br>• **4 puntos clave:** más de 300 personas, matrices de 32 × 64,000, precisión por muestra y pruebas de atención (CPT) y de ansiedad.<br>• **7 tecnologías.** |
| **Las fotos del hospital.** | Son las dos del gorro de EEG que me mandaste el 1 de noviembre (venían como capturas de un chat).<br><br>• Se recortó solo la foto, sin el chat alrededor.<br>• En la primera se pixeló la cara de la persona que participa. En la segunda está de espaldas.<br>• Quienes están de pie se ven tal cual. Si alguna de esas personas no eres tú y prefieres ocultarla, la pixelo. |
| **Proyectos 1 a 5 muy puntuales.** | Cada ficha tiene entre 37 % y 62 % menos texto que en la V6.13 (tabla abajo), sin perder cifras. La lista de tecnologías de cada proyecto queda completa.<br><br>• El resumen es una frase y el problema, otra.<br>• «Mi contribución» va en 1 o 2 párrafos cortos.<br>• Hay de 4 a 5 puntos clave, cada uno con una sola idea.<br>• Los pies de las evidencias también se acortaron.<br><br>Títulos, etiquetas, frases del recorrido, imágenes y video no cambian, y tampoco los textos alternativos de las imágenes (los que leen los lectores de pantalla). |
| **Que se mantenga así.** | Dos pruebas nuevas de `npm test` revisan cada ficha en español y en inglés, y fallan si:<br>• pasa de 180 palabras entre resumen, problema, contribución y puntos clave;<br>• «Mi contribución» pasa de 2 párrafos;<br>• hay más de 5 puntos clave, o alguno pasa de 18 palabras.<br><br>La regla también quedó escrita en `docs/CONTENIDO.md`, para quien edite los proyectos después. |

Texto de cada ficha (resumen, problema, contribución y puntos clave), en palabras, versión en español:

| Proyecto | V6.13 | V6.14 | «Mi contribución» | Puntos clave |
|---|---|---|---|---|
| 01 Robot 6-DOF | 206 | 130 (−37 %) | 2 párrafos (más cortos) | 5 → 4 |
| 02 Finanzas y datos | 315 | 161 (−49 %) | 3 → 2 párrafos | 7 → 5 |
| 03 MealFlow | 348 | 163 (−53 %) | 3 → 1 párrafo | 7 → 5 |
| 04 Supply Chain Hub | 252 | 135 (−46 %) | 3 → 1 párrafo | 6 → 4 |
| 05 Mantenimiento KIA | 398 | 151 (−62 %) | 4 → 2 párrafos | 7 → 5 |
| 06 SCADA y planta | 74 | 175 (texto nuevo) | 1 → 2 párrafos | 3 → 4 |
| 07 Hospital UANL | 77 | 161 (texto nuevo) | 1 → 2 párrafos | 3 → 4 |

En inglés las fichas bajan en la misma proporción.

Lo que salió de los proyectos 1 a 5, por si quieres recuperar algo:

- **01 Robot:** los detalles HTTP POST y GET de la API, y «en un servidor local».
- **02 Finanzas y datos:** el punto de «dashboards para distintas áreas» y el del ETL, que ya están en «Mi contribución»; el párrafo de los reportes y los KPIs, que siguen como puntos clave.
- **03 MealFlow:** el color y el sonido exactos de la confirmación (ahora, «señal visual y sonora»), que el secreto no está en el código fuente y el acceso para personal autorizado.
- **04 Supply Chain Hub:** «precios promedio y atributos» (ahora, «precios») y el párrafo sobre consulta operativa y análisis estratégico.
- **05 Mantenimiento KIA:** los ejemplos de incidencias (fechas de CSV y valores NULL), por qué Power BI necesitaba el servicio intermedio, los filtros de los dashboards, quién desarrolló QBAMS y las tablas espejo y los JOINs de la migración (queda «UPSERT»).

Para que lo confirmes:

- **La cifra de 300:** tu CV dice «más de 300 muestras de señales EEG y EMG» y tu mensaje, «más de 300 personas». En la ficha usé lo de tu mensaje.
- **«Matrices de incertidumbre»:** no usé el término. La ficha dice que reportaste la precisión de los algoritmos con cada nueva muestra. Si te referías a matrices de confusión, lo añado.
- **El nombre de la prueba de atención:** no estabas seguro de que fuera «Alere», así que quedó «prueba de atención sostenida (CPT)», como decía la ficha anterior.
- **El nombre del sistema:** la pantalla dice «KIA Robot Diagnostic System» y tu texto, «Kawasaki Robot Monitoring». La ficha dice «SCADA de robots Kawasaki de soldadura» y el texto alternativo de la imagen cita el nombre de la pantalla.
- **El contador de la foto general:** marca 3 robots en marcha y 368 fuera de línea, como estaba al tomar la foto. Si prefieres que no se vea, recorto esa parte.

Lo que no se tocó:

- El proyecto 08 (VR y la nave), que espera tu contexto.
- Los títulos, etiquetas y frases del recorrido de los proyectos 1 a 5, y sus tecnologías, imágenes y video.
- El diseño, el universo, la ficha en PC y en celular, la música y los CV.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `src/data/projects.js` y `src/data/projects.en.js`: los siete textos.
- `public/images/proyectos/scada-planta/` y `public/images/proyectos/hospital-uanl/`: las cuatro evidencias nuevas.
- `src/lib/assistantDemo.js`: el asistente reconoce las preguntas sobre los proyectos 06 y 07 (Kawasaki, Filling, MATLAB, BCI…). Se quitaron de su lista «IA (prototipo)» y «validación de modelos de IA», que ya no aparecen en el sitio.
- `tests/data.test.js` y `tests/i18n.test.js`: las 2 pruebas de fichas puntuales.
- `tests/e2e/qa.cjs`: 4 comprobaciones ajustadas y 7 nuevas.
- `docs/CONTENIDO.md` (la regla de las fichas puntuales) y este informe, con los títulos actuales en su tabla de planetas (sección 5).

Tu texto quedó guardado tal cual en `contexto-proyectos/Proyecto6a7.txt`, junto a los de los proyectos 1 a 5.

Pruebas:

- Unitarias: 38/38 (`npm test`), 2 nuevas.
- e2e: 389/389 contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), con Playwright y Chromium sin GPU. Hay 7 comprobaciones nuevas:
  - Fichas 06 y 07: título, «El problema», «Mi contribución» en 2 párrafos y 4 puntos clave.
  - El visor de las dos: «Ver imágenes (2)», las dos imágenes cargan, caben enteras y llevan su pie.
  - Sin errores en ninguna de las dos.
- Se ajustaron 4 comprobaciones:
  - «Mi contribución» de Finanzas y datos, ahora en 2 párrafos.
  - La de Mantenimiento KIA, ahora en 2 párrafos.
  - La prueba del proyecto sin evidencias, que ahora usa el 08.
  - El pie de la foto del robot en inglés, que se acortó.
- La primera corrida completa dio 386/389. Falló la prueba del pie en inglés, que es la que se ajustó, y dos del asistente al copiar LinkedIn, porque su mensaje tardó más de los 4 s que espera la prueba, como en la V6.11. La segunda corrida completa pasó las 389.
- Build y unitarias repetidas desde un extracto limpio del zip.

Capturas en `capturas-v6.14/`:

- `ficha-01-robot-pc-antes-despues.jpg` a `ficha-07-hospital-pc-antes-despues.jpg`: cada ficha completa en PC, la V6.13 junto a la V6.14.
- `ficha-06-scada-celular-411x891-antes-despues.jpg` y `ficha-07-hospital-celular-411x891-antes-despues.jpg`: las dos fichas nuevas en tu celular, en pantalla completa.
- `fichas-06-y-07-pc-en-ingles.jpg`: las dos en inglés.
- `visor-06-scada-1-pc.jpg`, `visor-06-scada-2-pc.jpg`, `visor-07-hospital-1-pc.jpg` y `visor-07-hospital-2-pc.jpg`: el visor en PC, con cada foto y su pie.
- `visor-06-scada-celular.jpg` y `visor-07-hospital-celular.jpg`: el visor en tu celular, con las dos fotos de cada proyecto.

Qué verificar a mano:

- Lee las siete fichas, en español y en inglés.
- Abre «Ver imágenes» en los proyectos 06 y 07.
- Revisa los cinco puntos de «Para que lo confirmes».

## Versión 6.13: textos de los proyectos 1 a 5 más breves y formales, el enlace del video que sube y más espacio para leer la ficha

Lo que pediste el 3 de noviembre, sobre la V6.12:

- Refinar los textos de los proyectos 1 a 5 («en el texto 1 siento que es mucho»).
- Quitar los diminutivos y las expresiones coloquiales, que «le quitan seriedad y profesionalismo».
- Que «Video de presentación», abajo en el pie, suba de inmediato como lo hacen «Inicio» y «Proyectos».
- Dar «un poco más de espacio al texto que describe el proyecto».

| Qué pediste | Cómo queda |
|---|---|
| **Textos de los proyectos 1 a 5 más breves.** | Los cinco se condensaron en español e inglés a partir de tus textos, sin quitar datos técnicos ni cifras y sin añadir nada.<br><br>En el Robot 6-DOF, «Mi contribución» pasa de 3 párrafos y 164 palabras a 2 párrafos y 119. Sus puntos clave bajan de 8 a 5: se unieron los que repetían la cadena LM35 → ADC → UART → ESP32 → Wi-Fi.<br><br>Cada ficha (resumen, problema, contribución y puntos clave) queda con entre 15 % y 32 % menos texto (detalle en la tabla de abajo). Títulos, etiquetas, tecnologías y frases del recorrido no cambian. |
| **Sin diminutivos ni expresiones coloquiales.** | «Botoncitos» no aparece en los textos actuales del sitio: lo busqué en los proyectos, la interfaz y los informes. Sí había expresiones del mismo tipo, y se cambiaron todas (lista abajo).<br><br>Se dejó a propósito tu frase del recorrido «Un pequeño centro de control industrial en la palma de tu mano». Si también quieres cambiarla, dímelo. |
| **Títulos y pies de las evidencias.** | También se revisaron:<br>• El video del robot ahora se llama «RoboSCADA: control del brazo robótico desde la app móvil» (antes, «RoboSCADA en acción: el brazo robótico controlado desde la app»).<br>• Los pies del robot dicen «controles de navegación» y «comandos de movimiento».<br>• El pie del catálogo de Supply Chain Hub ya no repite «precio y calificación».<br>• El pie del login de QBAMS dice «con el logotipo de SMART».<br><br>Los pies de los dashboards de NetSuite, de MealFlow y de las incidencias ya eran formales y no cambiaron. |
| **«Video de presentación» del pie no subía.** | El pie es el mismo en todas las páginas. Desde abajo, el enlace abría la página del video, pero la pantalla seguía mostrando el pie (689 px abajo en PC y 323 px en celular). No había señal de que algo hubiera pasado.<br><br>Ahora la página del video se abre ya arriba, con su título a la vista, antes de dibujarse: no hay espera ni salto visible. Pasa lo mismo si tocas el enlace estando ya en el video.<br><br>De paso se corrigió un caso igual: «Volver al inicio», en la página del video, dejaba en el pie de la página principal. Ahora lleva al encabezado, como «Inicio» del pie y el logotipo. |
| **Más espacio para leer la descripción.** | En celular, la ficha mostraba 4 o 5 líneas de texto en pantalla completa y, en horizontal, dos como mucho (ninguna en pantalla completa). Cambios:<br>• **Cabecera compacta en celular:** el icono, la etiqueta y la X van en una fila, y el título a todo lo ancho. En un celular de 393 a 430 px de ancho baja de 132–151 a 110 px de alto. En tableta y en ventanas de 600 a 959 px el título ya cabía junto al icono, así que ahí la cabecera queda como estaba.<br>• **Fila Anterior/Siguiente** más delgada: de 69 a 59 px.<br>• **En pantalla completa**, la ficha llega al 60 % del alto (antes, 44 %) y la escena sigue a la vista arriba.<br>• **Con el celular en horizontal**, la ficha es un panel a la derecha, a todo lo alto, en lugar de una franja abajo. El zoom y la lista de planetas se recorren para no quedar debajo.<br>• **La cámara** reencuadra el planeta en el espacio libre, para que no quede escondido detrás de la ficha.<br><br>El asa para contraer la ficha sigue igual (26 px). Resultados en la tabla de abajo. |

Texto de cada ficha (resumen, problema, contribución y puntos clave), en palabras, versión en español:

| Proyecto | V6.12 | V6.13 | «Mi contribución» | Puntos clave |
|---|---|---|---|---|
| 01 Robot 6-DOF | 284 | 206 (−27 %) | 3 → 2 párrafos | 8 → 5 |
| 02 Finanzas y datos | 390 | 315 (−19 %) | 4 → 3 párrafos | 7 (igual) |
| 03 MealFlow | 409 | 348 (−15 %) | 4 → 3 párrafos | 8 → 7 |
| 04 Supply Chain Hub | 334 | 252 (−25 %) | 3 párrafos (más cortos) | 7 → 6 |
| 05 Mantenimiento KIA | 586 | 398 (−32 %) | 5 → 4 párrafos | 9 → 7 |

En inglés, las fichas bajan en la misma proporción.

Expresiones coloquiales que se cambiaron en español:

- «palomita verde» → «señal verde»
- «un pequeño ERP de consumos» → «un ERP de consumos para nóminas»
- «las solicitudes… esperan su turno» → «un control de concurrencia evita duplicar operaciones»
- «tablas dinámicas a mano» → «manualmente»
- «para montar una integración» → «para una integración»
- «controles de flechas» → «controles de navegación» (como dice tu texto)
- «la app móvil manda las señales» → «envía los comandos»
- «Eso dificultaba» → «Esto dificultaba»
- «El objetivo: navegar…» → «El objetivo era consultarla…»
- «y de ahí a su gripper»: se quitó

En inglés se cambiaron las equivalentes: «green check», «small ERP», «wait their turn» y «arrow controls».

Líneas de descripción a la vista en celular, sin desplazar (ficha de Finanzas y datos o del Robot):

| Pantalla | V6.12 | V6.13 |
|---|---|---|
| Tu celular (411×891), pantalla completa | 5 líneas | 12 líneas |
| 393×851, pantalla completa | 4 | 11 |
| 430×932, pantalla completa | 6 | 13 |
| 360×740, pantalla completa | 2–3 | 8–9 |
| 320×568, pantalla completa | ninguna | 3–5 |
| Tableta 768×1024, pantalla completa | 8–9 | 15–16 |
| Horizontal 851×393, pantalla completa | ninguna | 6 |
| Horizontal 851×393, sin pantalla completa | 2 | 4 |
| Horizontal 667×375, pantalla completa | ninguna | 5 |
| Horizontal 667×375, sin pantalla completa | ninguna | 2–3 |
| 393×851 y 411×891, sin pantalla completa | 10–11 | 12–13 |

En PC, con ventanas de 960 px o más, ya había espacio de sobra y la ficha no cambia: 16–17 líneas en 1366×768, 10–11 en 1366×606 y 29 en 1920×1080. En ventanas de 600 a 959 px solo se adelgaza la fila Anterior/Siguiente.

En el celular más chico (320×568) la franja libre arriba de la ficha es angosta: el planeta se ve más pequeño, asoma detrás de la ficha y su nombre roza el botón «Vista de lista». En la V6.12 el nombre tapaba «Volver al centro» y no se veía ninguna línea de la descripción.

Lo que no se tocó:

- Los títulos, las etiquetas, las tecnologías y las frases del recorrido.
- Las imágenes de evidencia y el visor.
- Los proyectos 6 a 8, que esperan tu contexto.
- El universo y la ficha en PC.
- La música, el asistente y los CV.
- Tu `vite.config.js`, byte por byte.

Archivos modificados:

- `src/data/projects.js` y `src/data/projects.en.js`: textos de los proyectos 1 a 5.
- `src/components/VideoPage.jsx`: la página sube al llegar, y «Volver al inicio» va a `/#perfil`.
- `src/index.css`: cabecera compacta, ficha al 60 % en pantalla completa y panel lateral en horizontal.
- `src/components/Universe.jsx` y `src/three/UniverseScene.js`: encuadre del planeta en el espacio libre.
- `tests/e2e/qa.cjs`: 2 comprobaciones ajustadas y 20 nuevas.
- `README.md` y `docs/CONTENIDO.md`: la ficha móvil como queda ahora.
- Este informe.

Pruebas:

- Unitarias: 36/36 (`npm test`).
- e2e: 382/382 contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), con Playwright y Chromium sin GPU. Hay 20 comprobaciones nuevas:
  - Ficha en 393×851 con pantalla completa y en 851×393 con y sin ella (12): tamaño y posición, líneas de texto a la vista, zoom libre, el asa contrae y vuelve a abrir, y sin errores.
  - «Video de presentación» del pie en PC y en celular (8): desde abajo, desde la propia página del video, «Volver al inicio» y sin errores.
- Se ajustaron 2 comprobaciones: Mantenimiento KIA con «Mi contribución» en 4 párrafos, y la ficha en pantalla completa al ~60 % del alto (antes, «menos de media pantalla»).
- Las 20 nuevas también se corrieron contra la V6.12: fallan 12, que son justo lo que corrige esta versión.
- Build y unitarias repetidas desde un extracto limpio del zip.

Capturas en `capturas-v6.13/`:

- `ficha-411x891-pantalla-completa-antes-despues.jpg`: tu celular.
- `ficha-393x851-pantalla-completa-antes-despues.jpg` y `ficha-320x568-pantalla-completa-antes-despues.jpg`.
- `ficha-horizontal-851x393-pantalla-completa-antes-despues.jpg`, `ficha-horizontal-851x393-antes-despues.jpg` y `ficha-horizontal-667x375-pantalla-completa-antes-despues.jpg`: celular en horizontal.
- `ficha-tableta-768x1024-pantalla-completa-antes-despues.jpg`.
- `texto-robot-pc-1366x768-antes-despues.jpg`: «Mi contribución» del proyecto 1, antes y ahora.
- `ficha-411x891-contraida-con-el-asa.png`, `ficha-411x891-en-ingles.png` y `ficha-pc-1366x768-sin-cambios.jpg`.
- `pie-video-pc-antes-despues.jpg` y `pie-video-celular-antes-despues.jpg`: qué se ve al tocar «Video de presentación» desde abajo. El recuadro del reproductor es una tarjeta que lo dice, porque aquí no hay acceso a YouTube.

Qué verificar a mano:

- En tu celular, abre un proyecto en pantalla completa y lee la ficha.
- Gira el celular a horizontal.
- Contrae la ficha con el asa y vuelve a abrirla.
- Desde el pie de la página principal, toca «Video de presentación».
- Lee los textos 1 a 5 y dime si algo quedó de más o de menos.

## Versión 6.12: auditoría en celular, pantallas reducidas y PC, y lo que se corrigió

Lo que pediste el 2 de noviembre: «una auditoría para verificar que tanto en móvil, pantallas reducidas y PC las imágenes o videos y cualquier nueva mejora implementada no quede bugeada o arruine el UX/UI por estar desorganizado».

Cómo se hizo: un guion de Playwright (Chromium sin GPU, con las fuentes web cargadas) abre cada ficha con evidencias (proyectos 1 a 5) y la 06 (sin evidencias) en 16 tamaños: celulares verticales (320×568, 393×851, 430×932) y apaisados (667×375, 851×393), tabletas (768×1024, 1024×768), ventanas de PC reducidas (700×800, 959×700, 960×700, 1024×600, 1280×720, 1280×520, 1600×500) y escritorio (1366×768, 1920×1080), en español y, en cuatro tamaños, también en inglés. En cada una mide la ficha (cabe en la pantalla, nada se sale a lo ancho, textos y chips sin recorte, la X no pisa el título, pie de navegación a la vista, «Mi contribución» en párrafos, botones de evidencia completos y sin encimarse), abre el visor con el primer botón y recorre todas las evidencias con la flecha (ventana dentro de la pantalla, imagen entera y aprovechando el escenario, video llenando el escenario con su enlace a YouTube, contador y flechas sin tapar nada, pie a la vista, título sin encimarse con el contador ni la X, Escape cierra y la ficha sigue donde estaba, foco de vuelta al botón) y, en pantallas táctiles, contrae y vuelve a abrir la ficha con el asa. En total, 3,785 comprobaciones y 329 capturas; las primeras pasadas sirvieron para afinar el guion (una comprobación del pie del visor daba falsa alarma y en esta máquina la página tarda ~1,5 s en bajar sola al universo).

| Qué encontró | Cómo queda |
|---|---|
| **Celular: el asa para contraer la ficha no se podía tocar.** La ficha es una columna flexible con alto máximo; con los textos largos de los proyectos reescritos, el asa (que no tiene contenido propio) se encogía a 1–3 px y el toque caía en la cabecera: en 393 px todavía respondía por 3 px, en 320×568 y en 667×375 ya no. | `flex: none` en el asa: mide siempre 26 px, contrae la ficha a su título y la vuelve a abrir. Prueba e2e nueva en 320×568 (mide el asa, la toca, comprueba que contrae y que reabre) para que no vuelva a pasar. |
| **Celulares de 320 a 380 px: títulos de 5 líneas y un pie del visor cortado.** Con los títulos nuevos, la cabecera de la ficha ocupaba 5 líneas; en el visor, un pie de 8 líneas (robot, dashboard de almacén) quedaba unos píxeles bajo el borde y la ventana se desplazaba por dentro. | En pantallas de 380 px o menos la letra del título de la ficha baja a 1.12 rem, la del visor a 0.9 rem y la del pie a 0.84 rem: todo queda a la vista, sin desplazar. |
| **PC con ventana muy baja (menos de 566 px de alto): la fila Anterior/Siguiente de la ficha quedaba fuera.** El escenario 3D mide 520 px como mínimo (así quedó en la V6.2) y la ficha lateral va anclada a él, así que sobresalía por abajo. | En esas ventanas la ficha se recorta a lo que cabe bajo la barra y su cuerpo se desplaza por dentro: en 1280×520 y 1600×500 la ficha y su pie quedan completos; en 1366×606 y 1024×600 (las de siempre) nada cambia. |
| **Todo lo demás, limpio.** Imágenes enteras y centradas en el escenario, video llenando el escenario con su enlace a YouTube, contador y flechas sin tapar la imagen, pies a la vista, párrafos separados, botones completos, sin desplazamiento horizontal ni errores de consola en los 16 tamaños y en inglés. | Sin cambios. Observación, no fallo: en celular los títulos largos ocupan 3 o 4 líneas en la ficha y en el visor («Integración serverless de NetSuite con Power BI y dashboards web», «Transformación digital y analítica logística con Supply Chain Hub»); si quieres, se acortan esos dos títulos. |

Lo que no se tocó: el escenario y su alto mínimo, el universo, el visor, los textos, las evidencias, la música, el asistente, los CV y tu `vite.config.js`.

Archivos modificados: `src/index.css` (asa con `flex: none`; letra en ≤ 380 px; ficha en ventanas bajas), `tests/e2e/qa.cjs` (4 comprobaciones nuevas del asa en 320×568).

Pruebas: unitarias 36/36; e2e 362/362, con las 4 nuevas del asa; esta vez también pasaron las dos del asistente que en la V6.11 fallaron por tiempo (`tests/e2e/qa.cjs`, Playwright, Chromium sin GPU). Capturas en `capturas-v6.12/`: antes y después en 320×568 (ficha), en el pie del visor de 320 px y en PC de 1280×520 y 1600×500; la ficha de 320 px contraída con el asa; y una muestra de celular vertical y apaisado, tableta, ventana reducida y escritorio en español e inglés.

Qué verificar a mano: en tu celular, abrir una ficha, tocar la barrita del asa para contraerla y volver a abrirla; abrir «Ver imágenes» y pasar con las flechas o deslizando; en la PC, achicar la ventana al mínimo y abrir un planeta.

## Versión 6.11: el ahorro de NetSuite, igual en el CV y en el portafolio

Lo que pediste el 2 de noviembre («el que impacte más»): de las dos cifras que no coincidían, quedarte con la mayor y alinear el CV y el portafolio.

| Qué pediste | Cómo queda |
|---|---|
| **La cifra que más impacta.** | Tu texto dice «~$60K mensuales»; el CV aprobado decía «~500 mil MXN/año». La mayor es la tuya: 60 mil al mes son ~720 mil al año, así que los dos documentos dicen ahora lo mismo. Se tomó como pesos (MXN): es la moneda del CV y, en dólares, serían 26 veces más que la cifra del CV. Si fueran dólares, dímelo y lo cambio. |
| **Portafolio (planeta 02).** | El punto clave dice «Ahorro estimado de ~60 mil MXN mensuales (~720 mil al año) en infraestructura y servicios en la nube» / «Estimated savings of ~MXN 60K per month (~720K a year) in infrastructure and cloud services». Antes decía «~$60K», sin moneda, que en inglés se lee como dólares. |
| **CV (ESP y ENG, PDF y Word).** | El bullet de Supralux dice «…ahorro de ~720 mil MXN/año» / «…saving ~MXN 720K/year». Solo cambió ese número: mismo formato, una línea, una página; los PDF nuevos se compararon píxel a píxel con los aprobados y la única diferencia es ese dato (metadatos y enlaces iguales). Los PDF van en `public/` (botones de descarga del inicio) y, con los Word y la fuente para regenerar, en la carpeta `entregas/cv-2026-11` de la Library (reemplazan a los del 1 de noviembre). |

Lo que no se tocó: todo lo demás (proyectos, evidencias, visor, universo, música, asistente y tu `vite.config.js`).

Archivos modificados: `src/data/projects.js` y `src/data/projects.en.js` (un punto clave cada uno), `public/JonathanCorpusCV_ESP.pdf` y `public/JonathanCorpusCV_ENG.pdf`.

Pruebas: unitarias 36/36; e2e 356/358 (`tests/e2e/qa.cjs`, Playwright, Chromium sin GPU). Las dos que no pasaron son del asistente al copiar LinkedIn desde Contacto (bloque de la V6.6, sin relación con este cambio): en la máquina de pruebas, sin GPU y saturada por la escena 3D, el mensaje del asistente tardó más de los 4 s que espera la prueba. El mismo flujo repetido aparte pasa dos de dos veces (copia el enlace, el asistente lo confirma y sale el aviso); la suite completa se vuelve a correr con la auditoría. Capturas en `capturas-v6.11/`: el punto clave en escritorio ES/EN y en celular, y los dos CV renderizados.

Qué verificar a mano: abrir el planeta 02 y leer el punto clave del ahorro; descargar el CV desde los botones del inicio y comprobar la línea de Supralux.

## Versión 6.10: los proyectos 4 y 5 con tus descripciones y sus evidencias

Lo que pediste el 2 de noviembre (segundo texto, `Proyecto4a5.txt`): usar tus descripciones de Supply Chain Hub y de los sistemas de mantenimiento de KIA para los proyectos 4 y 5, y meter el login de QBAMS «para darle un poco más de vida».

| Qué pediste | Cómo queda |
|---|---|
| **Supply Chain Hub (04) con tu descripción.** | Título «Transformación digital y analítica logística con Supply Chain Hub»; resumen, «El problema» y «Mi contribución» en 3 párrafos a partir de tu texto (700,000 registros: 400,000 de productos y 300,000 de actividad y demanda, catálogo tipo Amazon, Stored Procedures, Power BI); 7 puntos clave y las 9 tecnologías que diste. Se quitó lo que tu texto no dice («Nube», «administración centralizada en la nube»). Frase del recorrido: «Un planeta de miles de productos donde cada dato encuentra su lugar». |
| **Mantenimiento KIA (05) con tu descripción.** | Título «Sistemas web y ERP de mantenimiento» (la etiqueta ya dice KIA México); resumen y «Mi contribución» en 5 párrafos: QBAMS (Hyundai AutoEver, C#, ASP.NET, .NET Framework 4.5, cuatro áreas), más de 200 incidencias (fechas en CSV, NULL en filtros), gráficas por XML + Stored Procedures + JSON, lógica de Downtime en Breakdown con acumulados intactos, migración del catálogo de soldadura (~500 equipos, 3,000+ subequipos, tablas espejo, JOINs, UPSERT), Power BI vía el servicio de QBAMS y Portlets en SMART, y las plataformas web internas. 9 puntos clave y 18 tecnologías (se quitó el «MVC» repetido al final de tu lista). Frase del recorrido: «Una fábrica que nunca deja de girar: sistemas que mantienen cada proceso bajo control». |
| **El login de QBAMS como evidencia.** | Va en el planeta 05 (`public/images/proyectos/mantenimiento-kia/qbams-login.png`, la versión sin la barra del navegador, a 1600 px). Como segunda evidencia añadí la captura de tu sitio v1 de la plataforma de incidencias de instalaciones («My Resolutions Centers», con datos de prueba): se pixeló tu número de empleado y se dejó lo demás. Para el 04 añadí la captura de tu sitio v1 del catálogo de Supply Chain Hub (`supply-chain-hub/catalogo.jpg`). Si alguna no la quieres, se quita en un minuto. |

Lo que no se tocó: los proyectos 6 a 8 (esperan tu contexto), el visor, el universo, el encabezado, la música, el asistente y los CV.

Archivos modificados: `src/data/projects.js` y `src/data/projects.en.js` (proyectos 4 y 5), `public/images/proyectos/supply-chain-hub/` y `public/images/proyectos/mantenimiento-kia/` (3 imágenes nuevas), `tests/e2e/qa.cjs` (el proyecto sin evidencias pasa a ser el 06 y 4 casos nuevos).

Pruebas: `npm test` 36/36 y e2e 358/358 (todo, incluida la comprobación en inglés que falló en la V6.9) contra el servidor con las cabeceras de producción, con 4 casos nuevos (Supply Chain Hub con «Ver imagen» y «El problema» primero, su catálogo entero en el visor; Mantenimiento KIA con 5 párrafos y «Ver imágenes (2)», login de QBAMS e incidencias enteras). Build y unitarias repetidas desde un extracto limpio del zip. Capturas en `capturas-v6.10/`: las fichas 04 y 05 y sus visores, en escritorio ES/EN y en celular.

Conviene verificar a mano: que las dos capturas tomadas de tu sitio v1 (catálogo e incidencias) sí quieras mostrarlas.

## Versión 6.9: los proyectos 1 a 3 con tus descripciones y sus evidencias

Lo que pediste el 2 de noviembre: usar tus tres descripciones (RoboSCADA, NetSuite y el comedor con QR) para que las fichas de los proyectos 1 a 3 dejen de verse mediocres y digan lo impactante de cada uno, mejorar la descripción de las imágenes del Robot 6-DOF, y meter la pantalla de MealFlow y tus dashboards de NetSuite como evidencia dejando solo datos no críticos.

| Qué pediste | Cómo queda |
|---|---|
| **Descripciones de los proyectos 1 a 3 basadas en tus textos.** | Las tres fichas se reescribieron en español e inglés a partir de tus descripciones, condensadas pero sin perder lo técnico: resumen, «El problema» (en los dos proyectos donde lo diste), «Mi contribución» en 3 o 4 párrafos cortos, «Puntos clave» (7 u 8 resultados, uno por línea) y «Tecnologías» con la lista completa que mandaste (13, 15 y 10 chips). Títulos nuevos: «Control y monitoreo de un robot industrial con RoboSCADA», «Integración serverless de NetSuite con Power BI y dashboards web» y «Digitalización y trazabilidad de consumos de comedor con QR». Las frases del recorrido guiado son las tuyas («Un pequeño centro de control industrial en la palma de tu mano», «Un planeta donde los datos de un ERP se transforman en inteligencia para toda la organización» y «Un planeta donde cada consumo queda registrado: quién compró, qué consumió y cuándo»). Nada que no esté en tus textos o en el CV aprobado. |
| **Que «Mi contribución» no sea un solo bloque.** | La ficha muestra `problem`, `contribution` y `learnings` en varios párrafos cuando el texto trae una línea en blanco (`\n\n`); los proyectos 4 a 8 siguen igual, en un párrafo, hasta que mandes su contexto. |
| **Las imágenes del Robot 6-DOF con mejor descripción.** | Pies y textos alternativos nuevos: la prueba en vivo (gráfica de tendencia en el escritorio, brazo con STM32, ESP32 y LM35, app móvil con las flechas y la lectura del gripper) y la arquitectura en dos etapas (adquisición y procesamiento; visualización y control). El video se titula «RoboSCADA en acción: el brazo robótico controlado desde la app». |
| **La imagen de MealFlow.** | La que mandaste es la misma `AppScannAndroid.png` de la v1 del sitio (la pantalla «Precios», 364 × 761) y se ve bien: va como única evidencia en `public/images/proyectos/mealflow/precios.png` (`Food.png` de la v1 es solo un icono). Con una sola evidencia el botón dice «Ver imagen» y el visor no muestra flechas. |
| **Tus dashboards de NetSuite, solo con datos no críticos.** | Los tres van como evidencia del planeta 02 (`public/images/proyectos/finanzas-datos/`): dashboard comercial y de ventas, sistema comercial y control de almacén. Se pixelaron todas las cifras (montos, metas, porcentajes de avance y de cumplimiento, variaciones, saldos, etiquetas de barras y pasteles, totales), los nombres de personas (top 10 de vendedores, top performance y la tarjeta «Saldo en inv. …») y las leyendas que llevaban montos. Quedan la estructura, los títulos de cada sección, los nombres de zonas, segmentos, familias, marcas y modelos, los meses y las fechas de actualización; en el de almacén se dejaron también los índices de facturación contra inventario (razones entre 0,8 y 1,4, sin unidades). Los pies lo dicen: «cifras y nombres pixelados por confidencialidad». No se inventaron datos ficticios: pixelar deja claro que se ocultó algo y no te obliga a sostener cifras falsas en una entrevista. |

Lo que no se tocó: los proyectos 4 a 8 (esperan tu contexto), el visor y la sección «Evidencia» (V6.8), el universo, el encabezado, la música, el asistente y los CV.

Una duda para ti: el portafolio dice «ahorro estimado de ~$60K mensuales» (tu texto de hoy, que ya estaba así) y el CV aprobado dice «~500 mil MXN al año»; no coinciden ($60K al mes serían $720K al año si son pesos). Dime cuál es la buena y la alineo en los dos. **Resuelto en la V6.11:** elegiste la que más impacta, ~60 mil MXN al mes (~720 mil al año), y así quedó en los dos.

Archivos modificados: `src/data/projects.js` y `src/data/projects.en.js` (proyectos 1 a 3), `src/components/ProjectPanel.jsx` (párrafos), `src/index.css` (separación entre párrafos), `public/images/proyectos/finanzas-datos/` (3 PNG nuevos) y `public/images/proyectos/mealflow/precios.png`, `tests/e2e/qa.cjs` (títulos nuevos, el proyecto sin evidencias ahora es el 04 y 10 casos nuevos), `tests/assistant.test.js` (el título de Finanzas y datos se toma de los datos), `docs/CONTENIDO.md` (cómo escribir párrafos).

Pruebas: `npm test` 36/36 y e2e 353/354 en la corrida completa contra el servidor con las cabeceras de producción (la única falla fue una comprobación de la V4.1 que esperaba el título anterior en inglés de Finanzas y datos, «without a native connector»; se actualizó al título nuevo y se verificó aparte que la ficha en inglés lo muestra; la corrida completa se repite en la siguiente versión) (`tests/e2e/serve.cjs`), con 10 casos nuevos: «Mi contribución» en varios párrafos; Finanzas y datos solo con «Ver imágenes (3)», el visor abre en el primer dashboard con su título y su pie, los dashboards (apaisados y anchos) caben enteros y → → llega al tercero; MealFlow con «Ver imagen» en singular, un solo elemento (1 / 1, sin flechas, la imagen vertical entera) y → no cambia nada; sin errores de consola. Build y unitarias repetidas desde un extracto limpio del zip. Capturas en `capturas-v6.9/`: las fichas de los tres proyectos (escritorio ES; Finanzas y datos también en EN y en celular), el visor con los tres dashboards y con la pantalla de MealFlow, en escritorio y en celular (vertical y apaisado).

Conviene verificar a mano: que los textos digan lo que quieres (sobre todo el ahorro y las cifras) y que los dashboards pixelados no dejen nada que prefieras ocultar (los nombres de marcas y modelos se dejaron a propósito).

## Versión 6.8: evidencias en la ficha de cada proyecto (imágenes y videos en un visor)

Lo que pediste el 2 de noviembre: que cada proyecto pueda llevar imágenes y videos que le den credibilidad, sin incrustarlos en la ficha (en un celular sería un desastre): un botón «ver imagen» o «ver video» que abra un overlay como el del video de la nave, con varias imágenes y videos en carrusel y flechitas para navegar; los videos como enlaces de YouTube; y, de momento, el Robot 6-DOF con tu video (`https://www.youtube.com/watch?v=TdU0hq1quLo`) y la imagen de evidencia (más el diagrama que mandaste). Los textos de cada proyecto se mejoran después, cuando mandes el contexto.

| Qué pediste | Cómo queda |
|---|---|
| **Imágenes y videos por proyecto, sin incrustarlos en la ficha.** | La ficha tiene una sección nueva, **«Evidencia»**, justo después de «Tecnologías» (donde marcaste el recuadro), con dos botones: **«Ver video»** (dorado; «Ver videos (n)» si hay varios) y **«Ver imágenes (n)»** («Ver imagen» si es una). Si un proyecto no tiene evidencias, la sección no aparece (como hoy en los demás planetas). En la ficha no se carga ninguna imagen ni video: nada se descarga hasta que alguien abre el visor. |
| **Que se abra un overlay como el de la nave.** | Los dos botones abren el **visor**: la misma ventana oscura del reproductor, con el título «Evidencia: nombre del proyecto», el contador («2 / 3»), la X y, abajo, el pie de la imagen o el título del video (y en los videos, «Video alojado en YouTube. Abrir en YouTube»). Se cierra con Escape, con la X o tocando fuera; la página de atrás queda quieta y al cerrar el foco vuelve al botón que lo abrió. Mientras hay un video a la vista la música se pausa, como con el video de la nave, y vuelve al pasar a una imagen o al cerrar. |
| **Varias imágenes y videos en carrusel, con flechitas.** | Todas las evidencias del proyecto van en un solo carrusel: primero los videos, luego las imágenes. «Ver video» lo abre en el primer video y «Ver imágenes» en la primera imagen; desde ahí se pasa de una a otra con las flechas, con ← → en el teclado o deslizando con el dedo (o con el ratón). Al llegar al final da la vuelta. Solo se monta lo que se está viendo: al pasar de un video a una imagen el video se quita de la página (deja de sonar), y las imágenes vecinas se precargan para que las flechas respondan al instante. |
| **Que en pantallas limitadas no sea un desastre.** | En escritorio la ventana ocupa hasta 1120 px y las flechas van a los lados; en un celular ocupa la pantalla, la imagen o el video van al ancho y las flechas (de 44 px, cómodas para el dedo) pasan debajo. La ventana y el escenario tienen una altura fija según la pantalla: al pasar de una imagen apaisada a una vertical, o a un pie más largo, nada salta de sitio. Sin desplazamiento horizontal; en un celular apaisado también cabe. |
| **Videos como enlaces de YouTube, para no sobrecargar la página.** | Los videos se configuran con el enlace o el id de YouTube (`videos: [{ type: "youtube", id: "…", title: "…" }]`) y se cargan solo al abrir el visor, con `youtube-nocookie.com`, dentro de la política de seguridad que ya permitía YouTube. Admite varios por proyecto; el campo antiguo `video` y los otros tipos (archivo, URL directa, Drive) siguen funcionando. |
| **El Robot 6-DOF con tu video y la imagen de evidencia.** | El planeta 01 lleva tu video de YouTube, la captura de la prueba (la app de escritorio con la gráfica de temperatura, el brazo con su electrónica y la app móvil) y el diagrama de arquitectura que mandaste, con pie y texto alternativo en español e inglés. Las imágenes están en `public/images/proyectos/robot-6dof/`: la captura a 1600 px como JPG (104 KB) y el diagrama como PNG (27 KB), sin metadatos. |

Lo que no se tocó: los textos de los proyectos (eso viene cuando mandes el contexto de cada uno), el universo, el encabezado, la música, la pantalla completa, el asistente y la hadita, el video de la nave (sigue en su reproductor), las cabeceras de seguridad y tu `vite.config.js`, byte por byte.

Cómo añadir evidencias a los demás proyectos: `docs/CONTENIDO.md`, secciones 3 y 4 (imágenes en `public/images/proyectos/<id>/` con `alt` y `caption`; videos como enlace de YouTube con `title`; la traducción en `projects.en.js` repite `src`, `type` e `id`). `npm test` avisa si falta un archivo, un `alt` o una traducción.

Archivos nuevos: `src/components/EvidenceViewer.jsx` (el visor), `src/lib/evidence.js` (qué evidencias tiene un proyecto y en qué orden), `tests/evidence.test.js`, `public/images/proyectos/robot-6dof/app-y-robot.jpg` y `diagrama.png`.

Archivos modificados: `src/components/ProjectPanel.jsx` (la sección «Evidencia» en lugar del botón de video y de la galería incrustada), `src/App.jsx` y `src/components/Home.jsx` (abrir y cerrar el visor, música y foco), `src/components/Icons.jsx` (icono de imagen), `src/i18n/strings.js` (textos nuevos en los dos idiomas), `src/index.css` (el visor), `src/data/projects.js` y `projects.en.js` (campo `videos` y las evidencias del Robot 6-DOF), `tests/data.test.js` e `i18n.test.js`, `tests/e2e/qa.cjs`, `README.md`, `docs/CONTENIDO.md` y este informe. Sin cambios: `vite.config.js`, `package.json`, `vercel.json`.

Pruebas: `npm test` 36/36 (5 nuevas) y e2e 344/344 (una corrida previa dio 342/344: fallaron dos comprobaciones de la V6.6 del primer clic en LinkedIn, por el tiempo de respuesta del asistente, ajenas a esta versión; la corrida completa final pasó todas) contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), con 45 casos nuevos: en escritorio, la sección en su sitio y sin nada incrustado ni descargado, los dos botones, el visor con imágenes y video (contador, pie, flechas, ← →, deslizar con el ratón, vuelta al final, el video se desmonta al pasar a una imagen, Escape, la X y tocar fuera cierran, el foco vuelve al botón, cada imagen cabe entera en el escenario, la ventana cabe y no se mueve al cambiar de evidencia, y la música se pausa con el video, vuelve con una imagen y vuelve al cerrar); lo mismo en inglés; y en dos celulares (vertical y apaisado) la ventana cabe sin desplazamiento horizontal, las imágenes se ven enteras (la casi cuadrada se recortaba en apaisado en una primera versión: corregido), las flechas van debajo o a los lados, deslizar con el dedo pasa de imagen y nada salta. Como esta máquina no llega a YouTube, en las pruebas el reproductor se sustituye por una página mínima en la misma dirección (se prueba el visor, no YouTube). Build y unitarias repetidas desde un extracto limpio del zip. Capturas en `capturas-v6.8/`: la ficha con la sección Evidencia y el visor (imagen 1, imagen 2 y video) en escritorio ES y EN, celular vertical y celular apaisado; en las del video, el recuadro del reproductor es una tarjeta que lo dice, porque aquí no hay acceso a YouTube.

Conviene verificar a mano: abrir el video desde el sitio publicado (el reproductor real de YouTube, que aquí no pude ver) y, en tu celular, deslizar entre evidencias y comprobar que el video deja de sonar al pasar a una imagen.

## Versión 6.7: el CV nuevo en los botones de descarga

Lo que pediste el 1 de noviembre: pasar al portafolio el CV aprobado ese día (español e inglés) sobre la última versión del sitio, que es la 6.6.

| Qué pediste | Cómo queda |
|---|---|
| **El CV nuevo en el portafolio.** | `public/JonathanCorpusCV_ESP.pdf` y `public/JonathanCorpusCV_ENG.pdf` son ahora los dos CV aprobados el 1 de noviembre de 2026 (una página cada uno, letra Archivo incrustada, autor «Jonathan Corpus» en los metadatos). Los botones «CV en español» y «CV in English» del encabezado y el aviso sin JavaScript siguen apuntando a los mismos nombres, así que no cambió ningún enlace: solo el archivo que se descarga. |
| **Sobre la última versión.** | Base: `jonathancorpusV6.6.zip` (commit `2bea38a`), la entrega más reciente del hilo «Auditar y mejorar el portafolio»; no había ninguna versión posterior ni ningún archivo tuyo más nuevo. |

Lo que no se tocó: todo lo demás. El universo, el encabezado, la barra, la música, la pantalla completa, la ficha, el video, el asistente y la hadita, las cabeceras de seguridad y tu `vite.config.js`, byte por byte. Los textos de los proyectos (`src/data/projects.js` y `projects.en.js`) tampoco se tocaron: todavía cuentan cosas que el CV nuevo dejó fuera a propósito (por ejemplo Power BI en Alfa o el prototipo de IA en el SCADA de KIA); alinearlos con el CV es un paso aparte, cuando tú digas.

Archivos modificados: `public/JonathanCorpusCV_ESP.pdf`, `public/JonathanCorpusCV_ENG.pdf`, `README.md` (la tabla de archivos de `public/` ya dice de dónde salen los PDF) y este informe. Sin cambios: `vite.config.js`, `package.json`, `vercel.json`, todo `src/` y `tests/`.

Pruebas: `npm test` 31/31 y e2e 299/299 contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), sin cambios en las pruebas. Además, una sonda aparte en escritorio y en celular, en español y en inglés: los dos botones del encabezado tienen enlace de descarga directo, los dos archivos se sirven como `application/pdf` y empiezan con `%PDF-`, la descarga real por el botón entrega el archivo completo (205 455 bytes el español, 205 206 el inglés, idénticos byte por byte a los aprobados) y no hay errores en consola. Build y unitarias repetidas desde un extracto limpio del zip. Capturas en `capturas-v6.7/`: `cv-antes/` y `cv-ahora/` (la primera página de cada CV, la 6.6 y la 6.7) y `sitio/` (el encabezado con los botones en escritorio y celular, ES y EN).

Conviene verificar a mano: abrir los dos PDF desde el sitio publicado en Vercel después de subir esta versión, porque Vercel y el navegador pueden tener en caché el PDF anterior con el mismo nombre durante un rato (si sale el viejo, recarga sin caché o espera unos minutos).

## Versión 6.6: el asistente se abre desde más sitios, LinkedIn se copia y la hadita se mueve

Las tres mejoras que pediste el 1 de noviembre, sin tocar nada más del sitio:

| Qué pediste | Cómo queda |
|---|---|
| **Que «Contacto» abra el asistente.** | «Contacto», en la barra de arriba y en el menú del celular, sigue bajando a Contacto (y cerrando la ficha que esté abierta, con la dirección `/#contacto` como siempre) y además abre ahí el asistente. La primera vez saluda y ofrece los tres medios (copiar el correo, escribir, LinkedIn) más las preguntas sugeridas; si ya estaba abierto o contraído, lo trae de vuelta sin repetir el saludo. Con Ctrl/⌘ + clic o clic central es solo el enlace, como cualquier otro. |
| **Que el correo y LinkedIn de abajo también lo abran.** | El botón de copiar el correo y LinkedIn en Contacto hacen exactamente lo mismo que los del encabezado y del menú del celular: copian, abren el asistente y este lo confirma. El enlace del correo (`mailto:`) sigue abriendo tu programa de correo, igual que arriba. |
| **Que la primera vez LinkedIn copie la URL al portapapeles, arriba y abajo.** | El primer clic en cualquier LinkedIn de la página copia `https://www.linkedin.com/in/jonathan-corpus-462067237`, baja a Contacto y abre el asistente, que lo confirma con un aviso discreto («Enlace de LinkedIn copiado al portapapeles») y en el saludo, y ofrece el botón directo. Los siguientes clics abren LinkedIn en otra pestaña, como antes. Si el navegador no dejara copiar, lo dice y ofrece el enlace igual. Para lectores de pantalla el enlace avisa «la primera vez copia el enlace y abre el asistente». |
| **Que la hadita se pueda mover.** | En su modo bolita se arrastra con el dedo o con el ratón (en escritorio el cursor ya es la mano de agarrar). Al soltarla se pega al lado más cercano de la pantalla, a la altura donde la dejaste, como las burbujas de chat: nunca se sale de la pantalla ni se mete bajo la barra. Ahí se queda el resto de la visita, también al abrir y volver a contraer el asistente y al recargar la página. Un toque sin arrastre la sigue abriendo (y Enter con el teclado). Mientras no la muevas sigue apartándose sola de los botones, como en la 6.5; una vez que la colocas, manda tu sitio (solo la pantalla completa del universo la esconde, y vuelve al salir). Si la pegas a la izquierda, la pista «¿Hablamos?» pasa a su derecha. |

Lo que no se tocó: el universo, el encabezado, la música (0,35 y pista al 15 %), la pantalla completa, la columna de planetas, la ficha, el video, las cabeceras de seguridad de la 6.5, el asistente sin ninguna conexión externa (la prueba «sin `fetch` ni claves» ahora revisa también el archivo del arrastre) y tu `vite.config.js`, byte por byte.

Archivos nuevos en la 6.6: `src/hooks/useBubbleDrag.js` (el arrastre de la hadita: umbral de 6 px para distinguir toque de arrastre, captura del puntero, acotado a la ventana, pegado al lado más cercano y sitio guardado en `sessionStorage`).

Archivos modificados: `src/App.jsx` (las entradas «Contacto», correo y LinkedIn en un solo sitio; LinkedIn copia su enlace la primera vez), `src/components/TopBar.jsx` (Contacto de la barra y del menú), `src/components/Footer.jsx` (correo y LinkedIn de Contacto conectados al asistente), `src/components/ContactActions.jsx` (`plainClick`, comentarios), `src/components/ContactAssistant.jsx` (aviso de «Enlace de LinkedIn copiado», la hadita arrastrable), `src/hooks/useAssistantDock.js` (respeta el sitio elegido por la persona; la pista a la derecha cuando está a la izquierda), `src/lib/assistantDock.js` (`snapBubble`, `bubblePlacement`), `src/lib/assistantDemo.js` (saludos nuevos: Contacto, LinkedIn copiado o no), `src/i18n/strings.js` (textos nuevos en los dos idiomas), `src/index.css` (hadita: posición movible, aspecto al arrastrar, `touch-action: none` para que el dedo la mueva a ella y no a la página), `tests/assistant.test.js`, `tests/e2e/qa.cjs`, `README.md`, `docs/CONTENIDO.md` (sección 14) y este informe. Sin cambios: `vite.config.js`, `package.json`, `vercel.json`, `src/hooks/useMusic.js` y `public/musica.mp3`.

Pruebas: `npm test` 31/31 y e2e 299/299 contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), con 44 casos nuevos (la primera corrida dio 297/299: los dos fallos eran de la hadita, React borraba la marca de «arrastrando» al apagarse la pista «¿Hablamos?»; se corrigió con atributos `data-*` y la segunda corrida completa quedó en 299/299): «Contacto» de la barra como primera entrada y como regreso, el correo y LinkedIn del pie, la copia del enlace de LinkedIn arriba y abajo, «Contacto» del menú del celular, y la hadita arrastrada con el ratón (sigue al puntero, se pega al lado, no se sale, el clic que la suelta no la abre, recuerda su sitio al contraerse, al recargar y tras la pantalla completa) y con el dedo en dos celulares (toques reales, la página no se mueve mientras se arrastra). Build y unitarias repetidas desde un extracto limpio del zip. Capturas de antes y después en `capturas-v6.6/`: 6 comparaciones (la V6.5 a la izquierda) y, en `v6.5-antes/` y `v6.6-ahora/`, las capturas sueltas de cada versión.

Conviene verificar a mano, en tu celular y en tu laptop:

- **Arrastrar la hadita con el dedo** en tu celular real (aquí fueron toques simulados en Chrome): que la página no se mueva mientras la llevas y que al soltarla se pegue al lado. En Safari de iPhone también está probado el no-selección y el no-menú de pulsación larga por CSS, pero no en un iPhone real.
- **Copiar el enlace de LinkedIn** en Safari: el portapapeles en Safari a veces pide que la copia sea en el mismo gesto del clic; así está hecho, pero vale confirmarlo.
- **La hadita en su sitio nuevo tapa lo que haya debajo** a propósito (es tu sitio): si en algún tamaño te estorba, se vuelve a arrastrar.

## Versión 6.5: auditoría completa y reparación

Primero audité la 6.4 sin tocar nada (build, código, pruebas, sondas en el navegador, 9 tamaños de pantalla en los dos idiomas, CPU frenada ×4 como un celular modesto, modo desarrollo de React, dependencias y seguridad) y después reparé cada punto. Ningún arreglo cambia cómo se ve o se usa el sitio, salvo para quitar el fallo: mismo universo, mismas animaciones, mismos textos y la misma estética.

| # | Hallazgo | Qué se hizo | Antes → después (medido) |
|---|---|---|---|
| 1 | **Grave.** Con el universo en pantalla completa, abrir el video, salir con Esc y cerrar el video dejaba la página congelada hasta recargar. | La pantalla completa y el reproductor bloqueaban el desplazamiento con el mismo interruptor y cada uno restauraba «lo que había»; cerrados en otro orden, el último dejaba un bloqueo huérfano. Ahora comparten un candado con conteo (`src/lib/scrollLock.js`): la página se libera cuando ya nadie lo pide, en cualquier orden. | Rueda tras cerrar: 174 → 174 px (trabada) → 174 → 674 px. |
| 2 | **Grave.** El asistente fallaba en equipos lentos: el panel aparecía antes de llegar a Contacto y después no se contraía al subir. | El viaje se daba por terminado con tiempos fijos (2 s y 0,9 s). Ahora se da por llegado cuando la página de verdad se detiene (`onScrollSettled` en `src/lib/assistantDock.js`: varios cuadros quieta o el evento `scrollend`), y la referencia para minimizar se toma ahí. Mismos umbrales que antes. | CPU ×4 en 1366 × 606: falló 2 de 8 veces → 0 de 8 (y 2 de 2 en las pruebas e2e). |
| 3 | Cambiar ES/EN todavía movía la página en celular y en Safari (el encabezado cambia de largo con el idioma). | Antes del cambio se mide lo que hay en el centro de la pantalla y, antes de pintar, se deja donde estaba (`src/lib/viewAnchor.js`, usado por `setLang`). Ya no depende del anclaje de Chrome, que Safari no tiene. | Celular 390 × 844: −60 px → 0; Safari simulado: −33 a −58 px → 0; escritorio 1366 × 606 y 1440 × 900: 0 → 0 (máximo ±1 px). |
| 4 | Cada vuelta de lista a 3D dejaba vivo el contexto WebGL anterior, hasta el aviso «Too many active WebGL contexts» (en celulares el límite es más bajo y puede tumbar la escena que se ve). | `dispose()` suelta el contexto en el acto (`forceContextLoss()`). | Tras 17 vueltas: 16 contextos vivos (el máximo de Chromium) y el aviso → 1 vivo, sin aviso. |
| 5 | El universo seguía dibujando detrás del video. | Se pausa mientras el reproductor está abierto (`setPaused`, prop `paused` de `Universe.jsx`) y sigue donde iba al cerrarlo. | Llamadas de dibujo en 1,2 s con el video abierto: 161 → 0. |
| 6 | El arranque del 3D congelaba la página un momento: en tu pantalla el universo arranca al cargar y hubo una tarea de 2,3 s. | Las acuarelas de los planetas se pintan sin trabajo inútil (las copias que caen fuera de la imagen se omiten), en un lienzo de CPU, una por una dejando respirar a la página, y se guardan para no repintarlas al volver de la lista. Los shaders se compilan en segundo plano donde el navegador lo permite, y el primer cuadro se dibuja al terminar, aunque el universo aún no esté a la vista. | Tarea más larga en 1366 × 606: 2,3 s → 0,35–0,46 s. Cada textura: ≈100 ms → ≈12 ms. Planetas: idénticos píxel a píxel en equipos sin aceleración; con tarjeta gráfica, a lo más 6/255 de diferencia (promedio 0,4/255), invisible. |
| 7 | Sin cabeceras de seguridad al publicar. | `vercel.json` manda una política de contenido a la medida (solo los scripts del sitio, Google Fonts, YouTube y Drive), `nosniff`, protección contra incrustar el sitio en otra página, `Referrer-Policy` y `Permissions-Policy`. `tests/e2e/serve.cjs` sirve `dist/` con esas mismas cabeceras para probarlas en local. Guía en `docs/CONTENIDO.md`, sección 15 (también qué añadir para Turnstile y Gemini). | Recorrido completo (carga, universo, fichas, video, música, idioma, asistente, lista, `/video`): 0 violaciones. |
| 8 | LinkedIn enlazado por `http://`. | `https://` en `src/data/profile.js` y en el aviso sin JavaScript de `index.html`. | 0 enlaces `http:` en el sitio. |
| 9 | A 320 px en inglés (y a 340) la página se salía 5 px de lado y «Résumé (Spanish)» quedaba cortado. | La columna del encabezado ya puede ser más angosta que su contenido más ancho. Los dos CV siguen lado a lado mientras quepan enteros; solo a 320–340 px en inglés, donde no caben, cada uno va en su fila. | 320 y 360 px, ES y EN: 5 px → 0 px de desplazamiento horizontal, con idioma, música y CV completos. |
| 10 | Aviso en consola en cada video («Allow attribute will take precedence over 'allowfullscreen'»). | El iframe pide la pantalla completa una sola vez (`allowFullScreen`), en `VideoModal.jsx` y `VideoPage.jsx`. Se sigue pudiendo ver en pantalla completa. | 1 aviso por video → 0. |
| 11 | Desenfoque que no se ve en la barra clara: es opaca, pero Safari lo recalculaba en cada desplazamiento (en Chrome ni siquiera llegaba a aplicarse, ver el punto 13). | Variable `--topbar-blur`: ninguno en el tema claro; el oscuro, que sí es translúcido, lo conserva. | Sin cambio visible. |
| 12 | Las pruebas e2e fallaban en máquinas lentas aunque el sitio estuviera bien, y si algo reventaba a mitad no decían qué había pasado. | Esperan condiciones (que la página se detenga, que termine una animación) en vez de tiempos fijos, imprimen siempre el resumen y suman el bloque «V6.5», que repite cada caso de esta tabla. | Ver «Pruebas». |
| 13 | **Salió en las pruebas nuevas.** En Chrome y Edge se perdían dos desenfoques: el de la barra oscura y el de los controles que flotan sobre el cielo 3D (el que evita que las etiquetas de los planetas se lean a través de los botones, desde la 4.6). | El CSS los escribía dos veces, la estándar y la de Safari al final; al compilar quedaba solo la de Safari. Ahora va solo la estándar y la compilación añade la de Safari (comentario en `src/index.css` y en `docs/CONTENIDO.md`, sección 16). | Chrome: sin desenfoque → con desenfoque, como ya se veía en Safari. |
| 14 | **Salió en las capturas de antes y después.** En celulares angostos: a 320 px el correo se partía en «…gmail.co» con una «m» suelta abajo (ya pasaba en la 6.4 en español), y los iconos de los botones del CV se aplastaban para que cupieran lado a lado (a 360 px en inglés quedaban de 5 px; a 320 px, de 0). | El correo cabe en una línea a 320 px con la letra apenas más chica y, si de plano no cabe (280 px, un Galaxy Fold cerrado), baja «@gmail.com» entero (`EmailText` en `src/components/ContactActions.jsx`). Los CV no se encogen: relleno lateral más corto, que solo se nota cuando van justos, y la letra apenas más chica a 380 px o menos. | Correo a 320 px: 2 líneas → 1. Icono más aplastado: 0 px → 18 px (completo), lado a lado como siempre. |

Lo que no se tocó: el volumen inicial de 0,35 y la pista al 15 %, la pantalla completa automática que respeta la salida y no vuelve a entrar sola, el lienzo sin esquinas redondeadas y pegado a la barra, el engranaje de KIA fuera del sitio de aterrizaje, la columna vertical compacta en ventanas bajas, el asistente sin ninguna conexión externa (su prueba «sin `fetch` ni claves» sigue pasando) y tu `vite.config.js`, byte por byte (comparado con el de la 6.4).

Una sospecha descartada: la onda EEG del planeta Salud y la estela de la nave no se recortan en los bordes (su caja se calcula antes del primer cuadro). Y una nota fuera del código: los PDF del CV llevan como título interno «CV_English Original» y «CV_Spanish_Original», que es lo que muestra la pestaña al abrirlos; se cambia en Canva poniéndole nombre al diseño antes de exportar.

Archivos nuevos en la 6.5: `src/lib/scrollLock.js` (candado de desplazamiento), `src/lib/viewAnchor.js` (ancla de la vista al cambiar de idioma) y `tests/e2e/serve.cjs` (servidor local con las cabeceras de producción).

Archivos modificados: `src/hooks/useFullscreen.js` y `src/components/VideoModal.jsx` (candado compartido; el iframe del modal y el de `src/components/VideoPage.jsx` sin el permiso duplicado), `src/three/UniverseScene.js`, `src/three/textures.js`, `src/three/worlds.js`, `src/components/Universe.jsx` y `src/components/Home.jsx` (arranque, pausa detrás del video y contexto WebGL), `src/i18n/index.jsx` (idioma), `src/lib/assistantDock.js` y `src/hooks/useAssistantDock.js` (llegada del asistente), `src/index.css` (barra, encabezado en celulares angostos, desenfoques y aviso sin JavaScript), `src/components/ContactActions.jsx` (el correo solo se parte antes de la @), `src/data/profile.js` e `index.html` (LinkedIn https), `vercel.json` (cabeceras), `tests/assistant.test.js`, `tests/data.test.js`, `tests/video.test.js` y `tests/e2e/qa.cjs` (pruebas), `README.md`, `docs/CONTENIDO.md` (secciones 15 y 16) y este informe. Sin cambios: `vite.config.js`, `package.json`, `src/hooks/useMusic.js` y `public/musica.mp3`.

Pruebas: `npm test` 30/30 y e2e 255/255 contra el servidor con las cabeceras de producción (`tests/e2e/serve.cjs`), incluida la de cero violaciones de la política de seguridad; antes del pulido del punto 14, otra corrida completa dio 251/251. Build y unitarias repetidas desde un extracto limpio del zip. Capturas de antes y después en `capturas-v6.5/`: 12 comparaciones (la V6.4 arriba o a la izquierda) y, en `v6.4-antes/` y `v6.5-ahora/`, las 29 capturas de cada versión en 7 tamaños y los dos idiomas, en las mismas posiciones. Fuera de lo arreglado (puntos 3, 9, 13 y 14) todo queda igual: a lo más 2 % de píxeles distintos, que es la animación del universo.

Conviene verificar a mano:

- **Safari (iPhone o Mac):** cambiar ES/EN con la página a media altura, dentro del universo. Lo probé quitándole a Chromium el anclaje de desplazamiento, que es justo lo que le falta a Safari, no en un Safari real.
- **Tu laptop con su tarjeta gráfica:** el arranque del 3D debería sentirse más ligero; la compilación de shaders en segundo plano solo existe con tarjeta gráfica real (aquí el WebGL va por software).
- **Los controles sobre el cielo 3D en Chrome** (Recorrido guiado, Volver al centro, Vista de lista, Pantalla completa): ahora llevan el desenfoque que siempre tuvieron en Safari. Si prefieres el aspecto anterior, es una línea en `src/index.css`.
- **Ya en Vercel:** abrir la consola del navegador y confirmar que no aparezca ningún «Refused to …». Si algún día agregas Vimeo, Loom o el captcha, añade su dominio como dice `docs/CONTENIDO.md`, sección 15.

## Versión 6.4: asistente de contacto flotante (prototipo)

Un asistente de contacto propio del sitio, con la paleta, las tipografías, los bordes y las sombras del portafolio (no un widget de terceros). Aparece en Contacto y, cuando sigues explorando, se recoge en una hadita discreta en la esquina. Es un prototipo: las respuestas son de ejemplo, escritas a mano con los datos del sitio, y **no hay ninguna conexión externa** (ni Google, ni IA, ni claves, ni servicios de pago). El panel lo dice en su cabecera («Demo · Respuestas de ejemplo») y el asistente lo aclara si le preguntan si es una IA. Nada más cambió: el modelo 3D, las estrellas, el universo, la música y tu `vite.config.js` (byte a byte) quedan igual.

| Petición | Qué se hizo |
|---|---|
| Prototipo funcional con respuestas fijas, en un módulo aparte para cambiarlo después por la integración real | `src/lib/assistantDemo.js` tiene las respuestas en español e inglés, sacadas de `src/data/` (perfil, proyectos, CV y video), así que no inventa nada. La interfaz solo habla con `src/lib/assistant.js`: su función `askAssistant()` hoy contesta con la demo tras una breve pausa de «escribiendo», y mañana puede llamar a tu función de Vercel sin tocar la interfaz (ver `docs/CONTENIDO.md`, sección 14). Sin librerías de chat ni dependencias nuevas: `package.json` no cambió. Una prueba revisa que esos archivos no tengan `fetch`, claves ni tokens. |
| Copiar el correo en el encabezado | Sigue copiando y, además, la página baja suave hasta Contacto, se abre el asistente con un saludo que confirma la copia y aparece un aviso discreto «Correo copiado al portapapeles» al pie del panel (2,6 s). Si el navegador no deja copiar, el saludo lo dice y ofrece el correo con su botón. En el menú del celular hace lo mismo (cierra el menú y abre el asistente). |
| LinkedIn en el encabezado | La primera vez en cada visita no sale del sitio: lleva a Contacto y abre el asistente, que ofrece el enlace a LinkedIn. Las siguientes veces va directo. Sigue siendo un enlace real: Ctrl/⌘ + clic, clic central o «abrir en otra pestaña» van siempre directo. En Contacto, el correo y LinkedIn siguen siendo los de siempre, visibles y directos. |
| «Contacto» de la barra | Igual que antes: lleva a Contacto sin abrir el asistente. |
| Minimizar al subir a explorar | Si subes más de un 22 % del alto de la pantalla (entre 140 y 260 px) por encima de donde llegaste, el panel se encoge hacia la burbuja. Ignora movimientos pequeños, rebotes, el desplazamiento dentro de la conversación y los ajustes por teclado o giro de pantalla. Nunca bloquea el scroll de la página (en escritorio tampoco) ni te persigue. |
| La burbuja | 54 px en escritorio y 50 px en celular, cielo nocturno con la hadita: un aleteo y un destello breves cada 7 s, nada constante. Sube lo justo para no tapar botones, enlaces ni títulos y, si no hay sitio, se aparta. La primera vez que se minimiza muestra «¿Hablamos?» 3 s, solo si no tapa nada. Al tocarla reabre el panel y vuelve suave a Contacto. Si llega una respuesta estando minimizado, lleva un punto rosa. Solo aparece después de abrir el asistente por primera vez. |
| Escritorio | Panel compacto abajo a la derecha (como máximo 360 × 480 px) con la hadita, «Asistente de Jonathan», la etiqueta «Demo», botón de minimizar, mensajes diferenciados, sugerencias, caja de texto y enviar, con scroll propio. Para no tapar el correo ni LinkedIn del pie, el contenido del pie se recorre a la izquierda lo justo (en 1366 px, unos 34 px). Capturas `d26-asistente-abierto.jpg`, `d27-asistente-burbuja.jpg` y `d28-asistente-oscuro.jpg`. |
| Celular (prioridad) | Panel inferior a todo el ancho de alrededor del 52 % del alto (entre 300 y 560 px), con la página visible arriba, scroll propio, margen para las zonas seguras y, con el teclado abierto, el panel sube y se ajusta al espacio visible. Al llegar, el correo y LinkedIn quedan por encima del panel. Sin desbordamiento horizontal. Capturas `m10-asistente-movil.jpg` y `m11-asistente-burbuja-movil.jpg`. |
| Conversación | Saludo breve según por dónde llegas (copiar correo, LinkedIn o burbuja) y respuestas sobre quién es, proyectos (con enlace a cada planeta), dónde ha trabajado, tecnologías, CV (descarga), video y contacto; recuerda el último proyecto del que hablaron («¿qué tecnologías usó?»). Si no sabe, lo dice y ofrece los medios reales (correo y LinkedIn). Envío controlado: no envía vacío ni dos veces mientras «escribe», máximo 400 caracteres. El botón ES / EN también traduce la conversación, saludo incluido. |
| Animaciones | Abrir y minimizar en 0,3 s (el panel se encoge hacia la burbuja) y una entrada corta para cada mensaje. Con «movimiento reducido» no hay animaciones ni aleteo. Modo oscuro con los colores de noche del sitio. |
| Accesibilidad | Panel como diálogo no modal con título y descripción; la conversación es un registro que anuncian los lectores de pantalla; todos los botones tienen nombre y la caja de texto su etiqueta. Enter envía, Mayús + Enter salta de línea, Esc minimiza y devuelve el foco a la burbuja, y todo funciona con teclado y táctil. |

Archivos nuevos en la 6.4: `src/components/ContactAssistant.jsx` (panel, burbuja y hadita), `src/hooks/useAssistantDock.js` (llegada a Contacto, minimizar al subir, teclado del celular y posición de la burbuja), `src/lib/assistant.js` (punto de cambio para la integración real), `src/lib/assistantDemo.js` (respuestas de ejemplo), `src/lib/assistantDock.js` (cálculos de la burbuja y del teclado) y `tests/assistant.test.js` (12 pruebas).

Archivos modificados: `src/App.jsx` (estado del asistente), `src/components/ContactActions.jsx` (copiar y LinkedIn pueden abrir el asistente), `src/components/Hero.jsx`, `src/components/TopBar.jsx` (menú del celular), `src/components/Home.jsx` (en pantallas angostas cierra la ficha de proyecto al abrir el asistente para que no se encimen), `src/components/Icons.jsx` (ícono de enviar), `src/i18n/strings.js` (textos ES / EN), `src/index.css` (sección «Asistente de contacto» al final), `tests/e2e/qa.cjs` (66 comprobaciones nuevas), `README.md`, `docs/CONTENIDO.md` (sección 14), `docs/INFORME.md` y cinco capturas nuevas. Sin cambios: `vite.config.js`, `package.json` y `vercel.json`.

Pruebas: `npm test` 26/26 (14 de antes y 12 del asistente) y e2e 213/213 (147 de antes y 66 del asistente: escritorio 1366 × 606 y 1024 × 700, LinkedIn, celular 390 × 844 y 375 × 667, modo oscuro y movimiento reducido), repetidas desde un extracto limpio del zip.

Conviene verificar a mano:

- **En tu celular real:** abrir el asistente, tocar la caja de texto y ver que el teclado no tape la caja ni el botón de enviar (lo probé con un teclado simulado, no con uno real).
- **Safari (Mac o iPhone):** que el regreso suave a Contacto termine bien. Safari no avisa cuando acaba un desplazamiento y ahí se usa un temporizador; debería verse igual.
- **Los textos y el tono** de las respuestas: están todos en `src/lib/assistantDemo.js`, por si quieres cambiar alguna.
- **La hadita y su tamaño** en tu laptop, y que el «¿Hablamos?» te guste.
- **Con lector de pantalla real** (VoiceOver o NVDA), si te interesa: lo comprobé por roles y etiquetas, no con un lector.

## Versión 6.3: el principito ya no pisa el engranaje de KIA, y tu `vite.config.js`

Dos cosas sobre la 6.2, más una corrección al acomodo del lienzo de la 6.2 que salió en las pruebas; nada más cambió.

| Petición | Qué se hizo |
|---|---|
| Al viajar a «Mantenimiento KIA» el principito quedaba parado sobre el engranaje | El engranaje dorado estaba casi en el mismo punto de la superficie donde aterriza el principito en todos los planetas (latitud 55°/longitud 40° frente a 58°/34°). Se movió a la derecha de ese sitio (50°/68°): ahora el principito aterriza entre la fábrica y el engranaje, que sigue girando y a la vista desde la cámara de la ficha y del recorrido. No cambió ni el principito ni el resto del planeta. Captura `d25-kia-engranaje-antes-ahora.jpg`. |
| (Corrección sobre la 6.2) El acomodo «pegado a la barra» solo debe responder a la rueda | En las pruebas apareció un caso en que la página se movía sola: al cambiar de idioma el encabezado cambia de alto y el navegador ajusta el desplazamiento unos píxeles para que no salte lo que ves; ese ajuste se tomaba como si hubieras subido con la rueda y, si el universo estaba cerca, la página se pegaba a la barra sin que lo pidieras. Ahora el acomodo solo se arma tras un giro de la rueda (o del trackpad); cualquier otro desplazamiento (ajustes del navegador, barra lateral, teclado, enlaces) no lo activa. Las pruebas de la rueda (acercarse, alejarse, volver) siguen pasando igual. |
| Conservar tu `vite.config.js` para no tener que habilitarlo en cada versión | Va tal cual lo mandaste (byte a byte): puerto 3000, `open: true` y `allowedHosts: ['.trycloudflare.com']` para exponer el servidor de desarrollo por túnel de Cloudflare. Queda anotado que ese archivo es tuyo y se conserva en las próximas entregas. |

Archivos modificados en la 6.3: `src/three/worlds.js` (una línea: posición del engranaje), `src/components/Universe.jsx` (el acomodo se arma solo con la rueda), `vite.config.js` (el tuyo), `docs/INFORME.md` y una captura nueva.

## Versión 6.2: el lienzo pegado a la barra y completo en pantallas bajas

Tres ajustes sobre la 6.1, a partir de tu captura de la ventana baja; nada más cambió.

| Petición | Qué se hizo |
|---|---|
| Quitar la franja de fondo entre la barra y el lienzo, «pegadito borde con borde» | Al saltar al universo («Explorar», «Proyectos» o la URL `/#universo`) el lienzo queda justo bajo la barra: antes se dejaban 8 px de aire (`scroll-padding-top`), que era la franja gris. El contacto conserva su aire de siempre. Además, en escritorio, si bajas con la rueda y el desplazamiento se detiene con el universo a menos de un tercio de pantalla de la barra, la página termina de acomodarse sola (con animación suave; sin ella si tienes el movimiento reducido activado) para que el lienzo quede pegado. Solo actúa al acercarte, bajando desde el encabezado o subiendo desde el contacto; cuando te alejas no te retiene, a diferencia de `scroll-snap`, que «atrapa» el desplazamiento y por eso no se usó. En celular no cambia nada. |
| Que el lienzo entre completo en tu pantalla (sin recorte abajo) sin verse chico | En ventanas de escritorio bajas (hasta 760 px de alto) el escenario vuelve a medir lo que queda bajo la barra (en 1366 × 606: 544 px, de 62 a 606), de modo que la columna de planetas y el zoom se ven enteros sin desplazarse. Para que no se vea pequeño, como pasó en la 6, la cámara se acerca en la misma proporción en que el lienzo es más bajo que los 640 px de diseño: planetas, sol y nave se ven en pantalla del mismo tamaño que en la V4.4 (comparación en `d24-tamano-planetas.jpg`); lo que se recorta es un poco de cielo arriba y abajo, no la escena. Lo mismo vale para la ficha de un planeta y la nave. En ventanas de 702 px o más y en celular el encuadre es el de siempre. |
| El título, los botones y la columna | Siguen compactos en ventanas bajas, como en la 6, y en 1366 × 606 la columna termina 9 px por encima del borde del lienzo y 8 px bajo los botones. |

Archivos modificados en la 6.2: `src/index.css` (`scroll-padding-top`, aire del contacto y alto del escenario en ventana baja), `src/components/Universe.jsx` (acomodo al detenerse cerca), `src/three/UniverseScene.js` (`goalPose`: acercamiento proporcional al alto), `tests/e2e/qa.cjs` (ventana baja: pegado, completo y rueda), `docs/INFORME.md` y dos capturas nuevas (`d23-pegado-y-completo-antes-ahora.jpg`, `d24-tamano-planetas.jpg`).

## Versión 6.1: el lienzo 3D vuelve a su tamaño y sin esquinas redondeadas

Solo los dos puntos pedidos; nada más cambió.

| Petición | Qué se hizo |
|---|---|
| El lienzo 3D quedó más pequeño que antes; devolverle el tamaño que tenía (comparado con la V4.4) | La 4.6 añadió una regla para ventanas de escritorio bajas (hasta 760 px de alto) que encogía el escenario al alto de la ventana. Se quitó esa línea, así que el escenario vuelve a la medida de la V4.4: el alto de la ventana menos la barra, con un mínimo de 640 px. Medido en 1366 × 606: V4.4 640 px, V6 536 px, V6.1 640 px; en 1440 × 900 y en celular no había diferencia (838 y 658 px en las tres). El ancho siempre fue el de la ventana. Como en la V4.4, en ventanas bajas el pie del lienzo (final de la columna de planetas y el zoom) queda a un pequeño scroll. Captura `d20-lienzo-alto-antes-ahora.jpg`. |
| Quitar las esquinas redondeadas del lienzo | `.universe` ya no tiene `border-radius` (antes 36 px arriba en escritorio y 26 px en celular): las esquinas son rectas en escritorio y celular. Captura `d21-esquinas-antes-ahora.jpg`. |

Archivos modificados en la 6.1: `src/index.css` (tres líneas), `tests/e2e/qa.cjs` (la prueba de ventana baja ahora comprueba el alto de 640 px y las esquinas rectas), `docs/INFORME.md` y dos capturas nuevas en `docs/capturas/`.

## Versión 6: estrellitas menos inclinadas, brazos del principito y el menú vertical de vuelta

Evolución controlada sobre la 4.6: solo los cuatro puntos pedidos, sin tocar nada más.

| Petición | Qué se hizo |
|---|---|
| Las estrellitas iban a unos 45°, como arrastrando al principito; acercarlas a 60° conservando el efecto | El ramillete ya no se adelanta tanto: medido en el modelo 3D, el centro de las estrellas pasa de 54° a 64° sobre la horizontal a media travesía (unos 10° más vertical; en pantalla el ángulo aparente depende del rumbo y de la cámara, y era el que tú veías como 45°), con la mitad de vaivén hacia adelante al llegar, y el cuerpo se inclina menos en el vuelo (16° en vez de 23°). Mismas estrellas, hilos, colores, titileo y suelta al aterrizar. Si lo quieres aún más vertical o más tendido, son dos números (ver `docs/CONTENIDO.md`, sección 13). Captura `docs/capturas/d19-estrellas-inclinacion-antes-ahora.jpg`. |
| Dos brazos visibles y estéticos, sin tocar el modelo | El principito tiene ahora dos brazos hechos con las mismas primitivas y colores del modelo: hombro redondeado bajo la bufanda, brazo y antebrazo del verde del abrigo con un leve codo, puño dorado (como el cinturón) y mano del color de la piel. En reposo caen algo separados del abrigo con las manos hacia el frente a la altura del cinturón, en vez de un tubo pegado al costado; en el vuelo el derecho se alza recto para sujetar los hilos y el izquierdo queda un poco hacia atrás. Rostro, cabello, abrigo, cinturón, bufanda, piernas y proporciones no cambiaron. Captura `d18-brazos-antes-ahora.jpg`. |
| Recuperar el menú vertical del canvas (la fila horizontal de la 4.6 en ventanas bajas no gustó) | Vuelve la columna de la 4.5 en todos los casos. En ventanas de escritorio bajas (hasta 760 px de alto) se compacta para no tapar los controles: filas de 27 px (antes 38), un poco menos de aire, y el encabezado del universo se recoge (título algo menor y menos margen), de modo que en 1366 × 606 la columna queda 28 px por debajo de «Recorrido guiado» y termina dentro de la ventana. Si una ventana fuera aún más baja, la columna se desplaza verticalmente dentro de su cápsula sin salirse (alternativa «desplazamiento vertical» de las que propusiste). En ventanas normales (1440 × 900 y más) y en celular no cambia nada. Comparado con la 4.5: misma columna, mismos botones, mismo lugar. Captura `d17-menu-ventana-baja-antes-ahora.jpg`. |
| Conservar la configuración de Cloudflare | El zip V4.6 que adjuntaste es byte a byte el que te entregué (mismo checksum MD5 `bd043a81…`), y el de la 4.5 también (`7d4e82e6…`): no contienen ningún archivo de Cloudflare (ni `wrangler.toml`, ni `_redirects`/`_headers`, ni config de túnel). Lo único relacionado en el proyecto es la guía para alojar videos en Cloudflare R2 (`docs/CONTENIDO.md`, sección 7), que se conserva igual. No se tocó `vite.config.js` (dev en el puerto 3000), `vercel.json` ni `package.json`, así que cualquier túnel o despliegue que tengas apuntando al proyecto sigue funcionando igual. Si tu configuración vive en un archivo fuera del zip, mándamelo y lo incluyo tal cual. |

Archivos modificados en la 6: `src/three/worlds.js` (brazos y posición de las estrellitas), `src/three/UniverseScene.js` (inclinación del cuerpo en vuelo, una línea), `src/index.css` (bloque de ventana baja), `tests/e2e/qa.cjs` (comprobaciones de la ventana baja), `README.md`, `docs/INFORME.md`, `docs/CONTENIDO.md` y cuatro capturas nuevas en `docs/capturas/`. Nada más cambió.

Hallazgos fuera del alcance (no corregidos, por tu instrucción): en tu captura de la ventana baja marcaste también las esquinas superiores del universo; si te referías a algo ahí, dime qué y lo vemos aparte.

## Versión 4.6: la lista de planetas en ventanas bajas y el principito volando con sus estrellitas

| Petición | Qué se hizo |
|---|---|
| Al entrar a la página, en tu laptop (ventana de unos 1366 × 606 px) la lista de proyectos se montaba sobre «Recorrido guiado» y los demás botones, y las etiquetas de los planetas se veían a través de ellos | En ventanas de escritorio bajas (hasta 760 px de alto) la lista deja de ser una columna a la izquierda y pasa a ser una **fila de pastillas al pie del universo**, debajo de los botones y sin pisar el zoom; con la ficha abierta la fila termina antes de la ficha. El universo baja su alto mínimo en esas ventanas (de 640 a 520 px) para que el pie quede a la vista sin desplazar. Además, los botones del universo («Recorrido guiado», «Volver al centro», «Vista de lista», «Pantalla completa») llevan ahora fondo semitransparente con desenfoque, así las etiquetas de los planetas ya no se leen a través de ellos. En ventanas normales (1440 × 900, 1920 × 1080) no cambia nada. Captura `docs/capturas/d14-ventana-baja-antes-ahora.jpg`. |
| Que el viaje entre planetas sea el principito volando con sus estrellitas amarradas, como en la ilustración | Al elegir otro planeta, el principito **alza el brazo, un ramillete de 11 estrellitas atadas con hilos a su mano tira de él y lo lleva en arco hasta el siguiente planeta**; la bufanda ondea al viento, va inclinado hacia el rumbo y, al llegar, las estrellitas lo sueltan, se elevan y se apagan mientras él aterriza y baja el brazo. El viaje dura 1,7 s, lo mismo que la cámara, que ahora **sube con él** para que nunca se salga del cuadro; en celular (donde la ficha deja poca franja visible) el ramillete se recoge para caber. También funciona rumbo a la nave y desde ella, y en el recorrido guiado. Con «movimiento reducido» activado no hay vuelo (aparece ya en el planeta), como antes. Capturas `d15-vuelo-estrellitas.jpg`, `d16-vuelo-reposo-vs-vuelo.jpg` y `m8-vuelo-movil.jpg`. |

Detalle que puede interesarte: si eliges otro planeta a mitad de un vuelo, el principito sigue desde donde va (antes volvía a saltar desde el planeta anterior).

## Versión 4.5: la ficha en la vista de lista, música de noche y pista al 15 %

| Petición | Qué se hizo |
|---|---|
| En la vista de lista la ficha se interponía sobre las tarjetas (también en pantalla completa) | En escritorio (≥ 960 px) la ficha ya no flota sobre la lista: la cabecera y la rejilla de tarjetas le dejan sitio (28 px de aire) y las tarjetas se reacomodan en menos columnas (3 a 1920 px, 2 a 1366 px, 1 a 960 px), como si la ficha las empujara; el cambio de ancho es animado. Dentro de pantalla completa pasa lo mismo y la lista completa sigue desplazable. |
| Al salir de pantalla completa en la vista de lista (o al abrir una tarjeta sin pantalla completa) la ficha volvía a flotar sobre el encabezado y a rebasar la sección | En la vista de lista la ficha va ahora dentro de la sección del universo: se pega bajo la barra mientras recorres la lista y nunca sube por encima del borde superior ni baja por debajo del inferior de la sección. La vista 3D conserva el anclaje al lienzo de la 4.4 y el móvil no cambia (sigue siendo la hoja inferior). |
| El icono de música se veía más cargado que antes | De día no había cambiado nada: lo distinto era el modo oscuro, donde el chip encendido llevaba un anillo dorado fuerte con relleno. De noche ahora es discreto (anillo suave, sin relleno marcado); las barras animadas siguen diciendo que suena. Captura `docs/capturas/d13-musica-noche-antes-ahora.png`. |
| Dejar la pista al 15 % en vez de la del 30 % | `public/musica.mp3` es ahora tu versión al 15 % del original (−17 dB respecto al original; la misma que me pasaste). El control sigue arrancando al 35 %. La clave de preferencias guardadas pasó a `jc-music-4` para que nadie conserve un volumen de la pista anterior. El original real sigue en `assets-src/musica-original.mp3` (no se publica) por si algún día quieres otro porcentaje. |

La reentrada automática en pantalla completa queda como en la 4.4 (tras salir, no vuelve a entrar sola) hasta que decidas; la opinión con fuentes va en el hilo.

## Versión 4.4: pantalla completa automática, overlay y modo oscuro

| Petición | Qué se hizo |
|---|---|
| Entrar en pantalla completa al interactuar con el 3D | La primera vez que tocas, haces clic o arrastras directamente sobre el lienzo (o sus etiquetas flotantes), el universo entra solo en pantalla completa, en móvil y en escritorio. Donde el navegador no da la API nativa (iPhone), se usa el modo equivalente con CSS que ya tenía el botón: la experiencia es la misma. Salir queda siempre a un gesto (botón, Esc, Espacio o atrás) y, si sales, no vuelve a entrar sola en toda la visita: tu salida se respeta. Los controles táctiles, el arrastre y la selección siguen funcionando; desplazar la página sobre el lienzo no dispara la pantalla completa (solo la interacción directa). |
| Overlay dentro de los límites del lienzo (escritorio) | La ficha ya no flota fija sobre la ventana: en la vista 3D va anclada al lienzo, así que acompaña el desplazamiento y nunca rebasa su borde superior ni el inferior (tu captura del encabezado tapado ya no puede pasar). En pantalla completa queda igualmente contenida. |
| Overlay discreto en móvil con pantalla completa | Se corrigió la causa de tu captura: una regla de escritorio dejaba la ficha colgada ARRIBA en pantalla completa, tapando la escena. Ahora en móvil la ficha es una hoja inferior de como mucho el 44 % de la pantalla, y el asa se volvió botón: un toque la contrae a solo su título (para ver la escena) y otro la expande. |
| Al salir de pantalla completa en móvil, el overlay no se queda | Al salir de pantalla completa en una pantalla táctil, la ficha abierta se cierra en vez de quedarse sobre el lienzo reducido. Abrirla sin pantalla completa sigue siendo posible (vista de lista, enlaces directos `/proyecto/...`): solo la salida la cierra. |
| Modo oscuro coherente con la temática | El sitio ahora declara `color-scheme: light dark` (eso además evita que Chrome en Android «invente» su propio oscurecido, que es lo que te desteñía los colores). Con el sistema en oscuro, el papel marfil se vuelve el cielo nocturno del principito: azul profundo con estrellas sutiles, texto crema, oro un punto más claro donde es texto, y halo cálido en la ilustración. Botones, fichas, barra, controles de música e idioma y la página del video acompañan el tema. El universo 3D, el pie y el reproductor ya vivían de noche y quedan idénticos en ambos temas, igual que todo el modo claro. |

Nota de los archivos de tu `portafolio-vite2.rar`: tu `assets-src/musica-original.mp3` venía sobrescrito con la versión al 15 % (ya no era el original). Restauré el original real en esa ruta (de la entrega V4.3); tu `public/musica.mp3` (30 %) y tu volumen inicial (35 %) quedaron tal cual los fijaste.

## Versión 4.3: cursor de nave, música más suave y botones en una fila

| Petición | Qué se hizo |
|---|---|
| Cambiar el cursor por una navecita, solo cuando se está sobre un planeta | Al pasar el ratón sobre un planeta (o sobre su etiqueta) el cursor se convierte en una pequeña nave dorada que apunta al planeta, como si fuera a aterrizar. En el resto del lienzo se mantiene la mano de arrastrar, que es la que indica que se puede girar la vista. Es un cursor SVG de 32 px con respaldo al cursor de enlace en navegadores que no lo admitan; en pantallas táctiles no aplica. |
| Música: atenuar el original al 30 % y arrancar al 65 % | `public/musica.mp3` se regeneró **desde el original** (no desde la versión al 55 %) con ganancia 0.30 (−10.5 dB medidos). El control arranca al 65 % y de ahí se sube o se baja. Se cambió la clave de preferencias guardadas para que nadie conserve un volumen de versiones anteriores. |
| Quitar «Sobre mí» (el video lo cubre) | Se quitó la página `/sobremi` y todos sus enlaces (barra, menú móvil, pie y página del video). La ruta antigua `/sobremi` redirige a `/video`. La foto `Me.jpg` ya no se muestra en ningún sitio; queda una copia recortada en `assets-src/` por si se quiere usar. |
| «Explorar mis proyectos» y los dos CV en la misma línea | Ahora van en una sola fila. En ventanas medianas (entre 861 y 1199 px, portátil pequeño o tableta apaisada) la ilustración del principito se reduce a 300 px para que la fila siga cabiendo; solo por debajo de unos 970 px los dos CV bajan juntos a la siguiente línea, y en celular ocupan una fila entre los dos bajo «Explorar». Se redujo el espacio entre el encabezado y el universo. |

## Versión 4.2: video, orden del encabezado, música y navegación

| Petición | Qué se hizo |
|---|---|
| El video de presentación junto a tus contactos, para que no pase desapercibido | La fila de contacto del encabezado es ahora **Correo · LinkedIn · Video de presentación**. El enlace abre la página del video. |
| Orden del encabezado: contacto, «Proyectos» y debajo los dos CV; sin «Sobre mí» | «Explorar mis proyectos» ocupa una fila a lo ancho y debajo van «CV en español» y «CV in English», uno junto al otro (también en celular). «Sobre mí» se quitó del encabezado (y en la 4.3, de todo el sitio). |
| «Video» del menú como página propia, como en tu V1 | Nueva página `/video` con el video de YouTube embebido, enlace para abrirlo en YouTube, botones «Ver mis proyectos» y «Sobre mí» (este último, desde la 4.3, es «Volver al inicio»), y el contacto y pie debajo. Mientras se está en esa página la música de fondo se pausa y al salir se reanuda. La ficha de la nave conserva su botón «Ver mi video de presentación» (reproductor en ventana); su ruta pasa de `/video` a `/nave`. |
| Quitar «Inicio» del menú | La barra quedó: Proyectos · Sobre mí · Contacto · Video (más CV, idioma y música); desde la 4.3, sin «Sobre mí». El logotipo sigue llevando al inicio. |
| Si el principito queda sobre la nave, que la ficha de la nave aparezca sin hacer clic | Pasaba al cerrar la ficha de la nave: el principito quedaba a bordo sin su ficha. Ahora, al cerrar la ficha de la nave (X, Esc o al ir a otra sección), la cámara vuelve al centro; la nave nunca queda enfocada sin su ficha. |
| Música: atenuar el archivo al 55 % y que la página arranque al 100 % | `public/musica.mp3` se regeneró desde el original con ganancia 0.55 (−5.2 dB medidos sobre la señal decodificada; mismo formato, 128 kb/s, 3:24). El control arranca al 100 % y de ahí se baja. El original queda en `assets-src/musica-original.mp3` y el comando para cambiar el porcentaje está en `docs/CONTENIDO.md`. La animación del medidor se conserva. |
| Botón de música dentro del 3D | Descartado por indicación tuya (ya está en la barra y sería doble). |

Además, tu V1 (`jonathancorpuscv.rar`) traía los dos CV en PDF y tu foto. Se copiaron a `public/`: `JonathanCorpusCV_ESP.pdf`, `JonathanCorpusCV_ENG.pdf` y `Me.jpg` (esta última recortada a 720×720 y sin los metadatos del teléfono). Los botones de CV ya descargan los archivos (la foto se mostró en «Sobre mí» hasta la 4.3). Conviene que confirmes que esos PDF son tu versión actual.

Corrección encontrada al probar: si se abría un video justo cuando la música estaba por arrancar, el control podía quedarse en «Música no disponible». Ya no.

## Versión 4.1: ajustes pedidos tras la primera entrega

| Petición | Qué se hizo |
|---|---|
| Quitar la redundancia de la barra superior | La barra de navegación ya no está sobre el encabezado: ahí el nombre, correo, LinkedIn y los CV se ven directamente, como antes. La barra aparece al bajar (más allá del encabezado) con Inicio · Proyectos · Sobre mí · Contacto · Video, los dos CV, idioma y música, para cambiar de sección sin perderse. En `/sobremi` siempre está visible. |
| Un botón que traduzca todo | Selector **ES / EN** (en el encabezado y en la barra). Traduce interfaz, proyectos, «Sobre mí», nave y metadatos del documento, sin vistas separadas. Se recuerda la elección; la primera vez usa el idioma del navegador. Lo que no esté traducido cae en español. Guía en `docs/CONTENIDO.md`, sección 9. |
| Música ambiental al 40 % | Volumen inicial del 40 %. Escritorio: al pasar el cursor aparece el control de volumen con medidor animado y un clic silencia o reactiva. Móvil y pantallas táctiles: solo encender o apagar, siempre al 40 %, sin controles flotantes (el botón vive en el encabezado y en el menú). Se recuerda la elección. |
| Pantalla completa del universo | Botón «Pantalla completa» (escritorio) e ícono de esquinas junto al zoom (móvil). Se sale con **Espacio**, **Esc** o el botón de minimizar. Usa la API nativa de pantalla completa y, si el navegador no la ofrece, un modo a ventana completa equivalente. |
| «Sobre mí» como antes | Se quitó de debajo del universo. Vuelve a ser su propia página (`/sobremi`) con el contacto y el pie de página debajo. El bloque de contacto y pie que ya te gustaba se conserva en todas las páginas. |
| Conservar el principito en su planeta | La ilustración junto a «Jonathan Corpus» no se tocó. |

Correcciones encontradas al probar esta versión:

- Al primer toque en móvil arrancaba la música y la píldora cambiaba de ancho; el selector ES / EN se movía y el toque caía en el hueco (había que tocar dos veces). Ahora la píldora tiene ancho fijo.
- Una ficha cerrada con Esc podía reabrirse sola por un retraso del enrutador al actualizar la URL. Ahora la URL sigue al estado y se ignora el eco de la navegación propia.
- Después de salir de pantalla completa con Espacio, el botón enfocado se activaba al soltar la tecla. Ahora se descarta ese `keyup`.
- La barra superior dejaba entrever el contenido que pasa por detrás en móvil; ahora es opaca.
- Los botones del universo se partían en dos filas y se encimaban con etiquetas de planetas; ahora caben en una fila en escritorio.

## 1. Qué encontré en el proyecto original

- **Stack:** React 18.3 + Vite 8 + React Router 7, sin backend. Scripts `dev`, `start`, `build`, `preview`; no había pruebas.
- **Encabezado** (`Header.jsx`): nombre, subtítulo, correo, LinkedIn, navegación (Planetas / Sobre mí / Video), enlaces a los dos CV y botón de música. Estética de cielo azul con sol, nubes y colinas en CSS.
- **Planetas** (`Planets.jsx` + `data/projects.js`): 8 botones circulares con emoji sobre un camino SVG; el principito (SVG) saltaba al planeta elegido y luego se abría un modal con descripción y viñetas. Flechas ← → movían al principito; Escape cerraba. El último planeta («VR y la nave») mostraba la nave.
- **Sobre mí** (`/sobremi`): texto y foto `/Me.jpg`.
- **Video** (`/video`): iframe de YouTube `kB4uux4evWQ`.
- **CV:** enlaces a `/JonathanCorpusCV_ESP.pdf` y `/JonathanCorpusCV_ENG.pdf`.
- **Música:** `public/musica.mp3` (3.2 MB, `preload="auto"`), intenta sonar al abrir y, si el navegador lo bloquea, al primer clic o tecla.

Problemas detectados:

1. **Los PDF del CV y `Me.jpg` no estaban en el archivo.** Los botones de CV apuntaban a archivos inexistentes y, en un hosting de SPA, descargarían el HTML de la página con nombre `.pdf`.
2. Sin `vercel.json`: abrir directamente `/sobremi` o `/video` en Vercel daba 404.
3. La información de los planetas no era accesible sin el mapa (sin alternativa) y en móvil el escenario medía 980 px.
4. La fuente se cargaba con `@import` dentro del CSS (bloquea el render) y la música se precargaba completa al entrar.
5. `node_modules` venía de Windows (binarios `win32`); en Linux se reinstaló con `npm install`.

## 2. Cambios implementados

- **Capa profesional en HTML real:** encabezado con nombre, título, propuesta de valor, datos rápidos (Analista de ERP Finanzas, KIA México, Hospital Universitario UANL), correo, LinkedIn, «Explorar mis proyectos» y los dos CV. Todo visible en el primer pantallazo, sin hover ni 3D. La barra de navegación (con CV, idioma y música; menú en móvil) aparece al bajar. `<noscript>` con los mismos datos.
- **Verificación de CV:** antes de ofrecer la descarga, el sitio comprueba que el archivo exista y sea un PDF. Si falta, el botón aparece como «(pendiente)» en lugar de un enlace roto.
- **Universo 3D con Three.js 0.186** (cargado bajo demanda, en un archivo aparte): cielo pintado, estrellas y polvo, centro luminoso, 8 planetas con escenas propias, la nave y el principito (detalle en la sección 4).
- **Fichas profesionales** (`ProjectPanel.jsx`): panel lateral en escritorio y hoja inferior en móvil, con descripción, problema, contribución, puntos clave, tecnologías, aprendizajes, imágenes, video y enlaces. Cada sección solo aparece si el dato existe. Anterior / Siguiente, cierre con X o Escape y el foco vuelve al planeta.
- **Reproductor integrado** (`VideoModal.jsx`): `<dialog>` modal con `<video controls>` para archivos y URL directas, e iframe para Drive (`/preview`) y YouTube (`youtube-nocookie`). Se monta solo al abrirse (no se descarga nada antes), muestra estados de carga y de error con enlace directo, cierra con Escape, X o clic fuera, pausa el video al cerrar, devuelve el foco y pausa la música mientras se ve un video.
- **La nave como escena final:** cámara baja con un cielo que se ilumina en tonos de amanecer; su ficha contiene el video de presentación, motivaciones, objetivos documentados, contacto y CV.
- **Dos modos:** recorrido guiado (etapas 1 a 9, terminando en la nave) y exploración libre (lista de planetas siempre visible, clic o toque en el planeta o su etiqueta, flechas del teclado). «Volver al centro» en todo momento.
- **Vista de lista** disponible siempre y usada automáticamente cuando no hay WebGL.
- **Rutas:** `/video` (página del video de presentación), `/nave` (abre la ficha de la nave) y `/proyecto/<id>` para enlazar una ficha concreta; `/sobremi` (ruta antigua) redirige a `/video`.
- **Datos centralizados:** `src/data/profile.js` (nuevo) y `src/data/projects.js` (ampliado con id, escena 3D, problema, contribución, tecnologías, imágenes, video y enlaces). Todos los textos de proyecto provienen del contenido original; solo se reorganizaron en campos. Los únicos textos nuevos son las frases narrativas del recorrido (`story`) y la introducción de la nave, que describen la escena, no hechos.
- **Dirección artística:** papel marfil, tinta azul noche, oro cálido y acuarela; tipografías Fraunces (titulares) y Nunito Sans (texto); ilustración SVG original del principito en su asteroide con la rosa y el volcán. Sin imágenes del libro ni de la película.
- **Despliegue:** `vercel.json` (Vite, `dist`, reescrituras de rutas de la SPA sin afectar archivos con extensión, caché de `assets/`).
- **Pruebas:** `npm test` (datos y fuentes de video) y `tests/e2e/qa.cjs` (Playwright).

## 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Metadatos, carga de fuentes con `<link>`, `<noscript>` con datos de contacto |
| `package.json` / `package-lock.json` | Dependencia `three@^0.186.1`; scripts `test` y `test:e2e` |
| `src/App.jsx` | Reescrito: estado del universo, rutas de entrada, teclado, música (comportamiento original conservado, ahora `preload="none"` y pausa durante videos) |
| `src/index.css` | Reescrito con el nuevo sistema visual |
| `src/data/projects.js` | Ampliado; mismos 8 proyectos y textos |
| `src/data/profile.js` | Nuevo: datos personales, CV, nave, video de presentación |
| `src/components/TopBar.jsx`, `Hero.jsx` | Nuevos (sustituyen a `Header.jsx`) |
| `src/components/Universe.jsx`, `ProjectPanel.jsx`, `ProjectList.jsx`, `VideoModal.jsx` | Nuevos (sustituyen a `Planets.jsx` y `Video.jsx`) |
| `src/components/ContactActions.jsx`, `Icons.jsx` | Nuevos: botones de CV, correo, LinkedIn e iconos SVG |
| `src/components/Footer.jsx` | Actualizado (sección de contacto y navegación del pie). `AboutMe.jsx` se eliminó en la 4.3 |
| `src/three/UniverseScene.js`, `worlds.js`, `textures.js` | Nuevos: escena Three.js |
| `src/lib/video.js`, `src/lib/webgl.js`, `src/hooks/*` | Nuevos |
| `tests/*`, `vercel.json`, `.gitignore`, `README.md`, `docs/*` | Nuevos o reescritos |

## 4. Cómo quedó el universo 3D

- **Cielo:** esfera con shader de degradado azul noche → lavanda, un resplandor cálido en el horizonte y un lavado de ruido tipo acuarela. No es un fondo negro de ciencia ficción.
- **Profundidad:** tres capas de estrellas que giran a distinta velocidad (las mayores con destello en cruz), polvo dorado flotante en escritorio y niebla suave.
- **Centro:** una estrella cálida con halo que ilumina los planetas (luz puntual + hemisférica + contraluz frío).
- **Planetas:** esferas con textura de acuarela generada en el navegador, halo de atmósfera, órbita propia con leve inclinación y una pequeña escena animada que cuenta el proyecto. La «cara» decorada gira suavemente hacia la cámara para que siempre se lea.
- **El principito** en 3D vuela al planeta seleccionado colgado de un ramillete de estrellitas atadas a su mano derecha (desde la 4.6; antes daba un salto en arco) y termina a bordo de la nave. Desde la 6 tiene dos brazos con codo, puño y mano.
- **Interacción:** hover (escala, halo, órbita y etiqueta resaltadas, cursor), clic o toque (raycasting con zonas amplias), etiquetas HTML proyectadas sobre cada planeta, lista de planetas, flechas ← →, Escape y botones de acercar y alejar. La cámara viaja en arco durante 1.7 s y encuadra el planeta en el espacio que deja libre la ficha. Arrastrar gira la vista; Ctrl + rueda acerca, y la rueda sola sigue desplazando la página. En pantallas táctiles, el deslizamiento vertical desplaza la página y el horizontal gira la vista.
- **Rendimiento:** geometrías y materiales compartidos, texturas generadas (sin descargas), menos estrellas y sin polvo en pantallas táctiles, resolución limitada (2× escritorio, 1.5× táctil) con bajada automática a 1× si los primeros cuadros van lentos, render pausado cuando la pestaña está oculta o el universo fuera de pantalla, liberación completa de GPU al desmontar y manejo de pérdida de contexto WebGL con «Reintentar» o «Ver como lista». Sin posprocesado. El código 3D (616 kB, 158 kB comprimido) se descarga después de la página y solo cuando el universo se acerca a la pantalla.
- **Movimiento reducido:** sin órbitas, parpadeo ni parallax; la cámara cambia de punto sin animación.

## 5. Planetas y proyectos

| # | Planeta | Escena 3D | Proyecto |
|---|---|---|---|
| 01 | Robot 6-DOF | brazo robótico articulado | Control y monitoreo de un robot industrial con RoboSCADA |
| 02 | Finanzas y datos | columnas de datos y anillo | Integración serverless de NetSuite con Power BI y dashboards web |
| 03 | MealFlow | letrero tipo QR, árboles y tazón | Digitalización y trazabilidad de consumos de comedor con QR |
| 04 | Supply Chain Hub | cajas apiladas y cinturón de cajas | Transformación digital y analítica logística con Supply Chain Hub |
| 05 | Mantenimiento KIA | fábrica con humo y engrane | Sistemas web y ERP de mantenimiento |
| 06 | SCADA y planta | antena con ondas de señal | SCADA de mantenimiento en operación 24/7 |
| 07 | Hospital UANL | rosa bajo campana y onda EEG | Señales EEG y EMG para rehabilitación |
| 08 | VR y la nave | malla virtual y visor VR | Teleoperación robótica en realidad virtual |
| ✦ | La nave | nave con estela y cielo de amanecer | Video de presentación, motivaciones, objetivos y contacto |

## 6. Videos, proyectos futuros y URL

Ver `docs/CONTENIDO.md`: cómo añadir un video desde el celular (secciones 4 y 6), cómo cambiar la URL de un video (sección 4), cómo configurar Cloudflare R2 (sección 7), cómo cambiar el video de presentación (sección 5) y cómo agregar proyectos y vincular planetas (sección 1).

## 7. Pruebas ejecutadas y resultados

Entorno: contenedor Linux, Node 22.22, Chromium de Playwright sin GPU (WebGL por software con SwiftShader).

| Prueba | Resultado |
|---|---|
| `npm run build` | Correcto. Aviso informativo de Vite: el archivo de la escena 3D supera 500 kB (es Three.js, se carga de forma diferida). No se ocultó el aviso |
| `npm test` (datos, fuentes de video y traducciones) | 14/14 |
| E2E sobre el build de producción (`vite preview`), dos corridas seguidas | 147/147 (versión 6.3, sin comprobaciones nuevas; en la 6.2 también 147/147: en la ventana baja se comprueba que el lienzo empieza justo bajo la barra y entra completo, y que con la rueda se pega al acercarse y no retiene al alejarse; en la 6.1 fueron 144/144) |
| E2E sobre un build con un MP4 de prueba en «Robot 6-DOF» | 152/152 |
| Servidor de desarrollo (`npm run dev`) con `/proyecto/vr-nave` | Carga sin errores de consola |

Las 142 comprobaciones cubren: nombre, título, correo (`mailto`) y LinkedIn visibles en el primer pantallazo; copiar correo; acceso al CV en barra y encabezado; CV ausente marcado como pendiente sin enlace roto; escena creada con 9 etiquetas; hover; selección con clic en etiqueta y en el canvas; URL `/proyecto/<id>`; cierre de ficha y regreso del foco; teclado (Enter, ← →, Escape, segundo Escape vuelve al centro); proyecto sin video sin botón; recorrido guiado de 9 etapas hasta la nave; video de presentación en el modal; Escape cierra el modal y devuelve el foco; vista de lista y regreso a 3D sin duplicar la escena; pérdida de contexto WebGL y recuperación; rutas `/proyecto/finanzas-datos`, `/nave` y `/video`; móvil 390×844 (CV en la barra, correo visible, sin desplazamiento horizontal, menú, ficha a ancho completo que se cierra); movimiento reducido; y navegador sin WebGL (sin canvas, aviso, 9 tarjetas, fichas y contacto). Ninguna página registró errores de consola ni recursos locales con error HTTP.

Comprobaciones nuevas de la versión 4.1: la barra está oculta al inicio y aparece al bajar; el botón EN traduce encabezado, fichas y universo, y vuelve a ES; un navegador en inglés abre el sitio en inglés; la música arranca al 40 %, el control de volumen aparece al pasar el cursor, un clic silencia y otro reactiva al volumen guardado; en móvil solo existe encender o apagar; entrar y salir de pantalla completa con el botón, con Espacio (aunque haya un botón enfocado) y con Esc, y el lienzo ocupa toda la pantalla; `/sobremi` es una página propia sin el universo debajo y con el contacto al final; «Proyectos» desde Sobre mí regresa al universo; menú móvil con enlaces y sin desplazamiento horizontal.

Comprobaciones nuevas de la versión 4.2: los dos CV descargan como PDF; «Video de presentación» está en la misma fila que el correo y LinkedIn; el encabezado ya no enlaza «Sobre mí»; «Explorar» va arriba y abarca el ancho de los dos CV, que comparten fila (también en celular); la música arranca al 100 % del archivo; cerrar la ficha de la nave devuelve la cámara al centro; `/nave` abre la nave; `/video` es una página propia con el iframe de YouTube, enlace externo, barra y contacto; la barra no tiene «Inicio» y «Video» abre la página del video; el enlace del encabezado abre la página del video, que pausa la música y la reanuda al salir, sin falso aviso de «no disponible»; el menú móvil no tiene «Inicio» y sí el video.

Comprobaciones nuevas de la versión 4.4: tocar o hacer clic en el lienzo entra solo en pantalla completa (móvil y escritorio) y con la ficha dentro del lienzo; Espacio sale y en escritorio la ficha sigue; tras salir, una nueva interacción no reentra; la ficha anclada no sobresale del lienzo ni con la página a medio desplazar; en móvil la ficha de pantalla completa queda abajo con menos de media pantalla, el asa la contrae a solo el título y la expande, y al salir de pantalla completa desaparece; el tema claro conserva el papel marfil; y en modo oscuro: fondo azul noche, nombre en crema, botón dorado con texto oscuro, barra acompañando el tema, ficha nocturna con texto crema y universo idéntico, sin errores de consola.

Comprobaciones nuevas de la versión 4.5: en la vista de lista la ficha empuja tarjetas y controles sin taparlos; con el encabezado a la vista no sube por encima de la sección; al final de la lista no baja por debajo; a media lista acompaña pegada bajo la barra; en pantalla completa con lista queda dentro sin tapar tarjetas y la lista completa sigue desplazable; tras salir de pantalla completa sigue dentro de la sección; de noche el chip de música encendido lleva el anillo suave; y la música arranca al 35 % de la pista al 15 %.

Comprobaciones de la ventana baja (4.6, ajustadas en la 6): en una ventana de 1366 × 606 la lista de planetas no se monta sobre el título ni los botones y queda al menos 8 px por debajo de ellos, sigue siendo una columna de una sola fila de botones (compacta) con los 9 completos y a la vista sin pisar el zoom, y con la ficha abierta no toca la ficha; y el vuelo: con el reloj del navegador controlado por la prueba (para capturar siempre el mismo instante, porque con el renderizado por software las capturas normales llegan tarde), a media travesía entre «Robot 6-DOF» y «SCADA y planta» las estrellitas brillan sobre el lienzo (se cuentan los píxeles blancos de la franja libre: en reposo y tras aterrizar son unos pocos, en vuelo cientos) y al aterrizar desaparecen, sin errores de consola.

Comprobaciones nuevas de la versión 4.3: el cursor sobre el lienzo es la mano de arrastrar; al pasar sobre un planeta y sobre su etiqueta es la navecita; «Explorar» y los dos CV comparten fila; la música arranca al 65 %; `/sobremi` redirige al video y no queda ningún enlace ni texto «Sobre mí» en la página principal ni en la del video.

Las 10 comprobaciones adicionales con video real: ningún video se descarga al cargar la página ni al abrir la ficha; el video carga su duración (6 s); controles nativos; reproduce; avanzar en la línea de tiempo; volumen; al cerrar se pausa; al cerrar vuelve a la ficha; y estado de error visible cuando el archivo responde 404.

Lo que **no** pude verificar:

- **Reproducción real de YouTube y Drive:** se comprobó que el iframe se crea con la URL correcta, pero el contenedor no tiene acceso a esos servicios para reproducirlos.
- **Pantalla completa nativa:** en el Chromium sin pantalla del contenedor no se puede comprobar la API nativa, así que las pruebas cubren el modo de ventana completa de respaldo (que es lo que se ve en pantalla). La API nativa (`requestFullscreen`) está implementada pero no se ejercitó; en iPhone, Safari solo permite pantalla completa nativa para video, por lo que ahí se usará el modo de respaldo.
- **Autoplay de la música en navegadores reales:** se probó el arranque al primer gesto, pero cada navegador tiene su propia política de audio.
- **Navegadores y dispositivos reales:** Safari, Firefox y teléfonos físicos no estaban disponibles. El rendimiento en GPU real debería ser mejor que en SwiftShader, pero no está medido.
- **Despliegue en Vercel:** no desplegué. `vercel.json` sigue la documentación, pero las reescrituras no se probaron en Vercel.
- **Contenido de los PDF del CV:** se comprobó que se sirven como PDF y que descargan, y leí solo su primera línea para confirmar que son tus CV; no revisé el resto ni si son la versión más reciente.
- **Reproducción de YouTube en la página `/video`:** el iframe se crea con la URL correcta (`youtube-nocookie.com/embed/kB4uux4evWQ`), pero el contenedor no llega a YouTube para reproducirlo.

Capturas de las pruebas en `docs/capturas/`: `d*` son de escritorio (1440 px), `w*` de ventanas de 1024 y 700 px, `m*` de celular (390 px) y `o*` del modo oscuro; `m6`/`m7` muestran la ficha discreta y contraída en pantalla completa móvil (modo oscuro). `d10`–`d12` y `o4` muestran la ficha en la vista de lista (empuje, encabezado a la vista, pantalla completa y modo oscuro) y `d13` compara el chip de música de noche antes y ahora (y de día, sin cambios). `d14` compara la ventana baja antes y ahora (4.6); `d15` es la secuencia del vuelo con estrellitas (despegue, travesía, llegada y aterrizaje) a 1440 px, `d16` el reposo frente al vuelo de cerca y `m8` el vuelo en celular (4.6). De la versión 6: `d17` el menú en ventana baja (fila de la 4.6 frente a columna compacta), `d18` los brazos (tu captura frente al primer plano nuevo), `d19` la inclinación de las estrellitas a media travesía y `m9` el vuelo en celular con los cambios. `d4-cursor-nave.png` muestra el cursor de la navecita a tamaño real (32 px) y ampliado, sobre fondo oscuro y claro; las capturas de pantalla no incluyen el cursor.

## 8. Ejecutar y desplegar

```bash
npm install
npm run dev       # http://localhost:3000
npm test
npm run build && npm run preview
```

Vercel: importar el repositorio; `vercel.json` ya configura Vite, `npm run build` y `dist`. Requiere Node 20.19+ o 22.12+.

## 9. Recursos que faltan

Los dos CV en PDF y la foto ya están incluidos (vienen de tu V1). Tu V1 también traía imágenes de proyectos (`hospital_ai.png`, `plc.png`, `scada.png`, `vr.png`, `SupplyChain.jpg`, `Food.png`, `PowerMonitor.png`, etc.) que podrían usarse como galería de las fichas; no se incluyeron porque no lo pediste.

| Recurso | Dónde va | Qué pasa mientras falta |
|---|---|---|
| Videos de evidencia de tu celular | `public/videos/` o una URL pública | Los proyectos no muestran el botón de video |
| Imágenes de proyectos (opcional) | `public/images/proyectos/` | Las fichas no tienen galería |
| Aprendizajes, resultados medibles y enlaces por proyecto (opcional) | `src/data/projects.js` | Esas secciones no aparecen |
| Otros enlaces profesionales (GitHub, etc.) | `PROFILE.links` | No aparecen |
| Licencia de `musica.mp3` | — | Se conservó tal cual; confirma que puedes usarla públicamente |

## 10. Configuraciones externas pendientes

- Repositorio en GitHub y proyecto en Vercel (o la plataforma que elijas).
- Cuenta y bucket de Cloudflare R2 (o equivalente) solo si vas a alojar videos grandes.
- Permisos «Cualquier persona con el enlace» en los videos de Drive que quieras usar.
- Dominio propio (opcional).
