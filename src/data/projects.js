// Planetas del universo = proyectos del portafolio.
// Para añadir o editar un proyecto solo cambia este archivo (ver docs/CONTENIDO.md).
//
// Campos:
//   id          identificador único (se usa en la URL /proyecto/<id>)
//   planet      { name, kind, color, color2, icon }  kind elige la escena 3D del planeta:
//               robot | finance | meal | supply | factory | scada | health | vr | generic
//   tag, title, summary            obligatorios
//   problem, contribution, learnings, tech[], highlights[], links[]   opcionales
//   images[]    evidencias en imagen: { src: "/images/proyectos/…", alt, caption }
//   videos[]    evidencias en video: { type: "file" | "url" | "drive" | "youtube", ..., title }
//               (el campo antiguo `video`, de un solo video, sigue funcionando)
//               Imágenes y videos no se incrustan: la ficha muestra «Ver video» y «Ver imágenes»,
//               que abren el visor sobre la página (ver docs/CONTENIDO.md, secciones 3 y 4).
//   story       frase corta que acompaña al planeta en el recorrido guiado
//
// Ningún campo opcional vacío se muestra en la ficha.
//
// Fichas puntuales (regla de JC, V6.14): resumen de una frase, problema breve, contribución en
// 1 o 2 párrafos cortos, de 4 a 5 puntos clave de una sola idea y la lista completa de tecnologías.
// `npm test` lo comprueba (tests/data.test.js).

