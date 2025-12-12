
import { GoogleGenAI, Type } from "@google/genai";
import { ResearchResponse, ResearchLink, ChartData, Reference, UniversityUpdate, Journal, ValidationReport, AnalyticsReport, University } from "@/types";

// Helper to initialize AI client
function getAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
}

export const GeminiService = {
  validateResearch: async (text: string): Promise<ValidationReport> => {
    const ai = getAIClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          You are an academic auditor and fact-checker. Analyze the following academic text for three pillars of validity:
          
          1. **Fact-Checking**: Identify specific claims, statistics, or historical assertions. Verify them against general knowledge and real-time information. Flag dubious or unsupported claims.
          2. **Academic Integrity**: Check for citation gaps (claims without references), potential plagiarism (generic/clichéd phrasing), and correct attribution.
          3. **Quality Metrics**: Evaluate coherence, flow, argument strength, and methodology appropriateness.

          Text to validate:
          "${text.substring(0, 15000)}"

          Return a strictly valid JSON object adhering to this schema:
          {
            "factScore": number (0-100),
            "integrityScore": number (0-100),
            "qualityScore": number (0-100),
            "summary": string (A brief executive summary of the validation),
            "issues": [
              {
                "category": "fact" | "integrity" | "quality",
                "severity": "high" | "medium" | "low",
                "text": "The specific substring in the text causing the issue",
                "issue": "Description of the problem (e.g., 'Unsupported statistical claim')",
                "recommendation": "How to fix it (e.g., 'Add a citation to a 2023 study')"
              }
            ]
          }
        `,
        config: {
          tools: [{ googleSearch: {} }],
          // responseMimeType and responseSchema cannot be used with tools
        }
      });

      let jsonString = response.text || '{}';
      // Clean up markdown code blocks if the model includes them
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse validation JSON", e);
        // Fallback for empty or malformed JSON
        data = { factScore: 0, integrityScore: 0, qualityScore: 0, summary: "Could not parse analysis results.", issues: [] };
      }
      
      data.issues = data.issues?.map((issue: any, index: number) => ({
          ...issue,
          id: `val-${Date.now()}-${index}`
      })) || [];

      return data as ValidationReport;
    } catch (error) {
      console.error("Validation Error", error);
      return {
        factScore: 0,
        integrityScore: 0,
        qualityScore: 0,
        summary: "Error running validation checks.",
        issues: []
      };
    }
  },

  filterDocuments: async (query: string, docsMetadata: any[]): Promise<string[]> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          You are an intelligent document search engine.
          User Query: "${query}"
          
          Available Documents (Metadata):
          ${JSON.stringify(docsMetadata)}
          
          Instructions:
          1. Interpret the user's intent.
          2. Select the IDs of documents that match this intent.
          3. Return strictly a JSON array of strings (the IDs).
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("AI Filter Error", error);
      return [];
    }
  },

  analyzeText: async (text: string, university: University | null): Promise<any[]> => {
    if (!text || text.length < 10) return [];
    const ai = getAIClient();
    const standards = university?.standards || { citationStyle: 'APA 7th', font: 'Times New Roman', size: '12', spacing: 'Double' };
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Analyze for ${standards.citationStyle}, academic tone, and clarity.
          Text: "${text.substring(0, 10000)}"
          Return JSON array of suggestions (type, originalText, suggestion, explanation).
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                originalText: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
            },
          },
        },
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      return [];
    }
  },

  deepCritique: async (text: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Critique logic and argumentation. Text: "${text.substring(0, 30000)}"`,
        config: { thinkingConfig: { thinkingBudget: 32768 } }
      });
      return response.text || "Unable to generate critique.";
    } catch (e) { return "Error generating deep critique."; }
  },

  researchTopic: async (query: string): Promise<ResearchResponse> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find academic sources about: ${query}`,
        config: { tools: [{ googleSearch: {} }] },
      });

      const rawLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter((l: any) => l !== null) as ResearchLink[] || [];

      const uniqueLinks = Array.from(new Map(rawLinks.map(link => [link.uri, link])).values());

      return { content: response.text || 'No results.', links: uniqueLinks };
    } catch (error) { return { content: "Research failed.", links: [] }; }
  },

  checkUniversityUpdates: async (universityName: string): Promise<UniversityUpdate[]> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 2024-2025 thesis updates for ${universityName}. Return JSON array.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      let jsonString = response.text || '[]';
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const updates = JSON.parse(jsonString);
      return updates.map((u: any, i: number) => ({
          ...u,
          id: Date.now().toString() + i,
          universityId: universityName.toLowerCase().replace(/\s/g, ''),
          universityName,
          date: new Date()
      }));
    } catch (error) {
      return [{
          id: 'error',
          universityId: 'unknown',
          universityName,
          date: new Date(),
          title: 'Could not fetch updates',
          description: 'Check official website.',
          type: 'policy'
      }];
    }
  },

  chatWithTutor: async (message: string, context: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Context: "${context.substring(0, 10000)}..." Question: "${message}"`,
        config: { thinkingConfig: { thinkingBudget: 32768 } }
      });
      return response.text || "No response.";
    } catch (error) { return "Error connecting."; }
  },

  rewriteText: async (text: string, mode: 'paraphrase' | 'expand' | 'shorten'): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${mode} this text: "${text}"`
      });
      return response.text || text;
    } catch (error) { return text; }
  },

  continueWriting: async (context: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Continue writing: "${context.slice(-1000)}"`
      });
      return response.text || "";
    } catch (error) { return ""; }
  },

  getSynonyms: async (word: string, context: string): Promise<string[]> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Synonyms for "${word}" in context: "${context}"`,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) { return []; }
  },

  generateChartData: async (description: string): Promise<ChartData | null> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate Chart JSON for: "${description}"`,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text || 'null');
      return parsed ? { ...parsed, id: Date.now().toString() } : null;
    } catch (error) { return null; }
  },

  parseReference: async (rawText: string): Promise<Reference | null> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Parse reference: "${rawText}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
             type: Type.OBJECT,
             properties: {
                 author: { type: Type.STRING },
                 year: { type: Type.STRING },
                 title: { type: Type.STRING },
                 source: { type: Type.STRING },
                 formatted: { type: Type.STRING }
             }
          }
        }
      });
      const parsed = JSON.parse(response.text || 'null');
      return parsed ? { ...parsed, id: Date.now().toString(), raw: rawText } : null;
    } catch (e) { return null; }
  },

  findCitation: async (query: string): Promise<Reference[]> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Search academic sources for: "${query}". Return top 3 JSON array.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      let text = response.text || '[]';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const arrayMatch = text.match(/\[.*\]/s);
      if (arrayMatch) text = arrayMatch[0];
      const results = JSON.parse(text);
      if (Array.isArray(results)) {
          return results.map((r: any, i: number) => ({
              id: `web-${Date.now()}-${i}`,
              raw: query,
              author: r.author || 'Unknown',
              year: r.year || 'n.d.',
              title: r.title || 'Untitled',
              source: r.source || 'Unknown Source',
              formatted: r.formatted || `${r.author}. (${r.year}). ${r.title}.`,
              url: r.url
          }));
      }
      return [];
    } catch (error) { return []; }
  },

  generateSectionContent: async (title: string, thesisTitle: string, context: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write section "${title}" for thesis "${thesisTitle}". Context: "${context.slice(-5000)}"`
      });
      return response.text || "";
    } catch (error) { return ""; }
  },

  generateThesisOutline: async (topic: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Thesis outline for: "${topic}"`
      });
      return response.text || "";
    } catch (error) { return ""; }
  },

  generateGrantProposal: async (thesisAbstract: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Grant proposal from abstract: "${thesisAbstract}"`
      });
      return response.text || "Failed.";
    } catch (e) { return "Error"; }
  },

  generateSlidesOutline: async (content: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `10-slide defense outline from: "${content.substring(0, 15000)}"`
      });
      return response.text || "Failed.";
    } catch (e) { return "Error"; }
  },

  matchJournals: async (abstract: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest 5 journals for: "${abstract}"`
      });
      return response.text || "Failed.";
    } catch (e) { return "Error"; }
  },

  findJournals: async (abstract: string): Promise<Journal[]> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest 6 journals for: "${abstract.substring(0, 5000)}". Return JSON array.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                publisher: { type: Type.STRING },
                impactFactor: { type: Type.STRING },
                matchScore: { type: Type.INTEGER },
                matchReason: { type: Type.STRING },
                scope: { type: Type.STRING },
                acceptanceRate: { type: Type.STRING },
                openAccess: { type: Type.BOOLEAN },
                website: { type: Type.STRING }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) { return []; }
  },

  generateLiteratureMatrix: async (topic: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Literature Matrix for: "${topic}"`,
        config: { thinkingConfig: { thinkingBudget: 32768 } }
      });
      return response.text || "Failed.";
    } catch (e) { return "Error"; }
  },

  checkScientificPaper: async (content: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audit this paper: "${content.substring(0, 30000)}"`,
        config: { thinkingConfig: { thinkingBudget: 32768 } }
      });
      return response.text || "Failed.";
    } catch (e) { return "Error"; }
  },

  generateAnalyticsReport: async (docsSummary: string): Promise<AnalyticsReport> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze stats: ${docsSummary}`,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { peakPerformance: { type: Type.STRING }, academicTone: { type: Type.STRING }, goalProjection: { type: Type.STRING } } } }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) { return { peakPerformance: "", academicTone: "", goalProjection: "" }; }
  },

  generateStudySchedule: async (topic: string, startDate: string): Promise<any[]> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Thesis roadmap for "${topic}" starting ${startDate}. Return JSON array.`,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.NUMBER }, name: { type: Type.STRING }, start: { type: Type.NUMBER }, duration: { type: Type.NUMBER }, status: { type: Type.STRING } } } }, thinkingConfig: { thinkingBudget: 32768 } }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) { return []; }
  },

  generateCitation: async (details: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `APA 7 citation for: "${details}"`
      });
      return response.text || '';
    } catch (error) { return "Error"; }
  },

  runGenericTool: async (toolId: string, input: string): Promise<string> => {
    const ai = getAIClient();
    let prompt = `Run tool ${toolId} on: "${input}"`;
    let model = 'gemini-2.5-flash';
    let thinking = undefined;
    let tools = undefined;

    if (['t9', 't12'].includes(toolId)) { model = 'gemini-3-pro-preview'; thinking = { thinkingBudget: 32768 }; }
    if (['t16', 't22'].includes(toolId)) { tools = [{ googleSearch: {} }]; }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { thinkingConfig: thinking, tools: tools }
      });
      return response.text || "No response.";
    } catch (e) { return "Error."; }
  }
};
