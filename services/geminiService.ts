
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { FormData, AnalysisContent, SunroofData, EieData, HydroPreAnalysisData, GroundingChunk, UserRole } from '../types';
import { HydroSourceType } from '../types';
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

interface GeocodeResponse {
    lat: number | null;
    lon: number | null;
}

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

const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    const prompt = `
        You are a high-precision geocoding service. Your single task is to find the geographic coordinates for the given address and return them in a specific JSON format.

        Address to geocode: "${address}"

        **CRITICAL Instructions:**
        1. Use your Google Maps knowledge to find the most accurate latitude and longitude.
        2. Return ONLY a single, valid JSON object. Do not add any conversational text, markdown, or anything else.
        3. The JSON object must have "lat" and "lon" keys with numeric values.

        **Required JSON Output:**
        \`\`\`json
        {
          "lat": <latitude>,
          "lon": <longitude>
        }
        \`\`\`
        
        If you cannot find the address, return null values for lat and lon.
    `;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: { tools: [{ googleMaps: {} }] }, // Use googleMaps for better address lookups
        });
        
        const data = extractJsonFromText<GeocodeResponse>(response.text);
        if (data && data.lat !== null && data.lon !== null) {
            return { lat: data.lat, lon: data.lon };
        }
        return null;

    } catch (e) {
        console.error(`Error geocoding address "${address}":`, e);
        if (e instanceof Error) {
           throw new Error(`Failed to get geocoding response from Gemini API: ${e.message}`);
        }
        throw new Error('An unknown error occurred while geocoding the address.');
    }
};

interface ReverseGeocodeResponse {
    address: string | null;
}

const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    const prompt = `
        You are an expert-level geocoding system powered by Google Maps. Your SOLE purpose is to perform a high-precision reverse geocode lookup for the given coordinates.

        Coordinates to reverse geocode:
        - Latitude: ${lat}
        - Longitude: ${lon}

        **CRITICAL INSTRUCTIONS:**
        1.  **Exact Address ONLY:** You MUST return the most precise street address available (e.g., "123 Main St, Anytown, USA 12345"). DO NOT return just a city, county, or general area.
        2.  **JSON Format:** The output MUST be ONLY a single, valid JSON object. No other text, conversation, or markdown is permitted.
        3.  **Required Schema:** The JSON object MUST follow this exact structure:
            \`\`\`json
            {
              "address": "<The full, precise street address>"
            }
            \`\`\`
        4.  **Failure Case:** If you cannot find a precise street-level address for the given coordinates, the value for "address" MUST be \`null\`.
    `;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: { tools: [{ googleMaps: {} }] },
        });
        
        const data = extractJsonFromText<ReverseGeocodeResponse>(response.text);
        if (data && data.address) {
            return data.address;
        }
        console.warn(`Could not extract a precise address from reverse geocode response for (${lat}, ${lon}). Response text: ${response.text}`);
        return null;

    } catch (e) {
        console.error(`Error reverse geocoding coordinates (${lat}, ${lon}):`, e);
        if (e instanceof Error) {
           throw new Error(`Failed to get reverse geocoding response from Gemini API: ${e.message}`);
        }
        throw new Error('An unknown error occurred while reverse geocoding coordinates.');
    }
};

