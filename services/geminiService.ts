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

// Custom type for the structured response from the new analysis function
interface LocationAnalysisResponse {
    location: string;
    sunroofData: SunroofData | null;
    eieData: EieData | null;
    hydroPreAnalysisData: HydroPreAnalysisData | null;
    coordinates?: { lat: number; lon: number };
}

/**
 * A wrapper for the native fetch API that adds a timeout.
 * @param {RequestInfo} resource - The resource to fetch.
 * @param {RequestInit & { timeout?: number }} [options] - Fetch options including a timeout in milliseconds.
 * @returns {Promise<Response>} A promise that resolves to the Response from the fetch call.
 * @throws An error if the request times out or fails for other reasons.
 */
const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 10000 } = options; // Default 10-second timeout

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
        context += `Sunroof/Solar Estimate Summary: ${formData.sunroofData.rawText}\n`;
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
 * Performs a comprehensive AI analysis of a specific location, optionally enhanced with user-provided text or images.
 * It fetches data for Project Sunroof, Environmental Insights Explorer, and Hydropower potential.
 * @param {number} lat - The latitude of the location.
 * @param {number} lon - The longitude of the location.
 * @param {string} address - The confirmed address of the location.
 * @param {string} [pastedText] - Optional user-pasted text (e.g., from a utility bill).
 * @returns {Promise<LocationAnalysisResponse | null>} A promise resolving to the structured analysis data.
 * @throws An error if the API call fails.
 */
const analyzeLocationAndData = async (
    lat: number, 
    lon: number,
    address: string,
    pastedText?: string
): Promise<LocationAnalysisResponse | null> => {

    const prompt = `
        You are an AI assistant specializing in green energy analysis. Your task is to parse user-provided text, which is likely from Google's Project Sunroof or a similar solar calculator, and extract specific data points.

        **Primary Location Context (for reference only):**
        - Address: ${address}

        **User-provided Text to Analyze:**
        ---
        ${pastedText || "No text provided."}
        ---

        **CRITICAL Instructions:**
        1.  **Parse the Text:** Read the "User-provided Text" above and extract values for the fields in the JSON structure below.
        2.  **Extract, Don't Invent:** Your primary goal is to find values *within the text*. If a specific value (like "roofPitch") is not mentioned in the text, you MUST return \`null\` for that field. Do not estimate or guess values.
        3.  **Strict JSON Output:** Return ONLY a single, valid JSON object matching the structure below. Do not include any conversational text, markdown formatting like \`\`\`json, or any other characters outside the JSON object itself.
        4.  **Location Field:** The 'location' field in your JSON output MUST be exactly "${address}".

        **Required JSON Output Structure:**
        \`\`\`json
        {
          "location": "${address}",
          "sunroofData": {
            "usableSunlightHours": "...",
            "usableRoofArea": "...",
            "potentialSystemSizeKw": "...",
            "potentialYearlySavings": "...",
            "roofPitch": "...",
            "rawText": "Brief summary of data source, e.g., 'Data extracted from user-provided text.'"
          },
          "eieData": null,
          "hydroPreAnalysisData": null,
          "coordinates": {
            "lat": ${lat},
            "lon": ${lon}
          }
        }
        \`\`\`
        `;
    
    const promptParts: any[] = [{ text: prompt }];

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_PRO, // Use Pro for this parsing task
            contents: { parts: promptParts },
        });

        const text = response.text;
        return extractJsonFromText<LocationAnalysisResponse>(text);
    } catch (e) {
        console.error(`Error running location analysis:`, e);
        if (e instanceof Error) {
           throw new Error(`Failed to get response from Gemini API: ${e.message}`);
        }
        throw new Error('An unknown error occurred while querying the Gemini API.');
    }
};

/**
 * Uses Gemini with Google Search to find public data about a property and auto-fill form details.
 * @param {string} address - The address of the property to research.
 * @returns {Promise<{updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]}>} An object with form updates and a list of filled keys.
 */
