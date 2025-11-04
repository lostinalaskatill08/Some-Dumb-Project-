

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { FormData, AnalysisResults, LoadingStates, AnalysisKey, SalesAnalysisKey, AnalysisContent, Project, Run, FormErrors } from './types';
// FIX: Removed unused and undefined type imports LeedCertification, HVACSystem, and RoofType.
import { UserRole, EnergySource } from './types';
import { geminiService } from './services/geminiService';

import Header from './components/Header';
import StepProgressBar from './components/StepProgressBar';
import Step1RoleAndLocation from './components/steps/Step1RoleAndLocation';
import Step2EnergyAudit from './components/steps/Step2EnergyAudit';
import Step2MarketAnalysisInput from './components/steps/Step2MarketAnalysisInput';
import Step3Analysis from './components/steps/Step3Analysis';
import Step3MarketAnalysis from './components/steps/Step3MarketAnalysis';
import Step4Summary from './components/steps/Step4Summary';
import Step4Permitting from './components/steps/Step4Permitting';
import Step6Financing from './components/steps/Step6Financing';
import Step6FinalReport from './components/steps/Step6FinalReport';
import Step6SalesSummary from './components/steps/Step6SalesSummary';
import UserGuide from './components/UserGuide';
import LiveConversation from './components/LiveConversation';
import PrintableReport from './components/PrintableReport';
import PrintablePermittingPack from './components/PrintablePermittingPack';
import ProjectManager from './components/ProjectManager';
import SharedReport from './components/SharedReport';


const initialFormData: FormData = {
  // Core
  role: null,
  location: '',
  
  // A) Property Basics
  propertyType: null,
  ownership: null,
  propertyAge: '',
  squareFootage: '',
  stories: '',

  // B) Energy Baseline & Rates
  electricityUsage: '',
  electricityBill: '',
  utilityProvider: '',
  otherFuels: [],
  otherFuelsCost: '',
  estimatedYearlySavings: '',
  
  // C) Roof, Sun, and Site Orientation
  roofType: null,
  roofShape: null,
  roofCondition: null,
  roofPitch: '',
  roofAzimuth: '',
  usableRoofArea: '',
  solarSystemSizeKw: '',
  shading: '',
  yardSize: '',
  
  // D) Existing HVAC & Water Heating
  heatingSystem: null,
  heatingSystemAge: '',
  coolingSystem: null,
  coolingSystemAge: '',
  waterHeater: null,
  waterHeaterAge: '',
  ductworkCondition: null,

  // E) Electrical & Interconnection
  mainServiceSize: '',
  panelSpaces: '',
  serviceVoltage: null,
  batteryGenerator: null,

  // F) Envelope & Windows
  atticInsulation: null,
  wallInsulation: null,
  windowType: null,
  airSealing: null,

  // G) Site Constraints & Risks
  zoningConstraints: [],
  hazardExposure: [],
  noiseSensitivity: null,
  internetConnectivity: null,
  
  // H) Occupancy & Load Shape
  occupancyPattern: null,
  thermostatCooling: '',
  thermostatHeating: '',
  evCount: '',

  // I) Goals & Priorities
  primaryGoals: [],
  budgetRange: null,
  preferredFinancing: [],

  // J) Hydropower Potential
  hydroSourceType: null,
  hydroHoursPerYear: '',
  hydroSiteDescription: '',
  hydroDesignFlow: '',
  hydroDesignFlowUnit: null,
  hydroGrossHead: '',
  hydroGrossHeadUnit: null,
  hydroEstimatedLosses: null,
  hydroCustomLosses: '',
  hydroMinInstreamFlow: '',
  hydroMinInstreamFlowUnit: null,
  hydroDebrisLevel: null,
  hydroDistanceToService: '',
  hydroDistanceToServiceUnit: null,
  hydroPipeDiameter: '',
  hydroPipeDiameterUnit: null,
  hydroPipeFlow: '',
  hydroPipeFlowUnit: null,
  hydroPressureDrop: '',
  hydroPressureDropUnit: null,
  hydroMinServicePressure: '',
  hydroMinServicePressureUnit: null,
  hydroPipeMaterial: null,
  hydroPrvOnSite: null,
  hydroScadaNeeded: null,
  hydroOperationMode: null,
  
  // K) Role-Specific Fields
  communityNumberOfHomes: '',
  communityTotalEnergyUsage: '',
  communityRegionSize: '',
  communityPopulation: '',
  communityKeyIndustries: '',
  developerProjectPhase: null,
  developerNumberOfBuildings: '',
  
  // Specialized Fields (Legacy)
  foodWaste: '',
  waterFlow: '',
  waterHead: '',
  proximityToWater: '',
  pipeSize: '',
  waterPressure: '',

  // Sales Flow
  sellingTechnology: null,
  selectedTechnologies: [],
  selectedPortfolioProducts: [],

  // Data from location analysis
  sunroofData: null,
  eieData: null,
  autoFilledFields: [],
};

