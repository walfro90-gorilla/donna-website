// app/legal/privacidad-restaurantes/page.tsx
"use client";

import Link from 'next/link';

export default function PrivacidadRestaurantesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidad para Restaurantes
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información Específica para Restaurantes</h2>
              <p className="text-gray-700 mb-4">
                Esta política complementa nuestra Política de Privacidad general y describe específicamente 
                cómo manejamos los datos de nuestros socios restaurantes en la plataforma Doña Repartos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Datos Comerciales que Recopilamos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Información de Registro Comercial</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Razón social y nombre comercial</li>
                <li>RFC y datos fiscales</li>
                <li>Licencias y permisos sanitarios</li>
                <li>Dirección del establecimiento</li>
                <li>Información del representante legal</li>
                <li>Datos bancarios para pagos</li>
                <li>Documentación legal requerida</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Información Operativa</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Menús, precios y disponibilidad</li>
                <li>Horarios de operación</li>
                <li>Capacidad de producción</li>
                <li>Tiempos de preparación</li>
                <li>Historial de pedidos y ventas</li>
                <li>Métricas de rendimiento</li>
                <li>Calificaciones y reseñas recibidas</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Datos Financieros</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Volumen de ventas y comisiones</li>
                <li>Información de facturación</li>
                <li>Historial de pagos</li>
                <li>Datos para cumplimiento fiscal</li>
                <li>Información de promociones y descuentos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Uso de Información Comercial</h2>
              <p className="text-gray-700 mb-4">Utilizamos su información comercial para:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Verificar la legitimidad y legalidad de su negocio</li>
                <li>Procesar y facilitar pedidos de clientes</li>
                <li>Calcular y procesar pagos y comisiones</li>
                <li>Generar reportes de ventas y análisis</li>
                <li>Mejorar la visibilidad de su restaurante en la plataforma</li>
                <li>Cumplir con obligaciones fiscales y regulatorias</li>
                <li>Proporcionar soporte técnico y comercial</li>
                <li>Desarrollar nuevas funcionalidades y servicios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartir Información con Terceros</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Información Visible para Clientes</h3>
              <p className="text-gray-700 mb-4">Los clientes pueden ver:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Nombre comercial y logo</li>
                <li>Menú, precios y descripciones</li>
                <li>Horarios de operación</li>
                <li>Ubicación y área de entrega</li>
                <li>Calificaciones y reseñas</li>
                <li>Tiempo estimado de preparación</li>
                <li>Información de promociones activas</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Información Compartida con Repartidores</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Nombre y ubicación del restaurante</li>
                <li>Detalles específicos del pedido</li>
                <li>Instrucciones especiales de recolección</li>
                <li>Información de contacto para coordinación</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Terceros Autorizados</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Procesadores de pago para transacciones</li>
                <li>Servicios de verificación de antecedentes</li>
                <li>Autoridades fiscales cuando sea requerido</li>
                <li>Auditores y consultores bajo acuerdos de confidencialidad</li>
                <li>Proveedores de servicios tecnológicos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Protección de Datos Comerciales</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Medidas de Seguridad Específicas</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encriptación de datos financieros y comerciales sensibles</li>
                <li>Acceso restringido a información comercial confidencial</li>
                <li>Auditorías regulares de seguridad de datos</li>
                <li>Respaldos seguros de información crítica</li>
                <li>Monitoreo continuo de accesos no autorizados</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Confidencialidad Comercial</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Protección de secretos comerciales y recetas</li>
                <li>Confidencialidad de estrategias de precios</li>
                <li>Protección de datos de proveedores</li>
                <li>Seguridad de información financiera detallada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Derechos Específicos de Restaurantes</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Control de Información Pública</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Actualizar información del menú y precios en tiempo real</li>
                <li>Controlar la visibilidad de promociones</li>
                <li>Gestionar horarios de disponibilidad</li>
                <li>Responder a reseñas y calificaciones</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Acceso a Datos y Reportes</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Dashboard con métricas de rendimiento en tiempo real</li>
                <li>Reportes detallados de ventas y comisiones</li>
                <li>Análisis de tendencias y patrones de pedidos</li>
                <li>Exportación de datos para análisis interno</li>
                <li>Historial completo de transacciones</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Portabilidad de Datos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Derecho a obtener copia de todos sus datos</li>
                <li>Formato estructurado y legible por máquina</li>
                <li>Transferencia a otras plataformas cuando sea técnicamente posible</li>
                <li>Conservación de datos históricos tras terminación del servicio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Retención de Datos Comerciales</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Períodos de Retención</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Datos operativos:</strong> Durante la relación comercial activa</li>
                <li><strong>Información fiscal:</strong> 5 años después de la terminación</li>
                <li><strong>Datos de transacciones:</strong> 7 años para cumplimiento legal</li>
                <li><strong>Información de marketing:</strong> Hasta revocación del consentimiento</li>
                <li><strong>Datos de soporte:</strong> 2 años después de la última interacción</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Eliminación Segura</h3>
              <p className="text-gray-700 mb-4">
                Al finalizar los períodos de retención, eliminamos de forma segura todos los datos 
                que ya no son necesarios, siguiendo protocolos de destrucción certificados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Análisis y Mejora de Servicios</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Análisis Agregado</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Tendencias de mercado y comportamiento de consumidores</li>
                <li>Optimización de algoritmos de recomendación</li>
                <li>Mejora de tiempos de entrega y eficiencia</li>
                <li>Desarrollo de nuevas funcionalidades</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Benchmarking Anónimo</h3>
              <p className="text-gray-700 mb-4">
                Podemos usar datos agregados y anonimizados para proporcionar benchmarks de la industria 
                y ayudar a mejorar el rendimiento de todos los restaurantes en la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Transferencias Internacionales</h2>
              <p className="text-gray-700 mb-4">
                Sus datos se almacenan principalmente en servidores ubicados en México. En caso de 
                transferencias internacionales para servicios de soporte técnico o análisis, 
                implementamos salvaguardas adecuadas como:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Cláusulas contractuales estándar</li>
                <li>Certificaciones de privacidad reconocidas</li>
                <li>Encriptación durante la transferencia</li>
                <li>Limitación del acceso a datos mínimos necesarios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Notificación de Incidentes</h2>
              <p className="text-gray-700 mb-4">
                En caso de una violación de seguridad que afecte sus datos comerciales:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Le notificaremos dentro de 72 horas del descubrimiento</li>
                <li>Proporcionaremos detalles sobre el tipo de datos afectados</li>
                <li>Explicaremos las medidas tomadas para contener el incidente</li>
                <li>Ofreceremos recomendaciones para proteger su negocio</li>
                <li>Mantendremos comunicación regular durante la investigación</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto para Restaurantes</h2>
              <p className="text-gray-700 mb-4">
                Para consultas específicas sobre privacidad de datos comerciales:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacidad-restaurantes@donarepartos.com</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> +52 (55) 1234-5681</p>
                <p className="text-gray-700"><strong>Horario:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM</p>
                <p className="text-gray-700"><strong>Oficial de Protección de Datos:</strong> dpo@donarepartos.com</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/legal/privacidad"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium"
              >
                Ver Política General
              </Link>
              <Link 
                href="/legal/terminos-restaurantes"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium"
              >
                Ver Términos para Restaurantes
              </Link>
              <Link 
                href="/socios"
                className="text-gray-600 hover:text-gray-800"
              >
                Volver a Registro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}