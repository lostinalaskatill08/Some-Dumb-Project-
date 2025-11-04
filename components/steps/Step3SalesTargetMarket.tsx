
import React from 'react';
import type { AnalysisContent } from '../../types';
import AnalysisSources from '../AnalysisSources';

interface Step3SalesTargetMarketProps {
  result: AnalysisContent;
  loading: boolean;
  error: string | null;
}

const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3 border-b border-slate-300 dark:border-slate-600 pb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            const boldText = line.replace(/\*\*/g, '');
            return <p key={index}><strong className="text-slate-800 dark:text-slate-200">{boldText.split(':')[0]}:</strong>{boldText.substring(boldText.indexOf(':') + 1)}</p>;
        }
        if (line.match(/^\s*-\s/)) { // Handles bullet points
            return <li key={index} className="ml-5 list-disc text-gray-600 dark:text-gray-300 mb-2">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        return <p key={index} className="text-gray-600 dark:text-gray-300 mb-2">{line}</p>;
    });
};

const Step3SalesTargetMarket: React.FC<Step3SalesTargetMarketProps> = ({ result, loading, error }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Define Target Market</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The AI is analyzing market potential and defining your Ideal Customer Profile (ICP).
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
      
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[400px]">
        {loading ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Analyzing Market & Customers...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment.</p>
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

export default Step3SalesTargetMarket;
