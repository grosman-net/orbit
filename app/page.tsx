"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/modules/dashboard"
import { Monitoring } from "@/components/modules/monitoring"
import { Packages } from "@/components/modules/packages"
import { Logs } from "@/components/modules/logs"
import { Users } from "@/components/modules/users"
import { Network } from "@/components/modules/network"
import { Settings } from "@/components/modules/settings"

export type ModuleType = "dashboard" | "monitoring" | "packages" | "logs" | "users" | "network" | "settings"

export default function OrbitApp() {
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Initialize localStorage data on first load
  useEffect(() => {
    const initializeData = () => {
      if (!localStorage.getItem("orbit-initialized")) {
        // Initialize with sample data
        localStorage.setItem(
          "orbit-server-stats",
          JSON.stringify({
            cpu: 45,
            memory: 68,
            disk: 32,
            network: 12.5,
            uptime: 2847600, // 33 days in seconds
            processes: 127,
          }),
        )

        localStorage.setItem(
          "orbit-packages",
          JSON.stringify([
            { id: 1, name: "nginx", version: "1.24.0", status: "active", description: "High-performance HTTP server" },
            {
              id: 2,
              name: "postgresql",
              version: "15.3",
              status: "active",
              description: "Advanced relational database",
            },
            {
              id: 3,
              name: "redis",
              version: "7.0.11",
              status: "inactive",
              description: "In-memory data structure store",
            },
            { id: 4, name: "docker", version: "24.0.2", status: "active", description: "Container platform" },
            { id: 5, name: "nodejs", version: "18.16.0", status: "active", description: "JavaScript runtime" },
          ]),
        )

        localStorage.setItem(
          "orbit-users",
          JSON.stringify([
            { id: 1, username: "admin", role: "Administrator", status: "online", lastLogin: "2024-01-15 14:30" },
            { id: 2, username: "developer", role: "Developer", status: "offline", lastLogin: "2024-01-15 09:15" },
            { id: 3, username: "monitor", role: "Monitor", status: "online", lastLogin: "2024-01-15 13:45" },
          ]),
        )

        localStorage.setItem("orbit-initialized", "true")
      }
    }

    initializeData()
  }, [])

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
