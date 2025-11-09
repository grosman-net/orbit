import { NextRequest, NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { getJournalEntries } from "@/lib/ubuntu/logs"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") ?? undefined
    const lines = Number.parseInt(searchParams.get("lines") ?? "200", 10)
    const priority = (searchParams.get("priority") ?? undefined) as
      | "emerg"
      | "alert"
      | "crit"
      | "err"
      | "warning"
      | "notice"
      | "info"
      | "debug"
      | undefined

    const entries = await getJournalEntries({
      unit,
      lines,
      priority,
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Failed to fetch logs", error)
    return NextResponse.json({ error: "Unable to retrieve logs" }, { status: 500 })
  }
}


