// Unified Citation Provider System
// Integrates: OpenCitations, CrossRef, Semantic Scholar, DataCite, ORCID, Unpaywall

export type CitationStyle = "apa" | "mla" | "chicago" | "harvard" | "ieee" | "vancouver"

export interface CitationMetadata {
  doi?: string
  title: string
  authors: { given?: string; family?: string; name?: string; orcid?: string }[]
  year?: string
  date?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  url?: string
  abstract?: string
  type?: string
  citationCount?: number
  openAccess?: boolean
  pdfUrl?: string
}

export interface SearchResult {
  provider: string
  results: CitationMetadata[]
  total: number
}

// CrossRef API - Primary DOI metadata provider
export const CrossRefService = {
  baseUrl: "https://api.crossref.org",

  async getByDOI(doi: string): Promise<CitationMetadata | null> {
    try {
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "").trim()
      const response = await fetch(`${this.baseUrl}/works/${encodeURIComponent(cleanDoi)}`, {
        headers: { "User-Agent": "ThesisAI/1.0 (mailto:support@thesisai.com)" },
      })
      if (!response.ok) return null
      const data = await response.json()
      const work = data.message

      return {
        doi: work.DOI,
        title: work.title?.[0] || "",
        authors:
          work.author?.map((a: any) => ({
            given: a.given,
            family: a.family,
            orcid: a.ORCID,
          })) || [],
        year: work.published?.["date-parts"]?.[0]?.[0]?.toString(),
        date: work.published?.["date-parts"]?.[0]?.join("-"),
        journal: work["container-title"]?.[0],
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        publisher: work.publisher,
        url: work.URL,
        abstract: work.abstract?.replace(/<[^>]*>/g, ""),
        type: work.type,
        citationCount: work["is-referenced-by-count"],
      }
    } catch (error) {
      console.error("CrossRef error:", error)
      return null
    }
  },

  async search(query: string, rows = 20): Promise<SearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/works?query=${encodeURIComponent(query)}&rows=${rows}`, {
        headers: { "User-Agent": "ThesisAI/1.0 (mailto:support@thesisai.com)" },
      })
      if (!response.ok) return { provider: "crossref", results: [], total: 0 }
      const data = await response.json()

      return {
        provider: "crossref",
        total: data.message["total-results"],
        results: data.message.items.map((work: any) => ({
          doi: work.DOI,
          title: work.title?.[0] || "",
          authors:
            work.author?.map((a: any) => ({
              given: a.given,
              family: a.family,
              orcid: a.ORCID,
            })) || [],
          year: work.published?.["date-parts"]?.[0]?.[0]?.toString(),
          journal: work["container-title"]?.[0],
          publisher: work.publisher,
          type: work.type,
          citationCount: work["is-referenced-by-count"],
        })),
      }
    } catch (error) {
      return { provider: "crossref", results: [], total: 0 }
    }
  },

  async searchByAuthor(author: string, rows = 20): Promise<SearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/works?query.author=${encodeURIComponent(author)}&rows=${rows}`, {
        headers: { "User-Agent": "ThesisAI/1.0 (mailto:support@thesisai.com)" },
      })
      if (!response.ok) return { provider: "crossref", results: [], total: 0 }
      const data = await response.json()

      return {
        provider: "crossref",
        total: data.message["total-results"],
        results: data.message.items.map((work: any) => ({
          doi: work.DOI,
          title: work.title?.[0] || "",
          authors:
            work.author?.map((a: any) => ({
              given: a.given,
              family: a.family,
            })) || [],
          year: work.published?.["date-parts"]?.[0]?.[0]?.toString(),
          journal: work["container-title"]?.[0],
          citationCount: work["is-referenced-by-count"],
        })),
      }
    } catch (error) {
      return { provider: "crossref", results: [], total: 0 }
    }
  },
}

