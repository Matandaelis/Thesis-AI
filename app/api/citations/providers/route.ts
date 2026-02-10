import { NextResponse } from "next/server"

// GET /api/citations/providers - List available citation providers and their capabilities
export async function GET() {
  return NextResponse.json({
    success: true,
    providers: [
      {
        id: "crossref",
        name: "CrossRef",
        description: "Primary DOI registration agency with comprehensive metadata",
        capabilities: ["metadata", "search", "author-search"],
        rateLimit: "50 requests/second with polite pool",
      },
      {
        id: "semanticscholar",
        name: "Semantic Scholar",
        description: "AI-powered academic search with citation graph",
        capabilities: ["metadata", "search", "citations", "references", "author-papers"],
        rateLimit: "100 requests/5 minutes",
      },
      {
        id: "openalex",
        name: "OpenAlex",
        description: "Open catalog of scholarly works, authors, and institutions",
        capabilities: ["metadata", "search", "citing-works", "open-access"],
        rateLimit: "100,000 requests/day",
      },
      {
        id: "datacite",
        name: "DataCite",
        description: "DOI registration for research data and non-traditional outputs",
        capabilities: ["metadata", "search"],
        rateLimit: "Generous",
      },
      {
        id: "orcid",
        name: "ORCID",
        description: "Author identification and profile information",
        capabilities: ["author-profile", "author-works"],
        rateLimit: "24 requests/second",
      },
      {
        id: "unpaywall",
        name: "Unpaywall",
        description: "Open access PDF finder",
        capabilities: ["open-access-check", "pdf-url"],
        rateLimit: "100,000 requests/day",
      },
      {
        id: "opencitations",
        name: "OpenCitations",
        description: "Open citation data and metrics",
        capabilities: ["citation-count", "incoming-citations", "reference-count"],
        rateLimit: "Generous",
      },
    ],
    supportedStyles: ["apa", "mla", "chicago", "harvard", "ieee", "vancouver"],
    endpoints: {
      search: "GET /api/citations/search?q={query}&provider={provider}&limit={limit}",
      metadata: "GET /api/citations/metadata?doi={doi}&style={style}&openaccess=true",
      doi: "GET /api/citations/doi?doi={doi}&style={style}",
      format: "POST /api/citations/format {raw?, doi?, style}",
      bulk: "POST /api/citations/bulk {dois[], style?, includeOpenAccess?}",
      author: "GET /api/citations/author?orcid={orcid}&name={name}&authorId={id}",
      references: "GET /api/citations/references?doi={doi}&paperId={id}&limit={limit}",
      openaccess: "GET /api/citations/openaccess?doi={doi}",
      analyze: "GET /api/citations/analyze?doi={doi}",
    },
  })
}
