import { type NextRequest, NextResponse } from "next/server"
import { UnifiedCitationProvider, CitationFormatter, type CitationStyle } from "@/services/citationProviders"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const doi = searchParams.get("doi")
  const style = (searchParams.get("style") || "apa") as CitationStyle
  const includeOpenAccess = searchParams.get("openaccess") === "true"

  if (!doi) {
    return NextResponse.json({ error: "DOI parameter is required" }, { status: 400 })
  }

  try {
    let metadata = await UnifiedCitationProvider.getByDOI(doi)

    if (!metadata) {
      return NextResponse.json({ error: "DOI not found" }, { status: 404 })
    }

    if (includeOpenAccess) {
      metadata = await UnifiedCitationProvider.enrichWithOpenAccess(metadata)
    }

    const formatted = CitationFormatter.format(metadata, style)

    return NextResponse.json({
      metadata,
      formatted,
      style,
    })
  } catch (error) {
    console.error("DOI lookup error:", error)
    return NextResponse.json({ error: "Failed to fetch DOI metadata" }, { status: 500 })
  }
}
