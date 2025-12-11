
import { 
  searchSemanticPapersAction, 
  getSemanticPaperDetailsAction, 
  getSemanticRecommendationsAction 
} from "@/app/actions";

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
    return await searchSemanticPapersAction(query, limit);
  },

  async getPaperDetails(paperId: string): Promise<SemanticPaper | null> {
    return await getSemanticPaperDetailsAction(paperId);
  },

  async getRecommendations(paperId: string, limit = 5): Promise<SemanticPaper[]> {
    return await getSemanticRecommendationsAction(paperId, limit);
  }
};
