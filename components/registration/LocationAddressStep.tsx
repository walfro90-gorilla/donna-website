// components/registration/LocationAddressStep.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, Alert, Badge } from '@/components/ui';
import AddressAutocomplete from '@/components/AddressAutocomplete';

export interface LocationAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  formattedAddress?: string;
  addressType: 'commercial' | 'residential' | 'mixed';
  hasParking: boolean;
  parkingSpaces?: number;
  hasDeliveryAccess: boolean;
  deliveryInstructions?: string;
  landmarks?: string;
  isVisible: boolean;
  operatingZones?: string[];
}

export interface LocationAddressStepProps {
  data: Partial<LocationAddress>;
  onDataChange: (data: Partial<LocationAddress>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

const ADDRESS_TYPES = [
  { id: 'commercial', name: 'Comercial', description: 'Local comercial o plaza' },
  { id: 'residential', name: 'Residencial', description: 'Casa o departamento' },
  { id: 'mixed', name: 'Mixto', description: 'Zona comercial-residencial' }
];

const OPERATING_ZONES = [
  'Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Zona Rosa', 'Polanco', 
  'Condesa', 'Roma', 'Coyoacán', 'Satelite', 'Interlomas', 'Santa Fe'
];

export default function LocationAddressStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading = false,
  errors = {}
}: LocationAddressStepProps) {
  const [localData, setLocalData] = useState<Partial<LocationAddress>>(data);
  const [selectedZones, setSelectedZones] = useState<string[]>(data.operatingZones || []);
  const [customZone, setCustomZone] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleInputChange = useCallback((field: keyof LocationAddress, value: any) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  }, [localData, onDataChange]);

  const handleAddressSelect = useCallback((address: any) => {
    const updatedData = {
      ...localData,
      street: address.street || '',
      number: address.number || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'México',
      coordinates: address.coordinates,
      placeId: address.placeId,
      formattedAddress: address.formattedAddress
    };
    setLocalData(updatedData);
    onDataChange(updatedData);
  }, [localData, onDataChange]);

  const handleZoneToggle = useCallback((zone: string) => {
    const newZones = selectedZones.includes(zone)
      ? selectedZones.filter(z => z !== zone)
      : [...selectedZones, zone];
    
    setSelectedZones(newZones);
    handleInputChange('operatingZones', newZones);
  }, [selectedZones, handleInputChange]);

  const handleAddCustomZone = useCallback(() => {
    if (customZone.trim() && !selectedZones.includes(customZone.trim())) {
      const newZones = [...selectedZones, customZone.trim()];
      setSelectedZones(newZones);
      handleInputChange('operatingZones', newZones);
      setCustomZone('');
    }
  }, [customZone, selectedZones, handleInputChange]);

  const validateForm = useCallback((): boolean => {
    const requiredFields = ['street', 'neighborhood', 'city', 'state', 'postalCode'];
    return requiredFields.every(field => localData[field as keyof LocationAddress]);
  }, [localData]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      onNext();
    }
  }, [validateForm, onNext]);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if ((window as any).google) {
      setMapLoaded(true);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ubicación del Restaurante
        </h2>
        <p className="text-gray-600">
          Proporciona la dirección exacta donde se encuentra tu negocio
        </p>
      </div>

      {/* Address Search */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Buscar Dirección
        </h3>
        
        {mapLoaded ? (
          <div className="mb-4">
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
              placeholder="Busca tu dirección (ej: Av. Insurgentes Sur 123, Roma Norte)"
            />
          </div>
        ) : (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        )}

        {localData.formattedAddress && (
          <Alert variant="success" className="mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="font-medium">Dirección encontrada:</p>
                <p className="text-sm">{localData.formattedAddress}</p>
              </div>
            </div>
          </Alert>
        )}
      </Card>

      {/* Manual Address Entry */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalles de la Dirección
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
              Calle *
            </label>
            <input
              type="text"
              id="street"
              value={localData.street || ''}
              onChange={(e) => handleInputChange('street', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.street ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Av. Insurgentes Sur"
            />
            {errors.street && (
              <p className="mt-1 text-sm text-red-600">{errors.street}</p>
            )}
          </div>

          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
              Número
            </label>
            <input
              type="text"
              id="number"
              value={localData.number || ''}
              onChange={(e) => handleInputChange('number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="123"
            />
          </div>

          <div>
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
              Colonia *
            </label>
            <input
              type="text"
              id="neighborhood"
              value={localData.neighborhood || ''}
              onChange={(e) => handleInputChange('neighborhood', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.neighborhood ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Roma Norte"
            />
            {errors.neighborhood && (
              <p className="mt-1 text-sm text-red-600">{errors.neighborhood}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad *
            </label>
            <input
              type="text"
              id="city"
              value={localData.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.city ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Ciudad de México"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <input
              type="text"
              id="state"
              value={localData.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.state ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="CDMX"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
              Código Postal *
            </label>
            <input
              type="text"
              id="postalCode"
              value={localData.postalCode || ''}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.postalCode ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="06700"
              maxLength={5}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Address Type & Characteristics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Características del Local
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Ubicación
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ADDRESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleInputChange('addressType', type.id)}
                  className={`
                    p-4 text-left border rounded-lg transition-colors
                    ${localData.addressType === type.id
                      ? 'border-[#e4007c] bg-[#fef2f9] text-[#e4007c]'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-[#e4007c]'
                    }
                  `}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm opacity-75">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localData.hasParking || false}
                  onChange={(e) => handleInputChange('hasParking', e.target.checked)}
                  className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Tiene estacionamiento
                </span>
              </label>
              
              {localData.hasParking && (
                <div className="mt-2">
                  <input
                    type="number"
                    value={localData.parkingSpaces || ''}
                    onChange={(e) => handleInputChange('parkingSpaces', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                    placeholder="Número de espacios"
                    min="1"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localData.hasDeliveryAccess || false}
                  onChange={(e) => handleInputChange('hasDeliveryAccess', e.target.checked)}
                  className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Acceso fácil para delivery
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localData.isVisible || false}
                  onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                  className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Visible desde la calle
                </span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Instrucciones para Delivery
            </label>
            <textarea
              id="deliveryInstructions"
              value={localData.deliveryInstructions || ''}
              onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Ej: Tocar el timbre, hay portón eléctrico, estacionarse en la esquina..."
              maxLength={300}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(localData.deliveryInstructions || '').length}/300 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="landmarks" className="block text-sm font-medium text-gray-700 mb-2">
              Referencias y Puntos de Interés Cercanos
            </label>
            <input
              type="text"
              id="landmarks"
              value={localData.landmarks || ''}
              onChange={(e) => handleInputChange('landmarks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Ej: Frente al Oxxo, a una cuadra del metro Insurgentes"
              maxLength={200}
            />
          </div>
        </div>
      </Card>

      {/* Operating Zones */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Zonas de Operación
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona las zonas donde realizas entregas (opcional)
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
          {OPERATING_ZONES.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => handleZoneToggle(zone)}
              className={`
                px-3 py-2 text-sm rounded-md border transition-colors
                ${selectedZones.includes(zone)
                  ? 'bg-[#e4007c] text-white border-[#e4007c]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#e4007c] hover:text-[#e4007c]'
                }
              `}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={customZone}
            onChange={(e) => setCustomZone(e.target.value)}
            placeholder="Agregar zona personalizada"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomZone()}
          />
          <button
            type="button"
            onClick={handleAddCustomZone}
            disabled={!customZone.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>

        {selectedZones.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Zonas seleccionadas:</p>
            <div className="flex flex-wrap gap-2">
              {selectedZones.map((zone) => (
                <Badge key={zone} variant="secondary" className="flex items-center space-x-1">
                  <span>{zone}</span>
                  <button
                    type="button"
                    onClick={() => handleZoneToggle(zone)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        {onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
        )}
        
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || !validateForm()}
          className="px-6 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}