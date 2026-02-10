import { type NextRequest, NextResponse } from "next/server"
import { generateCitationAction, parseReferenceAction } from "@/app/actions"
import { UnifiedCitationProvider, CitationFormatter, type CitationStyle } from "@/services/citationProviders"

// POST /api/citations/format
// Body: { raw?: string, doi?: string, style?: CitationStyle }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { raw, doi, style = "apa" } = body

    if (!raw && !doi) {
      return NextResponse.json({ error: "Either raw citation text or DOI is required" }, { status: 400 })
    }

    // If DOI provided, use citation providers for accurate formatting
    if (doi) {
      const metadata = await UnifiedCitationProvider.getByDOI(doi)

      if (!metadata) {
        return NextResponse.json({ error: "DOI not found" }, { status: 404 })
      }

      // Generate all style formats
      const formats: Record<string, string> = {}
      const styles: CitationStyle[] = ["apa", "mla", "chicago", "harvard", "ieee", "vancouver"]

      for (const s of styles) {
        formats[s] = CitationFormatter.format(metadata, s)
      }

      return NextResponse.json({
        success: true,
        data: {
          doi,
          metadata,
          formatted: formats[style],
          allFormats: formats,
          style,
        },
      })
    }

    // Fallback to AI parsing for raw text
    const parsed = await parseReferenceAction(raw)

    if (!parsed) {
      return NextResponse.json({ error: "Could not parse citation" }, { status: 400 })
    }

    const details = `Author: ${parsed.author}, Year: ${parsed.year}, Title: ${parsed.title}, Source: ${parsed.source}, Style: ${style.toUpperCase()}`
    const formatted = await generateCitationAction(details)

    return NextResponse.json({
      success: true,
      data: {
        ...parsed,
        formatted,
        style,
      },
    })
  } catch (error) {
    console.error("Format error:", error)
    return NextResponse.json({ error: "Failed to format citation" }, { status: 500 })
  }
}
