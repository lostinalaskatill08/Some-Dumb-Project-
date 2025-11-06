import React from 'react';
import type { SunroofData, EieData, HydroPreAnalysisData } from '../types';
import { UserRole } from '../types';
import { SunIcon, BuildingIcon, HydroIcon } from './Icons';

interface LocationDataSummaryProps {
  loading: boolean;
  location: string | null;
  sunroof: SunroofData | null | undefined;
  eie: EieData | null | undefined;
  hydro: HydroPreAnalysisData | null | undefined;
  role: UserRole | null;
}

const DataRow: React.FC<{ label: string, value: string | number | undefined | null }> = ({ label, value }) => {
  const displayValue = (value === null || value === undefined || String(value).trim() === '') ? 'N/A' : String(value);
  return (
    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`text-sm font-semibold ${displayValue === 'N/A' ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-800 dark:text-slate-200'}`}>{displayValue}</dd>
    </div>
  );
};

const LocationDataSummary: React.FC<LocationDataSummaryProps> = ({ loading, location, sunroof, eie, hydro, role }) => {
  const showSunroof = role === UserRole.HOMEOWNER && sunroof;
  const showEie = (role === UserRole.COMMUNITY || role === UserRole.POLICYMAKER) && eie;
  const showHydro = hydro && hydro.potentialSourceType;
  const showComponent = loading || showSunroof || showEie || showHydro;

  if (!showComponent) {
    return null;
  }

  return (
    <div className="mt-6 animate-fade-in">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
          AI Location Analysis Results
        </h3>
        {location && !loading && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                Showing results for: <span className="font-semibold text-slate-700 dark:text-slate-300">{location}</span>
            </p>
        )}
        {loading && (
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
            <span>Analyzing location data...</span>
          </div>
        )}

        <div className="space-y-4">
            {!loading && showSunroof && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                    <SunIcon className="w-6 h-6 text-orange-500" />
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Google Solar API Insights</h4>
                </div>
                <dl>
                  <DataRow label="Usable Sunlight Hours" value={sunroof.usableSunlightHours ? `${parseFloat(sunroof.usableSunlightHours).toLocaleString(undefined, {maximumFractionDigits: 0})} hrs/yr` : null} />
                  <DataRow label="Usable Roof Area" value={sunroof.usableRoofArea ? `${parseFloat(sunroof.usableRoofArea).toLocaleString(undefined, {maximumFractionDigits: 0})} sq ft` : null} />
                  <DataRow label="Potential System Size" value={sunroof.potentialSystemSizeKw ? `${parseFloat(sunroof.potentialSystemSizeKw).toFixed(2)} kW` : null} />
                  <DataRow label="Est. Annual Production" value={sunroof.yearlyProductionDcKwh ? `${parseFloat(sunroof.yearlyProductionDcKwh).toLocaleString(undefined, {maximumFractionDigits: 0})} kWh` : null} />
                  <DataRow label="Estimated Roof Pitch" value={sunroof.roofPitch ? `${parseFloat(sunroof.roofPitch).toFixed(1)}°` : null} />
                  <DataRow label="Estimated Monthly Bill" value={sunroof.monthlyBill ? `$${parseFloat(sunroof.monthlyBill).toFixed(2)}` : null} />
                  <DataRow label="Est. Savings Over 20 Years" value={sunroof.savingsOver20Years ? `$${parseFloat(sunroof.savingsOver20Years).toLocaleString(undefined, {maximumFractionDigits: 0})}` : null} />
                </dl>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">{sunroof.rawText}</p>
              </div>
            )}

            {!loading && showEie && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                    <BuildingIcon className="w-6 h-6 text-blue-500" />
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Environmental Insights Explorer</h4>
                </div>
                <dl>
                  <DataRow label="Building Emissions" value={eie.buildingEmissions} />
                  <DataRow label="Transportation Emissions" value={eie.transportationEmissions} />
                  <DataRow label="Renewable Potential (Rooftop)" value={eie.renewablePotential} />
                </dl>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">{eie.rawText}</p>
              </div>
            )}

            {!loading && showHydro && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                    <HydroIcon className="w-6 h-6 text-cyan-500" />
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Hydropower Insights</h4>
                </div>
                <dl>
                  <DataRow label="Potential Source Type" value={hydro.potentialSourceType} />
                  <DataRow label="Nearest Water Body" value={hydro.nearestWaterBody} />
                  <DataRow label="Approximate Distance" value={hydro.distance} />
                  {hydro.potentialSourceType === 'Drinking-Water Pipeline' && (
                    <>
                        <DataRow label="Est. Pipe Diameter" value={hydro.estimatedPipeDiameterInches ? `${hydro.estimatedPipeDiameterInches} in` : null} />
                        <DataRow label="Est. Water Pressure" value={hydro.estimatedPressurePSI ? `${hydro.estimatedPressurePSI} PSI` : null} />
                        <DataRow label="Est. Flow Rate" value={hydro.estimatedFlowGPM ? `${hydro.estimatedFlowGPM} GPM` : null} />
                    </>
                  )}
                </dl>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">{hydro.summaryText}</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LocationDataSummary;