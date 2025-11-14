// components/registration/customer/RestaurantDiscoveryStep.tsx
"use client";

import { useState, useEffect } from 'react';
import { StepProps } from '@/components/forms/StepperForm';
import { Card, CardContent, Badge } from '@/components/ui';
import ErrorMessage from '@/components/ErrorMessage';

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  minimum_order: number;
  image_url: string;
  distance: number;
  is_open: boolean;
  featured_items: string[];
}

interface DiscoveryData {
  nearbyRestaurants: Restaurant[];
  favoriteRestaurants: string[];
  preferredCuisines: string[];
  discoveryCompleted: boolean;
}

const SAMPLE_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Tacos El Güero',
    cuisine_type: 'Mexicana',
    rating: 4.8,
    delivery_time: '20-30 min',
    delivery_fee: 15,
    minimum_order: 80,
    image_url: '/api/placeholder/300/200',
    distance: 0.8,
    is_open: true,
    featured_items: ['Tacos al Pastor', 'Quesadillas', 'Tortas']
  },
  {
    id: '2',
    name: 'Pizza Napolitana',
    cuisine_type: 'Italiana',
    rating: 4.6,
    delivery_time: '25-35 min',
    delivery_fee: 20,
    minimum_order: 120,
    image_url: '/api/placeholder/300/200',
    distance: 1.2,
    is_open: true,
    featured_items: ['Pizza Margherita', 'Lasagna', 'Tiramisu']
  },
  {
    id: '3',
    name: 'Sushi Zen',
    cuisine_type: 'Japonesa',
    rating: 4.9,
    delivery_time: '30-40 min',
    delivery_fee: 25,
    minimum_order: 150,
    image_url: '/api/placeholder/300/200',
    distance: 2.1,
    is_open: false,
    featured_items: ['Sashimi', 'Rolls Especiales', 'Ramen']
  },
  {
    id: '4',
    name: 'Burger House',
    cuisine_type: 'Americana',
    rating: 4.4,
    delivery_time: '15-25 min',
    delivery_fee: 18,
    minimum_order: 100,
    image_url: '/api/placeholder/300/200',
    distance: 0.5,
    is_open: true,
    featured_items: ['Hamburguesas Gourmet', 'Papas Fritas', 'Malteadas']
  },
  {
    id: '5',
    name: 'Comida China Express',
    cuisine_type: 'China',
    rating: 4.3,
    delivery_time: '20-30 min',
    delivery_fee: 12,
    minimum_order: 90,
    image_url: '/api/placeholder/300/200',
    distance: 1.5,
    is_open: true,
    featured_items: ['Pollo Agridulce', 'Chow Mein', 'Dumplings']
  }
];

const CUISINE_TYPES = [
  'Mexicana', 'Italiana', 'Japonesa', 'China', 'Americana', 
  'India', 'Tailandesa', 'Mediterránea', 'Vegetariana', 'Postres'
];

export default function RestaurantDiscoveryStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  errors,
}: StepProps) {
  const [formData, setFormData] = useState<DiscoveryData>({
    nearbyRestaurants: data.nearbyRestaurants || SAMPLE_RESTAURANTS,
    favoriteRestaurants: data.favoriteRestaurants || [],
    preferredCuisines: data.preferredCuisines || [],
    discoveryCompleted: data.discoveryCompleted || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const toggleFavoriteRestaurant = (restaurantId: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteRestaurants: prev.favoriteRestaurants.includes(restaurantId)
        ? prev.favoriteRestaurants.filter(id => id !== restaurantId)
        : [...prev.favoriteRestaurants, restaurantId]
    }));
  };

  const togglePreferredCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      preferredCuisines: prev.preferredCuisines.includes(cuisine)
        ? prev.preferredCuisines.filter(c => c !== cuisine)
        : [...prev.preferredCuisines, cuisine]
    }));
  };

  const filteredRestaurants = formData.nearbyRestaurants.filter(restaurant => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'open') return restaurant.is_open;
    if (selectedFilter === 'fast') return parseInt(restaurant.delivery_time.split('-')[0]) <= 20;
    return restaurant.cuisine_type.toLowerCase() === selectedFilter.toLowerCase();
  });

  const handleNext = () => {
    setFormData(prev => ({ ...prev, discoveryCompleted: true }));
    onNext();
  };

  const handleSkipDiscovery = () => {
    setFormData(prev => ({ ...prev, discoveryCompleted: true }));
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Descubre Restaurantes Cerca de Ti
        </h2>
        <p className="text-gray-600">
          Explora los mejores restaurantes en tu área y marca tus favoritos
        </p>
      </div>

      {/* Cuisine Preferences */}
      <Card variant="default">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ¿Qué tipo de comida te gusta? (Opcional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona tus tipos de cocina favoritos para recibir mejores recomendaciones
          </p>
          
          <div className="flex flex-wrap gap-2">
            {CUISINE_TYPES.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => togglePreferredCuisine(cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.preferredCuisines.includes(cuisine)
                    ? 'bg-[#e4007c] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
          
          {formData.preferredCuisines.length > 0 && (
            <p className="text-sm text-green-600 mt-3">
              ✓ {formData.preferredCuisines.length} tipo{formData.preferredCuisines.length !== 1 ? 's' : ''} de cocina seleccionado{formData.preferredCuisines.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Restaurant Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-[#e4007c] text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedFilter('open')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'open'
              ? 'bg-[#e4007c] text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Abiertos ahora
        </button>
        <button
          onClick={() => setSelectedFilter('fast')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'fast'
              ? 'bg-[#e4007c] text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Entrega rápida
        </button>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Card key={restaurant.id} variant="default" className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {/* Restaurant Image */}
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {!restaurant.is_open && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-white text-gray-900">
                      Cerrado
                    </Badge>
                  </div>
                )}
                
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavoriteRestaurant(restaurant.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                    formData.favoriteRestaurants.includes(restaurant.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <CardContent className="p-4">
                {/* Restaurant Info */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{restaurant.rating}</span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>{restaurant.delivery_time}</span>
                  <span>${restaurant.delivery_fee} envío</span>
                  <span>Min. ${restaurant.minimum_order}</span>
                </div>

                {/* Distance */}
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {restaurant.distance} km de distancia
                </div>

                {/* Featured Items */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Platillos populares:</p>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.featured_items.slice(0, 3).map((item, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {(formData.favoriteRestaurants.length > 0 || formData.preferredCuisines.length > 0) && (
        <Card variant="default" className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-900 mb-2">
                  ¡Excelente! Hemos personalizado tu experiencia
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  {formData.favoriteRestaurants.length > 0 && (
                    <li>• {formData.favoriteRestaurants.length} restaurante{formData.favoriteRestaurants.length !== 1 ? 's' : ''} marcado{formData.favoriteRestaurants.length !== 1 ? 's' : ''} como favorito{formData.favoriteRestaurants.length !== 1 ? 's' : ''}</li>
                  )}
                  {formData.preferredCuisines.length > 0 && (
                    <li>• {formData.preferredCuisines.length} tipo{formData.preferredCuisines.length !== 1 ? 's' : ''} de cocina preferido{formData.preferredCuisines.length !== 1 ? 's' : ''}</li>
                  )}
                  <li>• Recibirás recomendaciones personalizadas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {errors?.general && <ErrorMessage message={errors.general} />}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSkipDiscovery}
            className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Omitir por ahora
          </button>
          
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors font-medium"
          >
            ¡Listo para pedir!
          </button>
        </div>
      </div>
    </div>
  );
}