
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FormData, FormErrors, SunroofData, EieData, HydroPreAnalysisData } from '../../types';
import { UserRole, HydroSourceType } from '../../types';
import { geminiService } from '../../services/geminiService';
import MapDisplay from '../MapDisplay';
import LocationDataSummary from '../LocationDataSummary';
import { InfoIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '../Icons';
import ReferenceMaps from '../ReferenceMaps';

declare const L: any; // Declare Leaflet global

interface Step1Props {
  formData: FormData;
  onDataChange: (field: keyof FormData, value: any) => void;
  onBulkDataChange: (updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]) => void;
  errors: FormErrors;
  onStartConversation: () => void;
  onLocationRequest: (onSuccess: PositionCallback, onError: PositionErrorCallback) => void;
}

const userRoles = [
    { role: UserRole.HOMEOWNER, title: 'Homeowner', description: 'Get a personalized solar, weatherization, and efficiency report for your property.' },
    { role: UserRole.COMMUNITY, title: 'Community Organizer', description: 'Analyze energy potential for a neighborhood or group of properties.' },
    { role: UserRole.POLICYMAKER, title: 'Policymaker', description: 'Assess regional data for environmental planning and incentive programs.' },
    { role: UserRole.SALES, title: 'Sales Professional / Consultant', description: 'Generate a market analysis and sales playbook for a specific technology.' },
    { role: UserRole.DEVELOPER, title: 'Developer', description: 'Evaluate green energy options for new construction or retrofit projects.' },
];

