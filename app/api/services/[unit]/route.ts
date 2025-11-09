import { NextRequest, NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { performServiceAction, ServiceAction } from "@/lib/ubuntu/services"

export const runtime = "nodejs"
export const revalidate = 0

export async function POST(request: NextRequest, context: { params: { unit: string } }) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const { unit } = context.params
    const body = (await request.json()) as { action?: string }

    if (!unit) {
      return NextResponse.json({ error: "Service unit is required" }, { status: 400 })
    }

    if (!body.action || !isValidServiceAction(body.action)) {
      return NextResponse.json({ error: "Unsupported service action" }, { status: 400 })
    }

    const result = await performServiceAction(unit, body.action)
    return NextResponse.json({ status: "ok", message: result.message })
  } catch (error) {
    console.error("Failed to execute service action", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to execute service action",
      },
      { status: 500 },
    )
  }
}

function isValidServiceAction(action: string): action is ServiceAction {
  return ["start", "stop", "restart", "reload", "enable", "disable"].includes(action)
}


