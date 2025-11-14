// components/registration/customer/AddressSetupStep.tsx
"use client";

import { useState, useEffect } from 'react';
import { StepProps } from '@/components/forms/StepperForm';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import FormField from '@/components/FormField';
import { Card, CardContent, Badge } from '@/components/ui';
import ErrorMessage from '@/components/ErrorMessage';
import type { Address } from '@/types/address';

interface AddressData {
  primaryAddress: Address | null;
  additionalAddresses: Address[];
  deliveryInstructions: string;
  addressLabel: string;
}

interface SavedAddress extends Address {
  id: string;
  label: string;
  instructions?: string;
  isDefault: boolean;
}

export default function AddressSetupStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  errors,
}: StepProps) {
  const [formData, setFormData] = useState<AddressData>({
    primaryAddress: data.primaryAddress || null,
    additionalAddresses: data.additionalAddresses || [],
    deliveryInstructions: data.deliveryInstructions || '',
    addressLabel: data.addressLabel || 'Casa',
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(!formData.primaryAddress);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleAddressSelect = (address: Address) => {
    setFormData(prev => ({
      ...prev,
      primaryAddress: address,
    }));
    setShowAddressForm(false);
    
    if (localErrors.primaryAddress) {
      setLocalErrors(prev => ({ ...prev, primaryAddress: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addAddress = () => {
    if (formData.primaryAddress) {
      const newAddress: SavedAddress = {
        ...formData.primaryAddress,
        id: Date.now().toString(),
        label: formData.addressLabel,
        instructions: formData.deliveryInstructions,
        isDefault: savedAddresses.length === 0,
      };
      
      setSavedAddresses(prev => [...prev, newAddress]);
      
      // Reset form for next address
      setFormData(prev => ({
        ...prev,
        primaryAddress: null,
        deliveryInstructions: '',
        addressLabel: 'Casa',
      }));
      setShowAddressForm(true);
    }
  };

  const removeAddress = (addressId: string) => {
    setSavedAddresses(prev => prev.filter(addr => addr.id !== addressId));
  };

  const setDefaultAddress = (addressId: string) => {
    setSavedAddresses(prev => 
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.primaryAddress && savedAddresses.length === 0) {
      newErrors.primaryAddress = 'Debes agregar al menos una dirección';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Include saved addresses in the data
      const finalData = {
        ...formData,
        savedAddresses,
        primaryAddress: savedAddresses.find(addr => addr.isDefault) || savedAddresses[0] || formData.primaryAddress,
      };
      onDataChange(finalData);
      onNext();
    }
  };

  const canProceed = formData.primaryAddress || savedAddresses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configuración de Direcciones
        </h2>
        <p className="text-gray-600">
          Agrega tus direcciones de entrega para recibir tus pedidos
        </p>
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <Card variant="default">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Direcciones Guardadas
            </h3>
            <div className="space-y-3">
              {savedAddresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{address.label}</h4>
                      {address.isDefault && (
                        <Badge variant="primary" size="sm">
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{address.address}</p>
                    {address.instructions && (
                      <p className="text-xs text-gray-500">
                        Instrucciones: {address.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!address.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(address.id)}
                        className="text-xs text-[#e4007c] hover:text-[#c6006b] font-medium"
                      >
                        Hacer principal
                      </button>
                    )}
                    <button
                      onClick={() => removeAddress(address.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Address */}
      {showAddressForm && (
        <Card variant="default">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {savedAddresses.length === 0 ? 'Dirección Principal' : 'Agregar Nueva Dirección'}
              </h3>
              {savedAddresses.length > 0 && (
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Address Search */}
            <div>
              <AddressAutocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                onAddressSelect={handleAddressSelect}
                label="Buscar Dirección"
                placeholder="Empieza a escribir tu dirección..."
                error={localErrors.primaryAddress || errors?.primaryAddress}
                required
              />
              {!formData.primaryAddress && (
                <p className="text-xs text-gray-500 mt-1">
                  Empieza a escribir para ver opciones de direcciones
                </p>
              )}
              {formData.primaryAddress && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-1">
                    ✓ Dirección seleccionada
                  </p>
                  <p className="text-sm text-green-700">
                    {formData.primaryAddress.address}
                  </p>
                </div>
              )}
            </div>

            {/* Address Label */}
            {formData.primaryAddress && (
              <>
                <div>
                  <label htmlFor="addressLabel" className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta de la Dirección
                  </label>
                  <select
                    name="addressLabel"
                    id="addressLabel"
                    value={formData.addressLabel}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900"
                  >
                    <option value="Casa">🏠 Casa</option>
                    <option value="Trabajo">🏢 Trabajo</option>
                    <option value="Escuela">🎓 Escuela</option>
                    <option value="Gimnasio">💪 Gimnasio</option>
                    <option value="Otro">📍 Otro</option>
                  </select>
                </div>

                {/* Delivery Instructions */}
                <div>
                  <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones de Entrega (Opcional)
                  </label>
                  <textarea
                    name="deliveryInstructions"
                    id="deliveryInstructions"
                    value={formData.deliveryInstructions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ej: Tocar el timbre, dejar en la puerta, edificio azul..."
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900 placeholder-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ayuda al repartidor a encontrarte más fácilmente
                  </p>
                </div>

                {/* Add Address Button */}
                <button
                  onClick={addAddress}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#e4007c] hover:text-[#e4007c] transition-colors"
                >
                  + Guardar esta dirección
                </button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Another Address Button */}
      {!showAddressForm && savedAddresses.length > 0 && (
        <button
          onClick={() => setShowAddressForm(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#e4007c] hover:text-[#e4007c] transition-colors"
        >
          + Agregar otra dirección
        </button>
      )}

      {/* Benefits Info */}
      <Card variant="default" className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                ¿Por qué agregar múltiples direcciones?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pide desde casa, trabajo o cualquier lugar</li>
                <li>• Checkout más rápido en futuros pedidos</li>
                <li>• Instrucciones específicas para cada ubicación</li>
                <li>• Cambia fácilmente entre direcciones</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}