

import React from 'react';
import type { AnalysisContent } from '../../types';
import { DocumentCheckIcon, DownloadIcon } from '../Icons';
import AnalysisSources from '../AnalysisSources';

interface Step4PermittingProps {
  result: AnalysisContent;
  loading: boolean;
  error: string | null;
}

// Simple markdown formatter
const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold text-slate-800 dark:text-white mt-6 mb-3 border-b border-slate-300 dark:border-slate-600 pb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            const boldText = line.replace(/\*\*/g, '');
            const parts = boldText.split(':');
            const title = parts[0];
            const content = parts.slice(1).join(':');
            return <p key={index} className="my-1"><strong className="text-slate-800 dark:text-slate-200">{title}:</strong>{content}</p>;
        }
        if (line.match(/^\s*-\s/)) { // Handles bullet points
            return <li key={index} className="ml-5 list-disc text-slate-600 dark:text-slate-300 mb-2">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        if (line.match(/^\d+\.\s/)) { // Handles numbered lists
            return <li key={index} className="ml-5 list-decimal text-slate-600 dark:text-slate-300 mb-2">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        return <p key={index} className="text-slate-600 dark:text-slate-300 mb-2">{line}</p>;
    });
};

const Step4Permitting: React.FC<Step4PermittingProps> = ({ result, loading, error }) => {
  const handlePrint = () => {
    document.body.classList.add('print-pack');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-pack');
    }, 500);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <DocumentCheckIcon className="w-10 h-10 text-green-500" />
        <div>
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Permitting & Local Regulations</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              The AI has researched local regulations for your area. This information will be used to guide the technology analysis in the next step.
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
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Researching Local Permitting Rules...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
            </div>
        ) : (
          <div className="prose prose-green dark:prose-invert max-w-none">
            {formatMarkdown(result.text)}
            <AnalysisSources sources={result.sources} />

            {!loading && result.text && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg border-2 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/50 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <DownloadIcon className="w-6 h-6" />
                  Export Permitting Guide
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4Permitting;