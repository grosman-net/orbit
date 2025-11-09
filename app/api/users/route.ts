import { NextRequest, NextResponse } from "next/server"
import { ensureApiAuth } from "@/lib/auth"
import { createUser, deleteUser, listSystemUsers, setUserLocked } from "@/lib/ubuntu/users"

export const runtime = "nodejs"
export const revalidate = 0

const USERNAME_REGEX = /^[a-z_][a-z0-9_-]{0,31}$/

export async function GET() {
  try {
    const authResponse = await ensureApiAuth()
    if (authResponse) {
      return authResponse
    }
    const users = await listSystemUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Failed to list users", error)
    return NextResponse.json({ error: "Unable to fetch users" }, { status: 500 })
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
      username?: string
      shell?: string
      home?: string
    }

    if (!body.action || !body.username || !USERNAME_REGEX.test(body.username)) {
      return NextResponse.json({ error: "Invalid action or username" }, { status: 400 })
    }

    switch (body.action) {
      case "lock":
        await setUserLocked(body.username, true)
        break
      case "unlock":
        await setUserLocked(body.username, false)
        break
      case "delete":
        await deleteUser(body.username)
        break
      case "create":
        await createUser(body.username, { shell: body.shell, home: body.home })
        break
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Failed to update user", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update user" },
      { status: 500 },
    )
  }
}