export const PROJECTS = [
  {
    id: "robot-6dof",
    planet: { name: "Robot 6-DOF", kind: "robot", color: "#e98a76", color2: "#c8614f", icon: "🤖" },
    tag: "Proyecto personal",
    title: "Control y monitoreo de un robot industrial con RoboSCADA",
    summary:
      "SCADA móvil en .NET MAUI que controla por Bluetooth un brazo robótico de 6 grados de libertad y monitorea por Wi-Fi la temperatura de su gripper.",
    contribution:
      "Diseñé y desarrollé RoboSCADA: la app envía por Bluetooth los comandos de movimiento a un STM32 NUCLEO-F303RE, que genera el PWM de cada motor.\n\n" +
      "Para la telemetría, el STM32 digitaliza la lectura de un LM35; un ESP32 la recibe por UART y la envía cada segundo por Wi-Fi a una API en ASP.NET, que la guarda en SQL Server. La app grafica su tendencia.",
    tech: ["C#", ".NET MAUI", "ASP.NET", "SQL Server", "C", "STM32 NUCLEO-F303RE", "ESP32", "Bluetooth", "Wi-Fi", "UART", "PWM", "ADC de 12 bits", "LM35"],
    highlights: [
      "Control inalámbrico por Bluetooth de un brazo de 6 grados de libertad",
      "Telemetría de temperatura cada segundo por Wi-Fi",
      "Histórico en SQL Server y gráfica de tendencia en la app",
      "Canales de control y telemetría separados; dispositivos identificados por GUID",
    ],
    images: [
      {
        src: "/images/proyectos/robot-6dof/app-y-robot.jpg",
        alt: "Prueba en vivo de RoboSCADA: una gráfica de tendencia de la temperatura en la pantalla de un equipo de escritorio, el brazo robótico de 6 grados de libertad sobre la mesa con su electrónica y la app móvil con los controles de navegación y la lectura de temperatura.",
        caption: "Prueba en vivo: el brazo con su electrónica (STM32, ESP32 y LM35), la app móvil y la gráfica de temperatura en el equipo de escritorio.",
      },
      {
        src: "/images/proyectos/robot-6dof/diagrama.png",
        alt: "Diagrama de arquitectura de RoboSCADA en dos etapas: adquisición y procesamiento (el brazo robótico conectado por PWM y ADC a un microcontrolador con Bluetooth) y visualización y control (la señal de movimiento desde la app móvil, la visualización de datos en el teléfono y un script en C# en el equipo local que guarda en la base de datos).",
        caption: "Arquitectura en dos etapas: adquisición y procesamiento (brazo, PWM, ADC y microcontrolador) y visualización y control (app móvil y script en C# que guarda los datos).",
      },
    ],
    videos: [{ type: "youtube", id: "TdU0hq1quLo", title: "RoboSCADA: control del brazo robótico desde la app móvil" }],
    links: [],
    story: "Un pequeño centro de control industrial en la palma de tu mano.",
  },
  {
    id: "finanzas-datos",
    planet: { name: "Finanzas y datos", kind: "finance", color: "#86c9a8", color2: "#4f9c7b", icon: "📊" },
    tag: "Puesto actual: Analista de ERP Finanzas",
    title: "Integración serverless de NetSuite con Power BI y dashboards web",
    summary:
      "Arquitectura serverless que conecta NetSuite con Power BI y dashboards web, y automatiza la extracción y distribución de la información estratégica.",
    problem:
      "Sin un conector nativo de NetSuite a Power BI ni servidores dedicados, consultar y distribuir los datos dependía de procesos manuales.",
    contribution:
      "Desarrollé un proxy en JavaScript, desplegado en Vercel, que resuelve OAuth 1.0 y expone Saved Searches de NetSuite como endpoints HTTP para Power BI mediante SuiteQL y RESTlets.\n\n" +
      "Después añadí un flujo de CSV programados que Google Apps Script procesa y guarda en Google Sheets, base de dashboards web (JavaScript, HTML y CSS) con indicadores comerciales y operativos.",
    tech: ["NetSuite", "SuiteScript", "SuiteQL", "RESTlets", "Suitelets", "OAuth 1.0", "JavaScript", "HTML / CSS", "Vercel", "GitHub", "Power BI", "Google Apps Script", "Google Sheets", "CSV", "APIs REST"],
    highlights: [
      "Ahorro estimado de ~60 mil MXN mensuales (~720 mil al año) en infraestructura y servicios en la nube",
      "Saved Searches expuestas a Power BI sin un servidor dedicado",
      "Caché de 4 horas y control de concurrencia en las consultas",
      "4 reportes diarios automáticos para dirección y CEO",
      "KPIs de los ingenieros de ventas de 4 zonas, calculados en NetSuite con Suitelets",
    ],
    images: [
      {
        src: "/images/proyectos/finanzas-datos/dashboard-comercial-ventas.png",
        alt: "Dashboard comercial y de ventas: medidores de órdenes de venta y facturación del mes y acumuladas contra meta, órdenes por zona y por segmento, histórico mensual de órdenes contra facturación, órdenes por familia de producto y top 10 de vendedores; las cifras y los nombres están pixelados.",
        caption: "Dashboard comercial: avance contra meta, órdenes por zona, segmento y familia, histórico mensual y ranking de vendedores (cifras y nombres pixelados).",
      },
      {
        src: "/images/proyectos/finanzas-datos/sistema-comercial.png",
        alt: "Sistema comercial con filtros por año, periodo y mes: variación contra presupuesto, contra el periodo anterior y contra el año anterior; resultados del periodo por zona (facturación contra venta), ventas por aplicación y marca, vertical de negocios, cumplimiento contra presupuesto y pronóstico, top de vendedores y top de modelos; cifras y nombres pixelados.",
        caption: "Sistema comercial con filtros por periodo: resultados por zona y marca, cumplimiento contra presupuesto y top de vendedores y modelos (cifras y nombres pixelados).",
      },
      {
        src: "/images/proyectos/finanzas-datos/control-almacen.png",
        alt: "Dashboard financiero de control de almacén: saldo, entradas, salidas, ajustes, inventario en tránsito e inventario inicial; rotación por antigüedad, inventario por ubicación y por clase, evolución del valor histórico contra el año anterior, ocupación del almacén e índice de facturación contra inventarios; cifras pixeladas.",
        caption: "Control de almacén: saldo, entradas, salidas y tránsito, rotación por antigüedad, inventario por ubicación y clase, y ocupación (cifras pixeladas).",
      },
    ],
    links: [],
    story: "Un planeta donde los datos de un ERP se transforman en inteligencia para toda la organización.",
  },
  {
    id: "mealflow",
    planet: { name: "MealFlow", kind: "meal", color: "#f0c766", color2: "#d49d32", icon: "🍽️" },
    tag: "Autotransportes Especializados Alfa",
    title: "Digitalización y trazabilidad de consumos de comedor con QR",
    summary:
      "Sistema que sustituye las libretas del comedor por una app que escanea el QR del gafete, un backend API y un panel web para nóminas.",
    problem:
      "Los consumos se anotaban en libretas que se enviaban a nóminas para calcular descuentos, sin historial ni forma de verificar transacciones.",
    contribution:
      "Diseñé y desarrollé la solución completa: app móvil en .NET MAUI 10, backend en ASP.NET y plataforma web en ASP.NET MVC. Cada QR lleva una firma de integridad (hash con secreto privado) que el backend valida, junto con los datos del empleado en SQL Server, antes de registrar el consumo. Toda la infraestructura opera en la red local de la empresa, sin endpoints públicos.",
    tech: [".NET MAUI 10", "C#", "XAML", "CommunityToolkit.Maui (cámara)", "Plugin.Maui.Audio", "ASP.NET", "ASP.NET MVC", "API Controllers", "SQL Server", "Códigos QR", "Hashing y firmas de integridad", "Arquitectura cliente-servidor", "Red local (LAN)"],
    highlights: [
      "Libretas sustituidas por un registro digital con trazabilidad por fecha y hora",
      "QR firmado con hash y secreto privado para detectar alteraciones",
      "Confirmación inmediata en la app con señal visual y sonora",
      "Panel web para nóminas: empleados, platillos, precios e historial con filtros",
      "Historial en la app para verificar consumos y resolver aclaraciones",
    ],
    images: [
      {
        src: "/images/proyectos/mealflow/precios.png",
        alt: "Pantalla «Precios» de la app móvil: el precio del día de la comida y del desayuno, y tres accesos para registrar comida del día, desayuno o pedidos especiales.",
        caption: "App en .NET MAUI: precios del día y accesos para registrar comida, desayuno o un pedido especial.",
      },
      // V6.17: capturas que JC tomó en su celular (sin barra de estado ni de navegación). La cámara del
      // teléfono no sale en las capturas de pantalla: su recuadro queda en negro.
      {
        src: "/images/proyectos/mealflow/desayunos.jpg",
        alt: "Pantalla «Desayunos» de la app móvil: el recuadro de la cámara (en negro en la captura), el interruptor «Asignar precio manual» y los botones «Enviar» e «Historial».",
        caption: "Registro de desayunos: la cámara escanea el QR del gafete, con opción de precio manual, envío del registro e historial (la cámara aparece en negro en la captura).",
      },
      {
        src: "/images/proyectos/mealflow/pedidos.jpg",
        alt: "Pantalla «Pedidos» de la app móvil: el encabezado con el botón de regreso y el recuadro de la cámara que lee el QR del gafete (en negro en la captura).",
        caption: "Pedidos especiales: la pantalla abre con la lectura del QR del gafete (la cámara aparece en negro en la captura).",
      },
    ],
    links: [],
    story: "Un planeta donde cada consumo queda registrado: quién compró, qué consumió y cuándo.",
  },
  {
    id: "supply-chain-hub",
    planet: { name: "Supply Chain Hub", kind: "supply", color: "#7fb4d8", color2: "#4a86b4", icon: "📦" },
    tag: "Proyecto personal",
    title: "Transformación digital y analítica logística con Supply Chain Hub",
    summary:
      "Plataforma web que convierte más de 700,000 registros en Excel en un catálogo consultable y en dashboards de Power BI para análisis logístico.",
    problem:
      "Con los datos repartidos en archivos tabulares, era difícil explorar grandes volúmenes de productos y analizar la demanda.",
    contribution:
      "Desarrollé la plataforma en C# y ASP.NET (.NET Framework 4.5) con datos públicos de ejemplo: un catálogo de comercio electrónico para buscar productos y consultar inventario, precios y estatus logístico. Las consultas y los filtros se ejecutan en SQL Server con Stored Procedures, y Power BI concentra las métricas de demanda y los reportes gerenciales.",
    tech: ["C#", "ASP.NET", "MVC", ".NET Framework 4.5", "SQL Server", "Stored Procedures", "Power BI", "HTML / CSS / JavaScript", "Excel / CSV"],
    highlights: [
      "Más de 700,000 registros: unos 400,000 de productos y 300,000 de demanda",
      "Catálogo estilo e-commerce: búsqueda, exploración y selección de productos",
      "Consultas y filtros en SQL Server con Stored Procedures",
      "Dashboards de Power BI con métricas logísticas y reportes gerenciales",
    ],
    images: [
      {
        src: "/images/proyectos/supply-chain-hub/catalogo.jpg",
        alt: "Catálogo de Supply Chain Hub: barra de búsqueda de productos, marcas y categorías, carrito, filtros por categoría, precio y calificación mínima, tarjetas de producto con precio, calificación y botón «Agregar», y paginación de 20 páginas.",
        caption: "Catálogo estilo e-commerce: búsqueda, filtros, tarjetas de producto, carrito y paginación (datos públicos de ejemplo).",
      },
    ],
    links: [],
    story: "Un planeta de miles de productos donde cada dato encuentra su lugar.",
  },
  {
    id: "mantenimiento-kia",
    planet: { name: "Mantenimiento KIA", kind: "factory", color: "#a99bd6", color2: "#7766b0", icon: "🏭" },
    tag: "KIA México",
    title: "Sistemas web y ERP de mantenimiento",
    summary:
      "Soporte y evolución de QBAMS, el ERP de mantenimiento de KIA México, con dashboards de Power BI y plataformas web internas.",
    contribution:
      "Asumí el soporte y la evolución de QBAMS, ERP en C# y ASP.NET (.NET Framework 4.5) usado en estampado, pintura, soldadura y ensamble, y resolví más de 200 incidencias.\n\n" +
      "Con Stored Procedures y archivos XML que el servicio interno de QBAMS publica en JSON, alimenté las gráficas del ERP y los dashboards de Breakdown y Downtime en Power BI para jefes de departamento y dirección de planta, integrados en SMART.",
    tech: ["C#", "ASP.NET MVC", ".NET Framework 4.5", "SQL Server", "T-SQL", "Stored Procedures", "SQL Jobs", "XML", "JSON", "Servicios web / API REST", "CSV", "Excel", "Power BI", "SMART / Portlets", "HTML / CSS / JavaScript", "Modelo entidad-relación", "Migración y sincronización de datos", "Integración de sistemas empresariales"],
    highlights: [
      "Más de 200 incidencias resueltas en módulos como Breakdown, Training y Findings",
      "Dashboards de Breakdown y Downtime en Power BI, integrados en SMART con Portlets",
      "Lógica de Downtime corregida sin alterar los acumulados históricos",
      "Catálogo de soldadura migrado con UPSERT: ~500 equipos y más de 3,000 subequipos",
      "Plataformas web internas: rutas de transporte, incidencias de instalaciones y pagos a proveedores",
    ],
    images: [
      {
        src: "/images/proyectos/mantenimiento-kia/qbams-login.png",
        alt: "Pantalla de inicio de sesión de QBAMS (Qualitivity-Basic Activity Monitoring System): usuario, contraseña, «Remember me» y el logotipo de KMX SMART WORK SYSTEM.",
        caption: "Inicio de sesión de QBAMS, el ERP de mantenimiento, con el logotipo de SMART, donde se integraron los dashboards.",
      },
      {
        src: "/images/proyectos/mantenimiento-kia/incidencias-instalaciones.png",
        alt: "Plataforma web interna de incidencias de instalaciones: filtros por ID, estatus y fechas, tabla con solicitante, asunto, fecha, ubicación, descripción, estatus, comentarios y fecha de cierre, y botón «Create New».",
        caption: "Plataforma interna de incidencias de instalaciones, con filtros por ID, estatus y fechas (datos de prueba; número de empleado pixelado).",
      },
    ],
    links: [],
    story: "Una fábrica que nunca deja de girar: sistemas que mantienen cada proceso bajo control.",
  },
  {
    id: "scada-planta",
    planet: { name: "SCADA y planta", kind: "scada", color: "#eba06f", color2: "#c8733f", icon: "📡" },
    tag: "KIA México",
    title: "SCADA de mantenimiento en operación 24/7",
    summary:
      "Administración y soporte de dos SCADA heredados: el monitoreo de robots de soldadura y el de la llenadora de líquido de frenos.",
    problem:
      "SCADA heredados con unos 10 años en operación y sin soporte interno; las fallas frecuentes del servidor de base de datos del monitoreo de robots obligaban a reiniciar el sistema.",
    contribution:
      "Administré los servidores web y de base de datos (Windows Server, SQL Server) del SCADA de robots Kawasaki de soldadura (.NET Framework 3.5), que alerta a mantenimiento cuando un robot entra en alarma, y diagnostiqué y resolví sus fallas.\n\n" +
      "En ensamble mantuve el SCADA de Filling Machine (C#, .NET Framework 4.5), que lleva los datos de piso a SQL Server mediante un OPC Server y una HMI Mitsubishi. Rastreé sus fallas desde el PLC hasta logs saturados en SQL Server.",
    tech: ["SCADA", "C#", ".NET Framework 3.5", ".NET Framework 4.5", "SQL Server", "Windows Server", "OPC Server", "HMI Mitsubishi", "PLC Allen-Bradley"],
    highlights: [
      "Disponibilidad 24/7 del SCADA de alarmas de los robots de soldadura",
      "Servicio restablecido tras fallas del servidor de base de datos y cortes de energía",
      "Fallas de la llenadora rastreadas del PLC a logs saturados en SQL Server",
      "Mejoras de UX/UI en el SCADA de Filling Machine",
    ],
    images: [
      {
        src: "/images/proyectos/scada-planta/scada-robots-vista-general.jpg",
        alt: "Pantalla principal del SCADA de robots de soldadura (KIA Robot Diagnostic System): barra de herramientas, contadores de robots por estado (total, en marcha, advertencia, fuera de especificación, error y fuera de línea) y la planta dividida en zonas, cada una con los íconos de sus robots.",
        caption: "Vista general del SCADA de robots de soldadura: contadores por estado y la distribución de la planta por zonas, con un ícono por robot.",
      },
      {
        src: "/images/proyectos/scada-planta/scada-robots-detalle.jpg",
        alt: "Detalle del SCADA de robots: pestañas Status, Tip y Sealer Monitoring y las zonas T/GATE SUB, T/G, HOOD, RR DR RH y FRT DR RH con los íconos de los robots y su número; los que están en marcha aparecen en verde.",
        caption: "Detalle por zona: cada ícono es un robot con su número; en verde, los que están en marcha.",
      },
    ],
    links: [],
    story: "Una antena que escucha a la planta antes de que algo falle.",
  },
  {
    id: "hospital-uanl",
    planet: { name: "Hospital UANL", kind: "health", color: "#e79fb6", color2: "#c26a88", icon: "🧠" },
    tag: "Hospital Universitario",
    title: "Señales EEG y EMG para rehabilitación",
    summary:
      "Investigación biomédica para una interfaz cerebro-computadora (BCI) de rehabilitación tras un accidente cerebrovascular.",
    problem:
      "Quienes sufren un accidente cerebrovascular pueden perder el habla y la movilidad, y caer en depresión. El proyecto buscaba un sistema para rehabilitarlos y monitorear su avance.",
    contribution:
      "Como asistente de investigación, desarrollé interfaces en C# (.NET) que guían a cada participante en ejercicios de movimiento y adquirí sus señales EEG y EMG: primero de personas sanas y después de pacientes, sin mezclar grupos como diestros y zurdos.\n\n" +
      "Filtré, preprocesé y normalicé las señales, probé en MATLAB los algoritmos de los ingenieros de maestría (random forest) y reporté su precisión con cada nueva muestra, con miras a una publicación en IEEE.",
    tech: ["C#", ".NET", "MATLAB", "EEG", "EMG", "Procesamiento digital de señales", "Random forest"],
    highlights: [
      "Señales EEG y EMG de más de 300 personas, entre sanas y pacientes",
      "Matrices de 32 columnas × 64,000 filas procesadas por persona",
      "Precisión de los algoritmos (random forest) evaluada con cada nueva muestra",
      "Pruebas de atención sostenida (CPT) y de ansiedad para descartar ruido en las señales",
    ],
    images: [
      {
        src: "/images/proyectos/hospital-uanl/adquisicion-eeg.jpg",
        alt: "Sesión de adquisición en el hospital: una persona con el gorro de electrodos de EEG, sentada, mientras un integrante del equipo revisa el registro en una laptop; su cara está pixelada.",
        caption: "Sesión de adquisición: participante con el gorro de electrodos de EEG mientras se revisa el registro en la computadora (cara pixelada).",
      },
      {
        src: "/images/proyectos/hospital-uanl/sesion-eeg.jpg",
        alt: "Una persona de espaldas, con el gorro de electrodos de EEG, frente a la computadora de la sesión; a un lado, de pie, un integrante del equipo.",
        caption: "Otra sesión: participante con el gorro de EEG frente a la computadora y, a un lado, un integrante del equipo.",
      },
      {
        src: "/images/proyectos/hospital-uanl/ejercicio-eeg.jpg",
        alt: "Participante de espaldas, con el gorro de electrodos de EEG, sentada frente a un monitor que muestra el número 10, con el brazo apoyado en un soporte amarillo.",
        caption: "Ejercicio de movimiento guiado por la interfaz en C#: con el gorro de EEG, la participante sigue las indicaciones de la pantalla mientras se registran sus señales.",
      },
      {
        src: "/images/proyectos/hospital-uanl/sesion-eeg-2.jpg",
        alt: "Un integrante del equipo, de pie, maneja la computadora de la sesión junto a una participante sentada que lleva el gorro de electrodos de EEG; la cara de la participante está pixelada.",
        caption: "Preparación de una sesión: un integrante del equipo opera la computadora junto a la participante con el gorro de EEG (cara pixelada).",
      },
    ],
    links: [],
    story: "El planeta de la rosa: aquí la tecnología sirve para cuidar.",
  },
  {
    id: "vr-nave",
    planet: { name: "VR y la nave", kind: "vr", color: "#6fb9bd", color2: "#3f8c92", icon: "🥽" },
    tag: "Proyecto personal",
    title: "Teleoperación robótica en realidad virtual",
    summary:
      "Prototipo en desarrollo, en Unity para Meta Quest 3S, para operar a distancia el brazo robótico del proyecto 01.",
    problem:
      "Tareas de riesgo extremo, como maniobrar en una subestación eléctrica o en un reactor nuclear, exponen a las personas; hacerlas con robots desde realidad virtual las mantendría a salvo.",
    contribution:
      "Desarrollo en Unity (C#) el entorno de realidad virtual para Meta Quest 3S; hoy trabajo en el modelo 3D del brazo y en el conector con el hardware.\n\n" +
      "Propuesta: las Quest enviarán los comandos a una URL de la red local; la PC, como servidor local, los recibirá por sockets y los reenviará al robot por Bluetooth, que Unity no controla directamente. Junto al robot virtual, un panel mostrará el SCADA de la app: temperatura, paro y modo secuencial (rutina en bucle).",
    tech: ["Unity", "C#", "Meta Quest 3S", "Blender", "Visual Studio", "APIs REST", "Sockets", "Bluetooth", "SQL Server", "Red local (LAN)", "STM32 NUCLEO-F303RE", "ESP32", "LM35"],
    highlights: [
      "Entorno de realidad virtual para Meta Quest 3S, en Unity",
      "En desarrollo: modelo 3D del brazo y conector con el hardware",
      "Puente propuesto: Quest → PC → robot con APIs REST, sockets y Bluetooth",
      "Mismo brazo del proyecto 01: STM32 NUCLEO-F303RE, ESP32 y LM35",
    ],
    images: [
      {
        src: "/images/proyectos/vr-nave/unity-entorno.jpg",
        alt: "Captura del editor de Unity con el prototipo: la escena, una plataforma hexagonal bajo un cielo de atardecer con personajes 3D, la jerarquía de objetos, el inspector, la carpeta del proyecto y la vista de juego.",
        caption: "El prototipo en el editor de Unity: la escena, su jerarquía y la vista de juego (en proceso).",
      },
    ],
    videos: [{ type: "youtube", id: "FvwiXazVh-8", title: "Prototipo de realidad virtual en Unity (en proceso; no es el resultado final)" }],
    // Modelo 3D que se gira dentro del visor (V6.16; desde la V6.17, el brazo de 6 DOF que mandó JC):
    // glTF con su .bin en public/modelos; el poster es un render del mismo modelo. En la V6.18 salió la
    // imagen de Meshy AI, que ya no era este modelo.
    models: [
      {
        src: "/modelos/vr-nave/brazo.gltf",
        poster: "/images/proyectos/vr-nave/modelo-brazo-3d.jpg",
        alt: "Modelo 3D interactivo del brazo robótico de 6 DOF, con su base, seis servos, soportes de aluminio negro y pinza, que se puede girar.",
        caption: "Modelo 3D del brazo de 6 DOF con sus seis servos, soportes de aluminio y pinza: gíralo para verlo desde cualquier ángulo (demostración en proceso; no es el resultado final).",
      },
    ],
    links: [],
    story: "El último planeta antes de la nave: un mundo que existe en realidad virtual.",
  },
];

// Identificador reservado para la escena final.
export const SHIP_ID = "nave";
