import { NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { getSystemSummary } from "@/lib/ubuntu/system"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const summary = await getSystemSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Failed to fetch system summary", error)
    return NextResponse.json(
      {
        error: "Unable to retrieve system summary",
      },
      { status: 500 },
    )
  }
}