const initialAnalysisResults: AnalysisResults = {
  energyAudit: { text: '', sources: [] },
  weatherization: { text: '', sources: [] },
  solar: { text: '', sources: [] },
  wind: { text: '', sources: [] },
  battery: { text: '', sources: [] },
  wasteToEnergy: { text: '', sources: [] },
  hydro: { text: '', sources: [] },
  inPipeHydro: { text: '', sources: [] },
  geothermal: { text: '', sources: [] },
  miniSplit: { text: '', sources: [] },
  buildingMaterials: { text: '', sources: [] },
  portfolio: { text: '', sources: [] },
  permitting: { text: '', sources: [] },
  financing: { text: '', sources: [] },
  summary: { text: '', sources: [] },
  finalReport: { text: '', sources: [] },
  marketAnalysis: { text: '', sources: [] },
  salesTargetMarket: { text: '', sources: [] },
  salesSellingPoints: { text: '', sources: [] },
  salesOutreach: { text: '', sources: [] },
  salesSummary: { text: '', sources: [] },
};

const initialLoadingStates: LoadingStates = Object.keys(initialAnalysisResults).reduce((acc, key) => {
    acc[key as keyof AnalysisResults] = false;
    return acc;
}, {} as LoadingStates);


const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>(initialAnalysisResults);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(initialLoadingStates);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [currentStep, setCurrentStep] = useState(1);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [conversationContext, setConversationContext] = useState<'GUIDANCE' | 'SUMMARY'>('GUIDANCE');
  
  // New state for project management and sharing
  const [isShareView, setIsShareView] = useState(false);
  const [sharedData, setSharedData] = useState<{ formData: FormData, analysisResults: AnalysisResults } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showRestoreSession, setShowRestoreSession] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  // Load projects and check for session on initial mount
  useEffect(() => {
    // Check for shared link first
    const urlParams = new URLSearchParams(window.location.search);
    const shareData = urlParams.get('share');
    if (shareData) {
      try {
        const decodedData = JSON.parse(atob(shareData));
        if (decodedData.formData && decodedData.analysisResults) {
          setSharedData(decodedData);
          setIsShareView(true);
          return; // Stop further processing if in share view
        }
      } catch (e) {
        console.error("Failed to parse share data:", e);
      }
    }
    
    // Load saved projects
    const savedProjects = localStorage.getItem('green-energy-analyzer-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    // Check for restorable session
    const lastSession = localStorage.getItem('green-energy-analyzer-session');
    if (lastSession) {
      setShowRestoreSession(true);
    }
  }, []);

  // Autosave functionality
  useEffect(() => {
    if (isShareView) return; // Don't autosave in share view

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveStatus('saving');
    saveTimeoutRef.current = window.setTimeout(() => {
      localStorage.setItem('green-energy-analyzer-session', JSON.stringify({ formData, analysisResults, currentStep, activeProjectId }));
      setSaveStatus('saved');
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, analysisResults, currentStep, activeProjectId, isShareView]);

  const handleRestoreSession = (restore: boolean) => {
    if (restore) {
      const lastSession = localStorage.getItem('green-energy-analyzer-session');
      if (lastSession) {
        const { formData, analysisResults, currentStep, activeProjectId } = JSON.parse(lastSession);
        setFormData(formData);
        setAnalysisResults(analysisResults);
        setCurrentStep(currentStep);
        setActiveProjectId(activeProjectId);
      }
    } else {
      localStorage.removeItem('green-energy-analyzer-session');
    }
    setShowRestoreSession(false);
  };
  
  const isSalesFlow = formData.role === UserRole.SALES;

  const regularSteps = ['Role', 'Details', 'Permitting', 'Analysis', 'Financing', 'Summary', 'Report'];
  const salesSteps = ['Role', 'Technology', 'Market', 'Selling Points', 'Outreach', 'Playbook'];
  
  const currentFlowSteps = isSalesFlow ? salesSteps : regularSteps;

  const handleDataChange = useCallback((field: keyof FormData, value: any) => {
    // Clear error for the field being changed for better UX
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (Array.isArray(formData[field])) {
        const newArray = (formData[field] as string[]).includes(value)
            ? (formData[field] as string[]).filter(item => item !== value)
            : [...(formData[field] as string[]), value];
        setFormData(prev => ({...prev, [field]: newArray }));
    } else {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, [errors, formData]);

  const handleBulkDataChange = useCallback((updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[] = []) => {
    setFormData(prev => {
        const newFormData = { ...prev, ...updates };
        if (autoFilledKeys.length > 0) {
            const existingAutoFilled = prev.autoFilledFields || [];
            newFormData.autoFilledFields = [...new Set([...existingAutoFilled, ...autoFilledKeys])];
        }
        return newFormData;
    });
  }, []);

  const runAnalysis = async (isNewRun: boolean = true) => {
    const fullAnalysisRun = {
      formData,
      analysisResults,
      timestamp: Date.now()
    };
    // If it's a new run for a saved project, add it to the project history
    if (isNewRun && activeProjectId) {
      const updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, runs: [...p.runs, fullAnalysisRun], updatedAt: Date.now() };
        }
        return p;
      });
      setProjects(updatedProjects);
      localStorage.setItem('green-energy-analyzer-projects', JSON.stringify(updatedProjects));
    }
  };

  const runRegularAnalysis = useCallback(async () => {
    setError(null);
    const analysisContext = geminiService.generateAnalysisContext(formData, analysisResults.permitting.text);

    const analysisTasks: { key: AnalysisKey; task: Promise<AnalysisContent> }[] = [
        { key: 'energyAudit', task: geminiService.getEnergyAudit(analysisContext, formData.role) },
        { key: 'solar', task: geminiService.getSolarAnalysis(analysisContext, formData.role) },
        { key: 'wind', task: geminiService.getWindAnalysis(analysisContext, formData.role) },
        { key: 'buildingMaterials', task: geminiService.getBuildingMaterialsAnalysis(analysisContext, formData.role) },
    ];

    if (formData.propertyAge) {
      analysisTasks.push({ key: 'weatherization', task: geminiService.getWeatherizationAnalysis(analysisContext, formData.role) });
    }
    if (formData.squareFootage) {
        analysisTasks.push({ key: 'miniSplit', task: geminiService.getMiniSplitAnalysis(analysisContext, formData.role) });
    }
    if (formData.role && (formData.role === UserRole.POLICYMAKER || formData.role === UserRole.COMMUNITY) && formData.foodWaste) {
        analysisTasks.push({ key: 'wasteToEnergy', task: geminiService.getWasteToEnergyAnalysis(analysisContext, formData.role) });
    }
    
    if (formData.hydroSourceType) {
        analysisTasks.push({ key: 'hydro', task: geminiService.getHydroAnalysis(analysisContext, formData.role) });
    }

    analysisTasks.push({ key: 'geothermal', task: geminiService.getGeothermalAnalysis(analysisContext, formData.role) });
    
    setLoadingStates(prev => {
        const newStates = { ...prev };
        analysisTasks.forEach(({ key }) => { newStates[key as keyof LoadingStates] = true; });
        newStates.battery = true;
        newStates.portfolio = true;
        return newStates;
    });

    const resultsArray = await Promise.allSettled(analysisTasks.map(t => t.task));

    let intermediateResults: Partial<AnalysisResults> = {};
    resultsArray.forEach((result, index) => {
        const key = analysisTasks[index].key;
        if (result.status === 'fulfilled') {
            setAnalysisResults(prev => ({ ...prev, [key]: result.value }));
            intermediateResults[key as keyof AnalysisResults] = result.value;
        } else {
            console.error(`Analysis for ${key} failed:`, result.reason);
            setAnalysisResults(prev => ({ ...prev, [key]: { text: `Error: Analysis failed.`, sources: [] } }));
        }
        setLoadingStates(prev => ({ ...prev, [key as keyof LoadingStates]: false }));
    });
    
    const renewableGenerationAnalysis = `${intermediateResults.solar?.text || ''}\n${intermediateResults.wind?.text || ''}\n${intermediateResults.hydro?.text || ''}`;
    if (renewableGenerationAnalysis.trim()) {
        try {
            const batteryResult = await geminiService.getBatteryAnalysis(analysisContext, formData.role, renewableGenerationAnalysis);
            setAnalysisResults(prev => ({ ...prev, battery: batteryResult }));
        } catch (e) { console.error('Battery analysis failed:', e); }
        finally { setLoadingStates(prev => ({ ...prev, battery: false })); }
    } else {
        setLoadingStates(prev => ({ ...prev, battery: false }));
    }

    const fullAnalysisText = Object.values(intermediateResults).map(r => r?.text || '').join('\n---\n');
    try {
        const portfolioResult = await geminiService.getPortfolioAnalysis(analysisContext, formData.role, fullAnalysisText);
        setAnalysisResults(prev => ({ ...prev, portfolio: portfolioResult }));
    } catch (e) { console.error('Portfolio analysis failed:', e); }
    finally { setLoadingStates(prev => ({ ...prev, portfolio: false })); }

    runAnalysis();
  }, [formData, analysisResults.permitting.text]);
  
  const runSalesAnalysis = useCallback(async () => {
      setError(null);
      try {
          setLoadingStates(prev => ({ ...prev, salesTargetMarket: true }));
          const targetMarket = await geminiService.getSalesTargetMarket(formData);
          setAnalysisResults(prev => ({ ...prev, salesTargetMarket: targetMarket }));
          setLoadingStates(prev => ({ ...prev, salesTargetMarket: false }));
          
          setCurrentStep(4);
          setLoadingStates(prev => ({ ...prev, salesSellingPoints: true }));
          const sellingPoints = await geminiService.getSalesSellingPoints(formData, targetMarket.text);
          setAnalysisResults(prev => ({ ...prev, salesSellingPoints: sellingPoints }));
          setLoadingStates(prev => ({ ...prev, salesSellingPoints: false }));

          setCurrentStep(5);
          setLoadingStates(prev => ({ ...prev, salesOutreach: true }));
          const outreach = await geminiService.getSalesOutreach(formData, `${targetMarket.text}\n${sellingPoints.text}`);
          setAnalysisResults(prev => ({ ...prev, salesOutreach: outreach }));
          setLoadingStates(prev => ({ ...prev, salesOutreach: false }));

          setCurrentStep(6);
          setLoadingStates(prev => ({ ...prev, salesSummary: true }));
          const fullSalesAnalysis = `${targetMarket.text}\n\n${sellingPoints.text}\n\n${outreach.text}`;
          const summary = await geminiService.getSalesSummary(fullSalesAnalysis);
          setAnalysisResults(prev => ({ ...prev, salesSummary: summary }));
          setLoadingStates(prev => ({ ...prev, salesSummary: false }));
          
          runAnalysis();
      } catch (e) {
          console.error("Sales analysis flow failed:", e);
setError(e instanceof Error ? e.message : 'An unknown error occurred during sales analysis.');
          setLoadingStates(initialLoadingStates);
      }
  }, [formData]);

  const runPermittingAnalysis = useCallback(async () => {
    setLoadingStates(prev => ({...prev, permitting: true }));
    try {
        const res = await geminiService.getPermittingAnalysis(formData);
        setAnalysisResults(prev => ({...prev, permitting: res}));
    } catch(e) {
        console.error("Failed to generate permitting analysis:", e);
        setError("Could not generate the permitting and incentives guide.");
    } finally {
        setLoadingStates(prev => ({...prev, permitting: false}));
    }
  }, [formData]);

  const runSummary = useCallback(async () => {
    const fullAnalysisText = Object.entries(analysisResults)
        .filter(([key]) => !['summary', 'finalReport', 'financing'].includes(key) && key.indexOf('sales') === -1)
        .map(([, value]) => (value as AnalysisContent).text).join('\n---\n');
    
    setLoadingStates(prev => ({...prev, summary: true }));
    try {
        const analysisContext = geminiService.generateAnalysisContext(formData, analysisResults.permitting.text);
        const summaryRes = await geminiService.getSummary(analysisContext, fullAnalysisText);
        setAnalysisResults(prev => ({...prev, summary: summaryRes}));
    } catch(e) {
        console.error("Failed to generate summary:", e);
    } finally {
        setLoadingStates(prev => ({...prev, summary: false}));
    }
  }, [formData, analysisResults]);
  
  const runFinancing = useCallback(async () => {
    setLoadingStates(prev => ({...prev, financing: true }));
    try {
        const analysisContext = geminiService.generateAnalysisContext(formData, analysisResults.permitting.text);
        const financingRes = await geminiService.getFinancingAnalysis(analysisContext, formData.role);
        setAnalysisResults(prev => ({...prev, financing: financingRes}));
    } catch(e) {
        console.error("Failed to generate financing:", e);
    } finally {
        setLoadingStates(prev => ({...prev, financing: false}));
    }
  }, [formData, analysisResults.permitting.text]);

  const runFinalReport = useCallback(async () => {
    const fullAnalysisText = Object.entries(analysisResults)
        .filter(([key]) => !['summary', 'finalReport', 'financing'].includes(key) && key.indexOf('sales') === -1)
        .map(([, value]) => (value as AnalysisContent).text).join('\n---\n');
    
    setLoadingStates(prev => ({...prev, finalReport: true}));
    try {
        const analysisContext = geminiService.generateAnalysisContext(formData, analysisResults.permitting.text);
        const finalReportRes = await geminiService.getFinalReport(analysisContext, fullAnalysisText);
        setAnalysisResults(prev => ({...prev, finalReport: finalReportRes}));
    } catch(e) {
        console.error("Failed to generate final report:", e);
    } finally {
        setLoadingStates(prev => ({...prev, finalReport: false}));
    }
  }, [formData, analysisResults]);


  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    switch(currentStep) {
        case 1:
            if (!formData.role) newErrors.role = 'Please select a role.';
            if (!formData.location.trim()) newErrors.location = 'Please enter a location.';
            break;
        case 2:
            if(isSalesFlow) {
                if(!formData.sellingTechnology) newErrors.sellingTechnology = 'Please select a technology to continue.';
            } else {
                 const numericFields: (keyof FormData)[] = [
                    'propertyAge', 'squareFootage', 'stories', 'electricityUsage', 'electricityBill',
                    'otherFuelsCost', 'roofPitch', 'roofAzimuth', 'usableRoofArea', 'shading',
                    'yardSize', 'heatingSystemAge', 'coolingSystemAge', 'waterHeaterAge', 'mainServiceSize',
                    'panelSpaces', 'thermostatCooling', 'thermostatHeating', 'evCount', 'foodWaste', 'hydroHoursPerYear',
                    'hydroDesignFlow', 'hydroGrossHead', 'hydroCustomLosses', 'hydroMinInstreamFlow', 'hydroDistanceToService',
                    'hydroPipeDiameter', 'hydroPipeFlow', 'hydroPressureDrop', 'hydroMinServicePressure', 'communityNumberOfHomes',
                    'communityTotalEnergyUsage', 'communityRegionSize', 'communityPopulation', 'developerNumberOfBuildings',
                    'solarSystemSizeKw', 'estimatedYearlySavings'
                ];
                numericFields.forEach(field => {
                    const value = formData[field] as string;
                    if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                        newErrors[field] = 'Please enter a valid, positive number.';
                    }
                });
            }
            break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = useCallback(() => {
    if (!validateForm()) return;

    const nextStep = currentStep + 1;
    if (isSalesFlow) {
        if (nextStep === 3) {
            runSalesAnalysis(); // This function will now manage its own step progression
        }
    } else {
        if (nextStep === 3) runPermittingAnalysis();
        if (nextStep === 4) runRegularAnalysis();
        if (nextStep === 5) runFinancing();
        if (nextStep === 6) runSummary();
        if (nextStep === 7) runFinalReport();
    }
    if (currentStep < currentFlowSteps.length) {
      setCurrentStep(nextStep);
    }
  }, [currentStep, formData, isSalesFlow, runPermittingAnalysis, runRegularAnalysis, runSalesAnalysis, runSummary, runFinancing, runFinalReport, currentFlowSteps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setErrors({}); // Clear errors when going back
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const startOver = () => {
      setCurrentStep(1);
      setFormData(initialFormData);
      setAnalysisResults(initialAnalysisResults);
      setLoadingStates(initialLoadingStates);
      setError(null);
      setErrors({});
      setActiveProjectId(null);
      localStorage.removeItem('green-energy-analyzer-session');
  };
  
  const handleStartConversation = (context: 'GUIDANCE' | 'SUMMARY') => {
      setConversationContext(context);
      setIsConversationOpen(true);
  };
  
  const isAnalyzing = Object.values(loadingStates).some(Boolean);

  const renderCurrentStep = () => {
    const stepComponentMap = [
        // Regular Flow
        { step: 1, flow: 'regular', component: <Step1RoleAndLocation formData={formData} onDataChange={handleDataChange} onBulkDataChange={handleBulkDataChange} errors={errors} onStartConversation={() => handleStartConversation('GUIDANCE')} onLocationRequest={(onSuccess, onError) => navigator.geolocation.getCurrentPosition(onSuccess, onError)} /> },
        { step: 2, flow: 'regular', component: <Step2EnergyAudit formData={formData} onDataChange={handleDataChange} errors={errors} /> },
        { step: 3, flow: 'regular', component: <Step4Permitting result={analysisResults.permitting} loading={loadingStates.permitting} error={error} /> },
        { step: 4, flow: 'regular', component: <Step3Analysis results={analysisResults} loadingStates={loadingStates} error={error} formData={formData} onDataChange={handleDataChange} /> },
        { step: 5, flow: 'regular', component: <Step6Financing result={analysisResults.financing} loading={loadingStates.financing} error={error} /> },
        { step: 6, flow: 'regular', component: <Step4Summary summary={analysisResults.summary} loading={loadingStates.summary} error={error} onStartConversation={() => handleStartConversation('SUMMARY')} /> },
        { step: 7, flow: 'regular', component: <Step6FinalReport result={analysisResults.finalReport} loading={loadingStates.finalReport} error={error} shareData={{formData, analysisResults}} /> },
        
        // Sales Flow
        { step: 2, flow: 'sales', component: <Step2MarketAnalysisInput formData={formData} onDataChange={handleDataChange} errors={errors} /> },
        { step: 3, flow: 'sales', component: <Step3MarketAnalysis result={analysisResults.salesTargetMarket} loading={loadingStates.salesTargetMarket} error={error} /> },
        { step: 4, flow: 'sales', component: <Step3MarketAnalysis result={analysisResults.salesSellingPoints} loading={loadingStates.salesSellingPoints} error={error} /> },
        { step: 5, flow: 'sales', component: <Step3MarketAnalysis result={analysisResults.salesOutreach} loading={loadingStates.salesOutreach} error={error} /> },
        { step: 6, flow: 'sales', component: <Step6SalesSummary result={analysisResults.salesSummary} loading={loadingStates.salesSummary} error={error} onStartConversation={() => handleStartConversation('SUMMARY')} shareData={{formData, analysisResults}} /> },
    ];
    
    const flowType = isSalesFlow ? 'sales' : 'regular';
    
    return stepComponentMap.find(c => c.step === currentStep && (c.flow === flowType || c.step === 1))?.component || null;
  };
  
  useEffect(() => {
    if (isSalesFlow && currentStep > 2 && !formData.sellingTechnology) {
        handleBack();
    }
  }, [isSalesFlow, currentStep, formData.sellingTechnology, handleBack]);
  
  // --- Project Management Functions ---
  const saveCurrentProject = (name: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runs: [{ formData, analysisResults, timestamp: Date.now() }],
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setActiveProjectId(newProject.id);
    localStorage.setItem('green-energy-analyzer-projects', JSON.stringify(updatedProjects));
  };
  
  const loadProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project && project.runs.length > 0) {
      const latestRun = project.runs[project.runs.length - 1];
      setFormData(latestRun.formData);
      setAnalysisResults(latestRun.analysisResults);
      setActiveProjectId(id);
      setCurrentStep(1); // Reset to first step
      setIsProjectsModalOpen(false);
    }
  };
  
  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('green-energy-analyzer-projects', JSON.stringify(updatedProjects));
    if (activeProjectId === id) {
      startOver();
    }
  };

  const renameProject = (id: string, newName: string) => {
    const updatedProjects = projects.map(p => p.id === id ? { ...p, name: newName } : p);
    setProjects(updatedProjects);
    localStorage.setItem('green-energy-analyzer-projects', JSON.stringify(updatedProjects));
  };

  if (isShareView && sharedData) {
    return <SharedReport sharedData={sharedData} />;
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans p-4 sm:p-6 lg:p-8">
        {showRestoreSession && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center">
                    <h3 className="text-lg font-bold mb-2">Restore Previous Session?</h3>
                    <p className="mb-4">It looks like you have unsaved progress. Would you like to restore it?</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => handleRestoreSession(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Restore</button>
                        <button onClick={() => handleRestoreSession(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">Start Fresh</button>
                    </div>
                </div>
            </div>
        )}
        <div className="max-w-5xl mx-auto space-y-8">
          <Header onToggleGuide={() => setIsGuideOpen(true)} onToggleProjects={() => setIsProjectsModalOpen(true)} saveStatus={saveStatus} />
          
          {formData.role && (
            <div className="px-4">
              <StepProgressBar currentStep={currentStep} totalSteps={currentFlowSteps.length} steps={currentFlowSteps} />
            </div>
          )}

          <main className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            {renderCurrentStep()}
          </main>

          {formData.role && (
            <footer className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              
              {currentStep === currentFlowSteps.length ? (
                 <button onClick={startOver} className="px-6 py-3 font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Start New Analysis
                 </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isAnalyzing}
                  className="px-6 py-3 font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Next'}
                </button>
              )}
            </footer>
          )}
        </div>
      </div>
      <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      {isConversationOpen && <LiveConversation context={conversationContext} summary={analysisResults.summary} onClose={() => setIsConversationOpen(false)} />}
      <PrintableReport formData={formData} analysisResults={analysisResults} />
      <PrintablePermittingPack formData={formData} analysisContent={analysisResults.permitting} />
      <ProjectManager
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onLoadProject={loadProject}
        onSaveNewProject={saveCurrentProject}
        onDeleteProject={deleteProject}
        onNewProject={startOver}
        onRenameProject={renameProject}
        currentFormData={formData}
      />
    </>
  );
};

export default App;