import { type NextRequest, NextResponse } from "next/server"
import { UnpaywallService, UnifiedCitationProvider } from "@/services/citationProviders"

// GET /api/citations/openaccess?doi=10.xxxx/xxxx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doi = searchParams.get("doi")

  if (!doi) {
    return NextResponse.json({ error: "DOI parameter is required" }, { status: 400 })
  }

  try {
    const [openAccess, metadata] = await Promise.all([
      UnpaywallService.getOpenAccess(doi),
      UnifiedCitationProvider.getByDOI(doi),
    ])

    return NextResponse.json({
      success: true,
      data: {
        doi,
        title: metadata?.title,
        isOpenAccess: openAccess?.isOpenAccess || false,
        pdfUrl: openAccess?.pdfUrl || null,
        version: openAccess?.version || null,
        alternativePdf: metadata?.pdfUrl || null,
      },
    })
  } catch (error) {
    console.error("Open access lookup error:", error)
    return NextResponse.json({ error: "Failed to check open access" }, { status: 500 })
  }
}

// POST /api/citations/openaccess - Batch check multiple DOIs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dois: string[] = body.dois

    if (!dois || !Array.isArray(dois) || dois.length === 0) {
      return NextResponse.json({ error: "dois array is required" }, { status: 400 })
    }

    if (dois.length > 25) {
      return NextResponse.json({ error: "Maximum 25 DOIs per request" }, { status: 400 })
    }

    const results = await Promise.all(
      dois.map(async (doi) => {
        const oa = await UnpaywallService.getOpenAccess(doi)
        return {
          doi,
          isOpenAccess: oa?.isOpenAccess || false,
          pdfUrl: oa?.pdfUrl || null,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        openAccess: results.filter((r) => r.isOpenAccess).length,
      },
    })
  } catch (error) {
    console.error("Batch open access check error:", error)
    return NextResponse.json({ error: "Failed to check open access" }, { status: 500 })
  }
}
