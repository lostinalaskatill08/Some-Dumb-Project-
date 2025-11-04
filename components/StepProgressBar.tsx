import React from 'react';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center text-center w-20">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    isCompleted ? 'bg-green-600 text-white' : isCurrent ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 ring-2 ring-green-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <p className={`mt-2 text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                    isCompleted || isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                }`}>{label}</p>
              </div>
              {stepNumber < totalSteps && (
                <div className={`flex-1 h-1 mx-2 sm:mx-4 transition-colors duration-300 rounded ${isCompleted ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressBar;