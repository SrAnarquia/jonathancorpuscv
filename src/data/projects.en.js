// Traducción al inglés de los proyectos, por id.
// Solo hace falta traducir los campos de texto; lo que no esté aquí se muestra en español.
// Campos traducibles: planet.name, tag, title, summary, problem, contribution,
// learnings, highlights, tech, story, links[].label, images[].alt, images[].caption, videos[].title.
// Los arreglos se sustituyen completos: al traducir images o videos hay que repetir src, type e id.

export const PROJECTS_EN = {
  "robot-6dof": {
    tag: "Personal project",
    title: "Control and monitoring of an industrial robot with RoboSCADA",
    summary:
      "Mobile SCADA in .NET MAUI that controls a 6-degree-of-freedom robotic arm over Bluetooth and monitors its gripper temperature over Wi-Fi.",
    contribution:
      "I designed and built RoboSCADA: the app sends movement commands over Bluetooth to an STM32 NUCLEO-F303RE, which generates the PWM for each motor.\n\n" +
      "For telemetry, the STM32 digitizes an LM35 reading; an ESP32 receives it over UART and sends it every second over Wi-Fi to an ASP.NET API, which stores it in SQL Server. The app charts its trend.",
    tech: ["C#", ".NET MAUI", "ASP.NET", "SQL Server", "C", "STM32 NUCLEO-F303RE", "ESP32", "Bluetooth", "Wi-Fi", "UART", "PWM", "12-bit ADC", "LM35"],
    highlights: [
      "Wireless Bluetooth control of a 6-degree-of-freedom arm",
      "Temperature telemetry every second over Wi-Fi",
      "History in SQL Server and a trend chart in the app",
      "Separate control and telemetry channels; devices identified by GUID",
    ],
    images: [
      {
        src: "/images/proyectos/robot-6dof/app-y-robot.jpg",
        alt: "Live test of RoboSCADA: a temperature trend chart on a desktop computer screen, the 6-degree-of-freedom robotic arm on the desk with its electronics, and the mobile app with the navigation controls and the temperature reading.",
        caption: "Live test: the arm with its electronics (STM32, ESP32 and LM35), the mobile app and the temperature chart on the desktop computer.",
      },
      {
        src: "/images/proyectos/robot-6dof/diagrama.png",
        alt: "RoboSCADA architecture diagram in two stages: acquisition and processing (the robotic arm connected over PWM and ADC to a microcontroller with Bluetooth) and visualization and control (the movement signal from the mobile app, data visualization on the phone and a C# script on the local host that saves to the database).",
        caption: "Two-stage architecture: acquisition and processing (arm, PWM, ADC and microcontroller) and visualization and control (mobile app and a C# script that saves the data).",
      },
    ],
    videos: [{ type: "youtube", id: "TdU0hq1quLo", title: "RoboSCADA: controlling the robotic arm from the mobile app" }],
    story: "A small industrial control center in the palm of your hand.",
  },
  "finanzas-datos": {
    planet: { name: "Finance & data" },
    tag: "Current role: ERP Finance Analyst",
    title: "Serverless integration of NetSuite with Power BI and web dashboards",
    summary:
      "Serverless architecture that connects NetSuite to Power BI and web dashboards, automating the extraction and distribution of strategic information.",
    problem:
      "With no native NetSuite connector to Power BI and no dedicated servers, querying and distributing the data depended on manual processes.",
    contribution:
      "I built a JavaScript proxy, deployed on Vercel, that handles OAuth 1.0 and exposes NetSuite Saved Searches as HTTP endpoints for Power BI through SuiteQL and RESTlets.\n\n" +
      "I then added a flow of scheduled CSVs that Google Apps Script processes and stores in Google Sheets, the base of web dashboards (JavaScript, HTML and CSS) with commercial and operational indicators.",
    tech: ["NetSuite", "SuiteScript", "SuiteQL", "RESTlets", "Suitelets", "OAuth 1.0", "JavaScript", "HTML / CSS", "Vercel", "GitHub", "Power BI", "Google Apps Script", "Google Sheets", "CSV", "REST APIs"],
    highlights: [
      "Estimated savings of ~MXN 60K per month (~720K a year) in infrastructure and cloud services",
      "Saved Searches exposed to Power BI without a dedicated server",
      "4-hour cache and concurrency control for queries",
      "4 automatic daily reports for management and the CEO",
      "KPIs for the sales engineers of 4 regions, computed in NetSuite with Suitelets",
    ],
    images: [
      {
        src: "/images/proyectos/finanzas-datos/dashboard-comercial-ventas.png",
        alt: "Commercial and sales dashboard: gauges of sales orders and invoicing for the month and year to date against target, orders by region and by segment, monthly history of orders against invoicing, orders by product family and top 10 salespeople; figures and names are pixelated.",
        caption: "Commercial dashboard: progress against target, orders by region, segment and family, monthly history and salesperson ranking (figures and names pixelated).",
      },
      {
        src: "/images/proyectos/finanzas-datos/sistema-comercial.png",
        alt: "Commercial system with year, period and month filters: variation against budget, against the previous period and against the previous year; period results by region (invoicing against sales), sales by application and brand, business verticals, fulfillment against budget and forecast, top salespeople and top models; figures and names pixelated.",
        caption: "Commercial system with period filters: results by region and brand, fulfillment against budget, and top salespeople and models (figures and names pixelated).",
      },
      {
        src: "/images/proyectos/finanzas-datos/control-almacen.png",
        alt: "Financial warehouse control dashboard: balance, inbound, outbound, adjustments, inventory in transit and opening inventory; rotation by age, inventory by location and by class, evolution of historical value against the previous year, warehouse occupancy and invoicing-to-inventory index; figures pixelated.",
        caption: "Warehouse control: balance, inbound, outbound and in transit, rotation by age, inventory by location and class, and occupancy (figures pixelated).",
      },
    ],
    story: "A planet where an ERP's data turns into intelligence for the whole organization.",
  },
  mealflow: {
    tag: "Autotransportes Especializados Alfa",
    title: "Digitizing and tracing cafeteria purchases with QR codes",
    summary:
      "System that replaces the cafeteria notebooks with an app that scans the badge QR code, a backend API and a web panel for payroll.",
    problem:
      "Purchases were written in notebooks that went to payroll to compute deductions, with no history and no way to verify transactions.",
    contribution:
      "I designed and built the complete solution: a .NET MAUI 10 mobile app, an ASP.NET backend and an ASP.NET MVC web platform. Each QR code carries an integrity signature (a hash with a private secret) that the backend validates, along with the employee's data in SQL Server, before recording the purchase. The whole infrastructure runs on the company's local network, with no public endpoints.",
    tech: [".NET MAUI 10", "C#", "XAML", "CommunityToolkit.Maui (camera)", "Plugin.Maui.Audio", "ASP.NET", "ASP.NET MVC", "API Controllers", "SQL Server", "QR codes", "Hashing and integrity signatures", "Client-server architecture", "Local network (LAN)"],
    highlights: [
      "Notebooks replaced by a digital record traceable by date and time",
      "QR codes signed with a hash and a private secret to detect tampering",
      "Instant confirmation in the app with a visual and audio signal",
      "Payroll web panel: employees, dishes, prices and a filtered history",
      "In-app history to verify purchases and settle disputes",
    ],
    images: [
      {
        src: "/images/proyectos/mealflow/precios.png",
        alt: "“Prices” screen of the mobile app: the day's price for lunch and breakfast, and three shortcuts to record the day's lunch, breakfast or special orders.",
        caption: "The .NET MAUI app: the day's prices and shortcuts to record a lunch, a breakfast or a special order.",
      },
      {
        src: "/images/proyectos/mealflow/desayunos.jpg",
        alt: "“Breakfasts” screen of the mobile app: the camera frame (black in the screenshot), the “Set price manually” switch and the “Send” and “History” buttons.",
        caption: "Breakfast check-in: the camera scans the badge QR code, with a manual price option, sending the record and a history (the camera shows black in the screenshot).",
      },
      {
        src: "/images/proyectos/mealflow/pedidos.jpg",
        alt: "“Orders” screen of the mobile app: the header with the back button and the camera frame that reads the badge QR code (black in the screenshot).",
        caption: "Special orders: the screen opens with the badge QR reader (the camera shows black in the screenshot).",
      },
    ],
    story: "A planet where every purchase is on record: who bought, what they had and when.",
  },
  "supply-chain-hub": {
    tag: "Personal project",
    title: "Digital transformation and logistics analytics with Supply Chain Hub",
    summary:
      "Web platform that turns more than 700,000 Excel records into a searchable catalog and Power BI dashboards for logistics analysis.",
    problem:
      "With the data scattered across tabular files, it was hard to explore large volumes of products and analyze demand.",
    contribution:
      "I built the platform in C# and ASP.NET (.NET Framework 4.5) with public sample data: an e-commerce catalog to search products and check inventory, prices and logistics status. Queries and filters run in SQL Server with Stored Procedures, and Power BI brings together the demand metrics and management reports.",
    tech: ["C#", "ASP.NET", "MVC", ".NET Framework 4.5", "SQL Server", "Stored Procedures", "Power BI", "HTML / CSS / JavaScript", "Excel / CSV"],
    highlights: [
      "More than 700,000 records: about 400,000 products and 300,000 demand records",
      "E-commerce-style catalog: search, browse and select products",
      "Queries and filters in SQL Server with Stored Procedures",
      "Power BI dashboards with logistics metrics and management reports",
    ],
    images: [
      {
        src: "/images/proyectos/supply-chain-hub/catalogo.jpg",
        alt: "Supply Chain Hub catalog: search bar for products, brands and categories, cart, filters by category, price and minimum rating, product cards with price, rating and an “Add” button, and 20 pages of pagination.",
        caption: "E-commerce-style catalog: search, filters, product cards, cart and pagination (public sample data).",
      },
    ],
    story: "A planet of thousands of products where every piece of data finds its place.",
  },
  "mantenimiento-kia": {
    planet: { name: "KIA maintenance" },
    tag: "KIA Mexico",
    title: "Maintenance web systems and ERP",
    summary:
      "Support and evolution of QBAMS, KIA Mexico's maintenance ERP, with Power BI dashboards and internal web platforms.",
    contribution:
      "I took over the support and evolution of QBAMS, an ERP in C# and ASP.NET (.NET Framework 4.5) used in stamping, painting, welding and assembly, and resolved more than 200 issues.\n\n" +
      "With Stored Procedures and XML files that the internal QBAMS service publishes as JSON, I fed the ERP's charts and the Breakdown and Downtime dashboards in Power BI for department heads and plant management, integrated into SMART.",
    tech: ["C#", "ASP.NET MVC", ".NET Framework 4.5", "SQL Server", "T-SQL", "Stored Procedures", "SQL Jobs", "XML", "JSON", "Web services / REST API", "CSV", "Excel", "Power BI", "SMART / Portlets", "HTML / CSS / JavaScript", "Entity-relationship model", "Data migration and synchronization", "Enterprise systems integration"],
    highlights: [
      "More than 200 issues resolved in modules such as Breakdown, Training and Findings",
      "Breakdown and Downtime dashboards in Power BI, integrated into SMART with Portlets",
      "Downtime logic corrected without altering the historical totals",
      "Welding catalog migrated with UPSERT: ~500 pieces of equipment and 3,000+ sub-equipment",
      "Internal web platforms: transport routes, facility incidents and supplier payments",
    ],
    images: [
      {
        src: "/images/proyectos/mantenimiento-kia/qbams-login.png",
        alt: "QBAMS (Qualitivity-Basic Activity Monitoring System) login screen: user id, password, “Remember me” and the KMX SMART WORK SYSTEM logo.",
        caption: "Login screen of QBAMS, the maintenance ERP, with the logo of SMART, where the dashboards were integrated.",
      },
      {
        src: "/images/proyectos/mantenimiento-kia/incidencias-instalaciones.png",
        alt: "Internal facility-incidents web platform: filters by ID, status and dates, a table with requester, subject, date, location, description, status, remarks and finish date, and a “Create New” button.",
        caption: "Internal facility-incidents platform, with filters by ID, status and dates (test data; employee number pixelated).",
      },
    ],
    story: "A factory that never stops turning: systems that keep every process under control.",
  },
  "scada-planta": {
    planet: { name: "SCADA & plant" },
    tag: "KIA Mexico",
    title: "Maintenance SCADA in 24/7 operation",
    summary:
      "Administration and support of two legacy SCADA systems: monitoring of the welding robots and of the brake fluid filling machine.",
    problem:
      "Legacy SCADA systems about 10 years in operation, with no in-house support; frequent failures of the robot monitoring database server forced system restarts.",
    contribution:
      "I administered the web and database servers (Windows Server, SQL Server) of the Kawasaki welding robot SCADA (.NET Framework 3.5), which alerts maintenance when a robot goes into alarm, and diagnosed and resolved its failures.\n\n" +
      "In assembly I maintained the Filling Machine SCADA (C#, .NET Framework 4.5), which sends floor data to SQL Server through an OPC Server and a Mitsubishi HMI. I traced its failures from the PLC to saturated logs in SQL Server.",
    tech: ["SCADA", "C#", ".NET Framework 3.5", ".NET Framework 4.5", "SQL Server", "Windows Server", "OPC Server", "Mitsubishi HMI", "Allen-Bradley PLC"],
    highlights: [
      "24/7 availability of the alarm SCADA for the welding robots",
      "Service restored after database server failures and power outages",
      "Filling machine failures traced from the PLC to saturated logs in SQL Server",
      "UX/UI improvements to the Filling Machine SCADA",
    ],
    images: [
      {
        src: "/images/proyectos/scada-planta/scada-robots-vista-general.jpg",
        alt: "Main screen of the welding robot SCADA (KIA Robot Diagnostic System): toolbar, robot counters by status (total, run, warning, spec over, error and offline) and the plant divided into zones, each with the icons of its robots.",
        caption: "Overview of the welding robot SCADA: counters by status and the plant layout by zone, with one icon per robot.",
      },
      {
        src: "/images/proyectos/scada-planta/scada-robots-detalle.jpg",
        alt: "Detail of the robot SCADA: Status, Tip and Sealer Monitoring tabs and the T/GATE SUB, T/G, HOOD, RR DR RH and FRT DR RH zones with the robot icons and their numbers; the running ones are green.",
        caption: "Detail by zone: each icon is a robot with its number; the running ones are green.",
      },
    ],
    story: "An antenna that listens to the plant before something fails.",
  },
  "hospital-uanl": {
    tag: "University Hospital",
    title: "EEG and EMG signals for rehabilitation",
    summary: "Biomedical research for a brain-computer interface (BCI) for rehabilitation after a stroke.",
    problem:
      "Stroke survivors can lose speech and mobility and fall into depression. The project sought a system to rehabilitate them and monitor their progress.",
    contribution:
      "As a research assistant, I built C# (.NET) interfaces that guide each participant through movement exercises and acquired their EEG and EMG signals: first from healthy people and then from patients, without mixing groups such as right- and left-handed.\n\n" +
      "I filtered, preprocessed and normalized the signals, tested in MATLAB the algorithms of the master's engineers (random forest) and reported their accuracy on each new sample, with a view to an IEEE publication.",
    tech: ["C#", ".NET", "MATLAB", "EEG", "EMG", "Digital signal processing", "Random forest"],
    highlights: [
      "EEG and EMG signals from more than 300 people, healthy and post-stroke",
      "32-column × 64,000-row matrices processed per person",
      "Algorithm accuracy (random forest) evaluated on each new sample",
      "Sustained attention (CPT) and anxiety tests to rule out noise in the signals",
    ],
    images: [
      {
        src: "/images/proyectos/hospital-uanl/adquisicion-eeg.jpg",
        alt: "Acquisition session at the hospital: a seated participant wearing the EEG electrode cap while a team member reviews the recording on a laptop; the participant's face is pixelated.",
        caption: "Acquisition session: a participant wearing the EEG electrode cap while the recording is reviewed on the computer (face pixelated).",
      },
      {
        src: "/images/proyectos/hospital-uanl/sesion-eeg.jpg",
        alt: "Participant seen from behind, wearing the EEG electrode cap, in front of the session computer, with a team member standing alongside.",
        caption: "Another session: a participant wearing the EEG cap in front of the computer, with a team member alongside.",
      },
      {
        src: "/images/proyectos/hospital-uanl/ejercicio-eeg.jpg",
        alt: "Participant seen from behind, wearing the EEG electrode cap, seated at a monitor showing the number 10, with the arm resting on a yellow support.",
        caption: "Movement exercise guided by the C# interface: wearing the EEG cap, the participant follows the on-screen cues while the signals are recorded.",
      },
      {
        src: "/images/proyectos/hospital-uanl/sesion-eeg-2.jpg",
        alt: "A standing team member operates the session computer next to a seated participant wearing the EEG electrode cap; the participant's face is pixelated.",
        caption: "Setting up a session: a team member operates the computer next to the participant wearing the EEG cap (face pixelated).",
      },
    ],
    story: "The planet of the rose: here, technology is there to care.",
  },
  "vr-nave": {
    planet: { name: "VR & the ship" },
    tag: "Personal project",
    title: "Robotic teleoperation in virtual reality",
    summary:
      "Prototype in progress, built in Unity for the Meta Quest 3S, to operate the robotic arm from project 01 remotely.",
    problem:
      "Extreme-risk tasks, such as maneuvering in an electrical substation or a nuclear reactor, endanger people; doing them with robots from virtual reality would keep them safe.",
    contribution:
      "I am building the VR environment in Unity (C#) for the Meta Quest 3S; right now I am working on the arm's 3D model and the hardware connector.\n\n" +
      "Proposal: the Quest will send commands to a URL on the local network; the PC, acting as a local server, will receive them over sockets and relay them to the robot via Bluetooth, which Unity cannot control directly. Next to the virtual robot, a panel will show the app's SCADA: temperature, stop and sequential mode (a routine in a loop).",
    tech: ["Unity", "C#", "Meta Quest 3S", "Blender", "Visual Studio", "REST APIs", "Sockets", "Bluetooth", "SQL Server", "Local network (LAN)", "STM32 NUCLEO-F303RE", "ESP32", "LM35"],
    highlights: [
      "Virtual reality environment for the Meta Quest 3S, in Unity",
      "In development: the arm's 3D model and the hardware connector",
      "Proposed bridge: Quest → PC → robot with REST APIs, sockets and Bluetooth",
      "Same arm as project 01: STM32 NUCLEO-F303RE, ESP32 and LM35",
    ],
    images: [
      {
        src: "/images/proyectos/vr-nave/unity-entorno.jpg",
        alt: "Screenshot of the Unity editor with the prototype: the scene, a hexagonal platform under a sunset sky with 3D characters, the object hierarchy, the inspector, the project folder and the game view.",
        caption: "The prototype in the Unity editor: the scene, its hierarchy and the game view (in progress).",
      },
    ],
    videos: [{ type: "youtube", id: "FvwiXazVh-8", title: "Virtual reality prototype in Unity (in progress; not the final result)" }],
    models: [
      {
        src: "/modelos/vr-nave/brazo.gltf",
        poster: "/images/proyectos/vr-nave/modelo-brazo-3d.jpg",
        alt: "Interactive 3D model of the 6-DOF robotic arm, with its base, six servos, black aluminum brackets and gripper, which can be rotated.",
        caption: "3D model of the 6-DOF arm with its six servos, aluminum brackets and gripper: rotate it to see it from any angle (demo in progress; not the final result).",
      },
    ],
    story: "The last planet before the ship: a world that exists in virtual reality.",
  },
};
