
import React from 'react';
import type { AnalysisContent } from '../../types';
import { MicrophoneIcon } from '../Icons';

interface Step4Props {
  summary: AnalysisContent;
  loading: boolean;
  error: string | null;
  onStartConversation: () => void;
}

const formatSummary = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            return <p key={index} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>
        }
        if (line.match(/^\d+\./)) {
            return <li key={index} className="ml-5 list-decimal text-gray-600 dark:text-gray-300 mb-2">{line.substring(line.indexOf(' ') + 1)}</li>
        }
        return <p key={index} className="text-gray-600 dark:text-gray-300 mb-2">{line}</p>;
      });
  };

const Step4Summary: React.FC<Step4Props> = ({ summary, loading, error, onStartConversation }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Personalized Summary & Action Plan</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here is your tailored report based on the analysis.
            </p>
        </div>
        {!loading && (
             <button
                onClick={onStartConversation}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                aria-label="Discuss summary with AI"
            >
                <MicrophoneIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Discuss with AI</span>
            </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
      
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[300px]">
        {loading ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Generating Your Custom Report...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment.</p>
            </div>
        ) : (
          <div className="prose prose-green dark:prose-invert max-w-none">
            {formatSummary(summary.text)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4Summary;
