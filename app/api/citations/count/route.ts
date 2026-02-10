import { type NextRequest, NextResponse } from "next/server"
import { OpenCitationsService } from "@/services/openCitationsService"

// GET /api/citations/count?doi=10.xxxx/xxxx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doi = searchParams.get("doi")

  if (!doi) {
    return NextResponse.json({ error: "DOI parameter is required" }, { status: 400 })
  }

  try {
    const [incoming, outgoing] = await Promise.all([
      OpenCitationsService.getCitationCount(doi),
      OpenCitationsService.getReferenceCount(doi),
    ])

    return NextResponse.json({
      success: true,
      data: {
        doi,
        incomingCitations: incoming,
        outgoingReferences: outgoing,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch citation counts" }, { status: 500 })
  }
}
