import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { FormData, AnalysisContent, SunroofData, EieData, HydroPreAnalysisData, GroundingChunk, UserRole } from '../types';
import { 
    HydroSourceType, PropertyType, Ownership, RoofType, RoofShape, RoofCondition, 
    HeatingSystem, CoolingSystem, WaterHeater, DuctworkCondition 
} from '../types';
import { KNOWLEDGE_BASE } from './knowledgeBase';
import { FINANCING_DATA } from './financingData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO = 'gemini-2.5-pro';

/**
 * A wrapper for the native fetch API that adds a timeout.
 * @param {RequestInfo} resource - The resource to fetch.
 * @param {RequestInit & { timeout?: number }} [options] - Fetch options including a timeout in milliseconds.
 * @returns {Promise<Response>} A promise that resolves to the Response from the fetch call.
 * @throws An error if the request times out or fails for other reasons.
 */
const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 15000 } = options; // Default 15-second timeout

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The location service took too long to respond. Please try again.');
    }
    throw error; // Re-throw other errors
  } finally {
    clearTimeout(id);
  }
};

/**
 * Generates a base prompt containing the core user profile, goals, and property information.
 * @param {FormData} formData - The current application form data.
 * @returns {string} A formatted string with the base context.
 */
const generateBasePrompt = (formData: FormData): string => {
    let prompt = `--- USER PROFILE & GOALS ---\n`;
    prompt += `Role: ${formData.role || 'Not specified'}\n`;
    prompt += `Location: ${formData.location || 'Not specified'}\n`;
    prompt += `Primary Goals: ${formData.primaryGoals?.join(', ') || 'Not specified'}\n`;
    prompt += `Budget Range: ${formData.budgetRange || 'Not specified'}\n\n`;
    
    prompt += `--- PROPERTY BASICS ---\n`;
    prompt += `Property Type: ${formData.propertyType || 'Not specified'}\n`;
    prompt += `Property Age: ${formData.propertyAge ? `${formData.propertyAge} years` : 'Not specified'}\n`;
    prompt += `Square Footage: ${formData.squareFootage ? `${formData.squareFootage} sq ft` : 'Not specified'}\n\n`;

    prompt += `--- ENERGY BASELINE ---\n`;
    prompt += `Monthly Electricity Usage: ${formData.electricityUsage ? `${formData.electricityUsage} kWh` : 'Not specified'}\n`;
    prompt += `Monthly Electricity Bill: ${formData.electricityBill ? `$${formData.electricityBill}` : 'Not specified'}\n`;
    prompt += `Utility Provider: ${formData.utilityProvider || 'Not specified'}\n\n`;

    const details: string[] = [];
    if (formData.roofType) details.push(`Roof Type: ${formData.roofType}`);
    if (formData.heatingSystem) details.push(`Heating System: ${formData.heatingSystem}`);
    if (formData.shading) details.push(`Shading: ${formData.shading}%`);
    if (formData.hydroSourceType) details.push(`Hydro Source: ${formData.hydroSourceType}`);

    if (details.length > 0) {
        prompt += `--- ADDITIONAL DETAILS ---\n` + details.join('\n') + '\n';
    }

    return prompt;
};

/**
 * Generates the full analysis context by combining the base prompt, location data, and permitting information.
 * This context is passed to most of the analysis functions.
 * @param {FormData} formData - The current application form data.
 * @param {string} permittingText - The text result from the permitting analysis.
 * @returns {string} A comprehensive context string for the Gemini API.
 */
