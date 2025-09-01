"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Download, RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface LogEntry {
  id: number
  timestamp: string
  level: "info" | "warning" | "error"
  service: string
  message: string
}

const sampleLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: "2024-01-15 14:32:15",
    level: "info",
    service: "nginx",
    message: "Server started successfully on port 80",
  },
  {
    id: 2,
    timestamp: "2024-01-15 14:31:45",
    level: "warning",
    service: "postgresql",
    message: "Connection pool reaching maximum capacity",
  },
  {
    id: 3,
    timestamp: "2024-01-15 14:30:22",
    level: "error",
    service: "redis",
    message: "Failed to connect to cluster node redis-02",
  },
  {
    id: 4,
    timestamp: "2024-01-15 14:29:18",
    level: "info",
    service: "docker",
    message: "Container orbit-app-1 started successfully",
  },
  {
    id: 5,
    timestamp: "2024-01-15 14:28:55",
    level: "info",
    service: "systemd",
    message: "Service orbit-monitor.service started",
  },
  {
    id: 6,
    timestamp: "2024-01-15 14:27:33",
    level: "warning",
    service: "nginx",
    message: "Rate limiting activated for IP 192.168.1.100",
  },
  {
    id: 7,
    timestamp: "2024-01-15 14:26:12",
    level: "error",
    service: "nodejs",
    message: "Unhandled promise rejection in application",
  },
  {
    id: 8,
    timestamp: "2024-01-15 14:25:44",
    level: "info",
    service: "postgresql",
    message: "Database backup completed successfully",
  },
]

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>(sampleLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const refreshLogs = () => {
    setLoading(true)
    setTimeout(() => {
      // Simulate new log entries
      const newLogs: LogEntry[] = [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleString("sv-SE").replace("T", " ").slice(0, 19),
          level: ["info", "warning", "error"][Math.floor(Math.random() * 3)] as "info" | "warning" | "error",
          service: ["nginx", "postgresql", "redis", "docker", "nodejs"][Math.floor(Math.random() * 5)],
          message: "New system event detected",
        },
        ...logs,
      ]
      setLogs(newLogs.slice(0, 50)) // Keep only latest 50 logs
      setLoading(false)
    }, 1000)
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    const matchesService = serviceFilter === "all" || log.service === serviceFilter

    return matchesSearch && matchesLevel && matchesService
  })

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <Info className="h-4 w-4 text-[var(--mint)]" />
    }
  }

  const getLevelBadge = (level: string) => {
    const colors = {
      error: "bg-red-500/20 text-red-400 border-red-500/30",
      warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      info: "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30",
    }
    return colors[level as keyof typeof colors] || colors.info
  }

  const services = [...new Set(logs.map((log) => log.service))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">System Logs</h1>
          <p className="text-muted-foreground">Monitor system events and troubleshoot issues</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshLogs}
            disabled={loading}
            className="border-[var(--mint)]/30 hover:bg-[var(--mint)]/10 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="border-border/50 hover:bg-accent/50 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-40 bg-background/50 border-border/50">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-40 bg-background/50 border-border/50">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>Total: {logs.length}</span>
            <span>Filtered: {filteredLogs.length}</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>Errors: {logs.filter((l) => l.level === "error").length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Warnings: {logs.filter((l) => l.level === "warning").length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--mint)]" />
            Log Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors border border-border/30"
              >
                <div className="mt-0.5">{getLogIcon(log.level)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground font-mono">{log.timestamp}</span>
                    <Badge variant="outline" className={getLevelBadge(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.service}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground break-words">{log.message}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || levelFilter !== "all" || serviceFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No log entries available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
