import React from 'react';

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    isCompleted: boolean;
    action: () => void;
}

interface OnboardingChecklistProps {
    items: ChecklistItem[];
    completionPercentage: number;
}

export default function OnboardingChecklist({ items, completionPercentage }: OnboardingChecklistProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Tu progreso de configuración</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Completa estos pasos para activar tu restaurante</p>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-extrabold text-primary">{completionPercentage}</span>
                        <span className="text-lg font-bold text-gray-400 ml-1">%</span>
                    </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-primary to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(228,0,124,0.5)] relative"
                        style={{ width: `${completionPercentage}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
                    >
                        <div className="flex items-center space-x-5">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.isCompleted
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                                }`}>
                                {item.isCompleted ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${item.isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors'}`}>
                                    {item.label}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{item.description}</p>
                            </div>
                        </div>
                        <div className={`transform transition-transform duration-200 ${item.isCompleted ? 'text-green-500 opacity-0' : 'text-gray-300 group-hover:text-primary group-hover:translate-x-1'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
