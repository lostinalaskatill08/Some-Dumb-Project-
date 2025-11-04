

import React from 'react';
import type { AnalysisResults, LoadingStates, FormData, AnalysisKey, AnalysisContent } from '../../types';
import { PORTFOLIO_DATA } from '../../services/portfolioData';
import AnalysisSources from '../AnalysisSources';
import { 
    SunIcon, WindIcon, BatteryIcon, BiomassIcon, HydroIcon, GeothermalIcon, 
    HeatPumpIcon, BuildingIcon, WeatherizationIcon, PortfolioIcon, SparklesIcon
} from '../Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';


const analysisCardsConfig: { key: AnalysisKey; title: string; Icon: React.FC<any> }[] = [
    { key: 'energyAudit', title: 'Energy Audit', Icon: BuildingIcon },
    { key: 'solar', title: 'Solar Potential', Icon: SunIcon },
    { key: 'wind', title: 'Wind Potential', Icon: WindIcon },
    { key: 'hydro', title: 'Hydropower Potential', Icon: HydroIcon },
    { key: 'battery', title: 'Battery Storage', Icon: BatteryIcon },
    { key: 'geothermal', title: 'Geothermal', Icon: GeothermalIcon },
    { key: 'miniSplit', title: 'Mini-Split Heat Pumps', Icon: HeatPumpIcon },
    { key: 'buildingMaterials', title: 'Building Materials', Icon: BuildingIcon },
    { key: 'weatherization', title: 'Weatherization', Icon: WeatherizationIcon },
    { key: 'wasteToEnergy', title: 'Waste-to-Energy', Icon: BiomassIcon },
    { key: 'inPipeHydro', title: 'In-Pipe Hydropower', Icon: HydroIcon },
    { key: 'portfolio', title: 'Recommended Portfolio', Icon: PortfolioIcon },
];

const ProductRecommendation: React.FC<{ text: string }> = ({ text }) => {
    const productMatch = text.match(/\*\*Recommended Product:\*\*\s*(.*)/);
    const whyMatch = text.match(/\*\*Why it fits:\*\*\s*([\s\S]*)/);
    
    if (!productMatch) return null;

    const productName = productMatch[1].trim();
    const whyText = whyMatch ? whyMatch[1].trim() : 'No justification provided.';

    return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-green-600" />
                AI Product Recommendation
            </h4>
            <p className="mt-2 text-base"><strong>Product:</strong> <span className="font-medium text-green-800 dark:text-green-300">{productName}</span></p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400"><strong>Why it fits:</strong> {whyText}</p>
        </div>
    );
};


const FormattedAnalysisText: React.FC<{ text: string }> = ({ text }) => {
    const recommendationRegex = /\*\*Recommended Product:\*\*[\s\S]*/;
    const mainText = text.replace(recommendationRegex, '').trim();
    const recommendationText = text.match(recommendationRegex)?.[0] || '';

    return (
        <>
            <div className="prose prose-slate dark:prose-invert max-w-none text-base">
                {mainText.split('\n').map((line, index) => {
                    if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
                    }
                    if (line.startsWith('**')) {
                        const boldText = line.replace(/\*\*/g, '');
                        return <p key={index} className="my-1"><strong className="text-slate-800 dark:text-slate-200">{boldText.split(':')[0]}:</strong>{boldText.substring(boldText.indexOf(':') + 1)}</p>;
                    }
                    if (line.match(/^\s*-\s/)) {
                        return <li key={index} className="ml-5">{line.substring(line.indexOf(' ') + 1)}</li>;
                    }
                     if (line.match(/^\d+\.\s/)) {
                        return <li key={index} className="ml-5 list-decimal">{line.substring(line.indexOf(' ') + 1)}</li>;
                    }
                    return <p key={index} className="my-2">{line}</p>;
                })}
            </div>
            {recommendationText && <ProductRecommendation text={recommendationText} />}
        </>
    );
};

