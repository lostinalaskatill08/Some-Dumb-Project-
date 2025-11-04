import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PrintableCostSavingsChartProps {
  systemCost: number;
  annualSavings: number;
  paybackPeriod: number;
}

const PrintableCostSavingsChart: React.FC<PrintableCostSavingsChartProps> = ({ systemCost, annualSavings, paybackPeriod }) => {
  if (isNaN(systemCost) || systemCost <= 0 || isNaN(annualSavings) || annualSavings <= 0 || isNaN(paybackPeriod) || paybackPeriod <= 0) {
    return <p>No financial data to display.</p>;
  }
  
  const years = 20;
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
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(value) => `$${(value/1000).toLocaleString()}k`} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Area type="monotone" dataKey="Net Financial Position" fill="#ef4444" stroke="#ef4444" fillOpacity={0.2} />
          <Line type="monotone" dataKey="Cumulative Savings" stroke="#22c55e" strokeWidth={2} dot={false} />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <ReferenceLine x={`Year ${Math.round(paybackPeriod)}`} stroke="#4f46e5" label={`Payback: ~${paybackPeriod.toFixed(1)} yrs`} strokeDasharray="3 3"/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PrintableCostSavingsChart;
