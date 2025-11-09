"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Cpu, HardDrive, MemoryStick, Network, Server, Zap } from "lucide-react"

export function Dashboard() {
  const [summary, setSummary] = useState<SystemSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchSummary = async () => {
      try {
        const response = await fetch("/api/system/summary", { cache: "no-store" })
        if (!response.ok) {
          throw new Error(await response.text())
        }
        const data = (await response.json()) as SystemSummary
        if (!cancelled) {
          setSummary(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load system summary")
        }
      }
    }

    const interval = setInterval(() => {
      fetchSummary().catch(() => {})
    }, 5000)

    fetchSummary().catch(() => {})

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const cpuUsage = summary?.cpuUsage ?? 0
  const memoryUsage = summary?.memoryUsage ?? 0
  const diskUsage = summary?.diskUsage ?? 0
  const networkRxMbps = summary ? summary.networkRx / 1024 / 1024 : 0
  const networkTxMbps = summary ? summary.networkTx / 1024 / 1024 : 0
  const networkCombined = networkRxMbps + networkTxMbps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Server Dashboard</h1>
          <p className="text-muted-foreground">Real-time system monitoring and overview</p>
        </div>
        <Badge variant="secondary" className="bg-[var(--mint)]/10 text-[var(--mint)] border-[var(--mint)]/20">
          <Activity className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="py-4">
            <p className="text-sm text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="CPU Usage"
          icon={<Cpu className={`h-4 w-4 ${getStatusColor(cpuUsage, "cpu")}`} />}
          value={`${cpuUsage.toFixed(1)}%`}
          progress={cpuUsage}
          footer={cpuUsage > 80 ? "High load" : cpuUsage > 60 ? "Moderate load" : "Normal"}
        />

        <StatCard
          title="Memory Usage"
          icon={<MemoryStick className={`h-4 w-4 ${getStatusColor(memoryUsage, "memory")}`} />}
          value={`${memoryUsage.toFixed(1)}%`}
          progress={memoryUsage}
          footer={
            summary
              ? `${formatBytes(summary.memoryUsed)} / ${formatBytes(summary.memoryTotal)}`
              : "Calculating..."
          }
        />

        <StatCard
          title="Disk Usage"
          icon={<HardDrive className={`h-4 w-4 ${getStatusColor(diskUsage, "disk")}`} />}
          value={`${diskUsage.toFixed(1)}%`}
          progress={diskUsage}
          footer={
            summary ? `${formatBytes(summary.diskUsed)} / ${formatBytes(summary.diskTotal)}` : "Calculating..."
          }
        />

        <StatCard
          title="Network I/O"
          icon={<Network className="h-4 w-4 text-[var(--mint)]" />}
          value={`${networkCombined.toFixed(2)} MB/s`}
          progress={Math.min(100, networkCombined)}
          footer={`Down ${networkRxMbps.toFixed(2)} MB/s · Up ${networkTxMbps.toFixed(2)} MB/s`}
        />
      </div>

      {/* System Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--mint)]" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--mint)] mb-2">
              {summary ? formatUptime(summary.uptimeSeconds) : "Loading..."}
            </div>
            <p className="text-sm text-muted-foreground">System has been running continuously</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--mint)]" />
              Active Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--mint)] mb-2">
              {summary ? summary.processCount : 0}
            </div>
            <p className="text-sm text-muted-foreground">Currently running processes</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[var(--mint)]" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-[var(--mint)]" />
              <span className="text-xl font-bold text-[var(--mint)]">Operational</span>
            </div>
            <p className="text-sm text-muted-foreground">All systems running normally</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Load Average:{" "}
              {summary
                ? summary.loadAverage.map((value) => value.toFixed(2)).join(", ")
                : "0.00, 0.00, 0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Details */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Quick System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <InfoItem label="Hostname" value={summary?.hostname ?? "Unknown"} />
            <InfoItem label="OS Version" value={summary?.os ?? "Unknown"} />
            <InfoItem label="Kernel" value={summary?.kernel ?? "Unknown"} />
            <InfoItem label="Architecture" value={summary?.architecture ?? "Unknown"} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SystemSummary {
  hostname: string
  os: string
  kernel: string
  architecture: string
  uptimeSeconds: number
  cpuUsage: number
  memoryUsage: number
  memoryTotal: number
  memoryUsed: number
  diskUsage: number
  diskTotal: number
  diskUsed: number
  networkRx: number
  networkTx: number
  processCount: number
  loadAverage: [number, number, number]
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

function StatCard({
  title,
  icon,
  value,
  progress,
  footer,
}: {
  title: string
  icon: ReactNode
  value: string
  progress: number
  footer: string
}) {
  return (
    <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{value}</div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{footer}</p>
      </CardContent>
    </Card>
  )
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}

function getStatusColor(value: number, type: "cpu" | "memory" | "disk") {
  if (type === "disk") {
    if (value > 80) return "text-red-400"
    if (value > 60) return "text-yellow-400"
    return "text-[var(--mint)]"
  }
  if (value > 80) return "text-red-400"
  if (value > 60) return "text-yellow-400"
  return "text-[var(--mint)]"
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KiB", "MiB", "GiB", "TiB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[exponent]}`
}
