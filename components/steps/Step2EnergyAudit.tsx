

import React, { useState } from 'react';
import type { FormData, FormErrors } from '../../types';
import { 
    PropertyType, Ownership, OtherFuels, RoofType, RoofCondition, HeatingSystem, 
    CoolingSystem, WaterHeater, DuctworkCondition, ServiceVoltage, BatteryGenerator, 
    AtticInsulation, WallInsulation, WindowType, AirSealing, NoiseSensitivity, 
    InternetConnectivity, OccupancyPattern, PrimaryGoal, BudgetRange, PreferredFinancing,
    UserRole, HydroSourceType, FlowUnit, HeadUnit, LossEstimate, DebrisLevel, DistanceUnit,
    DiameterUnit, PipeFlowUnit, PressureUnit, PipeMaterial, YesNoUnknown, OperationMode, ProjectPhase,
    RoofShape
} from '../../types';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '../Icons';

interface Step2Props {
  formData: FormData;
  onDataChange: (field: keyof FormData, value: any) => void;
  errors: FormErrors;
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-t-lg"
            >
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {isOpen && <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{children}</div>}
        </div>
    );
};

const InputField: React.FC<{ name: keyof FormData, label: string, placeholder?: string, type?: string, errors: FormErrors, formData: FormData, onDataChange: Function, unit?: string, autoFilled?: boolean, isFullWidth?: boolean, description?: string }> = 
({ name, label, placeholder, type = 'text', errors, formData, onDataChange, unit, autoFilled, isFullWidth = false, description }) => {
    const hasError = !!errors[name];
    return (
      <div className={isFullWidth ? 'md:col-span-2' : ''}>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {/* FIX: Replaced the invalid `title` prop on the SVG component with a standard SVG `<title>` child element for accessibility and to resolve the type error. */}
            {autoFilled && <SparklesIcon className="w-4 h-4 inline-block ml-1 text-blue-500"><title>Auto-filled by AI location analysis</title></SparklesIcon>}
        </label>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{description}</p>}
        <div className="relative">
            <input
              type={type}
              id={name}
              value={formData[name] as string}
              onChange={(e) => onDataChange(name, e.target.value)}
              placeholder={placeholder}
              className={`mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 dark:border-red-500 ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500'}`}
              aria-invalid={hasError} aria-describedby={`${name}-error`}
            />
            {unit && <span className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{unit}</span>}
        </div>
        {hasError && <p id={`${name}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>}
      </div>
    );
};

const InputFieldWithUnitSelect: React.FC<{ 
    name: keyof FormData, 
    unitName: keyof FormData,
    label: string, 
    options: Record<string, string>,
    errors: FormErrors, 
    formData: FormData, 
    onDataChange: Function,
    autoFilled?: boolean
}> = ({ name, unitName, label, options, errors, formData, onDataChange, autoFilled }) => {
    const hasError = !!errors[name];
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
                {/* FIX: Replaced the invalid `title` prop on the SVG component with a standard SVG `<title>` child element for accessibility and to resolve the type error. */}
                {autoFilled && <SparklesIcon className="w-4 h-4 inline-block ml-1 text-blue-500"><title>Auto-filled by AI location analysis</title></SparklesIcon>}
            </label>
            <div className="flex gap-2 mt-1">
                 <input
                    type="number"
                    id={name}
                    value={formData[name] as string}
                    onChange={(e) => onDataChange(name, e.target.value)}
                    className={`block w-2/3 px-3 py-2 bg-slate-100 dark:bg-slate-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 dark:border-red-500 ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500'}`}
                />
                <select
                    id={unitName}
                    value={(formData[unitName] as string) ?? ''}
                    onChange={(e) => onDataChange(unitName, e.target.value || null)}
                    className="block w-1/3 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                >
                    {Object.values(options).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
            {hasError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>}
        </div>
    );
};


// FIX: Changed `options` type from `object` to a more specific Record to prevent potential TypeScript errors.
const SelectField: React.FC<{ name: keyof FormData, label: string, options: Record<string, string | number>, errors: FormErrors, formData: FormData, onDataChange: Function, isFullWidth?: boolean, description?: string, autoFilled?: boolean }> = 
({ name, label, options, errors, formData, onDataChange, isFullWidth = false, description, autoFilled }) => (
    <div className={isFullWidth ? 'md:col-span-2' : ''}>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {/* FIX: Replaced the invalid `title` prop on the SVG component with a standard SVG `<title>` child element for accessibility and to resolve the type error. */}
            {autoFilled && <SparklesIcon className="w-4 h-4 inline-block ml-1 text-blue-500"><title>Auto-filled by AI location analysis</title></SparklesIcon>}
        </label>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{description}</p>}
        <select
            id={name}
            value={(formData[name] as string) ?? ''}
            onChange={(e) => onDataChange(name, e.target.value || null)}
            className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
        >
            <option value="">Select...</option>
            {Object.values(options).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {errors[name] && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>}
    </div>
);

// FIX: Changed `options` type from `object` to a more specific Record to resolve TypeScript errors with `Array.prototype.includes`.
const CheckboxGroup: React.FC<{ name: keyof FormData, label: string, options: Record<string, string>, formData: FormData, onDataChange: Function }> = 
({ name, label, options, formData, onDataChange }) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(options).map(opt => (
                <label key={opt} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={Array.isArray(formData[name]) && (formData[name] as string[]).includes(opt as string)}
                        onChange={() => onDataChange(name, opt)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">{opt}</span>
                </label>
            ))}
        </div>
    </div>
);

const RoleSpecificSection: React.FC<Step2Props> = ({ formData, onDataChange, errors }) => {
    const { role } = formData;
    const commonInputProps = { errors, formData, onDataChange };

    if (role === UserRole.COMMUNITY || role === UserRole.POLICYMAKER) {
        return (
            <AccordionSection title="K) Community & Regional Data">
                <InputField name="communityNumberOfHomes" label="Number of Homes/Units" type="number" {...commonInputProps} />
                <InputField name="communityTotalEnergyUsage" label="Total Community Electricity Usage" type="number" unit="kWh/month" {...commonInputProps} />
                <InputField name="communityRegionSize" label="Region/Municipality Size" type="number" unit="sq miles" {...commonInputProps} />
                <InputField name="communityPopulation" label="Population" type="number" {...commonInputProps} />
                <InputField name="communityKeyIndustries" label="Key Industries" type="text" isFullWidth {...commonInputProps} />
            </AccordionSection>
        );
    }

    if (role === UserRole.DEVELOPER) {
         return (
            <AccordionSection title="K) Developer Project Details">
                <SelectField name="developerProjectPhase" label="Project Phase" options={ProjectPhase} {...commonInputProps} />
                <InputField name="developerNumberOfBuildings" label="Number of Buildings" type="number" {...commonInputProps} />
            </AccordionSection>
        );
    }
    
    return null;
}


const Step2EnergyAudit: React.FC<Step2Props> = ({ formData, onDataChange, errors }) => {
  const commonInputProps = { errors, formData, onDataChange };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Detailed Property Information</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Provide as much detail as you can. For any fields left blank, the AI will use public data or regional averages to complete the analysis. Fields marked with ✨ have been auto-filled based on your location.</p>
      </div>
      
        <AccordionSection title="A) Property Basics">
            <SelectField name="propertyType" label="Property Type" options={PropertyType} {...commonInputProps} />
            <SelectField name="ownership" label="Ownership" options={Ownership} {...commonInputProps} />
            <InputField name="propertyAge" label="Property Age" placeholder="e.g., 25" type="number" unit="years" {...commonInputProps} />
            <InputField name="squareFootage" label="Property Size" placeholder="e.g., 2000" type="number" unit="sq ft" {...commonInputProps} />
            <InputField name="stories" label="Number of Stories" placeholder="e.g., 2" type="number" {...commonInputProps} />
        </AccordionSection>

        <AccordionSection title="B) Energy Baseline & Rates">
            <InputField name="electricityUsage" label="Average Monthly Electricity Usage" placeholder="e.g., 750" type="number" unit="kWh" {...commonInputProps} />
            <InputField name="electricityBill" label="Average Monthly Electricity Bill" placeholder="e.g., 150" type="number" unit="$" {...commonInputProps} />
            <InputField name="utilityProvider" label="Utility Provider" placeholder="e.g., PG&E, Con Edison" type="text" {...commonInputProps} />
            <InputField name="estimatedYearlySavings" label="Estimated Yearly Solar Savings" placeholder="e.g., 1500" type="number" unit="$" autoFilled={formData.autoFilledFields?.includes('estimatedYearlySavings')} {...commonInputProps} />
            <CheckboxGroup name="otherFuels" label="Other Fuels Used" options={OtherFuels} {...commonInputProps} />
            <InputField name="otherFuelsCost" label="Avg. Monthly Cost for Other Fuels" placeholder="e.g., 80" type="number" unit="$" {...commonInputProps} />
        </AccordionSection>

        <AccordionSection title="C) Roof, Sun, and Site">
            <SelectField name="roofType" label="Roof Material" options={RoofType} {...commonInputProps} />
            <SelectField name="roofShape" label="Roof Shape" options={RoofShape} {...commonInputProps} />
            <SelectField name="roofCondition" label="Roof Condition" options={RoofCondition} {...commonInputProps} />
            <InputField name="roofPitch" label="Roof Pitch / Tilt" placeholder="e.g., 25" type="number" unit="°" autoFilled={formData.autoFilledFields?.includes('roofPitch')} {...commonInputProps} />
            <InputField name="roofAzimuth" label="Roof Azimuth (Direction)" placeholder="180 (South)" type="number" unit="°" {...commonInputProps} />
            <InputField name="usableRoofArea" label="Usable Roof Area for PV" placeholder="e.g., 800" type="number" unit="sq ft" autoFilled={formData.autoFilledFields?.includes('usableRoofArea')} {...commonInputProps} />
            <InputField name="solarSystemSizeKw" label="Potential Solar System Size" placeholder="e.g., 8.5" type="number" unit="kW" autoFilled={formData.autoFilledFields?.includes('solarSystemSizeKw')} {...commonInputProps} />
            <InputField name="shading" label="Avg. Annual Shading" placeholder="e.g., 15" type="number" unit="%" {...commonInputProps} />
            <InputField name="yardSize" label="Yard / Ground Area" placeholder="e.g., 5000" type="number" unit="sq ft" {...commonInputProps} />
        </AccordionSection>

        <AccordionSection title="D) Existing HVAC & Water Heating">
            <SelectField name="heatingSystem" label="Primary Heating System" options={HeatingSystem} {...commonInputProps} />
            <InputField name="heatingSystemAge" label="Heating System Age" placeholder="e.g., 15" type="number" unit="years" {...commonInputProps} />
            <SelectField name="coolingSystem" label="Cooling System" options={CoolingSystem} {...commonInputProps} />
            <InputField name="coolingSystemAge" label="Cooling System Age" placeholder="e.g., 15" type="number" unit="years" {...commonInputProps} />
            <SelectField name="waterHeater" label="Water Heater" options={WaterHeater} {...commonInputProps} />
            <InputField name="waterHeaterAge" label="Water Heater Age" placeholder="e.g., 10" type="number" unit="years" {...commonInputProps} />
            <SelectField name="ductworkCondition" label="Ductwork Condition" options={DuctworkCondition} {...commonInputProps} />
        </AccordionSection>

        <AccordionSection title="J) Hydropower Potential" defaultOpen={false}>
            <SelectField name="hydroSourceType" label="Hydro Source Type" options={HydroSourceType} isFullWidth description="Chooses which sub-form to show." autoFilled={formData.autoFilledFields?.includes('hydroSourceType')} {...commonInputProps} />
            <InputField name="hydroHoursPerYear" label="Hours Available Per Year" type="number" placeholder="e.g., 8760" description="Used for capacity factor & annual kWh." {...commonInputProps} />
            <InputField name="hydroSiteDescription" label="Site Description (optional)" type="text" placeholder="e.g., small creek near barn" description="Notes for install constraints." {...commonInputProps} />
            
            {/* B) Run-of-River */}
            {(formData.hydroSourceType === HydroSourceType.RIVER_STREAM || formData.hydroSourceType === HydroSourceType.IRRIGATION_CANAL) && (
                <>
                    <hr className="md:col-span-2 my-2 border-slate-300 dark:border-slate-600"/>
                    <h4 className="md:col-span-2 font-semibold text-slate-800 dark:text-slate-200">Run-of-River Details</h4>
                    <InputFieldWithUnitSelect name="hydroDesignFlow" unitName="hydroDesignFlowUnit" label="Design Flow (Q, average)" options={FlowUnit} {...commonInputProps} />
                    <InputFieldWithUnitSelect name="hydroGrossHead" unitName="hydroGrossHeadUnit" label="Gross Head (vertical drop)" options={HeadUnit} {...commonInputProps} />
                    <SelectField name="hydroEstimatedLosses" label="Estimated Losses" options={LossEstimate} {...commonInputProps} />
                    {formData.hydroEstimatedLosses === LossEstimate.CUSTOM && (
                        <InputField name="hydroCustomLosses" label="Custom Losses" type="number" unit="%" {...commonInputProps} />
                    )}
                    <InputFieldWithUnitSelect name="hydroMinInstreamFlow" unitName="hydroMinInstreamFlowUnit" label="Minimum Instream Flow Required (optional)" options={FlowUnit} {...commonInputProps} />
                    <SelectField name="hydroDebrisLevel" label="Debris/Sediment Level (optional)" options={DebrisLevel} {...commonInputProps} />
                    <InputFieldWithUnitSelect name="hydroDistanceToService" unitName="hydroDistanceToServiceUnit" label="Distance to Electrical Service (optional)" options={DistanceUnit} {...commonInputProps} />
                </>
            )}

            {/* C) In-Pipe / In-Conduit */}
            {(formData.hydroSourceType === HydroSourceType.DRINKING_WATER_PIPELINE || formData.hydroSourceType === HydroSourceType.WASTEWATER_PROCESS_PIPELINE) && (
                 <>
                    <hr className="md:col-span-2 my-2 border-slate-300 dark:border-slate-600"/>
                    <h4 className="md:col-span-2 font-semibold text-slate-800 dark:text-slate-200">In-Pipe / In-Conduit Details</h4>
                    <InputFieldWithUnitSelect name="hydroPipeDiameter" unitName="hydroPipeDiameterUnit" label="Pipe Inside Diameter" options={DiameterUnit} autoFilled={formData.autoFilledFields?.includes('hydroPipeDiameter')} {...commonInputProps} />
                    <InputFieldWithUnitSelect name="hydroPipeFlow" unitName="hydroPipeFlowUnit" label="Pipe Flow (average)" options={PipeFlowUnit} autoFilled={formData.autoFilledFields?.includes('hydroPipeFlow')} {...commonInputProps} />
                    <InputFieldWithUnitSelect name="hydroPressureDrop" unitName="hydroPressureDropUnit" label="Available Pressure Drop" options={PressureUnit} autoFilled={formData.autoFilledFields?.includes('hydroPressureDrop')} {...commonInputProps} />
                    <InputFieldWithUnitSelect name="hydroMinServicePressure" unitName="hydroMinServicePressureUnit" label="Minimum Service Pressure to Maintain" options={PressureUnit} {...commonInputProps} />
                    <SelectField name="hydroPipeMaterial" label="Pipe Material (optional)" options={PipeMaterial} {...commonInputProps} />
                    <SelectField name="hydroPrvOnSite" label="Pressure-Reducing Valve on Site (optional)" options={YesNoUnknown} {...commonInputProps} />
                    <SelectField name="hydroScadaNeeded" label="SCADA/Controls Integration Needed (optional)" options={YesNoUnknown} {...commonInputProps} />
                 </>
            )}

            {/* D) Interconnect & Intent */}
            {formData.hydroSourceType && (
                 <>
                    <hr className="md:col-span-2 my-2 border-slate-300 dark:border-slate-600"/>
                    <h4 className="md:col-span-2 font-semibold text-slate-800 dark:text-slate-200">Interconnect & Intent</h4>
                    <SelectField name="hydroOperationMode" label="Operation Mode" options={OperationMode} {...commonInputProps} />
                    <SelectField name="serviceVoltage" label="Service Voltage / Phase" options={ServiceVoltage} {...commonInputProps} />
                    <SelectField name="noiseSensitivity" label="Noise/Visual Sensitivity" options={NoiseSensitivity} {...commonInputProps} />
                 </>
            )}
        </AccordionSection>

        <RoleSpecificSection {...{ formData, onDataChange, errors }} />
        
        <AccordionSection title="I) Goals & Priorities">
            <CheckboxGroup name="primaryGoals" label="Primary Goals" options={PrimaryGoal} {...commonInputProps} />
            <SelectField name="budgetRange" label="Budget Range" options={BudgetRange} {...commonInputProps} />
            <CheckboxGroup name="preferredFinancing" label="Preferred Financing" options={PreferredFinancing} {...commonInputProps} />
        </AccordionSection>

    </div>
  );
};

export default Step2EnergyAudit;