import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FormData, FormErrors, SunroofData } from '../../types';
import { UserRole } from '../../types';
import { geminiService } from '../../services/geminiService';
import MapDisplay from '../MapDisplay';
import { InfoIcon } from '../Icons';
import ReferenceMaps from '../ReferenceMaps';
import LocationDataSummary from '../LocationDataSummary';

declare const L: any; // Declare Leaflet global

/**
 * Props for the Step1RoleAndLocation component.
 */
interface Step1Props {
  /** The current state of the main application form. */
  formData: FormData;
  /** Callback to update a single field in the form data. */
  onDataChange: (field: keyof FormData, value: any) => void;
  /** Callback to update multiple form fields at once, used for autofilling from AI analysis. */
  onBulkDataChange: (updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]) => void;
  /** An object containing any validation errors for the form fields. */
  errors: FormErrors;
  /** Callback to open the live AI conversation modal. */
  onStartConversation: () => void;
  /** Callback to request the user's current geographic position. */
  onLocationRequest: (onSuccess: PositionCallback, onError: PositionErrorCallback) => void;
}

const userRoles = [
    { role: UserRole.HOMEOWNER, title: 'Homeowner', description: 'Get a personalized solar, weatherization, and efficiency report for your property.' },
    { role: UserRole.COMMUNITY, title: 'Community Organizer', description: 'Analyze energy potential for a neighborhood or group of properties.' },
    { role: UserRole.POLICYMAKER, title: 'Policymaker', description: 'Assess regional data for environmental planning and incentive programs.' },
    { role: UserRole.SALES, title: 'Sales Professional / Consultant', description: 'Generate a market analysis and sales playbook for a specific technology.' },
    { role: UserRole.DEVELOPER, title: 'Developer', description: 'Evaluate green energy options for new construction or retrofit projects.' },
];

/**
 * Step1RoleAndLocation Component: The first step in the user journey.
 * This component allows the user to select their role and specify a location for analysis.
 * It features an interactive map for location pinning, address search, and "Use My Location" functionality.
 * Upon location selection, it triggers an AI-powered analysis to pre-fill relevant data.
 * @param {Step1Props} props The props for the component.
 * @returns {React.ReactElement} The rendered component.
 */
