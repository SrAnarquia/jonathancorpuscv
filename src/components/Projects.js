export default function Projects() {
  return (
    <section id="proyectos">
      <h2>Proyectos Implementados</h2>
      <div className="proyectos-container">

        {/* ================== Transformación Digital ================== */}
        <h3>Transformación Digital</h3>

        <div className="card">
          <div className="card-left">
            <img src="/TransformationDashboard.png" alt="Transformación Digital" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Supply Chain Hub - Proyecto Personal</h4>
            <p>
              Proyecto personal en el que transformé más de <strong>700,000 datos</strong> en una
              <strong> plataforma web interactiva tipo e-commerce</strong>. La solución permite seleccionar
              ítems, consultar su estatus de entrega y analizar métricas logísticas en tiempo real.
              Además, integré <strong>dashboards en Power BI</strong> para generar reportes gerenciales
              interactivos que optimizan la toma de decisiones.
            </p>
            <ul>
              <li>Administración centralizada en la nube</li>
              <li>Reducción del uso de papel con reportes digitales</li>
              <li>Filtrado dinámico de datos</li>
              <li>Mejor seguimiento del estatus de cada producto</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/SupplyChain.jpg" alt="Vista del proyecto" />
          </div>
        </div>

        <div className="card">
          <div className="card-left">
            <img src="/bus.png" alt="Reporte Autobuses" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Maintenance Transportation Report - KIA MEXICO</h4>
            <p>
              Plataforma de digitalización de rutas de transporte interno en la planta
              <strong> KIA México</strong>, permitiendo que operarios y personal de mantenimiento
              registraran y analizaran el <strong>estatus de las rutas</strong>. Facilitó la detección
              temprana de problemas, la programación de mantenimientos y la mejora de la satisfacción
              laboral al contar con rutas seguras y confiables.
            </p>
            <ul>
              <li>Análisis en tiempo real del estado de rutas</li>
              <li>Respuesta rápida ante incidencias</li>
              <li>Optimización de la experiencia de los empleados</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/Survey.png" alt="Vista del proyecto" />
          </div>
        </div>

        <div className="card">
          <div className="card-left">
            <img src="/support.png" alt="Soporte Facilities" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Maintenance Facilities Issues Tracking - KIA MEXICO</h4>
            <p>
              Implementación de una <strong>web interactiva para la gestión de incidencias internas</strong>.
              Los colaboradores podían reportar problemas como fallas en aire acondicionado, mobiliario
              defectuoso o daños en instalaciones, los cuales eran asignados al personal de mantenimiento
              correspondiente para su resolución eficiente.
            </p>
            <ul>
              <li>Reducción del uso de reportes físicos en papel</li>
              <li>Mejor trazabilidad de problemas y resolución</li>
              <li>Incremento en la eficiencia de los equipos de soporte</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/Facilities.png" alt="Vista del proyecto" />
          </div>
        </div>

        {/* ================== Monitoreo en tiempo real ================== */}
        <h3>Monitoreo en Tiempo Real y Entornos de Producción</h3>

        <div className="card">
          <div className="card-left">
            <img src="/scada.png" alt="SCADA IA" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Power Monitor System (SCADA + IA) - KIA MEXICO</h4>
            <p>
              Sistema <strong>SCADA potenciado con IA</strong> como prototipo para su implementación
              en <strong>KIA México</strong>, enfocado en la predicción de fallas en robots de soldadura
              por sobrecalentamiento en servomotores. Permitiendo el <strong>monitoreo en tiempo real de
              vibraciones, alteraciones y condiciones críticas</strong> en producción.
            </p>
            <ul>
              <li>Predicción temprana de fallas críticas</li>
              <li>Monitoreo en tiempo real de la planta</li>
              <li>Prevención de pérdidas millonarias por paros no planificados</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/PowerMonitor.png" alt="Vista del SCADA" />
          </div>
        </div>

        <div className="card">
          <div className="card-left">
            <img src="/plc.png" alt="PLC HMI" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Filling Machine Monitoring - KIA MEXICO</h4>
            <p>
              Sistema de <strong>monitoreo en tiempo real</strong> de llenadoras de líquido de freno
              en la planta de ensamble automotriz. Aseguraba que cada unidad fuese correctamente
              llenada, evitando defectos de producción y pérdidas económicas. Permitía a
              <strong> mantenimiento, producción y calidad</strong> intervenir de manera conjunta
              en caso de incidencias.
            </p>
            <ul>
              <li>Detección inmediata de fallos en el llenado</li>
              <li>Coordinación eficiente entre áreas clave</li>
              <li>Garantía de calidad y reducción de desperdicios</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/plc_extra.jpg" alt="Vista del PLC" />
          </div>
        </div>

        <div className="card">
          <div className="card-left">
            <img src="/server.png" alt="Servidores Web" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Web & Database Server Enhancement - KIA MEXICO</h4>
            <p>
              Proyecto de modernización tecnológica en <strong>KIA México</strong>, enfocado en la
              actualización de <strong>servidores web y bases de datos</strong> que presentaban
              obsolescencia e interferencias en sistemas SCADA y de monitoreo. La solución mejoró la
              <strong> eficiencia de adquisición de datos en tiempo real</strong> y preparó la
              infraestructura para futuros proyectos tecnológicos.
            </p>
            <ul>
              <li>Mayor eficiencia en sistemas de mantenimiento</li>
              <li>Reducción de problemas por obsolescencia</li>
              <li>Base sólida para proyectos de transformación digital</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/server_extra.jpg" alt="Vista del servidor" />
          </div>
        </div>

        {/* ================== Salud y Entrenamiento ================== */}
        <h3>Salud y Entrenamiento</h3>

        <div className="card">
          <div className="card-left">
            <img src="/vr.png" alt="Virtual Training" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Paint & Welding Abilities Virtual Training - KIA MEXICO</h4>
            <p>
              Proyecto desarrollado para mejorar la forma en que se entrena al personal de producción
              en <strong>KIA México</strong>. En lugar de usar materiales reales costosos, se implementaron
              <strong> sistemas virtuales con recursos infinitos</strong> que guiaban paso a paso y mostraban
              resultados personalizados para perfeccionar las técnicas de pintura y soldadura.
            </p>
            <ul>
              <li>Reducción significativa en costos de entrenamiento</li>
              <li>Guía paso a paso personalizada</li>
              <li>Resultados inmediatos para mejorar habilidades</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/vr_extra.jpg" alt="Vista del proyecto de entrenamiento" />
          </div>
        </div>

        <div className="card">
          <div className="card-left">
            <img src="/hospital_ui.png" alt="Attention Monitoring" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Attention Monitoring Health System - HOSPITAL UANL</h4>
            <p>
              Sistema de escritorio en <strong>C#</strong> para la adquisición de datos en tiempo real
              que evaluaba el nivel de atención de pacientes mediante el test de atención sostenida (CPT).
              Incluía ejercicios repetidos y registro de señales <strong>EEG y EMG</strong> para analizar
              concentración y respuestas musculares, apoyando a médicos en la planificación de rutas de mejora.
            </p>
            <ul>
              <li>Evaluación objetiva del nivel de atención</li>
              <li>Registro en tiempo real de EEG y EMG</li>
              <li>Apoyo a médicos en rutas de rehabilitación</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/hospital_ui_extra.jpg" alt="Vista del sistema de atención" />
          </div>
        </div>

        <div className="card">
          <div className="card-left">
            <img src="/hospital_ai.png" alt="Recovery AI" className="project-icon" />
          </div>
          <div className="card-center">
            <h4>Recovery AI Model for Stroke Patients - HOSPITAL UANL</h4>
            <p>
              Algoritmo de Inteligencia Artificial entrenado con más de <strong>10 millones de datos </strong> 
               de EEG y EMG de más de 300 pacientes. Permitía predecir con alta precisión el estado cognitivo
              y motor de pacientes con derrame cerebral, brindando a médicos y neurocirujanos una herramienta
              para evaluar el estado actual del paciente y planificar su recuperación.
            </p>
            <ul>
              <li>Predicciones basadas en EEG y EMG reales</li>
              <li>Apoyo clínico en la evaluación de pacientes</li>
              <li>Herramienta de apoyo para neurocirujanos</li>
            </ul>
          </div>
          <div className="card-right">
            <img src="/hospital_ai_extra.png" alt="Vista del modelo de recuperación" />
          </div>
        </div>

      </div>
    </section>
  );
}
