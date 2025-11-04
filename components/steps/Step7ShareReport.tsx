import React from 'react';
import SocialShare from '../SocialShare';

interface Step7ShareReportProps {
  shareText: string;
}

const Step7ShareReport: React.FC<Step7ShareReportProps> = ({ shareText }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Share Your Report</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Help inspire others by sharing your personalized green energy potential report.
        </p>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <SocialShare shareText={shareText} />
      </div>
    </div>
  );
};

export default Step7ShareReport;
