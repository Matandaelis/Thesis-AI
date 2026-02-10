"use server"

import { generateText, generateObject } from "ai"
import { z } from "zod"
import type { ResearchResponse, ChartData, Reference, UniversityUpdate } from "@/types"

export async function analyzeTextAction(text: string, universityName: string): Promise<any[]> {
  if (!text || text.length < 10) return []

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
  `

  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        suggestions: z.array(
          z.object({
            type: z.enum(["grammar", "style", "clarity"]),
            originalText: z.string(),
            suggestion: z.string(),
            explanation: z.string(),
          }),
        ),
      }),
      prompt,
    })

    return object.suggestions
  } catch (error) {
    console.error("Analysis Error:", error)
    return []
  }
}

export async function deepCritiqueAction(text: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `
        Act as a rigorous PhD supervisor. Perform a deep logic and argumentation check on this thesis section.
        Identify gaps in logic, weak evidence, theoretical inconsistencies, or lack of critical analysis.
        Provide your feedback in a structured, essay-like format.
        
        Use **Double Asterisks** for headers/section titles to structure your critique.
        Use - for list items.
        
        Text: "${text.substring(0, 30000)}"
      `,
    })
    return result || "Unable to generate critique."
  } catch (e) {
    console.error("Deep Critique Error", e)
    return "Error generating deep critique."
  }
}

export async function researchTopicAction(query: string): Promise<ResearchResponse> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Find academic sources and recent information about: ${query}. Summarize key findings suitable for a thesis literature review. Include specific paper titles, authors, and years where possible.`,
    })

    return {
      content: result || "No results found.",
      links: [],
    }
  } catch (error) {
    console.error("Research Error:", error)
    return { content: "Failed to perform research. Please try again.", links: [] }
  }
}

export async function checkUniversityUpdatesAction(universityName: string): Promise<UniversityUpdate[]> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        updates: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            type: z.enum(["formatting", "citation", "deadline", "policy"]),
            sourceUrl: z.string().optional(),
          }),
        ),
      }),
      prompt: `
        Provide thesis writing guidelines, formatting rules, citation style information, or academic calendar guidance for ${universityName} for the years 2024-2025.
        If no specific updates are known, return generic academic thesis reminders appropriate for that university.
      `,
    })

    return object.updates.map((u, i) => ({
      ...u,
      id: Date.now().toString() + i,
      universityId: universityName.toLowerCase().replace(/\s/g, ""),
      universityName: universityName,
      date: new Date(),
      sourceUrl: u.sourceUrl || "",
    }))
  } catch (error) {
    console.error("University Update Error", error)
    return [
      {
        id: "error-1",
        universityId: "unknown",
        universityName: universityName,
        date: new Date(),
        title: "Could not fetch real-time updates",
        description: "Please check the official university website for the latest guidelines.",
        type: "policy",
      },
    ]
  }
}

export async function chatWithTutorAction(message: string, context: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `
        Context (Current Document Content): "${context.substring(0, 10000)}..."
        
        User Question: "${message}"
        
        You are a helpful Thesis Supervisor. Answer the student's question based on the context provided. Be encouraging but rigorous.
      `,
    })
    return result || "I'm not sure how to answer that."
  } catch (error) {
    return "Error connecting to tutor."
  }
}

export async function rewriteTextAction(text: string, mode: "paraphrase" | "expand" | "shorten"): Promise<string> {
  let instruction = ""
  switch (mode) {
    case "paraphrase":
      instruction = "Rewrite this text to improve clarity and academic tone while keeping the same meaning."
      break
    case "expand":
      instruction = "Expand this text with more academic detail, transitions, and explanation."
      break
    case "shorten":
      instruction = "Concisely summarize this text, removing fluff while keeping key points."
      break
  }

  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `${instruction}\n\nText: "${text}"`,
    })
    return result || text
  } catch (error) {
    return text
  }
}

