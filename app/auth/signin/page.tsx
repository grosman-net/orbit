import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { SignInForm } from "./sign-in-form"
import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Orbit — Sign In",
}

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect("/")
  }
  return <SignInForm />
}

