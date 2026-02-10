import { type NextRequest, NextResponse } from "next/server"
import { OpenCitationsService } from "@/services/openCitationsService"

// GET /api/citations/analyze?doi=10.xxxx/xxxx
// Returns comprehensive citation analysis including trends
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doi = searchParams.get("doi")

  if (!doi) {
    return NextResponse.json({ error: "DOI parameter is required" }, { status: 400 })
  }

  try {
    const [metadata, incoming, outgoing, citations] = await Promise.all([
      OpenCitationsService.getMetadata(doi),
      OpenCitationsService.getCitationCount(doi),
      OpenCitationsService.getReferenceCount(doi),
      OpenCitationsService.getIncomingCitations(doi, 100),
    ])

    if (!metadata && incoming === 0) {
      return NextResponse.json({ error: "No data found for this DOI" }, { status: 404 })
    }

    // Process citation trends by year
    const yearMap: Record<string, number> = {}
    citations.forEach((c: any) => {
      if (c.creation) {
        const year = c.creation.split("-")[0]
        yearMap[year] = (yearMap[year] || 0) + 1
      }
    })

    const years = Object.keys(yearMap).sort()
    const citationTrend = years.map((year) => ({
      year,
      count: yearMap[year],
    }))

    // Calculate citation velocity (citations per year since publication)
    const pubYear = metadata?.pub_date ? Number.parseInt(metadata.pub_date.substring(0, 4)) : null
    const currentYear = new Date().getFullYear()
    const yearsActive = pubYear ? currentYear - pubYear : null
    const citationVelocity = yearsActive && yearsActive > 0 ? (incoming / yearsActive).toFixed(2) : null

    // Recent citations (last 5)
    const recentCitations = citations.slice(0, 5).map((c: any) => ({
      citingDoi: c.citing?.split(" ")[0] || "Unknown",
      date: c.creation || "Unknown",
    }))

    return NextResponse.json({
      success: true,
      data: {
        doi,
        metadata: metadata || { title: "Unknown", venue: "Unknown", pub_date: "n.d." },
        metrics: {
          incomingCitations: incoming,
          outgoingReferences: outgoing,
          citationVelocity,
          yearsActive,
        },
        citationTrend,
        recentCitations,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze citation data" }, { status: 500 })
  }
}
