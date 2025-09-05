"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Activity, Cpu, MemoryStick, HardDrive, Network } from "lucide-react"

interface MetricData {
  time: string
  cpu: number
  memory: number
  disk: number
  network: number
}

export function Monitoring() {
  const [data, setData] = useState<MetricData[]>([])

  useEffect(() => {
    // Initialize with some historical data
    const now = new Date()
    const initialData: MetricData[] = []

    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000) // 1 minute intervals
      initialData.push({
        time: time.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 60 + 30,
        disk: Math.random() * 20 + 20,
        network: Math.random() * 50 + 5,
      })
    }

    setData(initialData)

    // Update data every 5 seconds
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(1)]
        const now = new Date()
        newData.push({
          time: now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 60 + 30,
          disk: Math.random() * 20 + 20,
          network: Math.random() * 50 + 5,
        })
        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">System Monitoring</h1>
        <p className="text-muted-foreground">Real-time performance metrics and historical data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Monitoring */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[var(--mint)]" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                <XAxis dataKey="time" stroke="oklch(0.708 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.708 0 0)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.3 0 0)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="var(--mint)"
                  fill="var(--mint)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Memory Monitoring */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-[var(--emerald)]" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                <XAxis dataKey="time" stroke="oklch(0.708 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.708 0 0)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.3 0 0)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="var(--emerald)"
                  fill="var(--emerald)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Disk I/O */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-yellow-400" />
              Disk I/O
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                <XAxis dataKey="time" stroke="oklch(0.708 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.708 0 0)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.3 0 0)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="disk" stroke="#facc15" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network Traffic */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-400" />
              Network Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
                <XAxis dataKey="time" stroke="oklch(0.708 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.708 0 0)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.3 0 0)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="network" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Current Metrics Summary */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--mint)]" />
            Current Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--mint)] mb-1">
                {data.length > 0 ? data[data.length - 1].cpu.toFixed(1) : "0"}%
              </div>
              <p className="text-sm text-muted-foreground">CPU Usage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--emerald)] mb-1">
                {data.length > 0 ? data[data.length - 1].memory.toFixed(1) : "0"}%
              </div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {data.length > 0 ? data[data.length - 1].disk.toFixed(1) : "0"} MB/s
              </div>
              <p className="text-sm text-muted-foreground">Disk I/O</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {data.length > 0 ? data[data.length - 1].network.toFixed(1) : "0"} MB/s
              </div>
              <p className="text-sm text-muted-foreground">Network</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