const getPropertyDetailsFromWeb = async (address: string): Promise<{updates: Partial<FormData>, autoFilledKeys: (keyof FormData)[]}> => {
    const prompt = `
    You are a property data gatherer for a clean-energy screening app. 
    Your job is to use public, free sources discoverable via Google Search to 
    fill as many fields as possible for a single street address: "${address}". 
    Never use paywalled or login-gated sites. Prefer official sources (County Appraisal District),
    Google Project Sunroof, OpenEI Utility Rate Database, and public listing pages.

    ALLOWED SOURCES (priority order):
    1) County Appraisal District (CAD) record for the parcel (e.g., Smith CAD)
    2) Google Project Sunroof for solar roof metrics
    3) OpenEI Utility Rate Database (URDB) for electricity rates
    4) Public listing pages (Zillow, Redfin, Realtor.com) for photos/HVAC/roof
    5) Google Maps + Street View for visual roof cues and shading context
    6) USGS StreamStats/NHD for nearby water (hydro screening)

    SEARCH STRATEGY (use Google Search):
    - First try the CAD:  site:*.org "Appraisal" "Property Search" + "${address}"
    - If county is known:  site:<COUNTY_SHORT>cad.org "${address}"
    - Then: Project Sunroof: "${address}" "Project Sunroof"
    - Then: Public listing pages: "${address}" Zillow | Redfin | Realtor.com
    - Electric rates: site:openei.org "Utility Rate Database" "<CITY> <STATE>"

    EXTRACTION:
    Return a single JSON object with this schema. For enum fields, return one of the provided values. Leave fields as null if the information cannot be found.
    
    {
      "property": {
        "type": "(${Object.values(PropertyType).join(' | ')}) or null",
        "ownership": "(${Object.values(Ownership).join(' | ')}) or null",
        "age_years": null,
        "size_sqft": null,
        "stories": null
      },
      "energy": {
        "utility_provider": null,
        "solar_savings_year_usd": null
      },
      "roof_site": {
        "material": "(${Object.values(RoofType).join(' | ')}) or null",
        "shape": "(${Object.values(RoofShape).join(' | ')}) or null",
        "condition": "(${Object.values(RoofCondition).join(' | ')}) or null",
        "pitch_degrees": null,
        "azimuth_degrees": null,
        "usable_roof_area_sqft": null,
        "pv_size_kw": null,
        "avg_annual_shading_pct": null,
        "yard_area_sqft": null
      },
      "hvac_water": {
        "primary_heating": "(${Object.values(HeatingSystem).join(' | ')}) or null",
        "cooling": "(${Object.values(CoolingSystem).join(' | ')}) or null",
        "water_heater": "(${Object.values(WaterHeater).join(' | ')}) or null",
        "ductwork_condition": "(${Object.values(DuctworkCondition).join(' | ')}) or null"
      }
    }

    RULES:
    - If multiple sources disagree, prefer CAD > Project Sunroof > URDB > public listings.
    - If a value is inferred (e.g., roof material from Street View), use it but note the lower confidence.
    - Do NOT hallucinate. If unknown, return null.
    - For TX addresses, treat county CAD as authoritative for year built, SQFT, and stories.
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
            // FIX: Cast the value to 'any' to prevent a TypeScript error. The type of `updates[key]`
            // is a union of all possible property types in `FormData`, which can resolve to `never`
            // during assignment. This is safe here because this helper is only used for keys that
            // correspond to string or enum properties.
            updates[key] = String(value) as any;
            autoFilledKeys.push(key);
        }
    };
    
    // Mapping from rawJson to FormData structure
    if (rawJson.property) {
        mapField('propertyType', rawJson.property.type);
        mapField('ownership', rawJson.property.ownership);
        if (rawJson.property.age_years) {
            updates.propertyAge = String(new Date().getFullYear() - Number(rawJson.property.age_years));
             autoFilledKeys.push('propertyAge');
        }
        mapField('squareFootage', rawJson.property.size_sqft);
        mapField('stories', rawJson.property.stories);
    }
    if (rawJson.energy) {
        mapField('utilityProvider', rawJson.energy.utility_provider);
        mapField('estimatedYearlySavings', rawJson.energy.solar_savings_year_usd);
    }
    if (rawJson.roof_site) {
        mapField('roofType', rawJson.roof_site.material);
        mapField('roofShape', rawJson.roof_site.shape);
        mapField('roofCondition', rawJson.roof_site.condition);
        mapField('roofPitch', rawJson.roof_site.pitch_degrees);
        mapField('roofAzimuth', rawJson.roof_site.azimuth_degrees);
        mapField('usableRoofArea', rawJson.roof_site.usable_roof_area_sqft);
        mapField('solarSystemSizeKw', rawJson.roof_site.pv_size_kw);
        mapField('shading', rawJson.roof_site.avg_annual_shading_pct);
        mapField('yardSize', rawJson.roof_site.yard_area_sqft);
    }
    if (rawJson.hvac_water) {
        mapField('heatingSystem', rawJson.hvac_water.primary_heating);
        mapField('coolingSystem', rawJson.hvac_water.cooling);
        mapField('waterHeater', rawJson.hvac_water.water_heater);
        mapField('ductworkCondition', rawJson.hvac_water.ductwork_condition);
    }

    return { updates, autoFilledKeys };
};

/**
 * Generates a guide on permitting, regulations, and incentives for a green energy project at a specific location.
 * @param {FormData} formData - The current application form data.
 * @returns {Promise<AnalysisContent>} A promise resolving to the permitting analysis content.
 */
const getPermittingAnalysis = async (formData: FormData): Promise<AnalysisContent> => {
    const prompt = `Generate a permitting and incentives guide for a green energy project in "${formData.location}". My role is "${formData.role}". The project involves technologies like solar, wind, and battery storage. Focus on:
1.  **Key Local Authorities:** Identify the city/county/state agencies responsible for building permits, electrical permits, and environmental reviews.
2.  **Major Permits Required:** List the likely permits (e.g., building, electrical, zoning variance).
3.  **Local/State Incentives:** Find specific rebates, tax credits, or grants available in this area for my role. Use Google Search for the most current information.
4.  **Utility Interconnection:** Briefly describe the process and key contact for the local utility provider (${formData.utilityProvider || 'local utility'}).
Format the response clearly with markdown headings.`;
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
 * @returns {Promise<AnalysisContent>} The solar analysis results.
 */
const getSolarAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a solar analyst, analyze the solar potential using the full context provided.
Your analysis MUST be tailored to the user's role: **${role}**.
- If 'Homeowner': Focus on system size (kW), cost, annual savings ($), and payback for a single rooftop.
- If 'Community Organizer': Focus on aggregate potential, community solar models, and local job creation.
- If 'Policymaker': Focus on regional capacity (MW), land use, grid impact, and policy recommendations.
- If 'Developer': Focus on new construction/retrofit integration, ROI for multi-unit buildings.

**Task:** Calculate the estimated system size, annual energy production in kWh, and estimated cost. Summarize pros and cons for this user.
Use these constants for calculation: ${JSON.stringify(KNOWLEDGE_BASE.calculators.solar)}

**Full Context:**\n${analysisContext}`);

