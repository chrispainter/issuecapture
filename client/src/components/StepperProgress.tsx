import React from 'react';

interface StepperProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const StepperProgress: React.FC<StepperProgressProps> = ({ 
  currentStep, 
  totalSteps,
  stepTitles 
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{stepTitles[currentStep - 1]}</h2>
        <div className="text-sm text-neutral-500">Step {currentStep} of {totalSteps}</div>
      </div>
      <div className="mt-2 h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#0052CC] rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default StepperProgress;
