const SEMANTIC_BASE_URL = "https://api.semanticscholar.org/graph/v1";

export interface SemanticPaper {
  paperId: string;
  title: string;
  authors: { authorId: string; name: string }[];
  year: number;
  venue?: string;
  citationCount: number;
  influentialCitationCount: number;
  abstract?: string;
  tldr?: { text: string };
  url?: string;
  openAccessPdf?: { url: string };
}

export const SemanticScholarService = {
  async searchPapers(query: string, limit = 10): Promise<SemanticPaper[]> {
    try {
      const url = `${SEMANTIC_BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=paperId,title,authors,year,venue,citationCount,influentialCitationCount,openAccessPdf,tldr,url`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error("Semantic Scholar Search Error", e);
      return [];
    }
  },

  async getPaperDetails(paperId: string): Promise<SemanticPaper | null> {
    try {
      const url = `${SEMANTIC_BASE_URL}/paper/${paperId}?fields=paperId,title,authors,year,venue,citationCount,influentialCitationCount,abstract,tldr,url,openAccessPdf`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Semantic Scholar Details Error", e);
      return null;
    }
  },

  async getRecommendations(paperId: string, limit = 5): Promise<SemanticPaper[]> {
    try {
      const url = `${SEMANTIC_BASE_URL}/paper/${paperId}/recommendations?limit=${limit}&fields=paperId,title,authors,year,venue`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.data ? data.data.map((d: any) => d.recommendedPaper) : [];
    } catch (e) {
      console.error("Semantic Scholar Recommendations Error", e);
      return [];
    }
  }
};