const EnergyOverviewChart: React.FC<{ results: AnalysisResults, formData: FormData }> = ({ results, formData }) => {
    const parseProduction = (text: string | undefined, regex: RegExp): number => {
        if (!text) return 0;
        const match = text.match(regex);
        if (match && match[1]) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
        return 0;
    };

    const solarProd = parseProduction(results.solar?.text, /annual energy production.*?\s([\d,.]+)\s*kWh/i);
    const windProd = parseProduction(results.wind?.text, /annual power output.*?\s([\d,.]+)\s*kWh/i);
    const hydroProd = parseProduction(results.hydro?.text, /annual energy.*?\s([\d,.]+)\s*kWh/i);
    const batteryCap = parseProduction(results.battery?.text, /Recommended Capacity:\*\*\s*([\d,.]+)\s*kWh/i);
    
    const data = [
        { name: 'Solar', "Annual Production (kWh)": solarProd, fill: '#f97316' },
        { name: 'Wind', "Annual Production (kWh)": windProd, fill: '#3b82f6' },
        { name: 'Hydro', "Annual Production (kWh)": hydroProd, fill: '#0ea5e9' },
        { name: 'Battery Capacity (kWh)', "Annual Production (kWh)": batteryCap, fill: '#8b5cf6' },
    ].filter(d => d["Annual Production (kWh)"] > 0);

    const currentAnnualUsage = (parseFloat(formData.electricityUsage) || 0) * 12;

    if (data.length === 0 && currentAnnualUsage === 0) {
        return null;
    }

    return (
        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-center mb-4">Energy Overview (Annual)</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
                        <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toLocaleString()}k kWh`} stroke="currentColor" />
                        <YAxis type="category" dataKey="name" stroke="currentColor" width={140}/>
                        <Tooltip
                             contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderColor: '#cbd5e1',
                                borderRadius: '0.5rem',
                                color: '#1e293b'
                            }}
                            wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600 dark:!text-slate-200"
                        />
                        <Bar dataKey="Annual Production (kWh)" barSize={35} />
                        {currentAnnualUsage > 0 && (
                             <ReferenceLine 
                                x={currentAnnualUsage} 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                label={{ value: `Current Usage: ${currentAnnualUsage.toLocaleString()} kWh`, position: 'insideTopRight', fill: '#b91c1c' }}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// FIX: Added missing interface definition for component props.
interface Step3AnalysisProps {
  results: AnalysisResults;
  loadingStates: LoadingStates;
  error: string | null;
  formData: FormData;
  onDataChange: (field: keyof FormData, value: any) => void;
}

const Step3Analysis: React.FC<Step3AnalysisProps> = ({ results, loadingStates, error, formData, onDataChange }) => {
    
    const handleProductSelection = (productName: string) => {
        const currentSelection = formData.selectedPortfolioProducts || [];
        const newSelection = currentSelection.includes(productName)
            ? currentSelection.filter(name => name !== productName)
            : [...currentSelection, productName];
        onDataChange('selectedPortfolioProducts', newSelection);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">AI Analysis & Project Builder</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Review your personalized analysis below. Then, scroll to the Technology Portfolio at the bottom to select products for your project.</p>
            </div>

            <EnergyOverviewChart results={results} formData={formData} />

            {error && <p className="text-red-500">Error: {error}</p>}
            
            <div className="space-y-6">
                {analysisCardsConfig.map(({ key, title, Icon }) => {
                    const result = results[key as keyof AnalysisResults] as AnalysisContent;
                    const isLoading = loadingStates[key as keyof LoadingStates];

                    if (!result?.text && !isLoading) return null;

                    return (
                        <div key={key} className={`p-6 border rounded-lg shadow-sm transition-all duration-300 ${isLoading ? 'bg-slate-100/50 dark:bg-slate-800/50 animate-pulse' : 'bg-white dark:bg-slate-800'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <Icon className="w-8 h-8 text-green-500" />
                                    <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100">{title}</h3>
                                </div>
                                {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>}
                            </div>
                            {isLoading ? <p>Analyzing...</p> : (
                                <>
                                    <FormattedAnalysisText text={result?.text} />
                                    <AnalysisSources sources={result?.sources || []} />
                                </>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-12 pt-8 border-t-2 border-green-500">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Technology Portfolio</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Based on your analysis, select the specific technologies you want to include in your project plan. This will inform the next steps.
                    </p>
                </div>
                <div className="space-y-12">
                    {PORTFOLIO_DATA.map((category) => (
                        <div key={category.category}>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white pb-2 border-b-2 border-slate-300 dark:border-slate-600 mb-6">
                                {category.category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.technologies.map((tech) => (
                                    <label key={tech.name} className="block bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-green-500 has-[:checked]:border-green-500">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div className="flex-grow">
                                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{tech.name}</h4>
                                                {tech.location && <p className="text-xs text-slate-500 dark:text-slate-400">{tech.location}</p>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-5 w-5 text-green-600 bg-slate-200 dark:bg-slate-700 border-slate-400 rounded focus:ring-green-500"
                                                checked={formData.selectedPortfolioProducts.includes(tech.name)}
                                                onChange={() => handleProductSelection(tech.name)}
                                            />
                                        </div>
                                        {tech.productName && <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">{tech.productName}</p>}
                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow mb-4">
                                            {tech.description}
                                        </p>
                                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-600 space-y-1">
                                            <SpecRow label="Rated Power/Energy" value={tech.ratedPower} />
                                            <SpecRow label="Efficiency/Perf." value={tech.efficiency} />
                                            <SpecRow label="Cost/Notes" value={tech.costNotes} />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            <a href={tech.website} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">
                                                Visit Website →
                                            </a>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SpecRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-2 text-xs py-1">
      <dt className="font-semibold text-slate-500 dark:text-slate-400 col-span-1">{label}</dt>
      <dd className="text-slate-700 dark:text-slate-300 col-span-2">{value}</dd>
    </div>
  );
};


export default Step3Analysis;
