import { type NextRequest, NextResponse } from "next/server"
import { ORCIDService, SemanticScholarService, CrossRefService } from "@/services/citationProviders"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orcid = searchParams.get("orcid")
  const authorId = searchParams.get("authorId") // Semantic Scholar author ID
  const name = searchParams.get("name")

  if (!orcid && !authorId && !name) {
    return NextResponse.json({ error: "One of orcid, authorId, or name parameter is required" }, { status: 400 })
  }

  try {
    let profile = null
    let works: any[] = []

    if (orcid) {
      // Use ORCID API for profile and works
      const [orcidProfile, orcidWorks] = await Promise.all([
        ORCIDService.getAuthorProfile(orcid),
        ORCIDService.getAuthorWorks(orcid),
      ])
      profile = orcidProfile
      works = orcidWorks
    } else if (authorId) {
      // Use Semantic Scholar for author papers
      works = await SemanticScholarService.getAuthorPapers(authorId)
    } else if (name) {
      // Search by author name via CrossRef
      const result = await CrossRefService.searchByAuthor(name, 50)
      works = result.results
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        totalWorks: works.length,
        works,
      },
    })
  } catch (error) {
    console.error("Author lookup error:", error)
    return NextResponse.json({ error: "Failed to fetch author data" }, { status: 500 })
  }
}