export async function continueWritingAction(context: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `
        You are a helpful academic writing assistant. 
        Continue the following academic text naturally, maintaining the same tone, style, and flow. 
        Write about 100-150 words. Do not repeat the last sentence.
        
        Current Text: "${context.slice(-1000)}"
      `,
    })
    return result || ""
  } catch (error) {
    return ""
  }
}

export async function getSynonymsAction(word: string, context: string): Promise<string[]> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        synonyms: z.array(z.string()),
      }),
      prompt: `Provide 5 academic synonyms for the word "${word}" appropriate for the following context: "${context}".`,
    })
    return object.synonyms
  } catch (error) {
    return []
  }
}

export async function generateChartDataAction(description: string): Promise<ChartData | null> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        title: z.string(),
        type: z.enum(["bar", "line", "area", "pie"]),
        data: z.array(
          z.object({
            name: z.string(),
            value: z.number(),
          }),
        ),
        xKey: z.string(),
        dataKeys: z.array(z.string()),
        description: z.string(),
      }),
      prompt: `Create chart data for: "${description}". Ensure the data is realistic.`,
    })

    return { ...object, id: Date.now().toString() }
  } catch (error) {
    return null
  }
}

export async function parseReferenceAction(rawText: string): Promise<Reference | null> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        author: z.string(),
        year: z.string(),
        title: z.string(),
        source: z.string(),
        formatted: z.string(),
      }),
      prompt: `Parse this citation/reference text into structured data and format it in APA 7th style.\nText: "${rawText}"`,
    })

    return { ...object, id: Date.now().toString(), raw: rawText }
  } catch (e) {
    return null
  }
}

export async function generateSectionContentAction(
  title: string,
  thesisTitle: string,
  context: string,
): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `
        You are writing a specific section for an academic thesis titled "${thesisTitle}".
        Write the content for the section heading: "${title}".
        
        Context so far (preceding text): "${context.substring(Math.max(0, context.length - 5000))}"
        
        Instructions:
        - Write academic, formal content suitable for a thesis.
        - Write approximately 300-500 words.
        - Ensure smooth flow from previous context if applicable.
        - Do NOT repeat the heading title in your output.
        - Use proper paragraph structure.
      `,
    })
    return result || ""
  } catch (error) {
    return ""
  }
}

export async function generateThesisOutlineAction(topic: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `
        Create a detailed academic thesis outline for the topic: "${topic}".
        Include standard chapters (Introduction, Literature Review, Methodology, Results, Discussion, Conclusion) and relevant subheadings (e.g., 1.1, 1.2).
        Format as plain text with clear indentation or numbering.
        Do not include any introductory text, just the outline.
      `,
    })
    return result || ""
  } catch (error) {
    return ""
  }
}

export async function generateGrantProposalAction(thesisAbstract: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `
        Convert this thesis abstract into a winning research grant proposal summary.
        Include: 
        1. Project Title
        2. Executive Summary
        3. Relevance/Impact
        4. Budget Justification (Hypothetical)
        
        Abstract: "${thesisAbstract}"
      `,
    })
    return result || "Failed to generate proposal."
  } catch (e) {
    return "Error"
  }
}

export async function generateSlidesOutlineAction(content: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `
        Create a 10-slide presentation outline for a thesis defense based on this content.
        Format as markdown.
        Slide structure: Title, Bullet Points, Speaker Notes.
        
        Content: "${content.substring(0, 15000)}"
      `,
    })
    return result || "Failed to generate slides."
  } catch (e) {
    return "Error"
  }
}

export async function matchJournalsAction(abstract: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `
        Suggest 5 academic journals suitable for publishing a paper with this abstract.
        For each, provide: Journal Name, Impact Factor (Estimate), and Scope Fit.
        
        Abstract: "${abstract}"
      `,
    })
    return result || "Failed to match journals."
  } catch (e) {
    return "Error"
  }
}

