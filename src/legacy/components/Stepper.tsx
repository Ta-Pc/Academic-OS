import React from 'react';
import { Icon } from './ui/Icon';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-blue-600 text-white scale-110' : isCompleted ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Icon name="Check" className="w-6 h-6" strokeWidth={2} />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <p className={`mt-2 text-xs text-center font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{step}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-auto border-t-2 transition-all duration-300 mx-4 ${isCompleted ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;