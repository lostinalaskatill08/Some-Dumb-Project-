
import React from 'react';
import type { FormData, AnalysisResults, LoadingStates } from '../types';
import Step3Analysis from './steps/Step3Analysis';
import Step4Summary from './steps/Step4Summary';
import Step6Financing from './steps/Step6Financing';
import Step6FinalReport from './steps/Step6FinalReport';

interface SharedReportProps {
  sharedData: {
    formData: FormData;
    analysisResults: AnalysisResults;
  };
}

const SharedReport: React.FC<SharedReportProps> = ({ sharedData }) => {
  const { formData, analysisResults } = sharedData;

  const startNewAnalysis = () => {
    // Navigates to the base URL, clearing the share parameter
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 py-4 px-6 -mx-6 rounded-b-lg border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Green Energy Analysis Report
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For: {formData.location}
            </p>
          </div>
          <button
            onClick={startNewAnalysis}
            className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Create Your Own Analysis
          </button>
        </header>

        <main className="space-y-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Step4Summary summary={analysisResults.summary} loading={false} error={null} onStartConversation={() => {}} />
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                {/* FIX: Cast the dynamically created loadingStates object to the `LoadingStates` type to satisfy the prop type requirement. */}
                <Step3Analysis results={analysisResults} loadingStates={Object.keys(analysisResults).reduce((acc, key) => ({...acc, [key]: false}), {}) as LoadingStates} error={null} formData={formData} onDataChange={()=>{}} />
            </div>
             <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Step6Financing result={analysisResults.financing} loading={false} error={null} />
            </div>
             <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Step6FinalReport result={analysisResults.finalReport} loading={false} error={null} shareData={{formData, analysisResults}} />
            </div>
        </main>
      </div>
    </div>
  );
};

export default SharedReport;