const analyzeLocationAndData = async (
    lat: number, 
    lon: number,
    address: string,
    pastedText?: string, 
    imageBase64?: string
): Promise<LocationAnalysisResponse | null> => {

    let supplementaryDataPrompt = '';
    if (pastedText) {
        supplementaryDataPrompt += `
        **User-provided Text (from Project Sunroof or similar):**
        ---
        ${pastedText}
        ---
        `;
    }
    if (imageBase64) {
         supplementaryDataPrompt += `\n**An optional user-provided screenshot is included. Analyze it for additional context.**`;
    }

    const prompt = `You are an expert AI assistant specializing in green energy analysis. Your task is to analyze a geographic location using a definitive address and its coordinates to gather relevant data.

        **Primary Location:**
        - Address: ${address}
        - Latitude: ${lat}
        - Longitude: ${lon}

        ${supplementaryDataPrompt}

        **CRITICAL Instructions:**
        1.  **Use Definitive Location:** The provided address and coordinates are the definitive location for all analysis. Do not attempt to change or correct them. The 'location' field in your JSON output MUST be exactly "${address}".
        2.  **Use Supplementary Data for Context:** Use the optional text and image to enrich your analysis. Extract solar metrics.
        3.  **Perform Comprehensive Analysis:** Using the definitive address, perform searches to gather data for "Project Sunroof" (if applicable for the area), "Environmental Insights Explorer (EIE)", and a "Hydropower Pre-analysis".
        4.  **Hydropower Analysis:** Investigate potential for in-pipe hydropower from the municipal water supply. If exact data is not found, provide a reasonable estimate for typical pipe diameter (inches), pressure (PSI), and flow (GPM) based on US municipal infrastructure, and clearly state it's an estimate.
        5.  **Roof Pitch Analysis:** If an image is provided, visually estimate the roof pitch in degrees. If no image is available, estimate the pitch based on typical architectural styles for the given address/region.
        6.  **Format Output:** Return a single, valid JSON object with the structure below. Do not include conversational text or markdown outside the JSON object.

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
            "rawText": "..."
          },
          "eieData": {
            "buildingEmissions": "...",
            "transportationEmissions": "...",
            "renewablePotential": "...",
            "rawText": "..."
          },
          "hydroPreAnalysisData": {
            "potentialSourceType": "...",
            "nearestWaterBody": "...",
            "distance": "...",
            "estimatedPipeDiameterInches": ...,
            "estimatedPressurePSI": ...,
            "estimatedFlowGPM": ...,
            "summaryText": "..."
          },
          "coordinates": {
            "lat": ${lat},
            "lon": ${lon}
          }
        }
        \`\`\`
        **Rules:**
        - 'location' MUST be the full address provided to you: "${address}".
        - All numeric values should be strings within \`sunroofData\`, but numbers in \`hydroPreAnalysisData\`.
        - If a value cannot be found, return \`null\`.
        - The \`rawText\` fields should briefly describe the data's origin (e.g., "Data extracted from coordinates and user-provided text.").`;
    
    const promptParts: any[] = [{ text: prompt }];

    if (imageBase64) {
        promptParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
            },
        });
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_PRO, // Use Pro for this complex task
            contents: { parts: promptParts },
            config: { tools: [{ googleSearch: {}, googleMaps: {} }] },
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


const getPermittingAnalysis = async (formData: FormData): Promise<AnalysisContent> => {
    const prompt = `Generate a permitting and incentives guide for a green energy project in "${formData.location}". My role is "${formData.role}". The project involves technologies like solar, wind, and battery storage. Focus on:
1.  **Key Local Authorities:** Identify the city/county/state agencies responsible for building permits, electrical permits, and environmental reviews.
2.  **Major Permits Required:** List the likely permits (e.g., building, electrical, zoning variance).
3.  **Local/State Incentives:** Find specific rebates, tax credits, or grants available in this area for my role. Use Google Search for the most current information.
4.  **Utility Interconnection:** Briefly describe the process and key contact for the local utility provider (${formData.utilityProvider || 'local utility'}).
Format the response clearly with markdown headings.`;
    return runQuery(prompt, MODEL_PRO, true);
};


const getEnergyAudit = (analysisContext: string, role: UserRole | null) => runQuery(`As an energy auditor, perform a basic energy audit based on the full context provided below. Identify the top 3-5 areas for energy efficiency improvements (e.g., insulation, air sealing, appliance upgrades). Be specific, actionable, and tailor your recommendations to the user's role of "${role}".\n\n${analysisContext}`);

const getSolarAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a solar analyst, analyze the solar potential using the full context provided.
Your analysis MUST be tailored to the user's role: **${role}**.
- If 'Homeowner': Focus on system size (kW), cost, annual savings ($), and payback for a single rooftop.
- If 'Community Organizer': Focus on aggregate potential, community solar models, and local job creation.
- If 'Policymaker': Focus on regional capacity (MW), land use, grid impact, and policy recommendations.
- If 'Developer': Focus on new construction/retrofit integration, ROI for multi-unit buildings.

**Task:** Calculate the estimated system size, annual energy production in kWh, and estimated cost. Summarize pros and cons for this user.
Use these constants for calculation: ${JSON.stringify(KNOWLEDGE_BASE.calculators.solar)}

