// FIX: Removed circular dependency and added missing enum exports.
export enum UserRole {
  HOMEOWNER = 'Homeowner',
  COMMUNITY = 'Community Organizer',
  POLICYMAKER = 'Policymaker',
  SALES = 'Sales Professional / Consultant',
  DEVELOPER = 'Developer'
}

export enum PropertyType {
  SINGLE_FAMILY = 'Single-family',
  MULTI_FAMILY = 'Multi-family',
  SMALL_BUSINESS = 'Small business',
  SCHOOL = 'School',
  FARM = 'Farm',
  NONPROFIT = 'Nonprofit',
}

export enum Ownership {
  OWNER_OCCUPIED = 'Owner-occupied',
  LANDLORD = 'Landlord',
  TENANT = 'Tenant',
  HOA_BOARD = 'HOA/Board',
}

export enum OtherFuels {
    NATURAL_GAS = 'Natural gas',
    PROPANE = 'Propane',
    OIL = 'Oil',
    NONE = 'None',
}

// FIX: Added missing RoofType enum.
export enum RoofType {
  ASPHALT_SHINGLE = 'Asphalt Shingle',
  METAL = 'Metal',
  TILE = 'Tile (Clay/Concrete)',
  SLATE = 'Slate',
  WOOD_SHAKE = 'Wood Shake',
  FLAT_MEMBRANE = 'Flat (Membrane/TPO/EPDM)',
}

export enum RoofShape {
  GABLE = 'Gable (A-frame / Triangle)',
  HIP = 'Hip (Multi-surface)',
  FLAT = 'Flat / Low-slope',
  SHED = 'Shed (Single slope)',
  COMPLEX = 'Complex (Multiple shapes)',
}

export enum RoofCondition {
    NEW_GOOD = 'New/Good',
    FAIR = 'Fair',
    NEAR_REPLACEMENT = 'Near replacement',
}

export enum HeatingSystem {
    GAS_FURNACE = 'Gas furnace',
    ELECTRIC_RESISTANCE = 'Electric resistance',
    HEAT_PUMP = 'Heat pump',
    BOILER = 'Boiler',
    SPACE_HEATER = 'Space heater',
    OTHER = 'Other',
}

export enum CoolingSystem {
    CENTRAL_AC = 'Central AC',
    MINI_SPLIT = 'Mini-split',
    WINDOW_UNITS = 'Window units',
    NONE = 'None',
}

export enum WaterHeater {
    GAS_TANK = 'Gas tank',
    ELECTRIC_TANK = 'Electric tank',
    HEAT_PUMP_WATER_HEATER = 'Heat pump water heater',
    TANKLESS_GAS = 'Tankless gas',
    TANKLESS_ELECTRIC = 'Tankless electric',
}

export enum DuctworkCondition {
    TIGHT = 'Tight',
    AVERAGE = 'Average',
    LEAKY = 'Leaky/needs seal',
}

export enum ServiceVoltage {
    RESIDENTIAL = '120/240V 1-phase',
    COMMERCIAL_LOW = '208/120V 3-phase',
    COMMERCIAL_HIGH = '480/277V 3-phase',
    OTHER = 'Other',
}

export enum BatteryGenerator {
    NONE = 'None',
    BATTERY = 'Battery',
    GENERATOR = 'Generator',
    BOTH = 'Both',
}

export enum AtticInsulation {
    UNKNOWN = 'Unknown',
    R13 = 'R-13',
    R19 = 'R-19',
    R30 = 'R-30',
    R38_PLUS = 'R-38+',
}

export enum WallInsulation {
    UNKNOWN = 'Unknown',
    UNINSULATED = 'Uninsulated',
    PARTIAL = 'Partial',
    CODE_PLUS = 'Code+',
}

export enum WindowType {
    SINGLE_PANE = 'Single pane',
    DOUBLE_PANE = 'Double pane',
    LOW_E = 'Low-E',
    TRIPLE_PANE = 'Triple pane',
}

export enum AirSealing {
    UNKNOWN = 'Unknown',
    DRAFTY = 'Drafty',
    AVERAGE = 'Average',
    TIGHT = 'Tight',
}

export enum NoiseSensitivity {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
}

export enum InternetConnectivity {
    RELIABLE_WIFI = 'Reliable Wi-Fi',
    CELLULAR_ONLY = 'Cellular only',
    NONE = 'None',
}

export enum OccupancyPattern {
    HOME_ALL_DAY = 'Home all day',
    EVENINGS_WEEKENDS = 'Evenings/weekends',
    MIXED = 'Mixed',
}