// Semantic Scholar API - AI-powered academic search
export const SemanticScholarService = {
  baseUrl: "https://api.semanticscholar.org/graph/v1",

  async getByDOI(doi: string): Promise<CitationMetadata | null> {
    try {
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "").trim()
      const fields = "paperId,title,authors,year,abstract,venue,citationCount,openAccessPdf,externalIds"
      const response = await fetch(`${this.baseUrl}/paper/DOI:${encodeURIComponent(cleanDoi)}?fields=${fields}`)
      if (!response.ok) return null
      const paper = await response.json()

      return {
        doi: paper.externalIds?.DOI,
        title: paper.title,
        authors: paper.authors?.map((a: any) => ({ name: a.name })) || [],
        year: paper.year?.toString(),
        journal: paper.venue,
        abstract: paper.abstract,
        citationCount: paper.citationCount,
        openAccess: !!paper.openAccessPdf,
        pdfUrl: paper.openAccessPdf?.url,
      }
    } catch (error) {
      console.error("Semantic Scholar error:", error)
      return null
    }
  },

  async search(query: string, limit = 20): Promise<SearchResult> {
    try {
      const fields = "paperId,title,authors,year,abstract,venue,citationCount,openAccessPdf,externalIds"
      const response = await fetch(
        `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`,
      )
      if (!response.ok) return { provider: "semanticscholar", results: [], total: 0 }
      const data = await response.json()

      return {
        provider: "semanticscholar",
        total: data.total || 0,
        results: (data.data || []).map((paper: any) => ({
          doi: paper.externalIds?.DOI,
          title: paper.title,
          authors: paper.authors?.map((a: any) => ({ name: a.name })) || [],
          year: paper.year?.toString(),
          journal: paper.venue,
          abstract: paper.abstract,
          citationCount: paper.citationCount,
          openAccess: !!paper.openAccessPdf,
          pdfUrl: paper.openAccessPdf?.url,
        })),
      }
    } catch (error) {
      return { provider: "semanticscholar", results: [], total: 0 }
    }
  },

  async getCitations(paperId: string, limit = 50): Promise<CitationMetadata[]> {
    try {
      const fields = "paperId,title,authors,year,venue,citationCount,externalIds"
      const response = await fetch(`${this.baseUrl}/paper/${paperId}/citations?fields=${fields}&limit=${limit}`)
      if (!response.ok) return []
      const data = await response.json()

      return (data.data || []).map((item: any) => ({
        doi: item.citingPaper?.externalIds?.DOI,
        title: item.citingPaper?.title,
        authors: item.citingPaper?.authors?.map((a: any) => ({ name: a.name })) || [],
        year: item.citingPaper?.year?.toString(),
        journal: item.citingPaper?.venue,
        citationCount: item.citingPaper?.citationCount,
      }))
    } catch (error) {
      return []
    }
  },

  async getReferences(paperId: string, limit = 50): Promise<CitationMetadata[]> {
    try {
      const fields = "paperId,title,authors,year,venue,citationCount,externalIds"
      const response = await fetch(`${this.baseUrl}/paper/${paperId}/references?fields=${fields}&limit=${limit}`)
      if (!response.ok) return []
      const data = await response.json()

      return (data.data || []).map((item: any) => ({
        doi: item.citedPaper?.externalIds?.DOI,
        title: item.citedPaper?.title,
        authors: item.citedPaper?.authors?.map((a: any) => ({ name: a.name })) || [],
        year: item.citedPaper?.year?.toString(),
        journal: item.citedPaper?.venue,
        citationCount: item.citedPaper?.citationCount,
      }))
    } catch (error) {
      return []
    }
  },

  async getAuthorPapers(authorId: string, limit = 100): Promise<CitationMetadata[]> {
    try {
      const fields = "paperId,title,year,venue,citationCount,externalIds"
      const response = await fetch(`${this.baseUrl}/author/${authorId}/papers?fields=${fields}&limit=${limit}`)
      if (!response.ok) return []
      const data = await response.json()

      return (data.data || []).map((paper: any) => ({
        doi: paper.externalIds?.DOI,
        title: paper.title,
        year: paper.year?.toString(),
        journal: paper.venue,
        citationCount: paper.citationCount,
      }))
    } catch (error) {
      return []
    }
  },
}

