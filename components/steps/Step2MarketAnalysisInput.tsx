
import React from 'react';
import type { FormData, FormErrors } from '../../types';
import { EnergySource } from '../../types';

interface Step2MarketAnalysisInputProps {
  formData: FormData;
  onDataChange: (field: keyof FormData, value: any) => void;
  errors: FormErrors;
}

const energySources = Object.values(EnergySource);

const Step2MarketAnalysisInput: React.FC<Step2MarketAnalysisInputProps> = ({ formData, onDataChange, errors }) => {

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Market Focus</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Select the primary green energy technology you are selling or consulting for in <strong>{formData.location}</strong>.</p>
      </div>
      
      <div className="mt-6">
        <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">Which technology do you represent?</label>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {energySources.map(source => (
            <div
              key={source}
              onClick={() => onDataChange('sellingTechnology', source)}
              className={`p-3 border rounded-lg cursor-pointer text-center font-medium transition-all duration-200 ${
                formData.sellingTechnology === source
                  ? 'bg-green-50 dark:bg-green-900/50 border-green-500 ring-2 ring-green-500 text-green-800 dark:text-green-200 shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              {source}
            </div>
          ))}
        </div>
        {errors.sellingTechnology && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.sellingTechnology}</p>}
      </div>
    </div>
  );
};

export default Step2MarketAnalysisInput;