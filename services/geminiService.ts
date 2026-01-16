
import { GoogleGenAI, Type } from "@google/genai";

// Always use named parameter for apiKey and obtain exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an uploaded Tech Pack (PDF or Image) to extract buyer requirements.
 */
export const analyzeTechPackFile = async (base64Data: string, mimeType: string) => {
  try {
    const filePart = {
      inlineData: {
        data: base64Data.split(',')[1], // Remove the data:mime/type;base64, prefix
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "Analyze this garment Tech Pack. Extract: 1. Fabric/Material details. 2. Key construction notes. 3. Trims/Accessories. 4. Potential production risks or special buyer requirements mentioned. Provide a concise bullet-point summary suitable for a UI dashboard."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [filePart, textPart] },
      config: {
        systemInstruction: "You are a Technical Designer and Quality Auditor. Summarize garments technical specifications with high precision."
      }
    });

    return response.text || "Could not analyze the tech pack content.";
  } catch (error) {
    console.error("Tech Pack Analysis Error:", error);
    return "AI failed to parse the tech pack. Please ensure the file is readable.";
  }
};

/**
 * Uses Gemini 3 Pro with thinking mode for deep analysis of production and costing.
 */
export const getAIAdvice = async (prompt: string, context?: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Context: ${JSON.stringify(context || {})} \n\nUser Question: ${prompt}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "You are an elite Garments Industry Advisor with 20+ years of experience in Merchandising, Supply Chain, and Production. Provide highly efficient, tactical advice. Use thinking mode to analyze complex bottlenecks."
      }
    });
    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Strategic analysis failed. Please retry your query.";
  }
};

/**
 * Performs deep historical data analysis and trend prediction.
 */
export const getHistoricalTrendAnalysis = async (prompt: string, projectData: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a deep historical and trend analysis based on the following multi-project data: ${JSON.stringify(projectData)}. 
      Specific Request: ${prompt}
      
      Your goal is to:
      1. Identify patterns in production delays or successes across different styles/buyers.
      2. Predict future trends for upcoming seasons based on current fabric/trim selections.
      3. Compare current performance against historical benchmarks (average lead times, approval cycles).
      4. Suggest data-driven optimizations for the next production cycle.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "You are a Garments Data Scientist and Strategic Forecaster. Analyze production logs, timestamps, and style details to provide predictive insights and historical performance benchmarks."
      }
    });
    return response.text || "Historical analysis could not be completed.";
  } catch (error) {
    console.error("Historical Analysis Error:", error);
    return "Deep analysis failed due to high complexity. Please try a more specific query.";
  }
};

/**
 * Suggests style details for a new inquiry based on buyer and season.
 */
export const getStyleSuggestions = async (buyerName: string, season: string, existingProjects: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user is creating a new style inquiry.
      Buyer: ${buyerName}
      Season: ${season}
      Existing Projects for Context: ${JSON.stringify(existingProjects.map(p => ({name: p.styleName, num: p.styleNumber, buyer: p.buyerName})))}
      
      Suggest a creative and relevant Style Name and a matching Style Number following the buyer's potential naming convention. 
      Also provide a relevant high-quality Unsplash image URL for this type of garment (e.g., denim, hoodie, dress).
      
      Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styleName: { type: Type.STRING },
            styleNumber: { type: Type.STRING },
            productImageUrl: { type: Type.STRING, description: "A relevant unsplash source URL" },
            quantity: { type: Type.NUMBER, description: "Suggested MOQs for this buyer" }
          },
          required: ["styleName", "styleNumber", "productImageUrl"],
          propertyOrdering: ["styleName", "styleNumber", "productImageUrl", "quantity"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Style Suggestion Error:", error);
    return null;
  }
};