// DataCite API - For datasets and non-traditional research outputs
export const DataCiteService = {
  baseUrl: "https://api.datacite.org",

  async getByDOI(doi: string): Promise<CitationMetadata | null> {
    try {
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "").trim()
      const response = await fetch(`${this.baseUrl}/dois/${encodeURIComponent(cleanDoi)}`)
      if (!response.ok) return null
      const data = await response.json()
      const attrs = data.data.attributes

      return {
        doi: attrs.doi,
        title: attrs.titles?.[0]?.title || "",
        authors:
          attrs.creators?.map((c: any) => ({
            name: c.name,
            given: c.givenName,
            family: c.familyName,
            orcid: c.nameIdentifiers?.find((n: any) => n.nameIdentifierScheme === "ORCID")?.nameIdentifier,
          })) || [],
        year: attrs.publicationYear?.toString(),
        publisher: attrs.publisher,
        type: attrs.types?.resourceTypeGeneral,
        url: `https://doi.org/${attrs.doi}`,
        abstract: attrs.descriptions?.find((d: any) => d.descriptionType === "Abstract")?.description,
      }
    } catch (error) {
      console.error("DataCite error:", error)
      return null
    }
  },

  async search(query: string, pageSize = 20): Promise<SearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/dois?query=${encodeURIComponent(query)}&page[size]=${pageSize}`)
      if (!response.ok) return { provider: "datacite", results: [], total: 0 }
      const data = await response.json()

      return {
        provider: "datacite",
        total: data.meta?.total || 0,
        results: (data.data || []).map((item: any) => ({
          doi: item.attributes.doi,
          title: item.attributes.titles?.[0]?.title || "",
          authors:
            item.attributes.creators?.map((c: any) => ({
              name: c.name,
              given: c.givenName,
              family: c.familyName,
            })) || [],
          year: item.attributes.publicationYear?.toString(),
          publisher: item.attributes.publisher,
          type: item.attributes.types?.resourceTypeGeneral,
        })),
      }
    } catch (error) {
      return { provider: "datacite", results: [], total: 0 }
    }
  },
}

// ORCID API - Author identification
export const ORCIDService = {
  baseUrl: "https://pub.orcid.org/v3.0",

  async getAuthorProfile(orcid: string): Promise<any | null> {
    try {
      const cleanOrcid = orcid.replace(/^https?:\/\/orcid\.org\//, "").trim()
      const response = await fetch(`${this.baseUrl}/${cleanOrcid}/record`, { headers: { Accept: "application/json" } })
      if (!response.ok) return null
      const data = await response.json()
      const person = data.person

      return {
        orcid: cleanOrcid,
        name: person?.name?.["given-names"]?.value + " " + person?.name?.["family-name"]?.value,
        biography: person?.biography?.content,
        affiliations:
          data["activities-summary"]?.employments?.["affiliation-group"]?.map((g: any) => ({
            organization: g.summaries?.[0]?.["employment-summary"]?.organization?.name,
            role: g.summaries?.[0]?.["employment-summary"]?.["role-title"],
          })) || [],
      }
    } catch (error) {
      console.error("ORCID error:", error)
      return null
    }
  },

  async getAuthorWorks(orcid: string): Promise<CitationMetadata[]> {
    try {
      const cleanOrcid = orcid.replace(/^https?:\/\/orcid\.org\//, "").trim()
      const response = await fetch(`${this.baseUrl}/${cleanOrcid}/works`, { headers: { Accept: "application/json" } })
      if (!response.ok) return []
      const data = await response.json()

      return (data.group || []).map((g: any) => {
        const work = g["work-summary"]?.[0]
        const extIds = work?.["external-ids"]?.["external-id"] || []
        const doi = extIds.find((e: any) => e["external-id-type"] === "doi")?.["external-id-value"]

        return {
          doi,
          title: work?.title?.title?.value || "",
          year: work?.["publication-date"]?.year?.value,
          type: work?.type,
        }
      })
    } catch (error) {
      return []
    }
  },
}

// Unpaywall API - Open access finder
export const UnpaywallService = {
  baseUrl: "https://api.unpaywall.org/v2",
  email: "support@thesisai.com",

  async getOpenAccess(doi: string): Promise<{ isOpenAccess: boolean; pdfUrl?: string; version?: string } | null> {
    try {
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "").trim()
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(cleanDoi)}?email=${this.email}`)
      if (!response.ok) return null
      const data = await response.json()

      return {
        isOpenAccess: data.is_oa,
        pdfUrl: data.best_oa_location?.url_for_pdf || data.best_oa_location?.url,
        version: data.best_oa_location?.version,
      }
    } catch (error) {
      console.error("Unpaywall error:", error)
      return null
    }
  },
}

