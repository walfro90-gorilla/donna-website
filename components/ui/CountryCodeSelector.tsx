import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const COUNTRY_CODES = [
    { code: '+52', country: 'MX', name: 'México' },
    { code: '+1', country: 'US', name: 'Estados Unidos' },
    { code: '+57', country: 'CO', name: 'Colombia' },
    { code: '+54', country: 'AR', name: 'Argentina' },
    { code: '+56', country: 'CL', name: 'Chile' },
    { code: '+51', country: 'PE', name: 'Perú' },
    { code: '+502', country: 'GT', name: 'Guatemala' },
    { code: '+503', country: 'SV', name: 'El Salvador' },
    { code: '+504', country: 'HN', name: 'Honduras' },
];

interface CountryCodeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function CountryCodeSelector({ value, onChange, className = '' }: CountryCodeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-3.5 bg-transparent outline-none text-gray-900 dark:text-white font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-l-xl transition-colors h-full"
            >
                <div className="relative w-6 h-4 overflow-hidden rounded-sm shadow-sm">
                    <Image
                        src={`https://flagcdn.com/w40/${selectedCountry.country.toLowerCase()}.png`}
                        alt={selectedCountry.country}
                        fill
                        className="object-cover"
                        sizes="24px"
                    />
                </div>
                <span className="text-sm">{selectedCountry.code}</span>
                <svg
                    className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1">
                        {COUNTRY_CODES.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                    onChange(country.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${value === country.code ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                                    }`}
                            >
                                <div className="relative w-6 h-4 overflow-hidden rounded-sm shadow-sm flex-shrink-0">
                                    <Image
                                        src={`https://flagcdn.com/w40/${country.country.toLowerCase()}.png`}
                                        alt={country.country}
                                        fill
                                        className="object-cover"
                                        sizes="24px"
                                    />
                                </div>
                                <span className="text-gray-900 dark:text-white font-medium w-10 flex-shrink-0 text-sm">{country.code}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{country.name}</span>
                                {value === country.code && (
                                    <svg className="w-4 h-4 text-primary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