const generateAnalysisContext = (formData: FormData, permittingText: string): string => {
    let context = "Here is the complete context for the Green Energy Analysis. Use all of this information to inform your response.\n\n";
    context += generateBasePrompt(formData);
    
    context += `\n--- PRELIMINARY LOCATION ANALYSIS ---\n`;
    if (formData.sunroofData && formData.sunroofData.rawText) {
        context += `Google Solar API Summary: Usable roof area ${formData.sunroofData.usableRoofArea} sq ft, potential size ${formData.sunroofData.potentialSystemSizeKw} kW, producing ${formData.sunroofData.yearlyProductionDcKwh} kWh/yr.\n`;
    }
    if (formData.eieData && formData.eieData.rawText) {
        context += `Environmental Insights Summary: ${formData.eieData.rawText}\n`;
    }
    if (formData.hydroPreAnalysisData && formData.hydroPreAnalysisData.summaryText) {
        context += `Hydropower Pre-analysis Summary: ${formData.hydroPreAnalysisData.summaryText}\n`;
    }

    context += `\n--- PERMITTING & INCENTIVES CONTEXT ---\n${permittingText}\n\n`;
    return context;
};

/**
 * A generic function to run a query against the Gemini API.
 * @param {string} prompt - The prompt to send to the model.
 * @param {string} [model=MODEL_FLASH] - The model to use (e.g., 'gemini-2.5-flash').
 * @param {boolean} [useSearch=false] - Whether to enable Google Search grounding for the query.
 * @returns {Promise<AnalysisContent>} A promise that resolves to the analysis content, including text and sources.
 * @throws An error if the API call fails.
 */
const runQuery = async (prompt: string, model: string = MODEL_FLASH, useSearch: boolean = false): Promise<AnalysisContent> => {
    try {
        const config: any = {};
        if (useSearch) {
            config.tools = [{ googleSearch: {} }];
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
        });

        const text = response.text;
        const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { text, sources: groundingChunks };
    } catch (e) {
        console.error(`Error running query with model ${model}:`, e);
        if (e instanceof Error) {
           throw new Error(`Failed to get response from Gemini API: ${e.message}`);
        }
        throw new Error('An unknown error occurred while querying the Gemini API.');
    }
};

/**
 * Extracts a JSON object from a string, which may contain markdown code fences.
 * @template T - The expected type of the parsed JSON object.
 * @param {string} text - The text containing the JSON string.
 * @returns {T | null} The parsed JSON object, or null if parsing fails.
 */
const extractJsonFromText = <T>(text: string): T | null => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    let jsonString: string | null = null;
    if (match && match[1]) {
        jsonString = match[1];
    } else {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonString = text.substring(firstBrace, lastBrace + 1);
        }
    }
    if (jsonString) {
        try {
            return JSON.parse(jsonString.trim());
        } catch (e) {
            console.error("Failed to parse extracted JSON string:", e, "String:", jsonString);
            return null;
        }
    }
    return null;
};

/**
 * Converts a street address into geographic coordinates (latitude and longitude) using a deterministic geocoding service.
 * @param {string} address - The street address to geocode.
 * @returns {Promise<{ lat: number; lon: number } | null>} A promise resolving to coordinates or null if not found.
 * @throws An error if the geocoding service call fails.
 */
const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?singleLine=${encodeURIComponent(address)}&maxLocations=1&f=json`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        console.error(`ArcGIS geocode HTTP ${res.status}: ${await res.text()}`);
        throw new Error(`Failed to geocode address. Service returned status ${res.status}.`);
    }
    const data = await res.json();
    const c = data?.candidates?.[0];
    return c?.location ? { lat: c.location.y, lon: c.location.x } : null;
  } catch(error) {
    console.error("Error during geocodeAddress fetch:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not connect to the location service. Please check your network connection.");
  }
};

/**
 * Converts geographic coordinates into a human-readable street address using a deterministic reverse geocoding service.
 * @param {number} lat - The latitude.
 * @param {number} lon - The longitude.
 * @returns {Promise<string | null>} A promise resolving to the address string or null if not found.
 * @throws An error if the reverse geocoding service call fails.
 */
const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lon},${lat}&f=json`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        console.error(`ArcGIS reverseGeocode HTTP ${res.status}: ${await res.text()}`);
        throw new Error(`Failed to find address for coordinates. Service returned status ${res.status}.`);
    }
    const data = await res.json();
    return data?.address?.LongLabel ?? null;
  } catch (error) {
    console.error("Error during reverseGeocode fetch:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not connect to the location service. Please check your network connection.");
  }
};

