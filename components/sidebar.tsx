"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Activity,
  Package,
  FileText,
  Users,
  Network,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { ModuleType } from "@/app/page"

interface SidebarProps {
  activeModule: ModuleType
  onModuleChange: (module: ModuleType) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const modules = [
  { id: "dashboard" as ModuleType, name: "Dashboard", icon: LayoutDashboard },
  { id: "monitoring" as ModuleType, name: "Monitoring", icon: Activity },
  { id: "packages" as ModuleType, name: "Packages", icon: Package },
  { id: "logs" as ModuleType, name: "Logs", icon: FileText },
  { id: "users" as ModuleType, name: "Users", icon: Users },
  { id: "network" as ModuleType, name: "Network", icon: Network },
  { id: "settings" as ModuleType, name: "Settings", icon: Settings },
]

export function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <TooltipProvider>
      <div
        className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 ${collapsed ? "w-16" : "w-64"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <Image src="/orbit-logo.png" alt="Orbit" width={32} height={32} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">Orbit</h1>
                <p className="text-xs text-sidebar-foreground/60">Server Management</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {modules.map((module) => {
            const Icon = module.icon
            const isActive = activeModule === module.id

            const buttonContent = (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 h-12 transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black font-medium shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed ? "px-2" : "px-4"}`}
                onClick={() => onModuleChange(module.id)}
              >
                <Icon className={`h-5 w-5 ${collapsed ? "mx-auto" : ""}`} />
                {!collapsed && <span>{module.name}</span>}
              </Button>
            )

            if (collapsed) {
              return (
                <Tooltip key={module.id} delayDuration={0}>
                  <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    {module.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={module.id}>{buttonContent}</div>
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs text-sidebar-foreground/40 text-center">
              <p>Orbit v1.0.0</p>
              <p>System Administrator Panel</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
