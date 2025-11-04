
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ProductionSource {
    name: string;
    value: number;
    fill: string;
}

interface PrintableEnergyComparisonChartProps {
  currentAnnualUsage: number;
  solarProductionText: string;
  windProductionText: string;
  hydroProductionText: string;
}

const PrintableEnergyComparisonChart: React.FC<PrintableEnergyComparisonChartProps> = ({ 
    currentAnnualUsage, 
    solarProductionText, 
    windProductionText,
    hydroProductionText
}) => {
    
    const parseProduction = (text: string | undefined, regex: RegExp): number => {
        if (!text) return 0;
        const match = text.match(regex);
        if (match && match[1]) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
        return 0;
    };
    
    const solarProd = parseProduction(solarProductionText, /annual energy production.*?\s([\d,.]+)\s*kWh/i);
    const windProd = parseProduction(windProductionText, /annual power output.*?\s([\d,.]+)\s*kWh/i);
    const hydroProd = parseProduction(hydroProductionText, /annual energy.*?\s([\d,.]+)\s*kWh/i);

    const productionSources: ProductionSource[] = [];
    if (solarProd > 0) productionSources.push({ name: 'Solar', value: solarProd, fill: '#f97316' });
    if (windProd > 0) productionSources.push({ name: 'Wind', value: windProd, fill: '#3b82f6' });
    if (hydroProd > 0) productionSources.push({ name: 'Hydro', value: hydroProd, fill: '#0ea5e9' });

  if (productionSources.length === 0 || isNaN(currentAnnualUsage) || currentAnnualUsage <= 0) {
    return <p>No renewable production data to display.</p>;
  }
  
  const chartData = [{ name: 'Production', ...productionSources.reduce((acc, source) => ({...acc, [source.name]: source.value }), {}) }];

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <XAxis type="category" dataKey="name" hide />
          <YAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} width={70} />
          <Tooltip />
          <Legend />
          {productionSources.map(source => (
              <Bar key={source.name} dataKey={source.name} fill={source.fill} barSize={40} />
          ))}
          <ReferenceLine 
              y={currentAnnualUsage} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `Current Usage`, position: 'insideTopRight' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PrintableEnergyComparisonChart;
