export default function Projects() {
    return (
        <section id="proyectos">
            <h2>Proyectos Implementados</h2>

            <div className="proyectos-container">

                {/* ===== NUEVO PROYECTO ===== */}
                <div className="card">
                    <div className="card-left">
                        <img src="/robot.png" alt="Robot Control App" className="project-icon" />
                    </div>

                    <div className="card-center">
                        <h4>Industrial Robot Control & Monitoring - Proyecto Personal - Industria 4.0</h4>
                        <p>
                            Desarrollo de una <strong>aplicación móvil en .NET MAUI (C#)</strong> para el control y monitoreo
                            de un robot industrial de 6 grados de libertad (6-DOF), integrando comunicación Bluetooth con
                            un sistema embebido basado en <strong>STM32</strong>.

                            El sistema permite controlar el movimiento del robot mediante un joystick móvil, mientras
                            adquiere datos de temperatura en tiempo real desde un sensor <strong>LM35</strong>. La información
                            es transmitida mediante <strong>ESP32</strong> hacia una API local (ASP.NET + SQL Server),
                            donde se almacena y visualiza en dashboards en tiempo real.
                        </p>

                        <ul>
                            <li>Control de robot en tiempo real desde app móvil</li>
                            <li>Adquisición de datos mediante ADC de 12 bits (STM32)</li>
                            <li>Integración IoT: STM32 + ESP32 + API + SQL Server</li>
                            <li>Visualización de datos en dashboards móviles</li>
                            <li>Arquitectura escalable mediante configuración de dispositivos Bluetooth</li>
                        </ul>
                    </div>

                    <div className="card-right">
                        <img src="/robot_extra.jpeg" alt="Vista del sistema de control" />

                        <a
                            href="https://www.linkedin.com/posts/jonathan-corpus-462067237_iiot-industry40-automation-activity-7449471521019953152-rCje"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-linkedin"
                        >
                            ▶ Ver video
                        </a>
                    </div>
                </div>


                {/* ===== PROYECTOS EXISTENTES ===== */}

                <div className="card">
                    <div className="card-left">
                        <img src="/Food.png" alt="MealFlow" className="project-icon" />
                    </div>
                    <div className="card-center">
                        <h4>MealFlow - Autotransportes Especializados Alfa - Transformación Digital</h4>
                        <p>
                            Desarrollo de una <strong>aplicación móvil + plataforma web</strong> para la
                            digitalización del proceso de compra de alimentos dentro de la organización.
                            El sistema reemplaza listas manuales que generaban retrasos operativos,
                            permitiendo registrar pedidos mediante el <strong>escaneo de códigos QR en gafetes</strong>.

                            La aplicación envía la información a un <strong>Backend API</strong> que valida
                            al usuario e inserta automáticamente los datos en base de datos, generando una <strong>trazabilidad completa del consumo</strong>: quién compró, qué compró,
                            cuándo y desde qué área.
                        </p>
                        <ul>
                            <li>Eliminación de procesos manuales y reducción de tiempos de espera</li>
                            <li>Registro automático mediante escaneo QR</li>
                            <li>Trazabilidad completa de consumo por empleado y departamento</li>
                            <li>Integración Mobile + Web + Backend API</li>
                            <li>Optimización operativa en entornos industriales</li>
                        </ul>
                    </div>
                    <div className="card-right">
                        <img src="/AppScannAndroid.png" alt="Vista del sistema FoodOps Tracker" />
                    </div>
                </div>


                <div className="card">
                    <div className="card-left">
                        <img src="/TransformationDashboard.png" alt="Transformación Digital" className="project-icon" />
                    </div>
                    <div className="card-center">
                        <h4>Supply Chain Hub - Proyecto Personal - Transformación Digital</h4>
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
                        <h4>Maintenance Transportation Report - KIA MEXICO - Transformación Digital</h4>
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
                        <img src="/plc.png" alt="PLC HMI" className="project-icon" />
                    </div>
                    <div className="card-center">
                        <h4>Filling Machine Monitoring - KIA MEXICO - Monitoreo en Tiempo Real</h4>
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
                        <img src="/hospital_ai.png" alt="Recovery AI" className="project-icon" />
                    </div>
                    <div className="card-center">
                        <h4>Recovery AI Model for Stroke Patients - HOSPITAL UANL - Salud e IA</h4>
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