/**
 * Fetches solar data for a given location using the Google Solar API.
 * @param lat Latitude of the location.
 * @param lon Longitude of the location.
 * @returns A promise resolving to the parsed SunroofData or null.
 */
const getSolarApiData = async (lat: number, lon: number): Promise<Partial<FormData> | null> => {
    const apiKey = process.env.SOLAR_API_KEY || process.env.API_KEY;

    if (!apiKey) {
        console.error("Solar API call failed: No API key found. Please set the SOLAR_API_KEY or API_KEY environment variable.");
        return null;
    }

    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&requiredQuality=HIGH&key=${apiKey}`;

    try {
        const res = await fetchWithTimeout(url);
        if (!res.ok) {
            if (res.status === 404) {
                 console.warn(`Solar API: No data found for location ${lat}, ${lon}.`);
                 return null;
            }
            throw new Error(`Google Solar API failed with status ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        
        if (!data.solarPotential) {
            return null; // No solar potential found.
        }

        const { solarPotential, financialAnalyses, solarPanelConfigs } = data;
        const bestConfig = solarPanelConfigs?.[0];
        const bestFinancial = financialAnalyses?.[0];

        const sunroofData: SunroofData = {
            usableSunlightHours: solarPotential.maxSunshineHoursPerYear?.toFixed(0) || null,
            usableRoofArea: solarPotential.maxArrayAreaMeters2 ? (solarPotential.maxArrayAreaMeters2 * 10.764).toFixed(0) : null,
            potentialSystemSizeKw: bestConfig?.panelsCount ? (bestConfig.panelsCount * solarPotential.panelCapacityWatts / 1000).toFixed(2) : null,
            savingsOver20Years: bestFinancial?.savingsOver20Years?.units?.toFixed(0) || null,
            yearlyProductionDcKwh: bestConfig?.yearlyEnergyDcKwh?.toFixed(0) || null,
            monthlyBill: bestFinancial?.monthlyBill?.units?.toFixed(0) || null,
            roofPitch: solarPotential.roofSegmentStats?.[0]?.pitchDegrees?.toFixed(1) || null,
            rawText: "Data from Google Solar API."
        };
        
        const updates: Partial<FormData> = { sunroofData };
        if (sunroofData.usableRoofArea) updates.usableRoofArea = sunroofData.usableRoofArea;
        if (sunroofData.potentialSystemSizeKw) updates.solarSystemSizeKw = sunroofData.potentialSystemSizeKw;
        if (sunroofData.roofPitch) updates.roofPitch = sunroofData.roofPitch;
        if (sunroofData.monthlyBill) updates.electricityBill = sunroofData.monthlyBill;

        return updates;

    } catch (error) {
        console.error("Error fetching from Google Solar API:", error);
        // Don't rethrow, just return null so the app can proceed gracefully.
        return null; 
    }
};


/**
 * Uses Gemini with Google Search to find public data about a property and auto-fill form details.
 * @param {string} address - The address of the property to research.
 * @returns {Promise<{updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]}>} An object with form updates and a list of filled keys.
 */