// OpenAlex API - Open scholarly metadata
export const OpenAlexService = {
  baseUrl: "https://api.openalex.org",

  async getByDOI(doi: string): Promise<CitationMetadata | null> {
    try {
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "").trim()
      const response = await fetch(`${this.baseUrl}/works/https://doi.org/${encodeURIComponent(cleanDoi)}`, {
        headers: { "User-Agent": "ThesisAI/1.0 (mailto:support@thesisai.com)" },
      })
      if (!response.ok) return null
      const work = await response.json()

      return {
        doi: work.doi?.replace("https://doi.org/", ""),
        title: work.title,
        authors:
          work.authorships?.map((a: any) => ({
            name: a.author?.display_name,
            orcid: a.author?.orcid,
          })) || [],
        year: work.publication_year?.toString(),
        journal: work.primary_location?.source?.display_name,
        publisher: work.primary_location?.source?.host_organization_name,
        abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : undefined,
        citationCount: work.cited_by_count,
        openAccess: work.open_access?.is_oa,
        pdfUrl: work.open_access?.oa_url,
        type: work.type,
      }
    } catch (error) {
      console.error("OpenAlex error:", error)
      return null
    }
  },

  async search(query: string, perPage = 20): Promise<SearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/works?search=${encodeURIComponent(query)}&per_page=${perPage}`, {
        headers: { "User-Agent": "ThesisAI/1.0 (mailto:support@thesisai.com)" },
      })
      if (!response.ok) return { provider: "openalex", results: [], total: 0 }
      const data = await response.json()

      return {
        provider: "openalex",
        total: data.meta?.count || 0,
        results: (data.results || []).map((work: any) => ({
          doi: work.doi?.replace("https://doi.org/", ""),
          title: work.title,
          authors:
            work.authorships?.slice(0, 5).map((a: any) => ({
              name: a.author?.display_name,
            })) || [],
          year: work.publication_year?.toString(),
          journal: work.primary_location?.source?.display_name,
          citationCount: work.cited_by_count,
          openAccess: work.open_access?.is_oa,
          type: work.type,
        })),
      }
    } catch (error) {
      return { provider: "openalex", results: [], total: 0 }
    }
  },

  async getCitingWorks(doi: string, perPage = 50): Promise<CitationMetadata[]> {
    try {
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "").trim()
      const response = await fetch(
        `${this.baseUrl}/works?filter=cites:https://doi.org/${encodeURIComponent(cleanDoi)}&per_page=${perPage}`,
        { headers: { "User-Agent": "ThesisAI/1.0 (mailto:support@thesisai.com)" } },
      )
      if (!response.ok) return []
      const data = await response.json()

      return (data.results || []).map((work: any) => ({
        doi: work.doi?.replace("https://doi.org/", ""),
        title: work.title,
        authors:
          work.authorships?.slice(0, 3).map((a: any) => ({
            name: a.author?.display_name,
          })) || [],
        year: work.publication_year?.toString(),
        journal: work.primary_location?.source?.display_name,
        citationCount: work.cited_by_count,
      }))
    } catch (error) {
      return []
    }
  },
}

