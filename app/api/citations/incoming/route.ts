import { type NextRequest, NextResponse } from "next/server"
import { OpenCitationsService } from "@/services/openCitationsService"

// GET /api/citations/incoming?doi=10.xxxx/xxxx&limit=50
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doi = searchParams.get("doi")
  const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

  if (!doi) {
    return NextResponse.json({ error: "DOI parameter is required" }, { status: 400 })
  }

  try {
    const citations = await OpenCitationsService.getIncomingCitations(doi, limit)

    // Process citations to extract year data for charts
    const yearMap: Record<string, number> = {}
    citations.forEach((c: any) => {
      if (c.creation) {
        const year = c.creation.split("-")[0]
        yearMap[year] = (yearMap[year] || 0) + 1
      }
    })

    const chartData = Object.keys(yearMap)
      .sort()
      .map((year) => ({ year, count: yearMap[year] }))

    return NextResponse.json({
      success: true,
      data: {
        doi,
        total: citations.length,
        citations,
        chartData,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incoming citations" }, { status: 500 })
  }
}