export async function generateLiteratureMatrixAction(topic: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `
        Generate a "Literature Review Matrix" for the topic: "${topic}".
        Create a Markdown table with 5 hypothetical but realistic academic sources (or real ones if you know them).
        Columns: Author(Year), Methodology, Key Findings, Research Gaps.
      `,
    })
    return result || "Failed to generate matrix."
  } catch (e) {
    return "Error"
  }
}

export async function checkScientificPaperAction(content: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `
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
    })
    return result || "Failed to check paper."
  } catch (e) {
    return "Error checking paper."
  }
}

export async function generateAnalyticsReportAction(docsSummary: string): Promise<any> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        peakPerformance: z.string(),
        academicTone: z.string(),
        goalProjection: z.string(),
      }),
      prompt: `
        You are a thesis performance analyst. Analyze the following writing statistics for a student and provide 3 key insights.
        
        Data:
        ${docsSummary}
      `,
    })
    return object
  } catch (error) {
    return {
      peakPerformance: "Keep writing to generate data.",
      academicTone: "Maintain a formal tone.",
      goalProjection: "Set a deadline to stay on track.",
    }
  }
}

export async function generateStudyScheduleAction(topic: string, startDate: string): Promise<any[]> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        stages: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            start: z.number(),
            duration: z.number(),
            status: z.string(),
          }),
        ),
      }),
      prompt: `
        Create a detailed 6-stage thesis roadmap for the topic: "${topic}".
        Start date: ${startDate}.
        Each stage has: id, name, start (day offset from start date), duration (days), status ("pending").
        Stages should cover Proposal, Literature Review, Methodology, Data Collection, Analysis, and Defense.
      `,
    })
    return object.stages
  } catch (e) {
    return []
  }
}

export async function generateCitationAction(details: string): Promise<string> {
  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Format the following reference details into a perfect APA 7th Edition citation string. Return only the citation string.\nDetails: "${details}"`,
    })
    return result || ""
  } catch (error) {
    return "Error generating citation."
  }
}

export async function runGenericToolAction(toolId: string, input: string): Promise<string> {
  let prompt = ""

  switch (toolId) {
    case "t1":
      prompt = `Summarize the following text into a formal, structured academic abstract (approx 250 words). Include Background, Methods, Results, and Conclusion.\n\nText: "${input}"`
      break
    case "t2":
      prompt = `Generate 5 engaging and academically rigorous titles for a thesis based on this abstract/content:\n\n"${input}"`
      break
    case "t3":
      prompt = `Rewrite the following text to minimize passive voice and improve directness, maintaining an academic tone:\n\n"${input}"`
      break
    case "t4":
      prompt = `Analyze the following text and suggest better transition words or phrases:\n\n"${input}"`
      break
    case "t5":
      prompt = `Detect potential plagiarism issues or flag sentences that may need citations:\n\n"${input}"`
      break
    case "t6":
      prompt = `Check if the following text uses consistent terminology throughout:\n\n"${input}"`
      break
    case "t7":
      prompt = `Assess the logical flow and coherence of this paragraph:\n\n"${input}"`
      break
    case "t8":
      prompt = `Check if this text uses appropriate hedging language for academic writing:\n\n"${input}"`
      break
    case "t9":
      prompt = `Improve the word variety and reduce repetition in this text:\n\n"${input}"`
      break
    case "t10":
      prompt = `Add or improve signposting language in this text:\n\n"${input}"`
      break
    case "t11":
      prompt = `Analyze and improve sentence structure variety:\n\n"${input}"`
      break
    case "t12":
      prompt = `Check and improve the cohesion and linking in this text:\n\n"${input}"`
      break
    default:
      prompt = `Provide academic writing feedback on:\n\n"${input}"`
  }

  try {
    const { text: result } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })
    return result || "No output generated."
  } catch (error) {
    return "Error running tool."
  }
}