export enum BudgetRange {
    UNDER_5K = 'Under $5k',
    FROM_5K_TO_15K = '$5k–$15k',
    FROM_15K_TO_30K = '$15k–$30k',
    FROM_30K_TO_60K = '$30k–$60k',
    OVER_60K = '$60k+',
}

export enum PreferredFinancing {
    CASH = 'Cash',
    LOAN = 'Loan',
    MORTGAGE_ADDON = 'Mortgage add-on/EEM',
    C_PACE = 'C-PACE',
    ON_BILL = 'On-bill',
    GRANTS_ONLY = 'Grants only',
}

export enum PrimaryGoal {
    LOWER_BILLS = 'Lower bills',
    BACKUP_POWER = 'Backup power',
    COMFORT = 'Comfort',
    CARBON_REDUCTION = 'Carbon reduction',
    INCREASE_HOME_VALUE = 'Increase home value',
}

export enum EnergySource {
  SOLAR = 'Solar',
  WIND = 'Wind',
  GEOTHERMAL = 'Geothermal',
  HYDRO = 'Hydropower',
  BATTERY = 'Battery Storage',
  BUILDING_MATERIALS = 'Building Materials',
  MINI_SPLIT = 'Mini-Split Heat Pumps',
  WASTE_TO_ENERGY = 'Waste-to-Energy',
}

// Hydropower Specific Enums
export enum HydroSourceType {
    RIVER_STREAM = 'River/Stream',
    IRRIGATION_CANAL = 'Irrigation Canal',
    DRINKING_WATER_PIPELINE = 'Drinking-Water Pipeline',
    WASTEWATER_PROCESS_PIPELINE = 'Wastewater/Process Pipeline',
}
export enum FlowUnit { CFS = 'cfs', LPS = 'L/s' }
export enum HeadUnit { FT = 'ft', M = 'm' }
export enum LossEstimate { TEN = '10%', FIFTEEN = '15%', TWENTY = '20%', CUSTOM = 'Custom %' }
export enum DebrisLevel { LOW = 'Low', MEDIUM = 'Medium', HIGH = 'High' }
export enum DistanceUnit { FT = 'ft', M = 'm' }
export enum DiameterUnit { IN = 'in', MM = 'mm' }
export enum PipeFlowUnit { GPM = 'gpm', LPS = 'L/s' }
export enum PressureUnit { PSI = 'psi', KPA = 'kPa' }
export enum PipeMaterial { DUCTILE_IRON = 'Ductile Iron', PVC = 'PVC', STEEL = 'Steel', HDPE = 'HDPE', UNKNOWN = 'Unknown' }
export enum YesNoUnknown { YES = 'Yes', NO = 'No', UNKNOWN = 'Unknown' }
export enum OperationMode { GRID_TIED = 'Grid-Tied (offset/export)', OFF_GRID = 'Off-Grid / Local Load Only' }

// Role-Specific Enums
export enum ProjectPhase { PLANNING = 'Planning', NEW_CONSTRUCTION = 'New Construction', RETROFIT = 'Retrofit' }

export interface SunroofData {
  usableSunlightHours: string | null;
  usableRoofArea: string | null;
  potentialSystemSizeKw: string | null;
  potentialYearlySavings: string | null;
  roofPitch?: string | null;
  rawText: string;
}

export interface EieData {
  buildingEmissions: string;
  transportationEmissions: string;
  renewablePotential: string;
  rawText: string;
}

export interface HydroPreAnalysisData {
  potentialSourceType: HydroSourceType | null;
  nearestWaterBody: string;
  distance: string;
  summaryText: string;
  estimatedPipeDiameterInches?: number | null;
  estimatedPressurePSI?: number | null;
  estimatedFlowGPM?: number | null;
}

export interface FormData {
  // Core
  role: UserRole | null;
  location: string;
  
  // A) Property Basics
  propertyType: PropertyType | null;
  ownership: Ownership | null;
  propertyAge: string;
  squareFootage: string;
  stories: string;

  // B) Energy Baseline & Rates
  electricityUsage: string;
  electricityBill: string;
  utilityProvider: string;
  otherFuels: OtherFuels[];
  otherFuelsCost: string;
  estimatedYearlySavings: string;
  
  // C) Roof, Sun, and Site Orientation
  roofType: RoofType | null;
  roofShape: RoofShape | null;
  roofCondition: RoofCondition | null;
  roofPitch: string;
  roofAzimuth: string;
  usableRoofArea: string;
  solarSystemSizeKw: string;
  shading: string;
  yardSize: string;
  