const getPropertyDetailsFromWeb = async (address: string, existingData: Partial<FormData>): Promise<{updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]}> => {
    const prompt = `
    You are a property data gatherer for a clean-energy screening app. 
    Your job is to use public, free sources discoverable via Google Search to 
    fill as many fields as possible for a single street address: "${address}".
    Some data has already been populated from other APIs. Your task is to find what's missing.

    **Existing Data (DO NOT OVERWRITE):**
    - Usable Roof Area: ${existingData.usableRoofArea || 'Unknown'}
    - Potential Solar kW: ${existingData.solarSystemSizeKw || 'Unknown'}
    - Roof Pitch: ${existingData.roofPitch || 'Unknown'}
    - Monthly Bill: ${existingData.electricityBill || 'Unknown'}

    **Search for these missing fields:**
    - Property Type (e.g., Single-family)
    - Year Built
    - Square Footage (Living Area)
    - Number of Stories
    - Roof Material (e.g., Asphalt Shingle)
    - Primary Heating System (e.g., Gas furnace)
    - Cooling System (e.g., Central AC)

    **ALLOWED SOURCES (priority order):**
    1) County Appraisal District (CAD) record for the parcel.
    2) Public real estate listing pages (Zillow, Redfin, Realtor.com).
    3) Google Maps + Street View for visual roof material cues.

    **Return a single JSON object with this schema. Leave fields as null if the information cannot be found.**
    
    {
      "property": {
        "type": "(${Object.values(PropertyType).join(' | ')}) or null",
        "year_built": 1998 or null,
        "size_sqft": null,
        "stories": null
      },
      "roof_site": {
        "material": "(${Object.values(RoofType).join(' | ')}) or null"
      },
      "hvac_water": {
        "primary_heating": "(${Object.values(HeatingSystem).join(' | ')}) or null",
        "cooling": "(${Object.values(CoolingSystem).join(' | ')}) or null"
      }
    }

    RULES:
    - Prefer CAD records for year_built, sqft, and stories.
    - Do NOT hallucinate. If unknown, return null.
    `;

    const response = await runQuery(prompt, MODEL_PRO, true);
    const rawJson = extractJsonFromText<any>(response.text);

    if (!rawJson) {
        console.error("Could not extract JSON from property details response", response.text);
        throw new Error("The AI was unable to find structured property data for this address.");
    }
    
    const updates: Partial<FormData> = {};
    const autoFilledKeys: (keyof FormData)[] = [];

    const mapField = (key: keyof FormData, value: any) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
            // FIX: Cast `updates` to `any` to bypass TypeScript's overly strict indexed access type checking.
            // This is a safe operation because we are only calling this function with keys
            // that correspond to string or enum properties in the FormData interface.
            (updates as any)[key] = String(value);
            autoFilledKeys.push(key);
        }
    };
    
    if (rawJson.property) {
        mapField('propertyType', rawJson.property.type);
        const yearBuilt = rawJson.property.year_built;
        if (yearBuilt && !isNaN(Number(yearBuilt)) && Number(yearBuilt) > 1800 && Number(yearBuilt) <= new Date().getFullYear()) {
             updates.propertyAge = String(new Date().getFullYear() - Number(yearBuilt));
             autoFilledKeys.push('propertyAge');
        }
        mapField('squareFootage', rawJson.property.size_sqft);
        mapField('stories', rawJson.property.stories);
    }
    if (rawJson.roof_site) {
        mapField('roofType', rawJson.roof_site.material);
    }
    if (rawJson.hvac_water) {
        mapField('heatingSystem', rawJson.hvac_water.primary_heating);
        mapField('coolingSystem', rawJson.hvac_water.cooling);
    }

    return { updates, autoFilledKeys };
};

/**
 * Orchestrates the full location analysis pipeline: Solar API call followed by AI web search for augmentation.
 * @param lat Latitude of the location.
 * @param lon Longitude of the location.
 * @param address The string address for the location.
 * @returns An object with form updates and a list of filled keys.
 */
const analyzeLocation = async (lat: number, lon: number, address: string): Promise<{updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]}> => {
    let allUpdates: Partial<FormData> = {};
    let allAutoFilledKeys: (keyof FormData)[] = [];

    // 1. Get data from Google Solar API
    const solarUpdates = await getSolarApiData(lat, lon);
    if (solarUpdates) {
        allUpdates = { ...allUpdates, ...solarUpdates };
        allAutoFilledKeys.push(...Object.keys(solarUpdates) as (keyof FormData)[]);
    }

    // 2. Augment with public records search via AI
    try {
        const webDetails = await getPropertyDetailsFromWeb(address, allUpdates);
        allUpdates = { ...allUpdates, ...webDetails.updates };
        allAutoFilledKeys.push(...webDetails.autoFilledKeys);
    } catch (e) {
        console.warn("AI web search for property details failed, proceeding with Solar API data only.", e);
        // Don't throw, allow the process to continue with whatever data we have.
    }
    
    return { updates: allUpdates, autoFilledKeys: [...new Set(allAutoFilledKeys)] };
};


