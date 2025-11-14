// app/legal/terminos-repartidores/page.tsx
"use client";

import Link from 'next/link';

export default function TerminosRepartidoresPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Términos y Condiciones para Repartidores
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Naturaleza de la Relación</h2>
              <p className="text-gray-700 mb-4">
                Al registrarse como repartidor en Doña Repartos, usted actúa como contratista independiente, 
                no como empleado. Esta relación le otorga flexibilidad para elegir cuándo, dónde y cómo 
                trabajar, manteniendo su autonomía profesional.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Importante:</strong> Como contratista independiente, usted es responsable de sus 
                propias obligaciones fiscales, seguros y cumplimiento legal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Requisitos de Elegibilidad</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Requisitos Personales</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Ser mayor de 18 años</li>
                <li>Tener identificación oficial vigente</li>
                <li>Contar con número de seguridad social o RFC</li>
                <li>Pasar verificación de antecedentes penales</li>
                <li>Proporcionar información de contacto de emergencia</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Requisitos de Vehículo</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Vehículo propio (bicicleta, motocicleta, automóvil)</li>
                <li>Licencia de conducir vigente (para vehículos motorizados)</li>
                <li>Seguro de vehículo al corriente</li>
                <li>Verificación vehicular vigente (donde aplique)</li>
                <li>Equipo de seguridad requerido (casco, chaleco reflectivo)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Requisitos Tecnológicos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Smartphone con Android 8.0+ o iOS 12+</li>
                <li>Conexión a internet estable</li>
                <li>GPS funcional</li>
                <li>Aplicación de Doña Repartos instalada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Proceso de Entrega</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Aceptación de Pedidos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Tiene 30 segundos para aceptar o rechazar un pedido</li>
                <li>Puede ver información básica antes de aceptar (distancia, pago estimado)</li>
                <li>Una vez aceptado, debe completar la entrega</li>
                <li>Cancelaciones excesivas pueden afectar su acceso a pedidos</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Recolección en Restaurante</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Llegar puntualmente al restaurante</li>
                <li>Verificar que el pedido esté completo</li>
                <li>Manejar los alimentos con cuidado</li>
                <li>Reportar cualquier problema inmediatamente</li>
                <li>Mantener la temperatura adecuada de los alimentos</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Entrega al Cliente</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Seguir las instrucciones de entrega del cliente</li>
                <li>Verificar la identidad del receptor cuando sea necesario</li>
                <li>Ser cortés y profesional en todo momento</li>
                <li>Tomar foto de confirmación cuando se requiera</li>
                <li>Completar la entrega en la aplicación</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compensación y Pagos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Estructura de Pagos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Tarifa base:</strong> $25 MXN por entrega</li>
                <li><strong>Distancia:</strong> $3 MXN por kilómetro adicional</li>
                <li><strong>Tiempo:</strong> Bonificación por entregas en horarios pico</li>
                <li><strong>Propinas:</strong> 100% para el repartidor</li>
                <li><strong>Bonos:</strong> Incentivos por rendimiento y volumen</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Ciclo de Pagos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Pagos semanales todos los miércoles</li>
                <li>Depósito directo a cuenta bancaria registrada</li>
                <li>Estado de cuenta detallado disponible en la app</li>
                <li>Retención del 4% del ISR (deducible en declaración anual)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Gastos y Deducciones</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Combustible y mantenimiento del vehículo por cuenta propia</li>
                <li>Seguro personal y del vehículo</li>
                <li>Equipo de trabajo (bolsas térmicas, uniformes)</li>
                <li>Obligaciones fiscales como persona física</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Estándares de Servicio</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Métricas de Rendimiento</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Índice de Aceptación:</strong> Mínimo 80%</li>
                <li><strong>Índice de Finalización:</strong> Mínimo 95%</li>
                <li><strong>Calificación de Clientes:</strong> Mínimo 4.5/5.0</li>
                <li><strong>Tiempo de Entrega:</strong> Dentro del rango estimado</li>
                <li><strong>Disponibilidad:</strong> Mínimo 10 horas por semana</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Código de Conducta</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Mantener apariencia profesional y limpia</li>
                <li>Ser puntual y confiable</li>
                <li>Tratar a clientes y restaurantes con respeto</li>
                <li>No consumir alcohol o drogas durante el trabajo</li>
                <li>Seguir todas las leyes de tránsito</li>
                <li>Mantener confidencialidad de información de clientes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Seguridad y Protección</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Medidas de Seguridad</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Usar equipo de protección personal obligatorio</li>
                <li>Seguir protocolos de seguridad vial</li>
                <li>Reportar incidentes inmediatamente</li>
                <li>Mantener vehículo en condiciones seguras</li>
                <li>Evitar trabajar en condiciones climáticas peligrosas</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Seguro y Cobertura</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Seguro de accidentes básico proporcionado por Doña Repartos</li>
                <li>Cobertura durante entregas activas únicamente</li>
                <li>Responsabilidad del repartidor mantener seguro personal</li>
                <li>Proceso de reclamación disponible 24/7</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Flexibilidad y Horarios</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Libertad de Horarios</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Puede conectarse y desconectarse cuando desee</li>
                <li>No hay horarios mínimos obligatorios</li>
                <li>Puede trabajar en múltiples zonas</li>
                <li>Flexibilidad para tomar descansos</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Horarios de Mayor Demanda</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Desayuno:</strong> 7:00 AM - 10:00 AM</li>
                <li><strong>Comida:</strong> 12:00 PM - 3:00 PM</li>
                <li><strong>Cena:</strong> 6:00 PM - 10:00 PM</li>
                <li><strong>Fines de semana:</strong> Demanda extendida</li>
                <li>Bonificaciones especiales durante horarios pico</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Capacitación y Soporte</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Onboarding Inicial</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Capacitación en línea obligatoria</li>
                <li>Tutorial de uso de la aplicación</li>
                <li>Mejores prácticas de entrega</li>
                <li>Protocolos de seguridad</li>
                <li>Sesión de preguntas y respuestas</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Soporte Continuo</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Chat de soporte 24/7 en la aplicación</li>
                <li>Línea telefónica de emergencias</li>
                <li>Centro de ayuda en línea</li>
                <li>Talleres de mejora continua</li>
                <li>Programa de mentores para nuevos repartidores</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Suspensión y Terminación</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Causas de Suspensión Temporal</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Calificaciones consistentemente bajas</li>
                <li>Múltiples quejas de clientes</li>
                <li>Incumplimiento de métricas de rendimiento</li>
                <li>Violaciones menores del código de conducta</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Causas de Terminación Permanente</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Actividad fraudulenta o deshonesta</li>
                <li>Violaciones graves de seguridad</li>
                <li>Comportamiento inapropiado hacia clientes</li>
                <li>Uso de drogas o alcohol durante el trabajo</li>
                <li>Violaciones repetidas después de suspensiones</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Beneficios y Programas</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 Programa de Lealtad</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Bonos por antigüedad y rendimiento</li>
                <li>Acceso prioritario a pedidos de alto valor</li>
                <li>Descuentos en mantenimiento de vehículos</li>
                <li>Seguro médico subsidiado para repartidores destacados</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.2 Desarrollo Profesional</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Oportunidades de convertirse en mentor</li>
                <li>Programas de capacitación avanzada</li>
                <li>Posibilidades de crecimiento dentro de la empresa</li>
                <li>Certificaciones en servicio al cliente</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Responsabilidades Fiscales</h2>
              <p className="text-gray-700 mb-4">
                Como contratista independiente, usted es responsable de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Declarar ingresos en su declaración anual</li>
                <li>Pagar impuestos correspondientes</li>
                <li>Mantener registros de gastos deducibles</li>
                <li>Obtener facturación cuando sea requerida</li>
                <li>Cumplir con obligaciones del SAT</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contacto Especializado</h2>
              <p className="text-gray-700 mb-4">
                Para soporte específico de repartidores:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> repartidores@donarepartos.com</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> +52 (55) 1234-5680</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +52 (55) 9876-5433</p>
                <p className="text-gray-700"><strong>Emergencias:</strong> +52 (55) 911-HELP (4357)</p>
                <p className="text-gray-700"><strong>Horario:</strong> 24/7 para emergencias, 6:00 AM - 12:00 AM para soporte general</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/legal/terminos"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium"
              >
                Ver Términos Generales
              </Link>
              <Link 
                href="/legal/privacidad"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium"
              >
                Ver Política de Privacidad
              </Link>
              <Link 
                href="/registro-repartidor"
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