  // D) Existing HVAC & Water Heating
  heatingSystem: HeatingSystem | null;
  heatingSystemAge: string;
  coolingSystem: CoolingSystem | null;
  coolingSystemAge: string;
  waterHeater: WaterHeater | null;
  waterHeaterAge: string;
  ductworkCondition: DuctworkCondition | null;

  // E) Electrical & Interconnection
  mainServiceSize: string;
  panelSpaces: string;
  serviceVoltage: ServiceVoltage | null;
  batteryGenerator: BatteryGenerator | null;

  // F) Envelope & Windows
  atticInsulation: AtticInsulation | null;
  wallInsulation: WallInsulation | null;
  windowType: WindowType | null;
  airSealing: AirSealing | null;

  // G) Site Constraints & Risks
  zoningConstraints: string[];
  hazardExposure: string[];
  noiseSensitivity: NoiseSensitivity | null;
  internetConnectivity: InternetConnectivity | null;
  
  // H) Occupancy & Load Shape
  occupancyPattern: OccupancyPattern | null;
  thermostatCooling: string;
  thermostatHeating: string;
  evCount: string;

  // I) Goals & Priorities
  primaryGoals: PrimaryGoal[];
  budgetRange: BudgetRange | null;
  preferredFinancing: PreferredFinancing[];

  // J) Hydropower Potential
  hydroSourceType: HydroSourceType | null;
  hydroHoursPerYear: string;
  hydroSiteDescription: string;
  // J.1) Run-of-River
  hydroDesignFlow: string;
  hydroDesignFlowUnit: FlowUnit | null;
  hydroGrossHead: string;
  hydroGrossHeadUnit: HeadUnit | null;
  hydroEstimatedLosses: LossEstimate | null;
  hydroCustomLosses: string;
  hydroMinInstreamFlow: string;
  hydroMinInstreamFlowUnit: FlowUnit | null;
  hydroDebrisLevel: DebrisLevel | null;
  hydroDistanceToService: string;
  hydroDistanceToServiceUnit: DistanceUnit | null;
  // J.2) In-Pipe
  hydroPipeDiameter: string;
  hydroPipeDiameterUnit: DiameterUnit | null;
  hydroPipeFlow: string;
  hydroPipeFlowUnit: PipeFlowUnit | null;
  hydroPressureDrop: string;
  hydroPressureDropUnit: PressureUnit | null;
  hydroMinServicePressure: string;
  hydroMinServicePressureUnit: PressureUnit | null;
  hydroPipeMaterial: PipeMaterial | null;
  hydroPrvOnSite: YesNoUnknown | null;
  hydroScadaNeeded: YesNoUnknown | null;
  // J.3) Interconnect
  hydroOperationMode: OperationMode | null;


  // K) Role-Specific Fields
  // K.1) Community / Policymaker
  communityNumberOfHomes: string;
  communityTotalEnergyUsage: string;
  communityRegionSize: string;
  communityPopulation: string;
  communityKeyIndustries: string;
  // K.2) Developer
  developerProjectPhase: ProjectPhase | null;
  developerNumberOfBuildings: string;

  // Specialized Fields (Original)
  foodWaste: string;
  waterFlow: string; // Will be deprecated by new hydro fields
  waterHead: string; // Will be deprecated by new hydro fields
  proximityToWater: string;
  pipeSize: string; // Will be deprecated by new hydro fields
  waterPressure: string; // Will be deprecated by new hydro fields

  // Sales Flow
  sellingTechnology: EnergySource | null;
  selectedTechnologies: EnergySource[];
  selectedPortfolioProducts: string[];

  // Data from location analysis
  sunroofData?: SunroofData | null;
  eieData?: EieData | null;
  hydroPreAnalysisData?: HydroPreAnalysisData | null;
  autoFilledFields?: (keyof FormData)[];
}

export type FormErrors = Partial<Record<keyof FormData, string>>;

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisContent {
  text: string;
  sources: GroundingChunk[];
}

export type AnalysisKey = 'energyAudit' | 'weatherization' | 'solar' | 'wind' | 'battery' | 'wasteToEnergy' | 'hydro' | 'inPipeHydro' | 'geothermal' | 'miniSplit' | 'buildingMaterials' | 'portfolio' | 'permitting' | 'financing' | 'summary' | 'finalReport';

export type SalesAnalysisKey = 'marketAnalysis' | 'salesTargetMarket' | 'salesSellingPoints' | 'salesOutreach' | 'salesSummary';

export type AnalysisResults = Record<AnalysisKey | SalesAnalysisKey, AnalysisContent>;

export type LoadingStates = Record<keyof AnalysisResults, boolean>;

export interface Run {
  formData: FormData;
  analysisResults: AnalysisResults;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  runs: Run[];
}