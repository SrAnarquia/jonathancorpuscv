export default function Projects() {
  return (
    <section id="proyectos">
      <h2>Proyectos Implementados</h2>
      <div className="proyectos-container">

        {/* Proyecto 1 */}
        <div className="card">
          {/* Foto circular */}
          <div className="card-left">
            <img src="/motor.png" alt="Motor Monitoring" className="project-icon" />
          </div>

          {/* Centro: Titulo + descripción + beneficios */}
          <div className="card-center">
            <h4>Motor Monitoring System</h4>
            <p>Adquisición de datos en tiempo real desde STM32 a Azure. Mantenimiento predictivo con Power BI.</p>
            <ul>
              <li>Monitoreo en tiempo real</li>
              <li>Prevención de fallas</li>
              <li>Integración con la nube</li>
            </ul>
          </div>

          {/* Imagen del proyecto */}
          <div className="card-right">
            <img src="/motor_extra.png" alt="Vista del proyecto" />
          </div>
        </div>

        {/* Proyecto 2 */}
        <div className="card">
          <div className="card-left">
            <img src="/maintenance.png" alt="Maintenance Web Platform" className="project-icon" />
          </div>

          <div className="card-center">
            <h4>Maintenance Web Platform</h4>
            <p>Herramienta interna para KIA México. Digitalización de flujos, integración SQL Server, monitoreo PLC.</p>
            <ul>
              <li>Optimización de procesos</li>
              <li>Integración con PLC</li>
              <li>Reportes automáticos</li>
            </ul>
          </div>

          <div className="card-right">
            <img src="/maintenance_extra.png" alt="Vista del proyecto" />
          </div>
        </div>

      </div>
    </section>
  );
}
