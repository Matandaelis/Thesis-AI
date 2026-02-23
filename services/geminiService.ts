import { GoogleGenAI, Type } from "@google/genai";
import { 
  ResearchLink, 
  Journal, 
  ValidationReport, 
  AnalyticsReport, 
  LibraryItem,
  WebResearchResponse
} from "../types";

/**
 * Service to interact with Google Gemini models.
 * Strictly adheres to @google/genai coding guidelines.
 */
export const GeminiService = {
  
  /**
   * Internal helper to get a fresh AI instance.
   * Required to prevent race conditions during API Key selection for Veo models.
   */
  _getAI: () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY }),

  testConnection: async () => {
    try {
      const ai = GeminiService._getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Hello, confirm connection status.',
      });
      return { success: !!response.text, message: response.text || "Connected" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Connection test failed:", message);
      return { success: false, message: "Connection Failed: " + message };
    }
  },

  /**
   * NL Web Capability: Search the web with grounding for academic tasks.
   */
  searchWebAcademic: async (query: string): Promise<WebResearchResponse> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Research task: ${query}. Focus on academic sources, official institutional guidelines, and peer-reviewed data.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "No synthesis available.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const sources: ResearchLink[] = chunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title || "External Source",
          uri: chunk.web?.uri || ""
        }));

      return { answer: text, sources };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Web grounded search failed:", message);
      return { answer: "I encountered an error searching the web. Please try again.", sources: [] };
    }
  },

  /**
   * Multimodal: Generate images for thesis diagrams.
   */
  generateImage: async (prompt: string): Promise<string | null> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High-quality, professional academic figure or conceptual diagram: ${prompt}` }]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      for (const part of response.candidates?.[0].content.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      console.warn("[GeminiService] No image data returned from model");
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Image generation error:", message);
      return null;
    }
  },

  /**
   * Multimodal: Generate cinematic scientific visualizations.
   */
  generateVideo: async (prompt: string, onProgress: (status: string) => void): Promise<string | null> => {
    const ai = GeminiService._getAI();
    try {
      onProgress("Contacting Veo engines...");
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A professional scientific visualization or research animation: ${prompt}`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      onProgress("Veo is synthesizing frames (this takes ~1-3 minutes)...");
      let attempts = 0;
      const maxAttempts = 18; // 3 minutes with 10s intervals
      while (!operation.done && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        attempts++;
      }
      
      if (!operation.done) {
        throw new Error("Video generation timeout after 3 minutes");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("No download link received");

      onProgress("Downloading final asset...");
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!videoResponse.ok) throw new Error(`Failed to fetch video bytes: ${videoResponse.statusText}`);
      
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Video generation failed:", message);
      onProgress(`Error: ${message}`);
      return null;
    }
  },

  /**
   * Perform deep structural and factual validation of a research text.
   */
  validateResearch: async (text: string): Promise<ValidationReport> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audit this academic text for factual consistency, integrity, and quality: "${text.substring(0, 10000)}"`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              factScore: { type: Type.NUMBER },
              integrityScore: { type: Type.NUMBER },
              qualityScore: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    text: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    recommendation: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      const data = JSON.parse(response.text || '{}');
      return {
        ...data,
        issues: data.issues?.map((i: any, idx: number) => ({ ...i, id: `v-${idx}` })) || []
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Validation error:", message);
      return { 
        factScore: 0, 
        integrityScore: 0, 
        qualityScore: 0, 
        summary: "Audit failed: " + message, 
        issues: [] 
      };
    }
  },

  chatWithDocument: async (message: string, context: string, history: any[]) => {
    const ai = GeminiService._getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are an expert PhD supervisor. Provide specific, citation-driven feedback. Context: ${context.substring(0, 20000)}`
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });
    const result = await chat.sendMessage({ message });
    return result.text || "I was unable to process your question.";
  },

  synthesizeLibraryItems: async (items: LibraryItem[], mode: 'thematic' | 'draft') => {
    const ai = GeminiService._getAI();
    try {
      const prompt = `Perform a ${mode} synthesis of these papers: ${items.map(i => `${i.title} (${i.author}, ${i.year})`).join('; ')}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 32768 } }
      });
      return response.text || "Synthesis failed.";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Synthesis error:", message);
      return "Synthesis failed: " + message;
    }
  },

  checkUniversityUpdates: async (universityName: string) => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Latest 2024-2025 academic updates for ${universityName}. Include policy shifts, formatting changes, and deadlines.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                date: { type: Type.STRING },
                type: { type: Type.STRING },
                sourceUrl: { type: Type.STRING }
              }
            }
          }
        }
      });
      const data = JSON.parse(response.text || '[]');
      return data.map((item: any, idx: number) => ({
        ...item,
        id: `upd-${Date.now()}-${idx}`,
        universityName,
        date: new Date(item.date)
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] University updates check failed:", message);
      return [];
    }
  },

  findJournals: async (abstract: string): Promise<Journal[]> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Suggest high-impact academic journals for this abstract: "${abstract}"`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                publisher: { type: Type.STRING },
                impactFactor: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Journal finding failed:", message);
      return [];
    }
  },

  runGenericTool: async (toolId: string, input: string): Promise<string> => {
    const ai = GeminiService._getAI();
    try {
      const prompts: Record<string, string> = {
        't1': `Generate a concise academic abstract for this research text: "${input}"`,
      };
      const prompt = prompts[toolId] || `Summarize and extract key insights from this text: "${input}"`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "I was unable to process the requested tool.";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Generic tool error:", message);
      return "Tool execution failed: " + message;
    }
  },

  generateLiteratureMatrix: async (input: string): Promise<string> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a markdown literature comparison table for these sources: "${input}". Include columns for Author/Year, Research Objective, Methodology, Findings, and Limitations.`,
      });
      return response.text || "Failed to generate matrix.";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Literature matrix generation failed:", message);
      return "Failed to generate matrix: " + message;
    }
  },

  filterDocuments: async (searchQuery: string, docsMetadata: any[]): Promise<string[]> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these documents: ${JSON.stringify(docsMetadata)} and identify which ones match this natural language query: "${searchQuery}". Return ONLY a JSON array of matching document IDs.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Document filtering failed:", message);
      return [];
    }
  },

  generateAnalyticsReport: async (summary: string): Promise<AnalyticsReport> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `As an academic supervisor, analyze this document completion summary and provide three distinct insights: "${summary}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              peakPerformance: { type: Type.STRING, description: 'Pattern of high productivity' },
              academicTone: { type: Type.STRING, description: 'Linguistic quality of drafts' },
              goalProjection: { type: Type.STRING, description: 'Estimated time to completion' }
            },
            required: ["peakPerformance", "academicTone", "goalProjection"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Analytics report generation failed:", message);
      return { peakPerformance: "", academicTone: "", goalProjection: "" };
    }
  },

  generateStudySchedule: async (topic: string, startDate: string): Promise<any[]> => {
    const ai = GeminiService._getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a logical research roadmap for a thesis titled "${topic}" starting from ${startDate}. Provide estimated durations in days.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                name: { type: Type.STRING },
                start: { type: Type.NUMBER, description: 'Days offset from start' },
                duration: { type: Type.NUMBER, description: 'Duration in days' },
                status: { type: Type.STRING, description: 'Status: completed, active, or pending' }
              },
              required: ["id", "name", "start", "duration", "status"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiService] Study schedule generation failed:", message);
      return [];
    }
  }
};
