"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, AlertTriangle, Download, FileText, Info, RefreshCw, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface LogEntry {
  id: string
  timestamp: string
  priority?: number
  unit?: string
  message: string
}

const PRIORITY_LABELS: Record<number, string> = {
  0: "EMERG",
  1: "ALERT",
  2: "CRIT",
  3: "ERROR",
  4: "WARN",
  5: "NOTICE",
  6: "INFO",
  7: "DEBUG",
}

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Levels" },
  { value: "err", label: "Errors" },
  { value: "warning", label: "Warnings" },
  { value: "info", label: "Info" },
] as const

export function Logs() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]["value"]>("all")
  const [unit, setUnit] = useState("all")
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    void fetchLogs()
    const interval = setInterval(() => {
      void fetchLogs(true)
    }, 5000)

    return () => clearInterval(interval)
  }, [priority, unit])

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("lines", "200")
      if (priority !== "all") {
        params.set("priority", priority)
      }
      if (unit !== "all") {
        params.set("unit", unit)
      }

      const response = await fetch(`/api/logs?${params.toString()}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { entries: LogEntry[] }
      setEntries(data.entries ?? [])
    } catch (error) {
      if (!silent) {
        toast({
          title: "Failed to load logs",
          description: error instanceof Error ? error.message : "Unable to fetch journal entries",
          variant: "destructive",
        })
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return entries.filter((entry) => {
      const matchesSearch =
        entry.message.toLowerCase().includes(term) ||
        (entry.unit?.toLowerCase().includes(term) ?? false) ||
        formatPriorityLabel(entry.priority).toLowerCase().includes(term)
      return matchesSearch
    })
  }, [entries, searchTerm])

  const units = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.unit).filter(Boolean) as string[])
    return Array.from(unique).sort()
  }, [entries])

  const downloadLogs = () => {
    const content = filteredEntries
      .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.unit ?? "system"}: ${entry.message}`)
      .join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `orbit-logs-${new Date().toISOString()}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const errorCount = entries.filter((entry) => (entry.priority ?? 7) <= 3).length
  const warningCount = entries.filter((entry) => (entry.priority ?? 7) === 4).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-balance">System Logs</h1>
          <p className="text-muted-foreground">Monitor systemd journal entries from your Ubuntu host</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="border-[var(--mint)]/30 hover:bg-[var(--mint)]/10 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="border-border/50 hover:bg-accent/50 bg-transparent" onClick={downloadLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <Select value={priority} onValueChange={(value) => setPriority(value as (typeof PRIORITY_OPTIONS)[number]["value"])}>
              <SelectTrigger className="w-full md:w-48 bg-background/50 border-border/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-full md:w-48 bg-background/50 border-border/50">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Total: {entries.length}</span>
            <span>Filtered: {filteredEntries.length}</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span>Errors: {errorCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span>Warnings: {warningCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--mint)]" />
            Log Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors border border-border/30"
              >
                <div className="mt-0.5">{renderLogIcon(entry.priority)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground font-mono">{formatTimestamp(entry.timestamp)}</span>
                    <Badge variant="outline" className={priorityBadgeClass(entry.priority)}>
                      {formatPriorityLabel(entry.priority)}
                    </Badge>
                    {entry.unit && (
                      <Badge variant="outline" className="text-xs">
                        {entry.unit}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground break-words whitespace-pre-line">{entry.message}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || priority !== "all" || unit !== "all"
                  ? "Try adjusting your filters"
                  : "No log entries available."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatPriorityLabel(priority?: number): string {
  if (priority === undefined) return "INFO"
  return PRIORITY_LABELS[priority] ?? "INFO"
}

function renderLogIcon(priority?: number) {
  if (priority !== undefined && priority <= 3) {
    return <AlertCircle className="h-4 w-4 text-red-400" />
  }
  if (priority === 4) {
    return <AlertTriangle className="h-4 w-4 text-yellow-400" />
  }
  return <Info className="h-4 w-4 text-[var(--mint)]" />
}

function priorityBadgeClass(priority?: number): string {
  if (priority !== undefined && priority <= 3) {
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }
  if (priority === 4) {
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  }
  return "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30"
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString()
  } catch {
    return timestamp
  }
}
