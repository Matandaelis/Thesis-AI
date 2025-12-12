
import { LibraryItem } from "@/types";

const CROSSREF_API_BASE = "https://api.crossref.org/works";
const DATACITE_API_BASE = "https://api.datacite.org/dois";

export interface CrossRefPaper {
  DOI: string;
  title: string[];
  author?: { given: string; family: string }[];
  issued?: { 'date-parts': number[][] };
  publisher?: string;
  URL?: string;
  type?: string;
  'container-title'?: string[]; // Journal name
  abstract?: string; // Sometimes available
}

export const CitationService = {
  async fetchByDOI(doi: string): Promise<CrossRefPaper | null> {
    const cleanDoi = doi.trim().replace(/^(doi:|https?:\/\/doi\.org\/)/i, '');
    
    // 1. Try CrossRef
    try {
      const res = await fetch(`${CROSSREF_API_BASE}/${encodeURIComponent(cleanDoi)}`);
      if (res.ok) {
        const data = await res.json();
        return data.message;
      }
    } catch (e) {
      console.warn("CrossRef lookup failed, checking DataCite...", e);
    }

    // 2. Fallback to DataCite (Great for datasets, software, and non-journal citations)
    try {
      const res = await fetch(`${DATACITE_API_BASE}/${encodeURIComponent(cleanDoi)}`);
      if (res.ok) {
        const data = await res.json();
        const attrs = data.data.attributes;
        
        // Map DataCite attributes to CrossRefPaper structure for compatibility
        return {
            DOI: attrs.doi,
            title: attrs.titles.map((t: any) => t.title),
            author: attrs.creators.map((c: any) => {
                // DataCite authors can be "Family, Given" or just "Name"
                if (c.familyName && c.givenName) return { family: c.familyName, given: c.givenName };
                const parts = c.name.split(',');
                if (parts.length === 2) return { family: parts[0].trim(), given: parts[1].trim() };
                return { family: c.name, given: '' };
            }),
            issued: { 'date-parts': [[attrs.publicationYear]] },
            publisher: attrs.publisher,
            URL: `https://doi.org/${attrs.doi}`,
            type: attrs.types.resourceTypeGeneral,
            'container-title': [attrs.publisher] // Use publisher as container fallback
        };
      }
    } catch (e) {
        console.error("DataCite lookup failed", e);
    }

    return null;
  },

  async searchPapers(query: string, limit = 10): Promise<CrossRefPaper[]> {
    try {
      const res = await fetch(`${CROSSREF_API_BASE}?query=${encodeURIComponent(query)}&rows=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.message?.items || [];
    } catch (e) {
      console.error("CrossRef Search Error", e);
      return [];
    }
  },

  /**
   * Formats a LibraryItem into a specific citation style string.
   */
  formatCitation(item: LibraryItem | { author: string, year: string, title: string, source: string, type?: string, url?: string }, style: string): string {
    const a = item.author || "Anonymous";
    const y = item.year || "n.d.";
    const t = item.title || "Untitled";
    const s = item.source || "";
    const url = (item as any).pdfUrl || (item as any).url || "";

    // Helper to clean author string if it comes in as "Last, F.; Last, F."
    const cleanAuthors = (authStr: string) => {
        return authStr.replace(/;/g, ',').replace(/\.\./g, '.');
    };

    const styleKey = style.toLowerCase().replace(/[^a-z0-9]/g, '');

    switch (styleKey) {
      case 'mla':
      case 'mla9':
        // Author. "Title." Source, vol. x, no. x, Year, pp. x-x.
        return `${cleanAuthors(a)}. "${t}." ${s}, ${y}.`;
      
      case 'harvard':
        // Author, A. (Year) 'Title', Source. Available at: URL.
        return `${cleanAuthors(a)} (${y}) '${t}', ${s}.${url && url !== '#' ? ` Available at: ${url}` : ''}`;
      
      case 'chicago':
        // Author. "Title." Source. Year.
        return `${cleanAuthors(a)}. "${t}." ${s}. ${y}.`;
      
      case 'ieee':
        // [1] A. Author, "Title," Source, Year.
        return `${cleanAuthors(a)}, "${t}," ${s}, ${y}.`;

      case 'apa':
      case 'apa7':
      case 'apa7th':
      default:
        // Author, A. A. (Year). Title of article. Title of Periodical, volume number(issue number), pages.
        // Simplified for general use without detailed volume/issue data
        return `${cleanAuthors(a)} (${y}). ${t}. ${s}.`;
    }
  },

  /**
   * Generates an in-text citation string (e.g., "(Smith, 2023)" or "[1]").
   */
  formatInText(item: LibraryItem, style: string, index?: number): string {
     const authorLastName = item.author ? item.author.split(',')[0].trim() : 'Anonymous'; 
     const year = item.year || "n.d.";
     const styleKey = style.toLowerCase().replace(/[^a-z0-9]/g, '');

     switch (styleKey) {
        case 'ieee':
            return `[${index || 1}]`;
        case 'mla':
        case 'mla9':
            return `(${authorLastName})`; // Page number usually added manually
        case 'apa':
        case 'apa7':
        case 'apa7th':
        case 'harvard':
        case 'chicago':
        default:
            return `(${authorLastName}, ${year})`;
     }
  }
};
