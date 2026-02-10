import { type NextRequest, NextResponse } from "next/server"
import {
  UnifiedCitationProvider,
  CrossRefService,
  SemanticScholarService,
  OpenAlexService,
  DataCiteService,
} from "@/services/citationProviders"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const provider = searchParams.get("provider") || "unified"
  const limit = Number.parseInt(searchParams.get("limit") || "20")

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  try {
    let results

    switch (provider) {
      case "crossref":
        results = await CrossRefService.search(query, limit)
        break
      case "semanticscholar":
        results = await SemanticScholarService.search(query, limit)
        break
      case "openalex":
        results = await OpenAlexService.search(query, limit)
        break
      case "datacite":
        results = await DataCiteService.search(query, limit)
        break
      case "unified":
      default:
        const bestResults = await UnifiedCitationProvider.searchBestResults(query, limit)
        results = { provider: "unified", results: bestResults, total: bestResults.length }
        break
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Citation search error:", error)
    return NextResponse.json({ error: "Failed to search citations" }, { status: 500 })
  }
}