/**
 * Generates a guide on permitting, regulations, and incentives for a green energy project at a specific location.
 * @param {FormData} formData - The current application form data.
 * @returns {Promise<AnalysisContent>} A promise resolving to the permitting analysis content.
 */
const getPermittingAnalysis = async (formData: FormData): Promise<AnalysisContent> => {
    const prompt = `Generate a permitting and incentives guide for a green energy project in "${formData.location}". My role is "${formData.role}". The project involves technologies like solar, wind, and battery storage. Use Google Search for the most current information. Focus on:
1.  **Key Local Authorities:** Identify the specific city/county/state agencies responsible for building permits, electrical permits, and environmental reviews for this address.
2.  **Major Permits Required:** List the likely permits (e.g., building, electrical, zoning variance) with links to the official application pages if possible.
3.  **Utility Interconnection:** Describe the interconnection process and provide a link to the application page for the local utility provider (${formData.utilityProvider || 'the local utility'}).
4.  **Key Local Codes:** Mention any specific local amendments or codes relevant to solar/wind installations (e.g., setback requirements, height restrictions).
Format the response clearly with markdown headings and provide citations to official government or utility websites.`;
    return runQuery(prompt, MODEL_PRO, true);
};

/**
 * Performs a basic energy audit based on the provided context.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @returns {Promise<AnalysisContent>} The energy audit results.
 */
const getEnergyAudit = (analysisContext: string, role: UserRole | null) => runQuery(`As an energy auditor, perform a basic energy audit based on the full context provided below. Identify the top 3-5 areas for energy efficiency improvements (e.g., insulation, air sealing, appliance upgrades). Be specific, actionable, and tailor your recommendations to the user's role of "${role}".\n\n${analysisContext}`);

/**
 * Analyzes the solar energy potential for the given context, tailored to the user's role.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @param {SunroofData | null | undefined} sunroofData - Pre-fetched data from the Google Solar API.
 * @returns {Promise<AnalysisContent>} The solar analysis results.
 */
const getSolarAnalysis = (analysisContext: string, role: UserRole | null, sunroofData: SunroofData | null | undefined) => {
    const solarApiContext = sunroofData 
        ? `This location has been analyzed with the Google Solar API. Key findings:
- Usable Roof Area: ${sunroofData.usableRoofArea || 'N/A'} sq ft
- Recommended System Size: ${sunroofData.potentialSystemSizeKw || 'N/A'} kW
- Estimated Annual Production: ${sunroofData.yearlyProductionDcKwh || 'N/A'} kWh (DC)
- Estimated 20-Year Savings: $${sunroofData.savingsOver20Years || 'N/A'}`
        : "No specific Google Solar API data is available for this location.";

    const prompt = `As a solar analyst, create a narrative analysis of the solar potential using the full context below.
**Your analysis MUST be tailored to the user's role: ${role}**.
- If 'Homeowner': Focus on interpreting the system size, cost, annual savings ($), and payback period. Explain what the numbers mean for their household.
- If 'Community Organizer': Discuss the aggregate potential if multiple homes adopted similar systems. Mention community solar models and local job creation.
- If 'Policymaker': Analyze the regional capacity impact, land use implications, and how these findings could inform policy.
- If 'Developer': Focus on ROI, integration into new construction/retrofits, and potential for multi-unit applications.

**Task:** Write a clear, narrative summary based on the provided data. If Solar API data is available, use it as the primary source for your quantitative statements. If not, use the general property details to make a high-level qualitative assessment. Conclude with pros and cons.

**Google Solar API Data:**
${solarApiContext}

**Full User & Property Context:**\n${analysisContext}`;

    return runQuery(prompt);
};

/**
 * Analyzes the wind energy potential, tailored to the user's role.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @returns {Promise<AnalysisContent>} The wind analysis results.
 */
const getWindAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a wind energy analyst, analyze the small-scale wind potential for the location in the context below.
**Use Google Search to find authoritative data on average wind speeds for this location (e.g., from NREL wind maps or NOAA). Cite your sources.**
A general heuristic is that average wind speeds should be at least 10-12 mph (4.5-5.5 m/s) at hub height for a small turbine to be viable.

