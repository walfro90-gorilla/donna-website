"use client";
// app/page.tsx
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Componente para renderizar las estrellas de calificación
const StarRating = ({ rating }: { rating: number }) => {
  const totalStars = 5;
  return (
    <div className="flex justify-center mb-4">
      {[...Array(totalStars)].map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Datos de ejemplo para los testimonios. A futuro, esto vendría de tu base de datos.
const testimonials = [
  {
    name: 'Ana García',
    role: 'Cliente Frecuente',
    rating: 5,
    comment: '"¡Doña Repartos es una maravilla! Siempre encuentro los restaurantes de mi barrio y la comida llega caliente. El repartidor fue súper amable."',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Dueño de "Taquería El Sol"',
    rating: 5,
    comment: '"Desde que nos unimos, nuestras ventas para llevar han subido un 40%. La plataforma es muy fácil de usar y el soporte es local, ¡entienden nuestro negocio!"',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d'
  },
  {
    name: 'Sofía Martínez',
    role: 'Repartidora',
    rating: 5,
    comment: '"Me encanta la flexibilidad. Puedo conectarme en mis tiempos libres y las ganancias son muy buenas. Lo mejor es que la propina es 100% mía."',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d'
  }
];

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? testimonials.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === testimonials.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const heroImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto.format&fit=crop";

  return (
    <>
      {/* Hero Section */}
      <section 
        className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroImage})` }}
        aria-label="Una mesa con platos de comida variada y colorida"
      >
        <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 drop-shadow-lg">
            El sabor de tu barrio, entregado con corazón.
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 md:mb-8 drop-shadow-md">
            Apoya a los restaurantes locales y recibe tu comida favorita más rápido que nunca.
          </p>
          <div className="mt-4 flex flex-col md:flex-row gap-2 justify-center max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Ingresa tu dirección"
              className="w-full md:w-2/3 px-4 py-3 rounded-full text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2"
              aria-label="Ingresa tu dirección para buscar restaurantes"
            />
            <Link
              href="/clientes"
              className="bg-[#e4007c] text-white font-semibold py-3 px-6 md:px-8 rounded-full hover:bg-[#c6006b] transition-transform transform hover:scale-105 text-center focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2"
              aria-label="Ver restaurantes disponibles"
            >
              Ver Restaurantes
            </Link>
          </div>
        </div>
      </section>

      {/* Sección "Cómo Funciona" */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-8 md:mb-12">
            Tu comida favorita en 3 simples pasos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="flex flex-col items-center">
              <div className="bg-[#fce4f3] p-6 rounded-full mb-4">
                <svg className="w-10 h-10 text-[#e4007c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Elige tu antojo</h3>
              <p className="text-gray-600">Explora los mejores restaurantes locales cerca de ti y encuentra lo que se te antoja.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#fce4f3] p-6 rounded-full mb-4">
                <svg className="w-10 h-10 text-[#e4007c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Haz tu pedido</h3>
              <p className="text-gray-600">Añade tus platillos al carrito y paga de forma segura con tarjeta o en efectivo.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#fce4f3] p-6 rounded-full mb-4">
                <svg className="w-10 h-10 text-[#e4007c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 18h6" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Disfruta en minutos</h3>
              <p className="text-gray-600">Sigue tu orden en tiempo real y recíbela en la puerta de tu casa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección CTA para Socios y Repartidores */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
            <div className="bg-gray-100 p-6 md:p-8 rounded-lg text-center">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Haz crecer tu negocio</h3>
              <p className="text-gray-600 mb-6 text-sm md:text-base">Llega a miles de nuevos clientes en tu comunidad y aumenta tus ventas. Únete a la familia Doña Repartos.</p>
              <Link
                href="/socios"
                className="bg-gray-800 text-white font-semibold py-3 px-8 rounded-full hover:bg-black transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2"
                aria-label="Registra tu restaurante"
              >
                Registra tu Restaurante
              </Link>
            </div>
            <div className="bg-[#e4007c] p-6 md:p-8 rounded-lg text-center text-white">
              <h3 className="text-xl md:text-2xl font-bold mb-4">Gana a tu ritmo</h3>
              <p className="mb-6 text-sm md:text-base">Sé tu propio jefe. Conduce con Doña Repartos y obtén ganancias con horarios flexibles.</p>
              <Link
                href="/repartidores"
                className="bg-white text-[#e4007c] font-semibold py-3 px-8 rounded-full hover:bg-pink-100 transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                aria-label="Conviértete en repartidor"
              >
                Conviértete en Repartidor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Testimonios */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Lo que dicen de nosotros</h2>
          <p className="text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto text-sm md:text-base">Nuestra mayor satisfacción es ver felices a nuestros clientes, socios y repartidores.</p>
          <div className="relative max-w-3xl mx-auto">
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <Image 
                          src={testimonial.avatar}
                          alt={`Avatar de ${testimonial.name}`}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <StarRating rating={testimonial.rating} />
                      <p className="text-gray-600 italic mb-4">&ldquo;{testimonial.comment}&rdquo;</p>
                      <h4 className="font-bold text-lg text-gray-800">{testimonial.name}</h4>
                      <p className="text-[#e4007c] font-semibold">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Controles del carrusel */}
            <button
              onClick={prevSlide}
              className="absolute top-1/2 left-0 md:-left-12 transform -translate-y-1/2 -translate-x-4 md:-translate-x-12 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 z-10"
              aria-label="Testimonio anterior"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-0 md:-right-12 transform -translate-y-1/2 translate-x-4 md:translate-x-12 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 z-10"
              aria-label="Siguiente testimonio"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Sección "Descarga la App" */}
      <section className="bg-[#fef2f9]">
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Lleva a Doña Repartos contigo</h2>
              <p className="text-gray-600 text-lg">
                Pide tu comida favorita desde cualquier lugar. Descarga la app y ten el sabor de tu barrio en la palma de tu mano.
              </p>
              <div className="flex justify-center md:justify-start space-x-4 mt-8">
                <a href="#" className="bg-black text-white py-3 px-6 rounded-lg flex items-center hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.333 3.003c-2.22-2.213-5.32-2.61-7.836-1.04-2.523 1.573-4.52 4.14-4.52 7.233 0 2.22.9 4.673 2.303 6.41.97 1.203 2.11 2.323 3.51 3.253.07.043.15.063.22.063.07 0 .15-.02.21-.053 2.2-1.12 3.82-2.64 4.96-4.14 1.3-1.743 2.02-3.863 2.02-5.943 0-2.89-1.63-5.463-3.887-7.23zM12.003 15.683c-1.88 0-3.41-1.52-3.41-3.39s1.53-3.39 3.41-3.39c1.88 0 3.41 1.52 3.41 3.39s-1.53 3.39-3.41 3.39z" /></svg>
                  <div>
                    <span className="text-xs">Descargar en la</span>
                    <span className="block font-semibold">App Store</span>
                  </div>
                </a>
                <a href="#" className="bg-black text-white py-3 px-6 rounded-lg flex items-center hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M3 2v20l18-10L3 2zm4.82 8.42L15.36 12l-7.54 1.58.01-3.16z" /></svg>
                  <div>
                    <span className="text-xs">DISPONIBLE EN</span>
                    <span className="block font-semibold">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-[300px] h-[600px]">
                <Image
                  src="https://placehold.co/300x600/FFFFFF/333333?text=App+Screenshot"
                  alt="Captura de pantalla de la app Doña Repartos"
                  fill
                  className="rounded-2xl shadow-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

