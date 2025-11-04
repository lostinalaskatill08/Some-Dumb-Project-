
import React from 'react';
import type { GroundingChunk } from '../types';

interface AnalysisSourcesProps {
  sources: GroundingChunk[];
}

const AnalysisSources: React.FC<AnalysisSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const validSources = sources.filter(s => (s.web && s.web.uri && s.web.title) || (s.maps && s.maps.uri && s.maps.title));

  if (validSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <h5 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
        Sources Consulted:
      </h5>
      <ul className="list-decimal pl-5 space-y-1">
        {validSources.map((source, index) => {
          const sourceData = source.web || source.maps;
          const sourceType = source.maps ? '(Map Source)' : '(Web Source)';
          return (
            <li key={index} className="text-xs">
              <a
                href={sourceData!.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:underline"
                title={sourceData!.uri}
              >
                {sourceData!.title}
              </a>
              <span className="ml-1 text-slate-400 dark:text-slate-500">{sourceType}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AnalysisSources;
