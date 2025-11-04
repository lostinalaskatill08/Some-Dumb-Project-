
import React from 'react';
import { PORTFOLIO_DATA } from '../../services/portfolioData';
import { PortfolioIcon } from '../Icons';

const getQualityColor = (quality: 'Proven' | 'Emerging' | 'Experimental') => {
  switch (quality) {
    case 'Proven':
      return 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/30';
    case 'Emerging':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-200 ring-1 ring-inset ring-yellow-600/20 dark:ring-yellow-500/30';
    case 'Experimental':
      return 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
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

const Step5Portfolio: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
         <div className="flex items-center justify-center gap-4">
            <PortfolioIcon className="w-10 h-10 text-green-500" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Technology Portfolio</h2>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Explore this curated portfolio of companies and solutions that can help you achieve your green energy goals.
        </p>
      </div>
      
      <div className="space-y-12">
        {PORTFOLIO_DATA.map((category) => (
          <div key={category.category}>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white pb-2 border-b-2 border-green-500 mb-6">
              {category.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.technologies.map((tech) => (
                <div key={tech.name} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex flex-col h-full transition-shadow duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-3 gap-2">
                     <div className="flex-grow">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{tech.name}</h4>
                        {tech.location && <p className="text-xs text-slate-500 dark:text-slate-400">{tech.location}</p>}
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-bold rounded-full text-center ${getQualityColor(tech.quality)}`}>
                      {tech.quality}
                    </span>
                  </div>
                  {tech.productName && <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">{tech.productName}</p>}
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow mb-4">
                    {tech.description}
                  </p>
                  
                  <dl className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-600 space-y-1 divide-y divide-slate-200/50 dark:divide-slate-700/50">
                      <SpecRow label="Rated Power/Energy" value={tech.ratedPower} />
                      <SpecRow label="Efficiency/Perf." value={tech.efficiency} />
                      <SpecRow label="Cost/Notes" value={tech.costNotes} />
                      <SpecRow label="Sources" value={tech.sources} />
                      <SpecRow label="Contact" value={tech.contact} />
                  </dl>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <a
                      href={tech.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-semibold text-green-600 dark:text-green-400 hover:underline transition-colors"
                    >
                      Visit Website →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step5Portfolio;