// Helper function for OpenAlex abstract reconstruction
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: [string, number][] = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([word, pos])
    }
  }
  words.sort((a, b) => a[1] - b[1])
  return words.map((w) => w[0]).join(" ")
}

// Citation Formatter - Multi-style citation generator
export const CitationFormatter = {
  formatAuthors(authors: CitationMetadata["authors"], style: CitationStyle, maxAuthors = 3): string {
    if (!authors || authors.length === 0) return ""

    const formatName = (author: CitationMetadata["authors"][0], style: CitationStyle, isFirst: boolean) => {
      if (author.name) {
        const parts = author.name.split(" ")
        const family = parts.pop() || ""
        const given = parts.join(" ")

        switch (style) {
          case "apa":
          case "chicago":
            return isFirst
              ? `${family}, ${given
                  .split(" ")
                  .map((n) => n[0] + ".")
                  .join(" ")}`
              : `${given
                  .split(" ")
                  .map((n) => n[0] + ".")
                  .join(" ")} ${family}`
          case "mla":
            return isFirst ? `${family}, ${given}` : `${given} ${family}`
          case "harvard":
            return `${family}, ${given
              .split(" ")
              .map((n) => n[0] + ".")
              .join("")}`
          case "ieee":
          case "vancouver":
            return `${given
              .split(" ")
              .map((n) => n[0] + ".")
              .join(" ")} ${family}`
          default:
            return author.name
        }
      }

      const family = author.family || ""
      const given = author.given || ""

      switch (style) {
        case "apa":
        case "chicago":
          return isFirst
            ? `${family}, ${given
                .split(" ")
                .map((n) => n[0] + ".")
                .join(" ")}`
            : `${given
                .split(" ")
                .map((n) => n[0] + ".")
                .join(" ")} ${family}`
        case "mla":
          return isFirst ? `${family}, ${given}` : `${given} ${family}`
        case "harvard":
          return `${family}, ${given
            .split(" ")
            .map((n) => n[0] + ".")
            .join("")}`
        case "ieee":
        case "vancouver":
          return `${given
            .split(" ")
            .map((n) => n[0] + ".")
            .join(" ")} ${family}`
        default:
          return `${given} ${family}`
      }
    }

    const displayAuthors = authors.slice(0, maxAuthors)
    const hasMore = authors.length > maxAuthors

    const formatted = displayAuthors.map((a, i) => formatName(a, style, i === 0))

    if (hasMore) {
      switch (style) {
        case "apa":
        case "chicago":
          return formatted.join(", ") + ", et al."
        case "mla":
          return formatted[0] + ", et al."
        case "harvard":
          return formatted.join(", ") + " et al."
        case "ieee":
        case "vancouver":
          return formatted.join(", ") + ", et al."
        default:
          return formatted.join(", ") + ", et al."
      }
    }

    if (formatted.length === 1) return formatted[0]
    if (formatted.length === 2) {
      return style === "apa" ? `${formatted[0]}, & ${formatted[1]}` : `${formatted[0]} and ${formatted[1]}`
    }
    const last = formatted.pop()
    return style === "apa" ? `${formatted.join(", ")}, & ${last}` : `${formatted.join(", ")}, and ${last}`
  },

  format(meta: CitationMetadata, style: CitationStyle): string {
    const authors = this.formatAuthors(meta.authors, style)
    const year = meta.year || "n.d."
    const title = meta.title || "Untitled"
    const journal = meta.journal || ""
    const volume = meta.volume || ""
    const issue = meta.issue || ""
    const pages = meta.pages || ""
    const doi = meta.doi ? `https://doi.org/${meta.doi}` : ""

    switch (style) {
      case "apa":
        let apa = `${authors} (${year}). ${title}.`
        if (journal) apa += ` *${journal}*`
        if (volume) apa += `, *${volume}*`
        if (issue) apa += `(${issue})`
        if (pages) apa += `, ${pages}`
        apa += "."
        if (doi) apa += ` ${doi}`
        return apa

      case "mla":
        let mla = `${authors}. "${title}."`
        if (journal) mla += ` *${journal}*`
        if (volume) mla += `, vol. ${volume}`
        if (issue) mla += `, no. ${issue}`
        if (year) mla += `, ${year}`
        if (pages) mla += `, pp. ${pages}`
        mla += "."
        return mla

      case "chicago":
        let chicago = `${authors}. "${title}."`
        if (journal) chicago += ` *${journal}*`
        if (volume) chicago += ` ${volume}`
        if (issue) chicago += `, no. ${issue}`
        if (year) chicago += ` (${year})`
        if (pages) chicago += `: ${pages}`
        chicago += "."
        if (doi) chicago += ` ${doi}.`
        return chicago

      case "harvard":
        let harvard = `${authors} (${year}) '${title}',`
        if (journal) harvard += ` *${journal}*`
        if (volume) harvard += `, ${volume}`
        if (issue) harvard += `(${issue})`
        if (pages) harvard += `, pp. ${pages}`
        harvard += "."
        if (doi) harvard += ` Available at: ${doi}`
        return harvard

      case "ieee":
        let ieee = `${authors}, "${title},"`
        if (journal) ieee += ` *${journal}*`
        if (volume) ieee += `, vol. ${volume}`
        if (issue) ieee += `, no. ${issue}`
        if (pages) ieee += `, pp. ${pages}`
        if (year) ieee += `, ${year}`
        ieee += "."
        return ieee

      case "vancouver":
        let vancouver = `${authors}. ${title}.`
        if (journal) vancouver += ` ${journal}`
        if (year) vancouver += `. ${year}`
        if (volume) vancouver += `;${volume}`
        if (issue) vancouver += `(${issue})`
        if (pages) vancouver += `:${pages}`
        vancouver += "."
        return vancouver

      default:
        return `${authors} (${year}). ${title}. ${journal}`
    }
  },
}