const Step1RoleAndLocation: React.FC<Step1Props> = ({ 
    formData, onDataChange, onBulkDataChange, errors, onStartConversation, onLocationRequest
}) => {
    /** State to hold the geographic coordinates of the selected location. */
    const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
    /** State for the controlled address input field. */
    const [addressInput, setAddressInput] = useState('');
    /** State to track when a location lookup (geocoding, etc.) is in progress. */
    const [isLocating, setIsLocating] = useState(false);
    /** State to hold any errors that occur during location analysis. */
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    /** State for when the optional text analysis is running. */
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const analyzeFullLocation = useCallback(async (lat: number, lon: number, address: string) => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const { updates, autoFilledKeys } = await geminiService.analyzeLocation(lat, lon, address);
            onBulkDataChange(updates, autoFilledKeys);
        } catch (error) {
            console.error("Failed to auto-fill details:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during location analysis.";
            setAnalysisError("Could not automatically fetch all property details. Please review and enter any missing information manually. Error: " + errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    }, [onBulkDataChange]);

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const addressToGeocode = addressInput.trim();
        if (!addressToGeocode || !formData.role || isLocating || isAnalyzing) return;

        setIsLocating(true);
        setAnalysisError(null);
        try {
            const coords = await geminiService.geocodeAddress(addressToGeocode);
            if (coords) {
                setLocationCoords(coords);
                onDataChange('location', addressToGeocode);
                await analyzeFullLocation(coords.lat, coords.lon, addressToGeocode);
            } else {
                setAnalysisError(`Could not find location for "${addressToGeocode}". Please try a different address.`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during geocoding.";
            setAnalysisError(errorMessage);
        } finally {
            setIsLocating(false);
        }
    };
    
    const processCoords = useCallback(async (lat: number, lon: number) => {
        if (!formData.role || isLocating || isAnalyzing) return;
        
        setIsLocating(true);
        setAnalysisError(null);
        try {
            const address = await geminiService.reverseGeocode(lat, lon);
            if (address) {
                setAddressInput(address);
                onDataChange('location', address);
                setLocationCoords({ lat, lon });
                await analyzeFullLocation(lat, lon, address);
            } else {
                throw new Error('No address found. Please click closer to a street or building.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during reverse geocoding.";
            setAnalysisError(errorMessage);
        } finally {
            setIsLocating(false);
        }
    }, [formData.role, onDataChange, analyzeFullLocation, isAnalyzing, isLocating]);

    const handleLocationSelect = useCallback((lat: number, lon: number) => {
        if (isLocating || isAnalyzing) return;
        processCoords(lat, lon);
    }, [processCoords, isLocating, isAnalyzing]);

    const handleUseMyLocation = useCallback(() => {
        if (!formData.role || isLocating || isAnalyzing) return;
        
        onLocationRequest(
            (position) => processCoords(position.coords.latitude, position.coords.longitude),
            (error) => {
                console.error("Geolocation error:", error);
                setAnalysisError("Could not retrieve your location. Please ensure you have granted permission.");
            }
        );
    }, [formData.role, onLocationRequest, processCoords, isLocating, isAnalyzing]);
    
    const isBusy = isLocating || isAnalyzing;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Start Your Analysis</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Select your role, then pinpoint a location to begin. The AI will find the address and then start its analysis.</p>
            </div>

            {/* Role Selection */}
            <div>
                <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">1. What is your role?</label>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userRoles.map(({ role, title, description }) => (
                        <div key={role} onClick={() => onDataChange('role', role)} className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col ${formData.role === role ? 'bg-green-50 dark:bg-green-900/50 border-green-500 ring-2 ring-green-500 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-600'}`}>
                            <h4 className={`font-semibold text-base ${formData.role === role ? 'text-green-800 dark:text-green-200' : 'text-slate-800 dark:text-slate-200'}`}>{title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                        </div>
                    ))}
                </div>
                {errors.role && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
            </div>

            {/* Map Interaction */}
            <div>
                <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">2. Select a Location</label>
                
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 w-full">
                    <form onSubmit={handleAddressSubmit} className="flex-grow flex items-center gap-2 w-full sm:w-auto">
                        <input 
                            id="location-input"
                            type="text"
                            value={addressInput}
                            onChange={e => setAddressInput(e.target.value)}
                            placeholder="Enter an address or click the map..."
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 border-slate-300 dark:border-slate-600 focus:ring-green-500"
                            disabled={!formData.role || isBusy}
                        />
                        <button 
                            type="submit"
                            className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                            disabled={!formData.role || isBusy || !addressInput.trim()}
                        >
                            {isLocating ? 'Finding...' : isAnalyzing ? 'Analyzing...' : 'Find'}
                        </button>
                    </form>
                    <span className="hidden sm:inline-block mx-2 text-slate-400">or</span>
                    <button
                        onClick={handleUseMyLocation}
                        disabled={!formData.role || isBusy}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        Use My Location
                    </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Find an address, or double-click the map below to set a location.</p>

                <MapDisplay
                    centerCoords={locationCoords}
                    onLocationSelect={handleLocationSelect}
                    analysisStatus={isAnalyzing ? 'analyzing' : 'idle'}
                    countdown={0}
                    disabled={!formData.role || isBusy}
                />
                 {errors.location && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
                 {analysisError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{analysisError}</p>}
            </div>

            <LocationDataSummary 
                loading={isAnalyzing}
                location={formData.location}
                sunroof={formData.sunroofData}
                eie={formData.eieData}
                hydro={formData.hydroPreAnalysisData}
                role={formData.role}
            />
            
            <ReferenceMaps coords={locationCoords} />

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0"><InfoIcon className="h-5 w-5 text-blue-500" /></div>
                    <div className="ml-3"><p className="text-sm text-blue-700 dark:text-blue-200">Need help? <button onClick={onStartConversation} className="font-medium underline hover:text-blue-600 dark:hover:text-blue-100">Talk to our AI Assistant</button>.</p></div>
                </div>
            </div>
        </div>
    );
};

export default Step1RoleAndLocation;