
import React, { useState } from 'react';
import type { AnalysisContent, FormData, AnalysisResults } from '../../types';
import AnalysisSources from '../AnalysisSources';
import { MicrophoneIcon, ShareIcon, ClipboardIcon } from '../Icons';

interface Step6SalesSummaryProps {
  result: AnalysisContent;
  loading: boolean;
  error: string | null;
  onStartConversation: () => void;
  shareData: { formData: FormData, analysisResults: AnalysisResults };
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
        if (line.match(/^\d+\.\s/)) { // Handles numbered lists
            return <li key={index} className="ml-5 list-decimal text-gray-600 dark:text-gray-300 mb-2">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        return <p key={index} className="text-gray-600 dark:text-gray-300 mb-2">{line}</p>;
    });
};

const ShareModal: React.FC<{ shareData: object, onClose: () => void }> = ({ shareData, onClose }) => {
  const [copyStatus, setCopyStatus] = useState('Copy Link');

  const generateLink = () => {
    const dataString = JSON.stringify(shareData);
    const encodedData = btoa(dataString);
    return `${window.location.origin}${window.location.pathname}?share=${encodedData}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLink()).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy Link'), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyStatus('Failed to copy');
    });
  };

  const shareLink = generateLink();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">Share Your Playbook</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Anyone with this link can view a read-only version of this sales playbook.</p>
        <div className="relative">
          <input type="text" readOnly value={shareLink} className="w-full p-2 pr-24 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700 text-sm" />
          <button onClick={handleCopy} className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1">
             <ClipboardIcon className="w-4 h-4" /> {copyStatus}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Note: This link contains your report data and can be long. You may want to use a URL shortener.</p>
        <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">Close</button>
      </div>
    </div>
  );
};

const Step6SalesSummary: React.FC<Step6SalesSummaryProps> = ({ result, loading, error, onStartConversation, shareData }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Complete Sales & Marketing Playbook</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
              Here is your final, comprehensive report, combining all strategic analyses into one actionable document.
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
        
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[400px]">
          {loading ? (
              <div className="flex flex-col justify-center items-center h-full text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Compiling Your Final Report...</p>
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

        {!loading && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <ShareIcon className="w-6 h-6" />
              Share Playbook
            </button>
          </div>
        )}
      </div>
      {isShareModalOpen && <ShareModal shareData={shareData} onClose={() => setIsShareModalOpen(false)} />}
    </>
  );
};

export default Step6SalesSummary;
