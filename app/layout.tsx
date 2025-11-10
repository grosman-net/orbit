import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { OrbitSessionProvider } from "@/components/session-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Orbit - Server Management Panel",
  description: "Professional server management and monitoring dashboard",
  generator: "v0.app",
  icons: {
    icon: "/orbit-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <OrbitSessionProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </OrbitSessionProvider>
      </body>
    </html>
  )
}