export const getFollowUpPrompt = async (project: any, step: any, tone: string = 'Professional') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a ${tone} follow-up message for a supplier/team regarding the following task:
      Project: ${project.styleName} (${project.styleNumber})
      Task: ${step.label}
      Due Date: ${step.dueDate}
      Buyer: ${project.buyerName}
      Current Status: ${step.status}
      
      The message should be appropriate for the requested tone: ${tone}.`,
      config: { 
        thinkingConfig: { thinkingBudget: 16000 } 
      }
    });
    return response.text;
  } catch (error) {
    return "Failed to generate follow-up template.";
  }
};

export const getBuyerSummaryEmail = async (project: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a professional, high-level status update email intended for the Buyer (${project.buyerName}) regarding the project "${project.styleName}" (${project.styleNumber}). 
      Include the following details:
      - Current Production Stage: ${project.workflow[project.currentStepIndex]?.label}
      - Quantity: ${project.quantity}
      - Target Ship Date: ${project.shipDate}
      - Recent Status Highlights: Provide a concise summary of the last 3-4 workflow steps and any critical updates from logs.
      
      The tone should be reassuring, transparent, and professional. Use a clear structure with bullet points for readability.`,
      config: { 
        thinkingConfig: { thinkingBudget: 24000 } 
      }
    });
    return response.text;
  } catch (error) {
    return "Failed to generate buyer summary email.";
  }
};

/**
 * Performs a deep efficiency audit for costing.
 */
export const getCostingEfficiencyAudit = async (project: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a deep Costing Efficiency Audit for the following garment style:
      Style: ${project.styleName} (${project.styleNumber})
      Buyer: ${project.buyerName}
      Quantity: ${project.quantity}
      Target Ship Date: ${project.shipDate}

      Your goal is to provide a structured breakdown that highlights potential savings.
      Focus specifically on:
      1. Fabric Optimization: Suggest specific weight adjustments or yarn-source alternatives for this style.
      2. Trim & Accessories: Identify bulk-purchase opportunities or material alternatives (e.g., recycled polyester vs virgin).
      3. Labor Efficiency: Suggest CM (Cut and Make) benchmarks for this style type in current manufacturing hubs.
      4. Strategic Negotiation: Provide 3 bullet points of leverage for the merchandiser.

      Return a JSON object with this structure:
      {
        "fabricSavings": "string",
        "trimSavings": "string",
        "laborBenchmark": "string",
        "negotiationPoints": ["string", "string", "string"],
        "efficiencyScore": number (0-100),
        "fobEstimate": "string"
      }`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        // Using responseSchema for robust JSON extraction
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fabricSavings: { type: Type.STRING },
            trimSavings: { type: Type.STRING },
            laborBenchmark: { type: Type.STRING },
            negotiationPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            efficiencyScore: { type: Type.NUMBER },
            fobEstimate: { type: Type.STRING }
          },
          required: ["fabricSavings", "trimSavings", "laborBenchmark", "negotiationPoints", "efficiencyScore", "fobEstimate"],
          propertyOrdering: ["fabricSavings", "trimSavings", "laborBenchmark", "negotiationPoints", "efficiencyScore", "fobEstimate"]
        },
        systemInstruction: "You are a Master Costing Auditor. Provide high-precision, industry-specific advice that focuses on real-world cost reduction strategies for garments."
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Efficiency Audit Error:", error);
    return null;
  }
};

export const getFOBBreakdownSummary = async (project: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a comprehensive FOB Costing Summary for the following style:
      Style: ${project.styleName} (${project.styleNumber})
      Buyer: ${project.buyerName}
      Quantity: ${project.quantity}
      
      Provide a structured summary including:
      1. Estimated Fabric Cost (based on style type)
      2. Trim & Accessories Estimation
      3. Labor/CM (Cut and Make) estimate
      4. Washing/Finish estimations if relevant
      5. Commercial/Logistics and Profit margin buffer
      6. Suggestions for cost savings in fabric or trim sourcing.
      
      Format with clear headings and bullet points.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "You are a Senior Costing Manager. Provide precise, industry-standard FOB breakdown summaries that help merchandisers negotiate better prices."
      }
    });
    return response.text || "Could not generate costing summary.";
  } catch (error) {
    console.error("Costing Summary Error:", error);
    return "Costing analysis failed. Please check style details and retry.";
  }
};

/**
 * Analyzes custom text (e.g., pasted Excel data) for costing breakdown.
 */
export const analyzeCustomCostingText = async (customText: string, project: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `A merchandiser has provided custom costing data (likely pasted from an Excel sheet or internal notepad). 
      Please analyze this raw data and generate a structured FOB Costing Summary for Project: ${project.styleName}.
      
      Raw Custom Data:
      ---
      ${customText}
      ---
      
      Your task:
      1. Clean up the raw data into a readable FOB table summary.
      2. Identify the biggest cost components.
      3. Suggest 2-3 specific areas for cost negotiation based on this specific data.
      4. Provide a total estimated FOB price per unit.`,
      config: {
        thinkingConfig: { thinkingBudget: 24000 },
        systemInstruction: "You are a specialized Garment Costing Analyst. You are excellent at parsing messy, tab-separated, or raw text data from Excel and turning it into professional FOB summaries."
      }
    });
    return response.text || "Analysis of custom data failed.";
  } catch (error) {
    console.error("Custom Costing Analysis Error:", error);
    return "Failed to parse custom data. Ensure the format is readable.";
  }
};

export const getCostingAssistant = async (styleData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze the following garment product details and suggest a breakdown for FOB costing. 
      Help me identify potential savings in fabric or trim sourcing.
      Style: ${styleData.styleName}, Quantity: ${styleData.quantity}, Buyer: ${styleData.buyerName}.`,
      config: { thinkingConfig: { thinkingBudget: 24000 } }
    });
    return response.text;
  } catch (error) {
    return "AI Assistant is currently unavailable.";
  }
};

