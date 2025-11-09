import bcrypt from "bcryptjs"
import type { NextAuthOptions, Session, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

const ADMIN_USERNAME = process.env.ORBIT_ADMIN_USERNAME
const ADMIN_PASSWORD_HASH = process.env.ORBIT_ADMIN_PASSWORD_HASH
let missingCredentialsWarned = false

function warnMissingCredentials() {
  if (!missingCredentialsWarned) {
    console.warn(
      "[Orbit] Admin credentials are not configured. Run `pnpm run setup` or define ORBIT_ADMIN_USERNAME and ORBIT_ADMIN_PASSWORD_HASH.",
    )
    missingCredentialsWarned = true
  }
}

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
  warnMissingCredentials()
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
          throw new Error("Admin credentials are not configured.")
        }
        if (!credentials?.username || !credentials.password) {
          return null
        }
        if (credentials.username !== ADMIN_USERNAME) {
          return null
        }
        const valid = await bcrypt.compare(credentials.password, ADMIN_PASSWORD_HASH)
        if (!valid) {
          return null
        }
        return {
          id: "orbit-admin",
          name: ADMIN_USERNAME,
        } satisfies User
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.name) {
        session.user = {
          name: token.name,
        } as Session["user"]
      }
      return session
    },
    async jwt({ token }) {
      if (ADMIN_USERNAME) {
        token.name = ADMIN_USERNAME
      }
      return token
    },
  },
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized")
    this.name = "UnauthorizedError"
  }
}

export async function assertAuthenticated() {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError()
  }
  return session
}

export async function ensureApiAuth() {
  try {
    await assertAuthenticated()
    return null
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    throw error
  }
}