// Unified Citation Provider - Aggregate search across all providers
export const UnifiedCitationProvider = {
  async getByDOI(doi: string): Promise<CitationMetadata | null> {
    // Try providers in order of reliability
    const providers = [
      () => CrossRefService.getByDOI(doi),
      () => OpenAlexService.getByDOI(doi),
      () => SemanticScholarService.getByDOI(doi),
      () => DataCiteService.getByDOI(doi),
    ]

    for (const provider of providers) {
      const result = await provider()
      if (result && result.title) return result
    }
    return null
  },

  async enrichWithOpenAccess(meta: CitationMetadata): Promise<CitationMetadata> {
    if (!meta.doi) return meta
    const oa = await UnpaywallService.getOpenAccess(meta.doi)
    if (oa) {
      return { ...meta, openAccess: oa.isOpenAccess, pdfUrl: oa.pdfUrl || meta.pdfUrl }
    }
    return meta
  },

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const results = await Promise.allSettled([
      CrossRefService.search(query, limit),
      SemanticScholarService.search(query, limit),
      OpenAlexService.search(query, limit),
    ])

    return results
      .filter((r): r is PromiseFulfilledResult<SearchResult> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((r) => r.results.length > 0)
  },

  async searchBestResults(query: string, limit = 20): Promise<CitationMetadata[]> {
    const allResults = await this.search(query, limit)

    // Merge and deduplicate by DOI
    const seen = new Set<string>()
    const merged: CitationMetadata[] = []

    for (const result of allResults) {
      for (const item of result.results) {
        const key = item.doi || item.title?.toLowerCase()
        if (key && !seen.has(key)) {
          seen.add(key)
          merged.push(item)
        }
      }
    }

    // Sort by citation count
    return merged.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0)).slice(0, limit)
  },

  formatCitation(meta: CitationMetadata, style: CitationStyle): string {
    return CitationFormatter.format(meta, style)
  },
}
