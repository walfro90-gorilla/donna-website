// app/legal/terminos/page.tsx
"use client";

import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Términos y Condiciones de Uso
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar los servicios de Doña Repartos, usted acepta estar sujeto a estos 
                Términos y Condiciones de Uso. Si no está de acuerdo con alguno de estos términos, 
                no debe utilizar nuestros servicios.
              </p>
              <p className="text-gray-700 mb-4">
                Doña Repartos es una plataforma tecnológica que conecta a usuarios (clientes) con 
                restaurantes locales y repartidores independientes para facilitar la entrega de alimentos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-700 mb-4">
                Doña Repartos proporciona una plataforma digital que permite:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>A los clientes: Explorar menús, realizar pedidos y recibir entregas de alimentos</li>
                <li>A los restaurantes: Gestionar su presencia digital y recibir pedidos</li>
                <li>A los repartidores: Conectarse con oportunidades de entrega</li>
                <li>Procesamiento de pagos y comunicación entre las partes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Registro y Cuenta de Usuario</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Requisitos de Registro</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Debe ser mayor de 18 años</li>
                <li>Proporcionar información veraz y actualizada</li>
                <li>Mantener la confidencialidad de sus credenciales</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Responsabilidades del Usuario</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Es responsable de toda actividad en su cuenta</li>
                <li>Debe mantener actualizada su información de contacto</li>
                <li>No puede transferir su cuenta a terceros</li>
                <li>Debe cumplir con todas las leyes aplicables</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Uso de la Plataforma</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Uso Permitido</h3>
              <p className="text-gray-700 mb-4">Puede utilizar nuestra plataforma para:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Realizar pedidos de alimentos legítimos</li>
                <li>Comunicarse con restaurantes y repartidores</li>
                <li>Calificar y reseñar servicios de manera honesta</li>
                <li>Gestionar su perfil y preferencias</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Uso Prohibido</h3>
              <p className="text-gray-700 mb-4">Está prohibido:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Usar la plataforma para actividades ilegales</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Crear cuentas falsas o múltiples</li>
                <li>Acosar o amenazar a otros usuarios</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Realizar pedidos fraudulentos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Pedidos y Pagos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Proceso de Pedidos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Los pedidos están sujetos a disponibilidad</li>
                <li>Los precios pueden cambiar sin previo aviso</li>
                <li>Confirmación del pedido no garantiza aceptación</li>
                <li>Los restaurantes pueden rechazar pedidos a su discreción</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Pagos y Facturación</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Los pagos se procesan de forma segura</li>
                <li>Se aplicarán cargos por servicio y entrega</li>
                <li>Los reembolsos están sujetos a nuestra política</li>
                <li>Puede solicitar factura fiscal cuando esté disponible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Entregas</h2>
              <p className="text-gray-700 mb-4">
                Los tiempos de entrega son estimados y pueden variar debido a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Condiciones climáticas</li>
                <li>Tráfico y condiciones de la vía</li>
                <li>Disponibilidad de repartidores</li>
                <li>Tiempo de preparación del restaurante</li>
                <li>Volumen de pedidos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cancelaciones y Reembolsos</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Cancelaciones</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Puede cancelar antes de que el restaurante confirme</li>
                <li>Cancelaciones tardías pueden incurrir en cargos</li>
                <li>Doña Repartos puede cancelar por razones operativas</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Reembolsos</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Reembolsos por pedidos no entregados</li>
                <li>Créditos por problemas de calidad reportados</li>
                <li>Procesamiento en 5-10 días hábiles</li>
                <li>Sujeto a investigación y verificación</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Responsabilidades y Limitaciones</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Limitación de Responsabilidad</h3>
              <p className="text-gray-700 mb-4">
                Doña Repartos actúa como intermediario y no es responsable por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Calidad, seguridad o legalidad de los alimentos</li>
                <li>Acciones de restaurantes o repartidores independientes</li>
                <li>Daños indirectos o consecuenciales</li>
                <li>Interrupciones del servicio por causas externas</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Indemnización</h3>
              <p className="text-gray-700 mb-4">
                Usted acepta indemnizar a Doña Repartos por cualquier reclamación derivada de su uso 
                indebido de la plataforma o violación de estos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Propiedad Intelectual</h2>
              <p className="text-gray-700 mb-4">
                Todos los derechos de propiedad intelectual de la plataforma pertenecen a Doña Repartos. 
                Está prohibido copiar, modificar o distribuir nuestro contenido sin autorización.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Suspensión y Terminación</h2>
              <p className="text-gray-700 mb-4">
                Podemos suspender o terminar su cuenta por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Violación de estos términos</li>
                <li>Actividad fraudulenta o sospechosa</li>
                <li>Solicitud del usuario</li>
                <li>Razones operativas o legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modificaciones</h2>
              <p className="text-gray-700 mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios significativos serán notificados con 30 días de anticipación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Ley Aplicable y Jurisdicción</h2>
              <p className="text-gray-700 mb-4">
                Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta 
                en los tribunales competentes de la Ciudad de México.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para preguntas sobre estos términos, contáctenos:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@donarepartos.com</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> +52 (55) 1234-5678</p>
                <p className="text-gray-700"><strong>Dirección:</strong> Av. Reforma 123, Col. Centro, CDMX, México</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/legal/privacidad"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium"
              >
                Ver Política de Privacidad
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