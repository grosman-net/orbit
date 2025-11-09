import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OrbitAppShell } from "@/components/orbit-app"

export default async function OrbitApp() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/auth/signin")
  }
  return <OrbitAppShell />
}
