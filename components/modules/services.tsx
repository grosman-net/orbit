"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Power, RefreshCw, RotateCcw, Search, Settings as SettingsIcon, StopCircle } from "lucide-react"

interface SystemdService {
  unit: string
  name: string
  description: string
  load: string
  active: string
  sub: string
}

type ServiceAction = "start" | "stop" | "restart" | "reload" | "enable" | "disable"

export function Services() {
  const [services, setServices] = useState<SystemdService[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    void refreshServices()
  }, [])

  const refreshServices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/services", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { services: SystemdService[] }
      setServices(data.services ?? [])
    } catch (error) {
      toast({
        title: "Failed to load services",
        description: error instanceof Error ? error.message : "Unable to query systemd services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const performAction = async (service: SystemdService, action: ServiceAction) => {
    setActioning(`${service.unit}:${action}`)
    try {
      const response = await fetch(`/api/services/${service.unit}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { message?: string }
      toast({
        title: `${capitalize(action)} executed`,
        description: data.message ?? `${service.unit} has been ${action}ed.`,
      })
      await refreshServices()
    } catch (error) {
      toast({
        title: "Service action failed",
        description: error instanceof Error ? error.message : "Unable to control the service",
        variant: "destructive",
      })
    } finally {
      setActioning(null)
    }
  }

  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return services.filter((service) => {
      return (
        service.unit.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.active.toLowerCase().includes(term)
      )
    })
  }, [services, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Service Control</h1>
          <p className="text-muted-foreground">Start, stop, and manage systemd services running on Ubuntu.</p>
        </div>
        <Button variant="outline" onClick={() => refreshServices()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter services by name, description, or state..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredServices.map((service) => (
          <Card key={service.unit} className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all">
            <CardContent className="py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold">{service.unit}</h2>
                    <Badge variant="outline" className={statusBadgeClass(service.active)}>
                      {service.active}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Sub: {service.sub}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Load: {service.load}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ServiceButton
                    icon={<Play className="h-4 w-4" />}
                    label="Start"
                    disabled={actioning !== null}
                    onClick={() => performAction(service, "start")}
                  />
                  <ServiceButton
                    icon={<StopCircle className="h-4 w-4" />}
                    label="Stop"
                    disabled={actioning !== null}
                    onClick={() => performAction(service, "stop")}
                    variant="destructive"
                  />
                  <ServiceButton
                    icon={<RotateCcw className="h-4 w-4" />}
                    label="Restart"
                    disabled={actioning !== null}
                    onClick={() => performAction(service, "restart")}
                  />
                  <ServiceButton
                    icon={<RefreshCw className="h-4 w-4" />}
                    label="Reload"
                    disabled={actioning !== null}
                    onClick={() => performAction(service, "reload")}
                  />
                  <ServiceButton
                    icon={<Power className="h-4 w-4" />}
                    label="Enable"
                    disabled={actioning !== null}
                    onClick={() => performAction(service, "enable")}
                    variant="outline"
                  />
                  <ServiceButton
                    icon={<SettingsIcon className="h-4 w-4" />}
                    label="Disable"
                    disabled={actioning !== null}
                    onClick={() => performAction(service, "disable")}
                    variant="outline"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <Card className="gradient-card border-border/50">
          <CardContent className="py-12 text-center space-y-2">
            <Loader2 className="h-6 w-6 mx-auto text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">No services match the current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function statusBadgeClass(state: string): string {
  if (state === "active") {
    return "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30"
  }
  if (state === "failed") {
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }
  return "bg-muted text-muted-foreground border-border/60"
}

function ServiceButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled: boolean
  variant?: "default" | "outline" | "destructive"
}) {
  if (disabled) {
    return (
      <Button variant={variant === "destructive" ? "destructive" : variant} size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        {label}
      </Button>
    )
  }
  return (
    <Button
      variant={variant === "destructive" ? "destructive" : variant}
      size="sm"
      onClick={onClick}
      className={variant === "outline" ? "border-border/50 hover:bg-accent/30" : ""}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </Button>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

