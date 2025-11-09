import { NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { listManagedConfigs } from "@/lib/ubuntu/config"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const configs = await listManagedConfigs()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error("Failed to list configuration files", error)
    return NextResponse.json({ error: "Unable to fetch configuration files" }, { status: 500 })
  }
}


