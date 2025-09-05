"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Cpu, MemoryStick, HardDrive, Network, Clock, Activity, Server, Zap } from "lucide-react"

interface MemoryStats {
  total: number
  used: number
  usage: number
}

interface NetworkStats {
  rx: number // Received bytes
  tx: number // Transmitted bytes
  rx_sec: number // Received bytes per second
  tx_sec: number // Transmitted bytes per second
}

interface ServerStats {
  cpu: number
  memory: MemoryStats
  disk: {
    total: number
    used: number
  }
  network: NetworkStats
  uptime: number
  processes: number
}

export function Dashboard() {
  const [stats, setStats] = useState<ServerStats>({
    cpu: 0,
    memory: { total: 0, used: 0, usage: 0 },
    disk: { total: 0, used: 0 },
    network: { rx: 0, tx: 0, rx_sec: 0, tx_sec: 0 },
    uptime: 0,
    processes: 0,
  })

  // Fetch server stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/server-info")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch server stats:", error)
    }
  }

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
        memory: {
          ...prev.memory,
          used: Math.max(0, Math.min(prev.memory.total, prev.memory.used + (Math.random() - 0.5) * 5)),
        },
        network: {
          ...prev.network,
          rx: Math.max(0, Math.min(1000, prev.network.rx + (Math.random() - 0.5) * 100)),
          tx: Math.max(0, Math.min(1000, prev.network.tx + (Math.random() - 0.5) * 100)),
        },
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
            <div className="text-2xl font-bold mb-2">{typeof stats.cpu === "number" ? stats.cpu.toFixed(1) : "0.0"}%</div>
            <Progress value={stats.cpu || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.cpu > 80 ? "High load" : stats.cpu > 60 ? "Moderate load" : "Normal"}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className={`h-4 w-4 ${getStatusColor(stats.memory.usage, "memory")}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {typeof stats.memory === "object" && stats.memory.used && stats.memory.total
                ? `${(stats.memory.used / (1024 ** 3)).toFixed(1)} GB / ${(stats.memory.total / (1024 ** 3)).toFixed(1)} GB`
                : "0.0 GB / 0.0 GB"}
            </div>
            <Progress value={stats.memory.usage || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.memory ? ((stats.memory.usage * 16) / 100).toFixed(1) : "0.0"} GB / 16 GB
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className={`h-4 w-4 ${getStatusColor(stats.disk.used / stats.disk.total * 100, "disk")}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{(stats.disk.used / stats.disk.total * 100).toFixed(0)}%</div>
            <Progress value={stats.disk.used / stats.disk.total * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{`${(stats.disk.used / (1024 ** 3)).toFixed(1)} GB / ${(stats.disk.total / (1024 ** 3)).toFixed(1)} GB`}</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Network className="h-4 w-4 text-[var(--mint)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.network.rx_sec.toFixed(1)} MB/s</div>
            <Progress value={Math.min(100, stats.network.rx_sec * 2)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Received</p>
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
