
import React from 'react';
import type { AnalysisContent } from '../../types';
import { FinancingIcon } from '../Icons';
import AnalysisSources from '../AnalysisSources';

interface Step6FinancingProps {
  result: AnalysisContent;
  loading: boolean;
  error: string | null;
}

const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold text-slate-800 dark:text-white mt-6 mb-3 border-b border-slate-300 dark:border-slate-600 pb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            const boldText = line.replace(/\*\*/g, '');
            return <p key={index} className="font-bold my-2">{boldText}</p>
        }
         if (line.match(/^\s*-\s/)) { // Handles bullet points
            return <li key={index} className="ml-5 list-disc text-slate-600 dark:text-slate-300 mb-2">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        // Basic link detection
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(line)) {
            const parts = line.split(urlRegex);
            return (
                <p key={index} className="text-slate-600 dark:text-slate-300 mb-2">
                    {parts.map((part, i) => 
                        i % 2 === 1 
                        ? <a href={part} key={i} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline break-all">{part}</a> 
                        : part
                    )}
                </p>
            );
        }
        return <p key={index} className="text-slate-600 dark:text-slate-300 mb-2">{line}</p>;
    });
};

const Step6Financing: React.FC<Step6FinancingProps> = ({ result, loading, error }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <FinancingIcon className="w-10 h-10 text-green-500" />
        <div>
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Financing Your Green Project</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Here is your personalized guide to grants, incentives, and loans to help you fund your project.
            </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
      
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[400px]">
        {loading ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Finding Personalized Financing Options...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
            </div>
        ) : (
          <>
            <div className="prose prose-green dark:prose-invert max-w-none">
              {formatMarkdown(result.text)}
            </div>
            <AnalysisSources sources={result.sources} />
          </>
        )}
      </div>
    </div>
  );
};

export default Step6Financing;