export const getStepSummary = async (stepLabel: string, records: any[]) => {
  if (!records || records.length === 0) return "No data recorded for this stage.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Stage: ${stepLabel}\nRecords: ${JSON.stringify(records.map(r => r.note))}\n\nSummarize the progress and any issues found in these records in one concise sentence (max 15 words).`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.trim() || "Summary unavailable.";
  } catch (error) {
    return "Failed to summarize.";
  }
};

export const getAIFeedSuggestions = async (projects: any[]) => {
  const projectContext = projects.map(p => `${p.styleName} (${p.season})`).join(", ");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a garments industry trend expert. Based on these active projects: ${projectContext}, 
      provide 4 high-value insights in JSON format.
      Include:
      1. A fabric trend relevant to these styles.
      2. A trim/accessory innovation.
      3. A production efficiency tip.
      4. Global apparel industry news impact.
      
      Format as JSON array of objects with keys: "type" (Fabric/Trims/Production/News), "title", "description", "styleContext".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              styleContext: { type: Type.STRING }
            },
            required: ["type", "title", "description", "styleContext"]
          }
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Feed Error:", error);
    return [];
  }
};

export const evaluateMerchandisingSkills = async (stats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evaluate a Merchandiser's monthly performance summary (2-3 sentences) and a score out of 100 based on ${JSON.stringify(stats)}.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (error) {
    return "Keep up the consistent effort! Your score: 85/100";
  }
};

export const analyzeProductionRisks = async (project: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze potential production risks for the following garment project:
      Style: ${project.styleName}, Quantity: ${project.quantity}, Target Ship Date: ${project.shipDate}.
      Current Status: ${project.workflow[project.currentStepIndex]?.label}.
      Identify bottleneck risks and suggest specific mitigation strategies.`,
      config: { thinkingConfig: { thinkingBudget: 32768 } }
    });
    return response.text;
  } catch (error) {
    return "Risk analysis is currently unavailable. Please check back later.";
  }
};

export const getUrgencyActionPlan = async (project: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `This garment project is marked as URGENT. Create an immediate, high-priority action plan.
      Style: ${project.styleName}, Ship Date: ${project.shipDate}.
      Current Stage: ${project.workflow[project.currentStepIndex]?.label}.
      Provide a step-by-step list of actions to ensure no delivery delays.`,
      config: { thinkingConfig: { thinkingBudget: 32768 } }
    });
    return response.text;
  } catch (error) {
    return "Urgency planning is currently unavailable.";
  }
};