**Task:**
1.  Report the average wind speed you found for the area, citing the source.
2.  Based on the wind speed and property details (like yard size), assess the feasibility for a small residential turbine.
3.  Discuss key considerations like zoning, noise, and maintenance, tailored to the user's role: **${role}**.

**Full Context:**\n${analysisContext}`, MODEL_PRO, true);

/**
 * Analyzes micro-hydropower potential, tailored to the user's role.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @returns {Promise<AnalysisContent>} The hydro analysis results.
 */
const getHydroAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a hydropower analyst, analyze the micro-hydropower potential based on the provided context.
**Use Google Search to identify any nearby rivers or perennial streams and check USGS streamflow data if available. Cite your sources.** A viable micro-hydro site typically requires year-round flow and at least a few feet of vertical drop (head).

**Task:**
1.  Identify if there are any suitable water resources near the location.
2.  Based on user-provided data (if any) and your research, assess the feasibility.
3.  If feasible, calculate the potential power in Watts and annual energy in kWh using the formula: Power (W) ≈ Head (ft) × Flow (GPM) × 0.113.
4.  Discuss key considerations (permitting, water rights, environmental impact) tailored for a **${role}**.

**Full Context:**\n${analysisContext}`, MODEL_PRO, true);

/**
 * Analyzes battery storage needs based on energy usage and potential renewable generation.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @param {string} renewableGenerationContext - Text from solar, wind, and hydro analyses.
 * @returns {Promise<AnalysisContent>} The battery analysis results.
 */
const getBatteryAnalysis = (analysisContext: string, role: UserRole | null, renewableGenerationContext: string) => runQuery(`As a battery storage expert, analyze the energy storage needs. Your recommendation should be tailored to the user's role of **${role}** and their stated goals.
**Renewable Generation Analysis Summary:**
${renewableGenerationContext}

**Task:** Recommend a battery capacity in kWh based on monthly usage and the renewable generation potential. Explain the benefits (backup power, load shifting, grid services) most relevant to the user.

**Full Context:**\n${analysisContext}`);

/**
 * Generates a financing guide with relevant options based on the user's role and project context.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @returns {Promise<AnalysisContent>} The financing analysis results.
 */
const getFinancingAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a green energy finance expert, create a financing guide for a "${role}".
**Task:**
1.  First, use Google Search to query the DSIRE database (dsireusa.org) for specific, local incentives for the location in the context below. Search for rebates, tax credits, and grants applicable to solar, batteries, and efficiency upgrades.
2.  Then, review the provided general knowledge base of financing options.
3.  Combine your findings into a single guide. Suggest the top 3-4 most relevant financing options (from both your search and the knowledge base). For each, explain WHY it's a good fit for this specific user and project. Provide direct links to the program websites.

**Knowledge Base:**
${JSON.stringify(FINANCING_DATA)}

**Full Context:**\n${analysisContext}`, MODEL_PRO, true);

/**
 * Synthesizes all individual analyses into a concise executive summary and action plan.
 * @param {string} analysisContext - The user and project context.
 * @param {string} fullAnalysisText - The combined text from all previous analysis steps.
 * @returns {Promise<AnalysisContent>} The summary results.
 */
const getSummary = (analysisContext: string, fullAnalysisText: string) => runQuery(`Synthesize the following detailed analyses into a concise executive summary and actionable plan.
**Task:** The summary should be written for the user whose profile is in the context below and must have:
1.  **Overall Recommendation:** A clear "what you should do" statement.
2.  **Key Findings:** 3-4 bullet points summarizing the most impactful results.
3.  **Action Plan:** A numbered list of the next 3 steps to take.
Keep it clear, direct, and encouraging.

**Full Analysis Text:**
${fullAnalysisText}

