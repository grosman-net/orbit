"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Cpu, MemoryStick, HardDrive, Network, Clock, Activity, Server, Zap } from "lucide-react"

interface ServerStats {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
  processes: number
}

export function Dashboard() {
  const [stats, setStats] = useState<ServerStats>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: 0,
    processes: 0,
  })

  useEffect(() => {
    const loadStats = () => {
      const savedStats = localStorage.getItem("orbit-server-stats")
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      }
    }

    loadStats()

    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
        uptime: prev.uptime + 1,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getStatusColor = (value: number, type: "cpu" | "memory" | "disk") => {
    if (type === "disk") {
      if (value > 80) return "text-red-400"
      if (value > 60) return "text-yellow-400"
      return "text-[var(--mint)]"
    }
    if (value > 80) return "text-red-400"
    if (value > 60) return "text-yellow-400"
    return "text-[var(--mint)]"
  }

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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className={`h-4 w-4 ${getStatusColor(stats.cpu, "cpu")}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.cpu.toFixed(1)}%</div>
            <Progress value={stats.cpu} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.cpu > 80 ? "High load" : stats.cpu > 60 ? "Moderate load" : "Normal"}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className={`h-4 w-4 ${getStatusColor(stats.memory, "memory")}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.memory.toFixed(1)}%</div>
            <Progress value={stats.memory} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{((stats.memory * 16) / 100).toFixed(1)} GB / 16 GB</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className={`h-4 w-4 ${getStatusColor(stats.disk, "disk")}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.disk}%</div>
            <Progress value={stats.disk} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{((stats.disk * 500) / 100).toFixed(0)} GB / 500 GB</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Network className="h-4 w-4 text-[var(--mint)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.network.toFixed(1)} MB/s</div>
            <Progress value={Math.min(100, stats.network * 2)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Combined up/down</p>
          </CardContent>
        </Card>
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
            <div className="text-3xl font-bold text-[var(--mint)] mb-2">{formatUptime(stats.uptime)}</div>
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
            <div className="text-3xl font-bold text-[var(--mint)] mb-2">{stats.processes}</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Quick System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">OS Version</p>
              <p className="font-medium">Ubuntu 22.04.3 LTS</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kernel</p>
              <p className="font-medium">5.15.0-91-generic</p>
            </div>
            <div>
              <p className="text-muted-foreground">Architecture</p>
              <p className="font-medium">x86_64</p>
            </div>
            <div>
              <p className="text-muted-foreground">Load Average</p>
              <p className="font-medium">0.45, 0.52, 0.48</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
