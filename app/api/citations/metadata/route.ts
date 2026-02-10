import { type NextRequest, NextResponse } from "next/server"
import { UnifiedCitationProvider, CitationFormatter, type CitationStyle } from "@/services/citationProviders"

// GET /api/citations/metadata?doi=10.xxxx/xxxx&style=apa&openaccess=true
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doi = searchParams.get("doi")
  const style = searchParams.get("style") as CitationStyle | null
  const includeOpenAccess = searchParams.get("openaccess") === "true"

  if (!doi) {
    return NextResponse.json({ error: "DOI parameter is required" }, { status: 400 })
  }

  try {
    let metadata = await UnifiedCitationProvider.getByDOI(doi)

    if (!metadata) {
      return NextResponse.json({ error: "No metadata found for this DOI" }, { status: 404 })
    }

    // Enrich with open access data if requested
    if (includeOpenAccess) {
      metadata = await UnifiedCitationProvider.enrichWithOpenAccess(metadata)
    }

    // Format citation if style requested
    const formatted = style ? CitationFormatter.format(metadata, style) : null

    return NextResponse.json({
      success: true,
      data: {
        ...metadata,
        formatted,
        requestedStyle: style,
      },
    })
  } catch (error) {
    console.error("Metadata fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 })
  }
}