**User and Project Context:**
${analysisContext}`);

/**
 * Generates the final report, focusing on financial ROI and environmental impact calculations.
 * @param {string} analysisContext - The user and project context.
 * @param {string} fullAnalysisText - The combined text from all previous analysis steps.
 * @param {SunroofData | null | undefined} sunroofData - Pre-fetched data from the Google Solar API.
 * @returns {Promise<AnalysisContent>} The final report content.
 */
const getFinalReport = (analysisContext: string, fullAnalysisText: string, sunroofData: SunroofData | null | undefined) => {
    const prompt = `
    Generate a final report synthesizing the financial and environmental impact of the recommended green energy project.
    **Analysis Summary:**
    ${fullAnalysisText}

    **Knowledge Base & Formulas:**
    - Avg. Electricity Cost: $${KNOWLEDGE_BASE.financial.avgElectricityCost}/kWh
    - Solar Cost: $${KNOWLEDGE_BASE.financial.costPerWatt.solar}/W (use for estimation if API data is missing)
    - Grid CO2 Factor: ${KNOWLEDGE_BASE.environmental.gridCo2Factor} lbs CO2/kWh
    - Annual CO2 Reduction (metric tons) = (Generated kWh * Grid CO2 Factor) / 2204.62

    **TASK:**
    Format the output with the following markdown structure. Use brackets for numeric values you calculate, like $[1234.56]. Your calculations should be informed by the complete project context provided below. If Google Solar API data is present, prioritize it for solar calculations.

    ### Financial Analysis
    **Estimated System Cost:** Use the recommended solar system size (kW) from the analysis. Calculation: [System Size kW] * 1000 * $${KNOWLEDGE_BASE.financial.costPerWatt.solar}. Provide a single dollar value, like $[25000].
    **Estimated Annual Electricity Savings/Revenue:** Use the estimated annual production (kWh) from the analysis. Calculation: [Annual kWh] * $${KNOWLEDGE_BASE.financial.avgElectricityCost}. Provide a single dollar value, like $[1800]. If available, use the 20-year savings from the Solar API and divide by 20.
    **Simple Payback Period:** Calculate System Cost / Annual Savings. Provide a single number in years, like [13.9].
    **20-Year Net Financial Impact:** Summarize the total savings over 20 years minus the initial cost. Use the Solar API value if available: $${sunroofData?.savingsOver20Years || 'Calculate: (Annual Savings * 20) - System Cost'}.

    ### Environmental Impact
    **Annual CO2 Reduction:** Calculate based on generated kWh. Provide a value in metric tons, like [7.5].
    **Equivalent to:** Use the EPA equivalents from the knowledge base to translate the CO2 reduction into "miles driven by a car" and "tree seedlings grown for 10 years".
    - Miles Driven: [18400]
    - Tree Seedlings Grown: [125]

    **Complete Project Context:**
    ${analysisContext}
    `;
    return runQuery(prompt, MODEL_PRO);
};


// --- Sales Flow Functions ---

/**
 * Generates a market analysis for a specific technology in a given location.
 * @param {FormData} formData - The current application form data, including selling technology and location.
 * @returns {Promise<AnalysisContent>} The market analysis results.
 */
const getSalesTargetMarket = (formData: FormData) => runQuery(`I am a sales professional for "${formData.sellingTechnology}" in "${formData.location}". Generate a market analysis. Use Google Search to get current local data.
1.  **Market Potential:** Briefly describe the market size and growth potential for this technology here.
2.  **Ideal Customer Profile (ICP):** Define the primary target customer. Include demographics (e.g., income, homeownership), psychographics (e.g., values like environmentalism, tech adoption), and needs (e.g., high bills, desire for energy independence).
3.  **Key Local Drivers:** Identify 2-3 local factors (e.g., high electricity rates, specific incentives, weather patterns, pro-solar policies) that make this a compelling market.`, MODEL_PRO, true);
/**
 * Generates key selling points and objection handling based on a target market.
 * @param {FormData} formData - The current application form data.
 * @param {string} targetMarketContext - The text from the target market analysis.
 * @returns {Promise<AnalysisContent>} The selling points content.
 */
const getSalesSellingPoints = (formData: FormData, targetMarketContext: string) => runQuery(`Based on the target market for "${formData.sellingTechnology}" in "${formData.location}", create key selling points.
Target Market Context:
${targetMarketContext}

