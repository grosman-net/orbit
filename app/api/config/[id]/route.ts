import { NextRequest, NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { readManagedConfig, writeManagedConfig } from "@/lib/ubuntu/config"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const { id } = context.params
    const content = await readManagedConfig(id)
    return NextResponse.json({ id, content })
  } catch (error) {
    console.error("Failed to read configuration file", error)
    return NextResponse.json({ error: "Unable to read configuration file" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const { id } = context.params
    const body = (await request.json()) as { content?: string }

    if (typeof body.content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    await writeManagedConfig(id, body.content)
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Failed to update configuration file", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update configuration file" },
      { status: 500 },
    )
  }
}


