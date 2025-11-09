import { NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { listServices } from "@/lib/ubuntu/services"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const services = await listServices()
    return NextResponse.json({ services })
  } catch (error) {
    console.error("Failed to list services", error)
    return NextResponse.json({ error: "Unable to fetch services" }, { status: 500 })
  }
}


