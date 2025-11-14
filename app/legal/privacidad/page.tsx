// app/legal/privacidad/page.tsx
"use client";

import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidad de Datos
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información General</h2>
              <p className="text-gray-700 mb-4">
                En Doña Repartos, nos comprometemos a proteger la privacidad y seguridad de los datos personales 
                de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, utilizamos, 
                almacenamos y protegemos su información personal cuando utiliza nuestros servicios.
              </p>
              <p className="text-gray-700 mb-4">
                Doña Repartos es una plataforma de entrega de alimentos que conecta a clientes, restaurantes 
                y repartidores en México, operando bajo las leyes mexicanas de protección de datos personales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Datos que Recopilamos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Información de Registro</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección física</li>
                <li>Fecha de nacimiento (para verificación de edad)</li>
                <li>Información de pago (procesada de forma segura)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Información de Uso</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Historial de pedidos y preferencias</li>
                <li>Ubicación geográfica (con su consentimiento)</li>
                <li>Información del dispositivo y navegador</li>
                <li>Datos de interacción con la plataforma</li>
                <li>Calificaciones y reseñas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Uso de la Información</h2>
              <p className="text-gray-700 mb-4">Utilizamos su información personal para:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Procesar y entregar sus pedidos</li>
                <li>Facilitar la comunicación entre usuarios</li>
                <li>Mejorar nuestros servicios y experiencia del usuario</li>
                <li>Enviar notificaciones importantes sobre su cuenta</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Prevenir fraudes y garantizar la seguridad</li>
                <li>Personalizar contenido y ofertas (con su consentimiento)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartir Información</h2>
              <p className="text-gray-700 mb-4">
                No vendemos ni alquilamos su información personal. Compartimos datos únicamente en las siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Con restaurantes y repartidores para completar pedidos</li>
                <li>Con proveedores de servicios de pago autorizados</li>
                <li>Con autoridades cuando sea requerido por ley</li>
                <li>En caso de fusión o adquisición empresarial</li>
                <li>Con su consentimiento explícito</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Seguridad de Datos</h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger 
                su información personal, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encriptación de datos sensibles</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Auditorías regulares de seguridad</li>
                <li>Capacitación del personal en protección de datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Sus Derechos</h2>
              <p className="text-gray-700 mb-4">
                Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, 
                usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Acceso:</strong> Conocer qué datos personales tenemos sobre usted</li>
                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de sus datos</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
                <li><strong>Portabilidad:</strong> Obtener una copia de sus datos</li>
                <li><strong>Limitación:</strong> Restringir el procesamiento de sus datos</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Para ejercer estos derechos, contáctenos en: <strong>privacidad@donarepartos.com</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso 
                de nuestros servicios y personalizar contenido. Puede gestionar sus preferencias de cookies 
                en la configuración de su navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retención de Datos</h2>
              <p className="text-gray-700 mb-4">
                Conservamos su información personal durante el tiempo necesario para cumplir con los 
                propósitos descritos en esta política, salvo que la ley requiera o permita un período 
                de retención más largo.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Menores de Edad</h2>
              <p className="text-gray-700 mb-4">
                Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos 
                intencionalmente información personal de menores de edad sin el consentimiento parental.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cambios a esta Política</h2>
              <p className="text-gray-700 mb-4">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre 
                cambios significativos a través de nuestros canales de comunicación habituales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre esta Política de Privacidad o el tratamiento de sus datos personales, 
                puede contactarnos:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacidad@donarepartos.com</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> +52 (55) 1234-5678</p>
                <p className="text-gray-700"><strong>Dirección:</strong> Av. Reforma 123, Col. Centro, CDMX, México</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/legal/terminos"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium"
              >
                Ver Términos y Condiciones
              </Link>
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-800"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}