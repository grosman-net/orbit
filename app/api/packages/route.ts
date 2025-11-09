import { NextRequest, NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { AptAction, executeAptAction, listInstalledPackages, searchPackages } from "@/lib/ubuntu/packages"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") ?? "200", 10)

    if (search) {
      const results = await searchPackages(search, limit)
      return NextResponse.json({ type: "search", results })
    }

    const packages = await listInstalledPackages(limit)
    return NextResponse.json({ type: "installed", packages })
  } catch (error) {
    console.error("Failed to query packages", error)
    return NextResponse.json({ error: "Unable to fetch packages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const body = (await request.json()) as { action?: string; package?: string }

    if (!body.action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const action = body.action as AptAction
    if (!isValidAptAction(action)) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }

    const result = await executeAptAction(action, body.package)
    return NextResponse.json({ status: "ok", message: result.message })
  } catch (error) {
    console.error("Failed to execute apt action", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to execute package action",
      },
      { status: 500 },
    )
  }
}

function isValidAptAction(action: string): action is AptAction {
  return ["install", "remove", "purge", "update", "upgrade"].includes(action)
}



