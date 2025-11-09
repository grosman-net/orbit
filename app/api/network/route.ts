import { NextRequest, NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import {
  allowFirewallRule,
  denyFirewallRule,
  getNetworkOverview,
  reloadFirewall,
  setFirewallState,
} from "@/lib/ubuntu/network"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const overview = await getNetworkOverview()
    return NextResponse.json(overview)
  } catch (error) {
    console.error("Failed to fetch network overview", error)
    return NextResponse.json({ error: "Unable to fetch network information" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const body = (await request.json()) as {
      action?: string
      state?: "enable" | "disable"
      rule?: string
    }

    switch (body.action) {
      case "firewall":
        if (!body.state) {
          return NextResponse.json({ error: "Firewall state is required" }, { status: 400 })
        }
        await setFirewallState(body.state === "enable")
        break
      case "allow-rule":
        if (!body.rule) {
          return NextResponse.json({ error: "Rule is required" }, { status: 400 })
        }
        await allowFirewallRule(body.rule)
        break
      case "deny-rule":
        if (!body.rule) {
          return NextResponse.json({ error: "Rule is required" }, { status: 400 })
        }
        await denyFirewallRule(body.rule)
        break
      case "reload-firewall":
        await reloadFirewall()
        break
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Failed to update network configuration", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update network configuration" },
      { status: 500 },
    )
  }
}


