
import { GoogleGenAI, Type } from "@google/genai";
import { Reference, ChartData, ResearchResponse, ResearchLink, UniversityUpdate } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  // Fast Structural Analysis (Flash)
  async analyzeText(text: string, universityName: string): Promise<any[]> {
    if (!text || text.length < 10) return [];

    const prompt = `
      You are an expert academic thesis editor specializing in Kenyan university standards (e.g., ${universityName}). 
      Analyze the following text snippet from a student's thesis.
      Focus on:
      1. Formal Academic Tone (British English preference).
      2. Clarity and Conciseness.
      3. Passive voice overuse.
      4. Adherence to generic academic standards (APA 7th style).
      
      Return a JSON array of suggestions.
      Each suggestion must have:
      - type: "grammar" | "style" | "clarity"
      - originalText: the exact substring from the text that needs changing.
      - suggestion: the proposed replacement or advice.
      - explanation: a brief reason why.

      Text to analyze: "${text}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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

      const jsonString = response.text || '[]';
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return [];
    }
  },

  // Deep Critique with Thinking Mode (Pro)
  async deepCritique(text: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Act as a rigorous PhD supervisor. Perform a deep logic and argumentation check on this thesis section.
          Identify gaps in logic, weak evidence, theoretical inconsistencies, or lack of critical analysis.
          Provide your feedback in a structured, essay-like format.
          
          Use **Double Asterisks** for headers/section titles to structure your critique.
          Use - for list items.
          
          Text: "${text.substring(0, 30000)}"
        `,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      return response.text || "Unable to generate critique.";
    } catch (e) {
      console.error("Deep Critique Error", e);
      return "Error generating deep critique.";
    }
  },

  async suggestResearchTopics(field: string): Promise<string[]> {
    const prompt = `
      Suggest 5 unique, relevant, and researchable thesis topics for a student in Kenya studying ${field}.
      Ensure they are locally relevant but globally significant.
      Return a JSON array of strings.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Gemini Topic Error:", error);
      return ["Impact of Mobile Money on Rural Development", "AI in Kenyan Agriculture", "Sustainable Tourism Practices"];
    }
  },

  async generateCitation(details: string): Promise<string> {
    const prompt = `
      Format the following reference details into a perfect APA 7th Edition citation string.
      Details: "${details}"
      Return only the citation string.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || '';
    } catch (error) {
      return "Error generating citation.";
    }
  },

  // Research with Google Search Grounding (Flash)
  async researchTopic(query: string): Promise<ResearchResponse> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find academic sources and recent information about: ${query}. Summarize key findings suitable for a thesis literature review.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract links from grounding chunks
      const rawLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter((l: any) => l !== null) as ResearchLink[] || [];

      // Deduplicate links by URI
      const uniqueLinks = Array.from(new Map(rawLinks.map(link => [link.uri, link])).values());

      return {
        content: response.text || 'No results found.',
        links: uniqueLinks
      };
    } catch (error) {
      console.error("Research Error:", error);
      return { content: "Failed to perform research. Please try again.", links: [] };
    }
  },

  // Check for University Updates (Flash with Search)
  async checkUniversityUpdates(universityName: string): Promise<UniversityUpdate[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              Search for the latest thesis writing guidelines, formatting rules, citation style changes, or academic calendar updates for ${universityName} for the years 2024-2025.
              Look for official university pdfs, announcements, or news.
              
              Summarize any found updates into a JSON array. If no recent specific updates are found, return generic reminders for that university based on common knowledge.
              Schema: [{
                  "title": "Short title of update",
                  "description": "2 sentence summary",
                  "type": "formatting" | "citation" | "deadline" | "policy",
                  "sourceUrl": "URL if available or empty string"
              }]
              Return strictly valid JSON.
            `,
            config: {
                tools: [{ googleSearch: {} }],
                // responseMimeType and responseSchema are not allowed with googleSearch
            }
        });

        let jsonString = response.text || '[]';
        // Remove markdown code blocks if present
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        const updates = JSON.parse(jsonString);
        return updates.map((u: any, i: number) => ({
            ...u,
            id: Date.now().toString() + i,
            universityId: universityName.toLowerCase().replace(/\s/g, ''),
            universityName: universityName,
            date: new Date()
        }));
    } catch (error) {
        console.error("University Update Error", error);
        return [{
            id: 'error-1',
            universityId: 'unknown',
            universityName: universityName,
            date: new Date(),
            title: 'Could not fetch real-time updates',
            description: 'Please check the official university website for the latest guidelines.',
            type: 'policy'
        }];
    }
  },

  // Complex Chat with Thinking Mode (Pro)
  async chatWithTutor(message: string, context: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Context (Current Document Content): "${context.substring(0, 10000)}..."
          
          User Question: "${message}"
          
          You are a helpful Thesis Supervisor. Answer the student's question based on the context provided. Be encouraging but rigorous.
        `,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      return response.text || "I'm not sure how to answer that.";
    } catch (error) {
      console.error("Chat Error", error);
      return "Error connecting to tutor.";
    }
  },

  async rewriteText(text: string, mode: 'paraphrase' | 'expand' | 'shorten'): Promise<string> {
    let instruction = "";
    switch (mode) {
      case 'paraphrase': instruction = "Rewrite this text to improve clarity and academic tone while keeping the same meaning."; break;
      case 'expand': instruction = "Expand this text with more academic detail, transitions, and explanation."; break;
      case 'shorten': instruction = "Concisely summarize this text, removing fluff while keeping key points."; break;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${instruction}\n\nText: "${text}"`
      });
      return response.text || text;
    } catch (error) {
      return text;
    }
  },

  async continueWriting(context: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          You are a helpful academic writing assistant. 
          Continue the following academic text naturally, maintaining the same tone, style, and flow. 
          Write about 100-150 words. Do not repeat the last sentence.
          
          Current Text: "${context.slice(-1000)}"
        `
      });
      return response.text || "";
    } catch (error) {
      return "";
    }
  },

  async getSynonyms(word: string, context: string): Promise<string[]> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide 5 academic synonyms for the word "${word}" appropriate for the following context: "${context}". Return a JSON array of strings.`,
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
      return [];
    }
  },

  async generateChartData(description: string): Promise<ChartData | null> {
    try {
      const prompt = `
        Create a valid JSON object to render a chart using 'recharts' based on this description: "${description}".
        The JSON must adhere to this exact schema:
        {
          "title": "A short academic title for the chart",
          "type": "bar" | "line" | "area" | "pie",
          "data": [ { "name": "Category1", "value": 10 }, ... ],
          "xKey": "The key to use for X-axis (e.g., 'name' or 'year')",
          "dataKeys": ["The key(s) to use for data values (e.g. 'value')"],
          "description": "A brief academic caption describing the figure."
        }
        Ensure the data is realistic if not specified.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || 'null');
      if (parsed) {
        return { ...parsed, id: Date.now().toString() };
      }
      return null;
    } catch (error) {
      console.error("Chart Gen Error", error);
      return null;
    }
  },

  async parseReference(rawText: string): Promise<Reference | null> {
    try {
      const prompt = `
        Parse this citation/reference text into structured data.
        Text: "${rawText}"
        Output JSON with keys: author, year, title, source, formatted (APA 7th style).
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
      if (parsed) {
          return { ...parsed, id: Date.now().toString(), raw: rawText };
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  
  async generateSectionContent(title: string, thesisTitle: string, context: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          You are writing a specific section for an academic thesis titled "${thesisTitle}".
          Write the content for the section heading: "${title}".
          
          Context so far (preceding text): "${context.substring(Math.max(0, context.length - 5000))}"
          
          Instructions:
          - Write academic, formal content suitable for a thesis.
          - Write approximately 300-500 words.
          - Ensure smooth flow from previous context if applicable.
          - Do NOT repeat the heading title in your output.
          - Use proper paragraph structure.
        `
      });
      return response.text || "";
    } catch (error) {
      return "";
    }
  },

  async generateThesisOutline(topic: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Create a detailed academic thesis outline for the topic: "${topic}".
          Include standard chapters (Introduction, Literature Review, Methodology, Results, Discussion, Conclusion) and relevant subheadings (e.g., 1.1, 1.2).
          Format as plain text with clear indentation or numbering.
          Do not include any introductory text, just the outline.
        `
      });
      return response.text || "";
    } catch (error) {
      return "";
    }
  },

  // --- TOOLKIT FEATURES ---

  async generateGrantProposal(thesisAbstract: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Convert this thesis abstract into a winning research grant proposal summary.
          Include: 
          1. Project Title
          2. Executive Summary
          3. Relevance/Impact
          4. Budget Justification (Hypothetical)
          
          Abstract: "${thesisAbstract}"
        `
      });
      return response.text || "Failed to generate proposal.";
    } catch (e) { return "Error"; }
  },

  async generateSlidesOutline(content: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Create a 10-slide presentation outline for a thesis defense based on this content.
          Format as markdown.
          Slide structure: Title, Bullet Points, Speaker Notes.
          
          Content: "${content.substring(0, 15000)}"
        `
      });
      return response.text || "Failed to generate slides.";
    } catch (e) { return "Error"; }
  },

  async matchJournals(abstract: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Suggest 5 academic journals suitable for publishing a paper with this abstract.
          For each, provide: Journal Name, Impact Factor (Estimate), and Scope Fit.
          
          Abstract: "${abstract}"
        `
      });
      return response.text || "Failed to match journals.";
    } catch (e) { return "Error"; }
  },

  async generateLiteratureMatrix(topic: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Generate a "Literature Review Matrix" for the topic: "${topic}".
          Create a Markdown table with 5 hypothetical but realistic academic sources (or real ones if you know them).
          Columns: Author(Year), Methodology, Key Findings, Research Gaps.
        `,
        config: { thinkingConfig: { thinkingBudget: 4096 } }
      });
      return response.text || "Failed to generate matrix.";
    } catch (e) { return "Error"; }
  },

  // Scientific Paper Checker (Inspired by automated checkers)
  async checkScientificPaper(content: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `
          Perform a rigorous scientific audit on the text below, acting as an automated compliance tool.
          
          Check for the following specific issues:
          1. **Structure (IMRaD)**: Check for presence of Intro, Methods, Results, Discussion headers.
          2. **Acronyms**: Are acronyms defined on first use? (e.g. "Artificial Intelligence (AI)").
          3. **Figure/Table Referencing**: Are "Figure 1" or "Table 1" referenced correctly in text? Consistent naming (Fig vs Figure)?
          4. **Subjective Language**: Flag words like "huge", "amazing", "unfortunately", "I feel".
          5. **Spacing & Units**: Check for space between number and unit (e.g. "5 kg" vs "5kg").
          6. **Consistency**: Does the Abstract conclusion match the final Conclusion?

          Provide a report in Markdown with a "Compliance Score" out of 100 at the top, followed by a checklist of the above 6 items (Pass/Fail/Warn) and specific examples of errors found.
          
          Content: "${content.substring(0, 30000)}"
        `,
        config: { thinkingConfig: { thinkingBudget: 4096 } }
      });
      return response.text || "Failed to check paper.";
    } catch (e) { return "Error checking paper."; }
  },

  async generateAnalyticsReport(docsSummary: string): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                You are a thesis performance analyst. Analyze the following writing statistics for a student and provide 3 key insights.
                
                Data:
                ${docsSummary}
                
                Return a strictly valid JSON object with this schema:
                { 
                  "peakPerformance": "One sentence about their best working time or habit.", 
                  "academicTone": "One sentence about their writing style improvement.", 
                  "goalProjection": "One sentence predicting when they will finish." 
                }
            `,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        peakPerformance: { type: Type.STRING },
                        academicTone: { type: Type.STRING },
                        goalProjection: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Analytics Report Error", error);
        return {
            peakPerformance: "Keep writing to generate data.",
            academicTone: "Maintain a formal tone.",
            goalProjection: "Set a deadline to stay on track."
        };
    }
  },

  // --- GENERIC TOOLKIT HANDLER ---
  async runGenericTool(toolId: string, input: string): Promise<string> {
    let prompt = '';
    let model = 'gemini-2.5-flash';
    let toolsConfig = undefined;

    switch (toolId) {
      case 't1': // Abstract
        prompt = `Summarize the following text into a formal, structured academic abstract (approx 250 words). Include Background, Methods, Results, and Conclusion.\n\nText: "${input}"`;
        break;
      case 't2': // Title
        prompt = `Generate 5 engaging and academically rigorous titles for a thesis based on this abstract/content:\n\n"${input}"`;
        break;
      case 't3': // Passive Voice
        prompt = `Rewrite the following text to minimize passive voice and improve directness, maintaining an academic tone:\n\n"${input}"`;
        break;
      case 't4': // Transitions
        prompt = `Analyze the following text and suggest better transition words or phrases to improve flow and cohesion:\n\n"${input}"`;
        break;
      case 't5': // Readability
        prompt = `Analyze the readability of the text below. Estimate the Flesch-Kincaid score, identify complex sentences, and suggest simplifications.\n\nText: "${input}"`;
        break;
      case 't6': // Originality (Simulated Plagiarism)
        prompt = `Analyze this text for originality. Highlight clichéd phrases, overused academic tropes, or sections that sound generic. Suggest ways to make the voice more unique.\n\nText: "${input}"`;
        break;
      case 't7': // Paraphrase
        prompt = `Paraphrase the following text to improve clarity and originality, ensuring the meaning remains unchanged. suitable for a thesis:\n\n"${input}"`;
        break;
      case 't8': // LaTeX
        prompt = `Convert the following mathematical expression or text into valid LaTeX code:\n\n"${input}"`;
        break;
      case 't9': // Argument Logic
        prompt = `Critique the logical strength of the following argument. Identify fallacies, weak premises, or unsupported claims:\n\n"${input}"`;
        model = 'gemini-3-pro-preview';
        break;
      case 't10': // Thesis Statement
        prompt = `Generate 3 strong, arguable thesis statements based on this topic or problem description:\n\n"${input}"`;
        break;
      case 't12': // Methodology
        prompt = `Outline a robust research methodology for the following study topic. Include research design, population, sampling, and data analysis techniques:\n\nTopic: "${input}"`;
        model = 'gemini-3-pro-preview';
        break;
      case 't13': // Reference Manager (Formatter)
        prompt = `Format the following raw reference information into perfect APA 7th Edition citations:\n\n"${input}"`;
        break;
      case 't14': // Survey Gen
        prompt = `Create a 10-item questionnaire/survey for a study on: "${input}". Ensure questions are neutral and academically sound.`;
        break;
      case 't15': // Ethics
        prompt = `Generate a research ethics checklist for a study involving: "${input}". Highlight potential risks and required consents.`;
        break;
      case 't16': // Text Chat (Q&A)
        prompt = `You are a research assistant. Answer the user's request based on general academic knowledge or refine the following text:\n\n"${input}"`;
        break;
      case 't17': // Keywords
        prompt = `Extract 5-10 high-impact SEO keywords and academic descriptors from this text:\n\n"${input}"`;
        break;
      case 't22': // Conference Finder
        prompt = `Find upcoming academic conferences (2024-2025) relevant to this topic: "${input}". Include dates and locations if found.`;
        toolsConfig = [{ googleSearch: {} }];
        break;
      case 't23': // CV Builder
        prompt = `Extract key research skills, methodologies, and subject matter expertise from this thesis abstract for a generic CV/Resume:\n\n"${input}"`;
        break;
      case 't26': // Data Mockup
        prompt = `Generate a realistic dummy dataset (in CSV format) for a study about: "${input}". Include 10 rows.`;
        break;
      case 't27': // Stat Test
        prompt = `Recommend the most appropriate statistical test(s) for the following research question and data type:\n\n"${input}"`;
        break;
      case 't29': // Codebook
        prompt = `Generate a qualitative coding framework (codebook) with themes and sub-themes for a study on:\n\n"${input}"`;
        break;
      default:
        return "Tool not configured yet.";
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: toolsConfig,
        }
      });
      return response.text || "No response generated.";
    } catch (error) {
      console.error("Tool Error:", error);
      return "An error occurred while running the tool.";
    }
  }
};
