import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="px-4 py-2 border-b border-indigo-200/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-indigo-600 font-medium">
          Progress: {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-indigo-600 font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};