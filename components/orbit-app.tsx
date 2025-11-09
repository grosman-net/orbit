"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/modules/dashboard"
import { Monitoring } from "@/components/modules/monitoring"
import { Packages } from "@/components/modules/packages"
import { Logs } from "@/components/modules/logs"
import { Users } from "@/components/modules/users"
import { Network } from "@/components/modules/network"
import { Services } from "@/components/modules/services"
import { Settings } from "@/components/modules/settings"

export type ModuleType =
  | "dashboard"
  | "monitoring"
  | "packages"
  | "logs"
  | "users"
  | "network"
  | "services"
  | "settings"

export function OrbitAppShell() {
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "monitoring":
        return <Monitoring />
      case "packages":
        return <Packages />
      case "logs":
        return <Logs />
      case "users":
        return <Users />
      case "network":
        return <Network />
      case "services":
        return <Services />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"} overflow-hidden`}>
        <div className="h-full p-6 overflow-auto">{renderModule()}</div>
      </main>
    </div>
  )
}

