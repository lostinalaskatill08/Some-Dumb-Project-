
import React, { useMemo } from 'react';
import type { AnalysisContent } from '../../types';
import { DownloadIcon } from '../Icons';
import SocialShare from '../SocialShare';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Step7FinalReportProps {
  result: AnalysisContent;
  loading: boolean;
  error: string | null;
  shareText: string;
}

const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3 border-b border-slate-300 dark:border-slate-600 pb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            const boldText = line.replace(/\*\*/g, '');
            return <p key={index} className="my-1"><strong className="text-slate-800 dark:text-slate-200">{boldText.split(':')[0]}:</strong>{boldText.substring(boldText.indexOf(':') + 1)}</p>;
        }
        if (line.match(/^\s*-\s/)) { // Handles bullet points
            return <li key={index} className="ml-5 list-disc text-gray-600 dark:text-gray-300 mb-1">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        return <p key={index} className="text-gray-600 dark:text-gray-300 mb-2">{line}</p>;
    });
};

const CostSavingsChart: React.FC<{
  systemCost: number;
  annualSavings: number;
  paybackPeriod: number;
}> = ({ systemCost, annualSavings, paybackPeriod }) => {
  if (isNaN(systemCost) || systemCost <= 0 || isNaN(annualSavings) || annualSavings <= 0 || isNaN(paybackPeriod) || paybackPeriod <= 0) {
    return null;
  }
  
  const years = 20; // Visualize a 20-year period
  const chartData = Array.from({ length: years + 1 }, (_, i) => {
    const year = i;
    const cumulativeSavings = year * annualSavings;
    const netPosition = cumulativeSavings - systemCost;
    return {
      year: `Year ${year}`,
      'Cumulative Savings': cumulativeSavings,
      'Net Financial Position': netPosition,
    };
  });

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
       <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Projected Financials Over 20 Years</h4>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={chartData}
            margin={{
              top: 5, right: 20, bottom: 5, left: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
            <XAxis dataKey="year" stroke="currentColor" />
            <YAxis 
              tickFormatter={(value) => `$${(value/1000).toLocaleString()}k`}
              stroke="currentColor"
            />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.5rem',
                    color: '#1e293b'
                }}
               wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600 dark:!text-slate-200"
            />
            <Legend />
            <defs>
                <linearGradient id="colorNetPosition" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Area 
                type="monotone" 
                dataKey="Net Financial Position" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorNetPosition)" 
            />
            <Line type="monotone" dataKey="Cumulative Savings" stroke="#22c55e" strokeWidth={2} dot={false} />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <ReferenceLine 
                x={`Year ${Math.round(paybackPeriod)}`} 
                stroke="#4f46e5" 
                label={{ value: `Payback: ~${paybackPeriod.toFixed(1)} yrs`, position: 'insideTopRight', fill: '#312e81' }}
                strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Step7FinalReport: React.FC<Step7FinalReportProps> = ({ result, loading, error, shareText }) => {
  const parsedFinancials = useMemo(() => {
    if (!result || !result.text) {
      return { systemCost: 0, annualSavings: 0, paybackPeriod: 0 };
    }
    const costMatch = result.text.match(/Estimated System Cost:\s*\$\[([\d,.]+)\]/);
    const savingsMatch = result.text.match(/Estimated Annual Electricity Savings\/Revenue:\s*\$\[([\d,.]+)\]/);
    const paybackMatch = result.text.match(/Simple Payback Period:\s*\[([\d.]+)\]/);

    const systemCost = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : 0;
    const annualSavings = savingsMatch ? parseFloat(savingsMatch[1].replace(/,/g, '')) : 0;
    const paybackPeriod = paybackMatch ? parseFloat(paybackMatch[1]) : 0;

    return { systemCost, annualSavings, paybackPeriod };
  }, [result]);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Final Report: ROI & Climate Impact</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          This is the final financial and environmental analysis based on your inputs and our AI's calculations.
        </p>
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
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Generating Final ROI & Impact Report...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment.</p>
            </div>
        ) : (
          <div>
            <div className="prose prose-green dark:prose-invert max-w-none">
              {formatMarkdown(result.text)}
            </div>
            <CostSavingsChart
              systemCost={parsedFinancials.systemCost}
              annualSavings={parsedFinancials.annualSavings}
              paybackPeriod={parsedFinancials.paybackPeriod}
            />
          </div>
        )}
      </div>
      
      {!loading && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                    <button
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg border-2 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/50 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <DownloadIcon className="w-6 h-6" />
                        Download Full Report (PDF)
                    </button>
                </div>
                <div className="flex-1">
                    <SocialShare shareText={shareText} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Step7FinalReport;
