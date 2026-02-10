import { type NextRequest, NextResponse } from "next/server"
import { SemanticScholarService, OpenAlexService } from "@/services/citationProviders"

// GET /api/citations/references?doi=10.xxxx/xxxx or ?paperId=xxx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doi = searchParams.get("doi")
  const paperId = searchParams.get("paperId")
  const limit = Number.parseInt(searchParams.get("limit") || "50")

  if (!doi && !paperId) {
    return NextResponse.json({ error: "Either doi or paperId parameter is required" }, { status: 400 })
  }

  try {
    let references: any[] = []
    let citations: any[] = []

    if (paperId) {
      // Direct Semantic Scholar lookup
      const [refs, cits] = await Promise.all([
        SemanticScholarService.getReferences(paperId, limit),
        SemanticScholarService.getCitations(paperId, limit),
      ])
      references = refs
      citations = cits
    } else if (doi) {
      // Use OpenAlex for citing works
      const [ssData, oaCitations] = await Promise.all([
        SemanticScholarService.getByDOI(doi),
        OpenAlexService.getCitingWorks(doi, limit),
      ])

      citations = oaCitations

      // If we got Semantic Scholar data, fetch references
      if (ssData) {
        // Extract paper ID from semantic scholar response if available
        const ssResponse = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=paperId`,
        )
        if (ssResponse.ok) {
          const ssJson = await ssResponse.json()
          if (ssJson.paperId) {
            references = await SemanticScholarService.getReferences(ssJson.paperId, limit)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        references: {
          count: references.length,
          items: references,
        },
        citations: {
          count: citations.length,
          items: citations,
        },
      },
    })
  } catch (error) {
    console.error("References/citations lookup error:", error)
    return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 })
  }
}
