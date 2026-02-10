import { type NextRequest, NextResponse } from "next/server"
import { UnifiedCitationProvider, CitationFormatter } from "@/services/citationProviders"

// POST /api/citations/bulk
// Body: { dois: string[], style?: CitationStyle, includeOpenAccess?: boolean }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dois, style, includeOpenAccess = false } = body

    if (!dois || !Array.isArray(dois) || dois.length === 0) {
      return NextResponse.json({ error: "Array of DOIs is required" }, { status: 400 })
    }

    if (dois.length > 25) {
      return NextResponse.json({ error: "Maximum 25 DOIs per request" }, { status: 400 })
    }

    // Fetch metadata for all DOIs in parallel
    const results = await Promise.all(
      dois.map(async (doi: string) => {
        try {
          let metadata = await UnifiedCitationProvider.getByDOI(doi)

          if (!metadata) {
            return { doi, success: false, error: "Not found" }
          }

          if (includeOpenAccess) {
            metadata = await UnifiedCitationProvider.enrichWithOpenAccess(metadata)
          }

          const formatted = style ? CitationFormatter.format(metadata, style) : null

          return {
            doi,
            success: true,
            metadata,
            formatted,
            citationCount: metadata.citationCount || 0,
          }
        } catch (e) {
          return { doi, success: false, error: "Failed to fetch data" }
        }
      }),
    )

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        totalCitations: successful.reduce((acc, r) => acc + (r.citationCount || 0), 0),
      },
    })
  } catch (error) {
    console.error("Bulk request error:", error)
    return NextResponse.json({ error: "Failed to process bulk request" }, { status: 500 })
  }
}