const Step1RoleAndLocation: React.FC<Step1Props> = ({ 
    formData, onDataChange, onBulkDataChange, errors, onStartConversation, onLocationRequest
}) => {
    const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
    const [addressInput, setAddressInput] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [analysisData, setAnalysisData] = useState<{ sunroof: SunroofData | null; eie: EieData | null; hydro: HydroPreAnalysisData | null } | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [mapStatus, setMapStatus] = useState<'idle' | 'countdown' | 'analyzing'>('idle');
    const [countdown, setCountdown] = useState(3);
    const countdownRef = useRef<number | null>(null);

    const [showOptional, setShowOptional] = useState(false);
    const [pastedText, setPastedText] = useState('');
    const [pastedImage, setPastedImage] = useState('');
    
    const analysisPayloadRef = useRef<{coords: {lat: number, lon: number}, address: string} | null>(null);
    
    const handleAnalyze = useCallback(async (coords: { lat: number; lon: number }, address: string) => {
        if (!coords || !address || !formData.role) return;

        if (countdownRef.current) clearInterval(countdownRef.current);

        setMapStatus('analyzing');
        setIsLocating(true); // Re-use isLocating for analysis phase as well
        setAnalysisError(null);
        setAnalysisData(null);
        
        try {
            const result = await geminiService.analyzeLocationAndData(
                coords.lat, 
                coords.lon,
                address,
                pastedText,
                pastedImage
            );

            if (result) {
                const { sunroofData, eieData, hydroPreAnalysisData, location } = result;
                setAnalysisData({ sunroof: sunroofData, eie: eieData, hydro: hydroPreAnalysisData });
                
                const updates: Partial<FormData> = {};
                const autoFilledKeys: (keyof FormData)[] = [];
                
                if (location) {
                    updates.location = location;
                    setAddressInput(location); // Sync input with AI-confirmed location
                    onDataChange('location', location);
                }

                updates.sunroofData = sunroofData;
                updates.eieData = eieData;
                updates.hydroPreAnalysisData = hydroPreAnalysisData;

                if (sunroofData) {
                    if (sunroofData.usableRoofArea) { updates.usableRoofArea = String(sunroofData.usableRoofArea).replace(/[^0-9.]/g, ''); autoFilledKeys.push('usableRoofArea'); }
                    if (sunroofData.potentialSystemSizeKw) { updates.solarSystemSizeKw = String(sunroofData.potentialSystemSizeKw).replace(/[^0-9.]/g, ''); autoFilledKeys.push('solarSystemSizeKw'); }
                    if (sunroofData.potentialYearlySavings) { updates.estimatedYearlySavings = String(sunroofData.potentialYearlySavings).replace(/[^0-9.]/g, ''); autoFilledKeys.push('estimatedYearlySavings'); }
                    if (sunroofData.roofPitch) { updates.roofPitch = String(sunroofData.roofPitch).replace(/[^0-9.]/g, ''); autoFilledKeys.push('roofPitch'); }
                }

                if (hydroPreAnalysisData) {
                    if (hydroPreAnalysisData.potentialSourceType) { updates.hydroSourceType = hydroPreAnalysisData.potentialSourceType; autoFilledKeys.push('hydroSourceType'); }
                    if (hydroPreAnalysisData.potentialSourceType === HydroSourceType.DRINKING_WATER_PIPELINE) {
                        if (hydroPreAnalysisData.estimatedPipeDiameterInches) { updates.hydroPipeDiameter = String(hydroPreAnalysisData.estimatedPipeDiameterInches); autoFilledKeys.push('hydroPipeDiameter'); }
                        if (hydroPreAnalysisData.estimatedPressurePSI) { updates.hydroPressureDrop = String(hydroPreAnalysisData.estimatedPressurePSI); autoFilledKeys.push('hydroPressureDrop'); }
                        if (hydroPreAnalysisData.estimatedFlowGPM) { updates.hydroPipeFlow = String(hydroPreAnalysisData.estimatedFlowGPM); autoFilledKeys.push('hydroPipeFlow'); }
                    }
                }
                
                if (Object.keys(updates).length > 0) {
                    onBulkDataChange(updates, autoFilledKeys);
                }
            } else {
                setAnalysisError("The AI could not parse the provided data. Please ensure it's copied correctly and try again.");
            }
        } catch (error) {
            console.error("Failed to analyze location data:", error);
            setAnalysisError(error instanceof Error ? error.message : "An error occurred during analysis. Please try again.");
        } finally {
            setIsLocating(false);
            setMapStatus('idle');
        }
    }, [formData.role, pastedText, pastedImage, onDataChange, onBulkDataChange]);

    const startAnalysisCountdown = useCallback((coords: { lat: number; lon: number }, address: string) => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        analysisPayloadRef.current = { coords, address };
        setMapStatus('countdown');
        setCountdown(3);

        countdownRef.current = window.setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!);
                    if (analysisPayloadRef.current) {
                        handleAnalyze(analysisPayloadRef.current.coords, analysisPayloadRef.current.address);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleAnalyze]);

    useEffect(() => {
        if (!locationCoords) return;

        let isCancelled = false;
        const processNewCoords = async () => {
            setIsLocating(true);
            setAnalysisError(null);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setMapStatus('analyzing');

            try {
                const address = await geminiService.reverseGeocode(locationCoords.lat, locationCoords.lon);
                if (isCancelled) return;

                if (address) {
                    setAddressInput(address);
                    onDataChange('location', address);
                    startAnalysisCountdown(locationCoords, address);
                } else {
                    throw new Error('No address found. Please click closer to a street or building.');
                }
            } catch (error) {
                if (isCancelled) return;
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during reverse geocoding.";
                setAnalysisError(errorMessage);
                setMapStatus('idle');
                setIsLocating(false);
            }
        };

        processNewCoords();
        return () => { isCancelled = true; };
    }, [locationCoords, onDataChange, startAnalysisCountdown]);

    const handleLocationSelect = useCallback((lat: number, lon: number) => {
        if (!formData.role || isLocating) return;
        setLocationCoords({ lat, lon });
    }, [formData.role, isLocating]);

    const handleUseMyLocation = useCallback(() => {
        if (!formData.role || isLocating) return;
        setIsLocating(true);
        onLocationRequest(
            (position) => setLocationCoords({ lat: position.coords.latitude, lon: position.coords.longitude }),
            (error) => {
                console.error("Geolocation error:", error);
                setAnalysisError("Could not retrieve your location. Please ensure you have granted permission.");
                setIsLocating(false);
            }
        );
    }, [formData.role, onLocationRequest, isLocating]);

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const addressToGeocode = addressInput.trim();
        if (!addressToGeocode || !formData.role || isLocating) return;

        setIsLocating(true);
        setAnalysisError(null);
        
        try {
            const coords = await geminiService.geocodeAddress(addressToGeocode);
            if (coords) {
                setLocationCoords(coords);
            } else {
                setAnalysisError(`Could not find location for "${addressToGeocode}". Please try a different address.`);
                setIsLocating(false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during geocoding.";
            setAnalysisError(errorMessage);
            setIsLocating(false);
        }
    };
    
    useEffect(() => () => { if(countdownRef.current) clearInterval(countdownRef.current) }, []);
    
    const isBusy = isLocating || mapStatus !== 'idle';

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
                            {isLocating ? 'Finding...' : 'Find'}
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

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Find an address, or double-click the map below. After the address is confirmed, analysis will begin.</p>

                <MapDisplay
                    centerCoords={locationCoords}
                    onLocationSelect={handleLocationSelect}
                    analysisStatus={mapStatus}
                    countdown={countdown}
                    disabled={!formData.role}
                />
                 {errors.location && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
            </div>

            {/* Optional Data Input */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
                <button
                    type="button"
                    onClick={() => setShowOptional(!showOptional)}
                    className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    aria-expanded={showOptional}
                >
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Optional: Enhance Analysis with More Data</h3>
                    {showOptional ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
                {showOptional && (
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pasted Text from Project Sunroof</label>
                            <textarea
                                value={pastedText}
                                onChange={(e) => setPastedText(e.target.value)}
                                placeholder="Paste the text summary from your Project Sunroof analysis here..."
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:outline-none min-h-[100px]"
                                disabled={!formData.role}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pasted Image Data (Base64)</label>
                             <textarea
                                value={pastedImage}
                                onChange={(e) => setPastedImage(e.target.value)}
                                placeholder="To add a screenshot, use a free online 'image to base64' converter and paste the resulting text string here."
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:outline-none min-h-[100px]"
                                disabled={!formData.role}
                            />
                        </div>
                        <button onClick={() => locationCoords && formData.location && handleAnalyze(locationCoords, formData.location)} disabled={isBusy || !locationCoords || !formData.role} className="w-full flex items-center justify-center gap-2 px-6 py-2 font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isBusy ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Analyzing...
                                </>
                            ) : (
                               <>
                                 <SparklesIcon className="w-5 h-5" /> Re-Analyze with Added Data
                               </>
                            )}
                        </button>
                    </div>
                )}
            </div>
            
            {analysisError && <p className="text-center text-sm text-red-600 dark:text-red-400">{analysisError}</p>}
            
            <LocationDataSummary loading={isBusy} location={formData.location} sunroof={analysisData?.sunroof} eie={analysisData?.eie} hydro={analysisData?.hydro} role={formData.role} />
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
