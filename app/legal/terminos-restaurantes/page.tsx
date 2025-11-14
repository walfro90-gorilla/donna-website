// app/legal/terminos-restaurantes/page.tsx
"use client";

import Link from 'next/link';

export default function TerminosRestaurantesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Términos y Condiciones para Restaurantes
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acuerdo de Asociación</h2>
              <p className="text-gray-700 mb-4">
                Al registrarse como restaurante en Doña Repartos, usted acepta estos términos específicos 
                que complementan nuestros Términos y Condiciones generales. Este acuerdo establece una 
                relación comercial entre su establecimiento y nuestra plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Requisitos de Elegibilidad</h2>
              <p className="text-gray-700 mb-4">Para operar en nuestra plataforma, su restaurante debe:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Contar con licencias y permisos vigentes para operar</li>
                <li>Cumplir con todas las regulaciones sanitarias locales</li>
                <li>Tener un establecimiento físico verificable</li>
                <li>Proporcionar información comercial veraz y actualizada</li>
                <li>Mantener estándares de calidad e higiene</li>
                <li>Contar con capacidad operativa para manejar pedidos digitales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Gestión de Menú y Precios</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Contenido del Menú</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Debe mantener información precisa de platillos y precios</li>
                <li>Las imágenes deben ser representativas del producto real</li>
                <li>Debe indicar claramente alérgenos e ingredientes especiales</li>
                <li>Actualizar disponibilidad en tiempo real</li>
                <li>Cumplir con regulaciones de etiquetado nutricional</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Precios y Promociones</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Los precios deben incluir todos los impuestos aplicables</li>
                <li>Puede ofrecer promociones exclusivas para la plataforma</li>
                <li>Cambios de precios deben notificarse con 24 horas de anticipación</li>
                <li>No puede discriminar precios entre canales de venta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Procesamiento de Pedidos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Aceptación de Pedidos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Debe confirmar o rechazar pedidos dentro de 5 minutos</li>
                <li>Solo puede rechazar por razones válidas (falta de ingredientes, capacidad)</li>
                <li>Debe mantener un índice de aceptación mínimo del 85%</li>
                <li>Notificar inmediatamente cualquier problema con el pedido</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Tiempos de Preparación</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Establecer tiempos de preparación realistas</li>
                <li>Cumplir con los tiempos prometidos en un 90% de los casos</li>
                <li>Notificar retrasos superiores a 10 minutos</li>
                <li>Ajustar tiempos según demanda y capacidad</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Estándares de Calidad</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Calidad de Alimentos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Mantener altos estándares de frescura y sabor</li>
                <li>Usar empaques adecuados para entrega</li>
                <li>Garantizar que los alimentos lleguen en condiciones óptimas</li>
                <li>Cumplir con todas las normas de seguridad alimentaria</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Empaque y Presentación</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Usar materiales de empaque apropiados para cada tipo de alimento</li>
                <li>Incluir utensilios y servilletas cuando sea necesario</li>
                <li>Etiquetar claramente pedidos especiales o modificaciones</li>
                <li>Considerar el impacto ambiental en la elección de empaques</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Comisiones y Pagos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Estructura de Comisiones</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Comisión estándar del 15% sobre el valor del pedido</li>
                <li>Comisiones promocionales durante los primeros 30 días (0%)</li>
                <li>Descuentos por volumen para restaurantes de alto rendimiento</li>
                <li>Cargos adicionales por servicios premium opcionales</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Ciclo de Pagos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Pagos semanales todos los martes</li>
                <li>Período de retención de 7 días para nuevos restaurantes</li>
                <li>Transferencia directa a cuenta bancaria registrada</li>
                <li>Estados de cuenta detallados disponibles en línea</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Marketing y Promociones</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Visibilidad en la Plataforma</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Posicionamiento basado en calidad, tiempo de entrega y popularidad</li>
                <li>Opciones de publicidad pagada disponibles</li>
                <li>Participación en campañas promocionales de la plataforma</li>
                <li>Uso de imágenes y contenido del restaurante para marketing</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Promociones Conjuntas</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Participación en eventos especiales y festivales gastronómicos</li>
                <li>Descuentos coordinados durante temporadas altas</li>
                <li>Programas de lealtad para clientes frecuentes</li>
                <li>Cross-promotion con otros restaurantes locales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Soporte y Capacitación</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Onboarding completo para nuevos restaurantes</li>
                <li>Soporte técnico durante horarios de operación</li>
                <li>Capacitación en mejores prácticas de entrega</li>
                <li>Análisis de rendimiento y recomendaciones</li>
                <li>Actualizaciones regulares de la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Métricas de Rendimiento</h2>
              <p className="text-gray-700 mb-4">Monitoreamos las siguientes métricas:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Índice de Aceptación:</strong> Mínimo 85%</li>
                <li><strong>Tiempo de Preparación:</strong> Cumplimiento del 90%</li>
                <li><strong>Calificación de Clientes:</strong> Mínimo 4.0/5.0</li>
                <li><strong>Índice de Cancelación:</strong> Máximo 5%</li>
                <li><strong>Tiempo de Respuesta:</strong> Máximo 5 minutos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Suspensión y Terminación</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 Causas de Suspensión</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Incumplimiento de métricas de rendimiento</li>
                <li>Violaciones repetidas de estándares de calidad</li>
                <li>Problemas de seguridad alimentaria</li>
                <li>Quejas recurrentes de clientes</li>
                <li>Falta de pago de comisiones</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.2 Proceso de Terminación</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Notificación previa de 30 días (salvo casos graves)</li>
                <li>Oportunidad de remediar problemas identificados</li>
                <li>Liquidación final de pagos pendientes</li>
                <li>Transferencia de datos del cliente según corresponda</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Responsabilidades Específicas</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">11.1 Responsabilidades del Restaurante</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Mantener licencias y permisos vigentes</li>
                <li>Cumplir con regulaciones sanitarias y fiscales</li>
                <li>Proporcionar alimentos seguros y de calidad</li>
                <li>Manejar adecuadamente quejas y devoluciones</li>
                <li>Mantener confidencialidad de datos de clientes</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">11.2 Responsabilidades de Doña Repartos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Proporcionar plataforma tecnológica estable</li>
                <li>Procesar pagos de manera segura y oportuna</li>
                <li>Brindar soporte técnico y comercial</li>
                <li>Mantener la confidencialidad de información comercial</li>
                <li>Promover el restaurante dentro de la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contacto Especializado</h2>
              <p className="text-gray-700 mb-4">
                Para soporte específico de restaurantes:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> restaurantes@donarepartos.com</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> +52 (55) 1234-5679</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +52 (55) 9876-5432</p>
                <p className="text-gray-700"><strong>Horario:</strong> Lunes a Domingo, 8:00 AM - 10:00 PM</p>
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