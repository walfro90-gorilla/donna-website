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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Tu progreso de configuración</h2>
                        <p className="text-sm text-gray-500 mt-1">Completa estos pasos para activar tu restaurante</p>
                    </div>
                    <span className="text-2xl font-bold text-[#e4007c]">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-[#e4007c] h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`flex-shrink-0 ${item.isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                                {item.isCompleted ? (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className={`font-medium ${item.isCompleted ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {item.label}
                                </h3>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-[#e4007c] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