/**
 * Analyzes the wind energy potential, tailored to the user's role.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @returns {Promise<AnalysisContent>} The wind analysis results.
 */
const getWindAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a wind energy analyst, analyze the small-scale wind potential. Tailor your response to the user's role: **${role}**.
- If 'Homeowner': Assess feasibility for a single property based on yard size. Discuss noise and permitting.
- If 'Community/Policymaker': Discuss distributed wind potential for the region and zoning considerations.

**Task:** Assess feasibility, estimate annual power output for a small residential turbine, and discuss key considerations.
Use these constants for calculation: ${JSON.stringify(KNOWLEDGE_BASE.calculators.wind)}

**Full Context:**\n${analysisContext}`);

/**
 * Analyzes micro-hydropower potential, tailored to the user's role.
 * @param {string} analysisContext - The full analysis context string.
 * @param {UserRole | null} role - The user's selected role.
 * @returns {Promise<AnalysisContent>} The hydro analysis results.
 */
const getHydroAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a hydropower analyst, analyze the micro-hydropower potential based on the provided context. Tailor the analysis for a **${role}**.
**Task:** Based on any provided hydro details (source type, flow, head), calculate the potential power in Watts and annual energy in kWh. Discuss feasibility, environmental impact, and maintenance.
Use these constants for calculation: ${JSON.stringify(KNOWLEDGE_BASE.calculators.hydro)}

**Full Context:**\n${analysisContext}`);

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
**Task:** Based on the full project context, suggest the top 3-4 most relevant financing options from the provided knowledge base. For each, explain WHY it's a good fit for this user. Use search to find any specific local programs that apply.

**Knowledge Base:**
${JSON.stringify(FINANCING_DATA)}

**Full Context:**\n${analysisContext}`);

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
 * @returns {Promise<AnalysisContent>} The final report content.
 */
const getFinalReport = (analysisContext: string, fullAnalysisText: string) => {
    const prompt = `
    Generate a final report synthesizing the financial and environmental impact of the recommended green energy project.
    **Analysis Summary:**
    ${fullAnalysisText}

    **Knowledge Base:**
    - Avg. Electricity Cost: $${KNOWLEDGE_BASE.financial.avgElectricityCost}/kWh
    - Solar Cost: $${KNOWLEDGE_BASE.financial.costPerWatt}/W
    - Grid CO2 Factor: ${KNOWLEDGE_BASE.environmental.gridCo2Factor} lbs CO2/kWh

    **TASK:**
    Format the output with the following markdown structure. Use brackets for numeric values you calculate, like $[1234.56]. Your calculations should be informed by the complete project context provided below.

    ### Financial Analysis
    **Estimated System Cost:** Calculate the total cost based on system sizes from the analysis (e.g., solar kW * cost/watt). Provide a single dollar value, like $[25000].
    **Estimated Annual Electricity Savings/Revenue:** Calculate this based on generated kWh and average electricity cost. Provide a single dollar value, like $[1800].
    **Simple Payback Period:** Calculate System Cost / Annual Savings. Provide a single number in years, like [13.9].
    **20-Year Net Financial Impact:** Summarize the total savings over 20 years minus the initial cost.

    ### Environmental Impact
    **Annual CO2 Reduction:** Calculate based on generated kWh * Grid CO2 factor. Provide a value in metric tons, like [7.5].
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
    analyzeLocationAndData,
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