Generate:
1.  **Top 3 Value Propositions:** Create three concise statements that directly address the ICP's needs (e.g., "Take control of your rising electricity bills...").
2.  **Objection Handling:** List two common objections (e.g., "It's too expensive," "Is it reliable?") and provide brief, effective responses.
3.  **Local "Hook":** Create a compelling, location-specific opening line that references a local driver (e.g., "With [Utility Company]'s recent rate hikes...").`, MODEL_PRO);
/**
 * Devises a sales outreach strategy, including channels and competitor analysis.
 * @param {FormData} formData - The current application form data.
 * @param {string} salesContext - The combined text from market and selling point analyses.
 * @returns {Promise<AnalysisContent>} The outreach strategy content.
 */
const getSalesOutreach = (formData: FormData, salesContext: string) => runQuery(`Given the target market and selling points for "${formData.sellingTechnology}" in "${formData.location}", devise an outreach strategy.
Sales Context:
${salesContext}

Generate:
1.  **Recommended Channels (Top 3):** Suggest the three most effective channels to reach the ICP (e.g., Local Community Events, Facebook Groups for [Town Name] Homeowners, Partnering with local roofers/builders). Justify each choice briefly.
2.  **Competitor Snapshot:** Use Google Search to identify 1-2 major local competitors. Briefly state their main offering and one potential differentiator for my product.
3.  **Sample Social Media Post:** Write a short, engaging post for Facebook or LinkedIn tailored to the ICP.`, MODEL_PRO, true);
/**
 * Compiles all sales analyses into a final, cohesive Sales & Marketing Playbook.
 * @param {string} fullSalesAnalysis - The combined text from all previous sales analysis steps.
 * @returns {Promise<AnalysisContent>} The final sales playbook summary.
 */
const getSalesSummary = (fullSalesAnalysis: string) => runQuery(`Compile the following sales analysis sections into a cohesive, actionable "Sales & Marketing Playbook". Structure it with clear headings for each section (Target Market, Selling Points, Outreach Strategy). Add a brief introductory and concluding paragraph.
Full Analysis:
${fullSalesAnalysis}`, MODEL_PRO);


// Dummy functions for analyses not fully implemented yet to avoid errors
const getBuildingMaterialsAnalysis = (analysisContext: string, role: UserRole | null) => Promise.resolve({ text: "Building materials analysis is in development.", sources: [] });
const getWeatherizationAnalysis = (analysisContext: string, role: UserRole | null) => Promise.resolve({ text: "Weatherization analysis is in development.", sources: [] });
const getMiniSplitAnalysis = (analysisContext: string, role: UserRole | null) => Promise.resolve({ text: "Mini-split analysis is in development.", sources: [] });
const getWasteToEnergyAnalysis = (analysisContext: string, role: UserRole | null) => Promise.resolve({ text: "Waste-to-energy analysis is in development.", sources: [] });
const getGeothermalAnalysis = (analysisContext: string, role: UserRole | null) => Promise.resolve({ text: "Geothermal analysis is in development.", sources: [] });
const getPortfolioAnalysis = (analysisContext: string, role: UserRole | null, fullAnalysisText: string) => Promise.resolve({ text: "Portfolio analysis is in development.", sources: [] });


export const geminiService = {
    geocodeAddress,
    reverseGeocode,
    analyzeLocation,
    getPropertyDetailsFromWeb,
    getPermittingAnalysis,
    generateAnalysisContext,
    getEnergyAudit,
    getSolarAnalysis,
    getWindAnalysis,
    getBuildingMaterialsAnalysis,
    getWeatherizationAnalysis,
    getMiniSplitAnalysis,
    getWasteToEnergyAnalysis,
    getHydroAnalysis,
    getGeothermalAnalysis,
    getBatteryAnalysis,
    getPortfolioAnalysis,
    getFinancingAnalysis,
    getSummary,
    getFinalReport,
    getSalesTargetMarket,
    getSalesSellingPoints,
    getSalesOutreach,
    getSalesSummary,
};