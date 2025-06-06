import React from 'react';

export const Header: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md">
            <div className="px-4 py-2.5 flex items-center gap-3">
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-300 rounded-full blur-sm opacity-40 animate-pulse"></div>
                    <img 
                        src="/brain.svg" 
                        alt="Glowing Brain" 
                        className="w-8 h-8 relative z-10 animate-float"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-medium">
                        ConceptCrafterAI
                    </h1>
                    <span className="text-indigo-100 text-sm">|</span>
                    <p className="text-indigo-100 text-sm">Craft Your Vision, Powered by AI</p>
                </div>
            </div>
        </div>
    );
}; 