'use client';

import { useState, useActionState, useEffect, useRef, useTransition } from 'react';
import { createUserProfile, CreateUserState } from '@/actions/admin/create-user';
import { LoadingSpinner } from '@/components/ui';
import { CountryCodeSelector } from '@/components/ui/CountryCodeSelector';
import AddressAutocompleteRestaurant from '@/components/AddressAutocompleteRestaurant';
import { User, Store, Bike, CheckCircle, AlertCircle, XCircle, Loader2, MapPin, Copy, X, Eye, EyeOff } from 'lucide-react';
import { useRestaurantValidation, ValidationStatus } from '@/lib/hooks/useRestaurantValidation';

const initialState: CreateUserState = {
    message: '',
};

export default function CreateProfilePage() {
    const [state, formAction, isPending] = useActionState(createUserProfile, initialState);
    const [isPendingTransition, startTransition] = useTransition();

    // UI States
    const [role, setRole] = useState<'client' | 'restaurant' | 'delivery_agent'>('client');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Controlled inputs for validation & reset
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+52');
    const [password, setPassword] = useState('');
    const [restaurantName, setRestaurantName] = useState('');

    // Address state
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [placeId, setPlaceId] = useState('');
    const [structuredAddress, setStructuredAddress] = useState<any>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerInstanceRef = useRef<any>(null);

    // Validation hooks
    const emailStatus = useRestaurantValidation('email', email);
    const fullPhone = `${countryCode}${phoneNumber}`;
    const phoneStatus = useRestaurantValidation('phone', fullPhone);
    const restaurantNameStatus = useRestaurantValidation('restaurantName', role === 'restaurant' ? restaurantName : '');

    // Reset form on success
    useEffect(() => {
        if (state.success) {
            setShowSuccessModal(true);
            setShowConfirmation(false);

            // Reset form fields
            setName('');
            setEmail('');
            setPhoneNumber('');
            setPassword('');
            setRestaurantName('');
            setAddress('');
            setCoordinates(null);
            setPlaceId('');
            setStructuredAddress(null);
            if (formRef.current) formRef.current.reset();
        }
    }, [state.success]);

    // Initialize map when coordinates change
    useEffect(() => {
        if (!coordinates) {
            // Reset refs if coordinates are cleared so we create a new map instance
            // when the map div is re-rendered
            mapInstanceRef.current = null;
            markerInstanceRef.current = null;
            return;
        }

        if (coordinates && mapRef.current && window.google && window.google.maps) {
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: coordinates,
                    zoom: 15,
                    disableDefaultUI: false, // Enable default UI to allow controls
                    gestureHandling: 'cooperative',
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                });

                markerInstanceRef.current = new window.google.maps.Marker({
                    position: coordinates,
                    map: mapInstanceRef.current,
                    draggable: true,
                    animation: window.google.maps.Animation.DROP,
                });

                // Listener for drag end to update coordinates
                markerInstanceRef.current.addListener('dragend', (event: any) => {
                    const newLat = event.latLng.lat();
                    const newLng = event.latLng.lng();
                    setCoordinates({ lat: newLat, lng: newLng });
                });
            } else {
                mapInstanceRef.current.setCenter(coordinates);
                markerInstanceRef.current.setPosition(coordinates);
            }
        }
    }, [coordinates]);

    // Form validity
    const isFormValid = () => {
        if (!name || !email || !password || password.length < 6) return false;
        if (emailStatus === 'invalid' || emailStatus === 'checking') return false;
        if (phoneStatus === 'invalid' || phoneStatus === 'checking') return false;
        if (role === 'restaurant') {
            if (restaurantNameStatus === 'invalid' || restaurantNameStatus === 'checking') return false;
            // if (!address || !coordinates) return false; // Optional: Enforce address validation
        }
        return true;
    };

    const renderValidationIcon = (status: ValidationStatus) => {
        if (status === 'checking') return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
        if (status === 'valid') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (status === 'invalid') return <XCircle className="h-5 w-5 text-red-500" />;
        return null;
    };

    const renderValidationMessage = (status: ValidationStatus, fieldName: string) => {
        if (status === 'invalid') {
            return <p className="mt-1 text-sm text-red-500">{fieldName} no disponible o inválido.</p>;
        }
        return null;
    };

    const handleAddressChange = (newAddress: string, placeData?: any) => {
        setAddress(newAddress);
        if (placeData) {
            setPlaceId(placeData.placeId);
            if (placeData.coordinates) {
                setCoordinates(placeData.coordinates);
            }
            if (placeData.structuredAddress) {
                setStructuredAddress(placeData.structuredAddress);
            }
        } else {
            // Reset if cleared or invalid
            setCoordinates(null);
            setPlaceId('');
            setStructuredAddress(null);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isFormValid()) {
            setShowConfirmation(true);
        }
    };

    const confirmAndSubmit = () => {
        if (formRef.current) {
            const formData = new FormData(formRef.current);
            // Ensure controlled values are current (explicit override for safety)
            // Especially coordinate updates from drag events which might not propagate to hidden inputs automatically if not re-rendered 
            if (coordinates) {
                formData.set('latitude', coordinates.lat.toString());
                formData.set('longitude', coordinates.lng.toString());
            }
            startTransition(() => {
                formAction(formData);
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Crear Nuevo Perfil</h1>

            <div className="bg-card border border-border shadow rounded-lg overflow-hidden">
                <div className="p-6">
                    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6">

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Perfil</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('client')}
                                    className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${role === 'client'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <User className="h-6 w-6 mr-2" />
                                    <span className="font-medium">Cliente</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('restaurant')}
                                    className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${role === 'restaurant'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <Store className="h-6 w-6 mr-2" />
                                    <span className="font-medium">Restaurante</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('delivery_agent')}
                                    className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${role === 'delivery_agent'
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <Bike className="h-6 w-6 mr-2" />
                                    <span className="font-medium">Repartidor</span>
                                </button>
                            </div>
                            <input type="hidden" name="role" value={role} />
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <div className="relative mt-1">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${emailStatus === 'invalid'
                                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white'
                                            }`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        {renderValidationIcon(emailStatus)}
                                    </div>
                                </div>
                                {renderValidationMessage(emailStatus, 'Email')}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                                <div className="relative mt-1 flex rounded-md shadow-sm">
                                    <CountryCodeSelector
                                        value={countryCode}
                                        onChange={setCountryCode}
                                        className="border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700"
                                    />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        className={`block w-full rounded-none rounded-r-md sm:text-sm p-2 border ${phoneStatus === 'invalid'
                                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white'
                                            }`}
                                        placeholder="1234567890"
                                    />
                                    <input type="hidden" name="phone" value={fullPhone} />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        {renderValidationIcon(phoneStatus)}
                                    </div>
                                </div>
                                {renderValidationMessage(phoneStatus, 'Teléfono')}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 pr-10 border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Role Specific Fields */}
                        {role === 'restaurant' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalles del Restaurante</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Restaurante</label>
                                    <div className="relative mt-1">
                                        <input
                                            type="text"
                                            name="restaurantName"
                                            required
                                            value={restaurantName}
                                            onChange={(e) => setRestaurantName(e.target.value)}
                                            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${restaurantNameStatus === 'invalid'
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white'
                                                }`}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            {renderValidationIcon(restaurantNameStatus)}
                                        </div>
                                    </div>
                                    {renderValidationMessage(restaurantNameStatus, 'Nombre del restaurante')}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección del Restaurante</label>
                                    <div className="relative">
                                        <AddressAutocompleteRestaurant
                                            value={address}
                                            onChange={handleAddressChange}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 pr-10 border"
                                            placeholder="Busca la dirección..."
                                        />
                                        {address && (
                                            <button
                                                type="button"
                                                onClick={() => handleAddressChange('')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 z-10"
                                            >
                                                <X className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                    <input type="hidden" name="address" value={address} />
                                    <input type="hidden" name="latitude" value={coordinates?.lat || ''} />
                                    <input type="hidden" name="longitude" value={coordinates?.lng || ''} />
                                    <input type="hidden" name="placeId" value={placeId} />
                                    <input type="hidden" name="address_structured" value={JSON.stringify(structuredAddress)} />
                                </div>

                                {coordinates && (
                                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-64 relative"> {/* Increased height */}
                                        <div ref={mapRef} className="w-full h-full" />
                                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded text-xs font-medium shadow-md z-10 text-gray-700 dark:text-gray-200 pointer-events-none">
                                            Arrastra el pin para ajustar
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {role === 'delivery_agent' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalles del Vehículo</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Vehículo</label>
                                    <select
                                        name="vehicleType"
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border"
                                    >
                                        <option value="motocicleta">Motocicleta</option>
                                        <option value="bicicleta">Bicicleta</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {state.message && !state.success && (
                            <div className="rounded-md p-4 bg-red-50 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                            {state.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button Trigger */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isPending || isPendingTransition || !isFormValid()}
                                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isPending || isPendingTransition ? (
                                    <>
                                        <LoadingSpinner isLoading={true} className="h-4 w-4 mr-2" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Crear Perfil'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-500">
                            <AlertCircle className="h-6 w-6" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Creación</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            ¿Estás seguro de que deseas crear este perfil? Verifica que todos los datos sean correctos.
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md text-sm space-y-1">
                            <p><span className="font-semibold">Nombre:</span> {name}</p>
                            <p><span className="font-semibold">Email:</span> {email}</p>
                            <p><span className="font-semibold">Rol:</span> {role === 'client' ? 'Cliente' : role === 'restaurant' ? 'Restaurante' : 'Repartidor'}</p>
                            {role === 'restaurant' && <p><span className="font-semibold">Restaurante:</span> {restaurantName}</p>}
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAndSubmit}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
                            >
                                Confirmar y Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-300 border-t-4 border-green-500">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2 text-green-600 dark:text-green-500">
                                <CheckCircle className="h-7 w-7" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Usuario Creado!</h3>
                            </div>
                            <button onClick={() => setShowSuccessModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300">
                            El perfil se ha creado exitosamente. Comparte las siguientes credenciales con el usuario:
                        </p>

                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                                    <div className="flex items-center justify-between mt-1">
                                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{state.email}</code>
                                        <button onClick={() => copyToClipboard(state.email || '')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contraseña</label>
                                    <div className="flex items-center justify-between mt-1">
                                        <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{state.password}</code>
                                        <button onClick={() => copyToClipboard(state.password || '')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
