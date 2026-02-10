const META_API_BASE = "https://api.opencitations.net/meta/v1";
const INDEX_API_BASE = "https://api.opencitations.net/index/v2";

// Access token from environment variables (optional but recommended for higher rate limits)
const ACCESS_TOKEN = process.env.OPENCITATIONS_TOKEN || "";

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };
  if (ACCESS_TOKEN) {
    headers['authorization'] = ACCESS_TOKEN;
  }
  return headers;
};

export const OpenCitationsService = {
  // Meta API: Get metadata by DOI, ISSN, etc.
  async getMetadata(id: string): Promise<any | null> {
    // Ensure ID has a prefix (e.g., doi:)
    const cleanId = id.trim(); 
    // Check if user pasted a raw DOI without prefix
    const finalId = cleanId.match(/^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/) ? `doi:${cleanId}` : cleanId;

    try {
      const response = await fetch(`${META_API_BASE}/metadata/${finalId}`, {
        headers: getHeaders()
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("OpenCitations Meta Error:", error);
      return null;
    }
  },

  // Index API: Get Citation Count
  async getCitationCount(doi: string): Promise<number> {
    const cleanId = doi.trim();
    const finalId = cleanId.match(/^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/) ? `doi:${cleanId}` : cleanId;
    
    try {
      const response = await fetch(`${INDEX_API_BASE}/citation-count/${finalId}`, {
         headers: getHeaders()
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data && data.length > 0 ? parseInt(data[0].count) : 0;
    } catch (error) {
       return 0;
    }
  },
  
  // Index API: Get Reference Count
  async getReferenceCount(doi: string): Promise<number> {
    const cleanId = doi.trim();
    const finalId = cleanId.match(/^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/) ? `doi:${cleanId}` : cleanId;

    try {
        const response = await fetch(`${INDEX_API_BASE}/reference-count/${finalId}`, {
            headers: getHeaders()
        });
        if (!response.ok) return 0;
        const data = await response.json();
        return data && data.length > 0 ? parseInt(data[0].count) : 0;
    } catch (error) {
        return 0;
    }
  },

  // Index API: Get Incoming Citations (Who cited this?)
  // Increased limit default to 100 for better graphing data
  async getIncomingCitations(doi: string, limit = 100): Promise<any[]> {
    const cleanId = doi.trim();
    const finalId = cleanId.match(/^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/) ? `doi:${cleanId}` : cleanId;

    try {
        const response = await fetch(`${INDEX_API_BASE}/citations/${finalId}`, {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        const data = await response.json();
        // Return structured data sorted by date if possible, or just raw
        return limit > 0 ? data.slice(0, limit) : data;
    } catch (error) {
        return [];
    }
  },

  // Author Search
  async getAuthorWorks(orcid: string): Promise<any[]> {
     try {
       const response = await fetch(`${META_API_BASE}/author/${orcid}`, {
        headers: getHeaders()
       });
       if (!response.ok) return [];
       return await response.json();
     } catch (error) {
       return [];
     }
  }
};