**Full Context:**\n${analysisContext}`);

const getWindAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a wind energy analyst, analyze the small-scale wind potential. Tailor your response to the user's role: **${role}**.
- If 'Homeowner': Assess feasibility for a single property based on yard size. Discuss noise and permitting.
- If 'Community/Policymaker': Discuss distributed wind potential for the region and zoning considerations.

**Task:** Assess feasibility, estimate annual power output for a small residential turbine, and discuss key considerations.
Use these constants for calculation: ${JSON.stringify(KNOWLEDGE_BASE.calculators.wind)}

**Full Context:**\n${analysisContext}`);

const getHydroAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a hydropower analyst, analyze the micro-hydropower potential based on the provided context. Tailor the analysis for a **${role}**.
**Task:** Based on any provided hydro details (source type, flow, head), calculate the potential power in Watts and annual energy in kWh. Discuss feasibility, environmental impact, and maintenance.
Use these constants for calculation: ${JSON.stringify(KNOWLEDGE_BASE.calculators.hydro)}

**Full Context:**\n${analysisContext}`);

const getBatteryAnalysis = (analysisContext: string, role: UserRole | null, renewableGenerationContext: string) => runQuery(`As a battery storage expert, analyze the energy storage needs. Your recommendation should be tailored to the user's role of **${role}** and their stated goals.
**Renewable Generation Analysis Summary:**
${renewableGenerationContext}

**Task:** Recommend a battery capacity in kWh based on monthly usage and the renewable generation potential. Explain the benefits (backup power, load shifting, grid services) most relevant to the user.

**Full Context:**\n${analysisContext}`);

const getFinancingAnalysis = (analysisContext: string, role: UserRole | null) => runQuery(`As a green energy finance expert, create a financing guide for a "${role}".
**Task:** Based on the full project context, suggest the top 3-4 most relevant financing options from the provided knowledge base. For each, explain WHY it's a good fit for this user. Use search to find any specific local programs that apply.

**Knowledge Base:**
${JSON.stringify(FINANCING_DATA)}

**Full Context:**\n${analysisContext}`);

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


// Sales Flow
const getSalesTargetMarket = (formData: FormData) => runQuery(`I am a sales professional for "${formData.sellingTechnology}" in "${formData.location}". Generate a market analysis. Use Google Search to get current local data.
1.  **Market Potential:** Briefly describe the market size and growth potential for this technology here.
2.  **Ideal Customer Profile (ICP):** Define the primary target customer. Include demographics (e.g., income, homeownership), psychographics (e.g., values like environmentalism, tech adoption), and needs (e.g., high bills, desire for energy independence).
3.  **Key Local Drivers:** Identify 2-3 local factors (e.g., high electricity rates, specific incentives, weather patterns, pro-solar policies) that make this a compelling market.`, MODEL_PRO, true);
const getSalesSellingPoints = (formData: FormData, targetMarketContext: string) => runQuery(`Based on the target market for "${formData.sellingTechnology}" in "${formData.location}", create key selling points.
Target Market Context:
${targetMarketContext}

Generate:
1.  **Top 3 Value Propositions:** Create three concise statements that directly address the ICP's needs (e.g., "Take control of your rising electricity bills...").
2.  **Objection Handling:** List two common objections (e.g., "It's too expensive," "Is it reliable?") and provide brief, effective responses.
3.  **Local "Hook":** Create a compelling, location-specific opening line that references a local driver (e.g., "With [Utility Company]'s recent rate hikes...").`, MODEL_PRO);
const getSalesOutreach = (formData: FormData, salesContext: string) => runQuery(`Given the target market and selling points for "${formData.sellingTechnology}" in "${formData.location}", devise an outreach strategy.
Sales Context:
${salesContext}

Generate:
1.  **Recommended Channels (Top 3):** Suggest the three most effective channels to reach the ICP (e.g., Local Community Events, Facebook Groups for [Town Name] Homeowners, Partnering with local roofers/builders). Justify each choice briefly.
2.  **Competitor Snapshot:** Use Google Search to identify 1-2 major local competitors. Briefly state their main offering and one potential differentiator for my product.
3.  **Sample Social Media Post:** Write a short, engaging post for Facebook or LinkedIn tailored to the ICP.`, MODEL_PRO, true);
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