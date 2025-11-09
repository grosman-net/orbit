"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Activity,
  ArrowDownUp,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  Network,
  Waves,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MetricPoint {
  time: string
  cpu: number
  memory: number
  swap: number
  disk: number
  networkIn: number
  networkOut: number
  diskRead: number
  diskWrite: number
  load1: number
  load5: number
  load15: number
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
  swapUsage: number
  swapTotal: number
  swapUsed: number
  diskUsage: number
  diskTotal: number
  diskUsed: number
  networkRx: number
  networkTx: number
  diskReadBps: number
  diskWriteBps: number
  processCount: number
  loadAverage: [number, number, number]
}

const REFRESH_OPTIONS = [
  { label: "5 секунд", value: 5000 },
  { label: "10 секунд", value: 10_000 },
  { label: "30 секунд", value: 30_000 },
  { label: "1 минута", value: 60_000 },
] as const

const HISTORY_WINDOW_MINUTES = 10

export function Monitoring() {
  const [data, setData] = useState<MetricPoint[]>([])
  const [refreshInterval, setRefreshInterval] = useState<number>(REFRESH_OPTIONS[0]!.value)
  const [latestSummary, setLatestSummary] = useState<SystemSummary | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("—")

  useEffect(() => {
    let cancelled = false

    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/system/summary", { cache: "no-store" })
        if (!response.ok) {
          throw new Error(await response.text())
        }
        const summary = (await response.json()) as SystemSummary
        if (cancelled) {
          return
        }

        const timeLabel = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
        const nextPoint: MetricPoint = {
          time: timeLabel,
          cpu: summary.cpuUsage,
          memory: summary.memoryUsage,
          swap: summary.swapUsage,
          disk: summary.diskUsage,
          networkIn: summary.networkRx / 1024 / 1024,
          networkOut: summary.networkTx / 1024 / 1024,
          diskRead: summary.diskReadBps / 1024 / 1024,
          diskWrite: summary.diskWriteBps / 1024 / 1024,
          load1: summary.loadAverage[0] ?? 0,
          load5: summary.loadAverage[1] ?? 0,
          load15: summary.loadAverage[2] ?? 0,
        }

        const maxEntries = Math.max(Math.round((HISTORY_WINDOW_MINUTES * 60_000) / refreshInterval), 12)

        setData((prev) => {
          const trimmed = prev.slice(Math.max(prev.length - (maxEntries - 1), 0))
          return [...trimmed, nextPoint]
        })
        setLatestSummary(summary)
        setLastUpdated(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch metrics", error)
        }
      }
    }

    fetchMetrics().catch(() => {})
    const intervalId = setInterval(() => {
      fetchMetrics().catch(() => {})
    }, refreshInterval)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [refreshInterval])

  const latestPoint = data.at(-1)
  const networkSeries = useMemo(
    () =>
      data.map((point) => ({
        time: point.time,
        download: point.networkIn,
        upload: point.networkOut,
      })),
    [data],
  )

  const diskIoSeries = useMemo(
    () =>
      data.map((point) => ({
        time: point.time,
        read: point.diskRead,
        write: point.diskWrite,
      })),
    [data],
  )

  const loadSeries = useMemo(
    () =>
      data.map((point) => ({
        time: point.time,
        "1m": point.load1,
        "5m": point.load5,
        "15m": point.load15,
      })),
    [data],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time performance metrics and historical data</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Интервал обновления</p>
            <Select value={String(refreshInterval)} onValueChange={(value) => setRefreshInterval(Number(value))}>
              <SelectTrigger className="w-[180px] bg-background/40 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>История: {HISTORY_WINDOW_MINUTES} минут</p>
            <p>Последнее обновление: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MetricAreaCard
          title="CPU Usage"
          icon={<Cpu className="h-5 w-5 text-[var(--mint)]" />}
          data={data}
          dataKey="cpu"
          color="var(--mint)"
          domain={[0, 100]}
        />

        <MetricAreaCard
          title="Memory Usage"
          icon={<MemoryStick className="h-5 w-5 text-[var(--emerald)]" />}
          data={data}
          dataKey="memory"
          color="var(--emerald)"
          domain={[0, 100]}
        />

        <MetricAreaCard
          title="Swap Usage"
          icon={<Gauge className="h-5 w-5 text-cyan-400" />}
          data={data}
          dataKey="swap"
          color="#22d3ee"
          domain={[0, 100]}
        />

        <MetricAreaCard
          title="Disk Utilization"
          icon={<HardDrive className="h-5 w-5 text-yellow-400" />}
          data={data}
          dataKey="disk"
          color="#facc15"
          domain={[0, 100]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MetricMultiLineCard
          title="Network Traffic"
          icon={<Network className="h-5 w-5 text-blue-400" />}
          data={networkSeries}
          lines={[
            { key: "download", color: "#38bdf8", label: "Download" },
            { key: "upload", color: "#60a5fa", label: "Upload" },
          ]}
          unit="MB/s"
        />

        <MetricMultiLineCard
          title="Disk I/O"
          icon={<ArrowDownUp className="h-5 w-5 text-purple-400" />}
          data={diskIoSeries}
          lines={[
            { key: "read", color: "#c084fc", label: "Read" },
            { key: "write", color: "#a855f7", label: "Write" },
          ]}
          unit="MB/s"
        />
      </div>

      <MetricMultiLineCard
        title="Load Average"
        icon={<Waves className="h-5 w-5 text-emerald-400" />}
        data={loadSeries}
        lines={[
          { key: "1m", color: "#34d399", label: "1 min" },
          { key: "5m", color: "#22c55e", label: "5 min" },
          { key: "15m", color: "#16a34a", label: "15 min" },
        ]}
        unit=""
      />

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--mint)]" />
            Current Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricSummary
              label="CPU Usage"
              value={latestPoint ? `${latestPoint.cpu.toFixed(1)}%` : "—"}
              accent="text-[var(--mint)]"
            />
            <MetricSummary
              label="Memory"
              value={
                latestSummary
                  ? `${formatBytes(latestSummary.memoryUsed)} / ${formatBytes(latestSummary.memoryTotal)}`
                  : "—"
              }
              accent="text-[var(--emerald)]"
            />
            <MetricSummary
              label="Swap"
              value={
                latestSummary
                  ? `${formatBytes(latestSummary.swapUsed)} / ${formatBytes(latestSummary.swapTotal)}`
                  : "—"
              }
              accent="text-cyan-400"
            />
            <MetricSummary
              label="Disk usage"
              value={
                latestSummary
                  ? `${formatBytes(latestSummary.diskUsed)} / ${formatBytes(latestSummary.diskTotal)}`
                  : "—"
              }
              accent="text-yellow-400"
            />
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricSummary
              label="Network (Down / Up)"
              value={
                latestPoint
                  ? `${latestPoint.networkIn.toFixed(2)} / ${latestPoint.networkOut.toFixed(2)} MB/s`
                  : "—"
              }
              accent="text-blue-400"
            />
            <MetricSummary
              label="Disk I/O (Read / Write)"
              value={
                latestPoint
                  ? `${latestPoint.diskRead.toFixed(2)} / ${latestPoint.diskWrite.toFixed(2)} MB/s`
                  : "—"
              }
              accent="text-purple-400"
            />
            <MetricSummary
              label="Processes"
              value={latestSummary ? `${latestSummary.processCount}` : "—"}
              accent="text-[var(--mint)]"
            />
            <MetricSummary
              label="Load Avg (1/5/15)"
              value={
                latestSummary
                  ? `${latestSummary.loadAverage.map((v) => v.toFixed(2)).join(" / ")}`
                  : "—"
              }
              accent="text-emerald-400"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricAreaCard({
  title,
  icon,
  data,
  dataKey,
  color,
  domain,
}: {
  title: string
  icon: ReactNode
  data: MetricPoint[]
  dataKey: keyof MetricPoint
  color: string
  domain: [number, number]
}) {
  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
            <XAxis dataKey="time" stroke="oklch(0.708 0 0)" fontSize={12} />
            <YAxis stroke="oklch(0.708 0 0)" fontSize={12} domain={domain} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(2)}%`, title]} />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.28} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function MetricMultiLineCard<
  T extends Record<string, number | string>,
  K extends keyof Omit<T, "time">,
>({
  title,
  icon,
  data,
  lines,
  unit,
}: {
  title: string
  icon: ReactNode
  data: Array<T & { time: string }>
  lines: Array<{ key: K; color: string; label: string }>
  unit: string
}) {
  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
            <XAxis dataKey="time" stroke="oklch(0.708 0 0)" fontSize={12} />
            <YAxis stroke="oklch(0.708 0 0)" fontSize={12} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [`${value.toFixed(2)}${unit ? ` ${unit}` : ""}`, name]}
            />
            {lines.map((line) => (
              <Line
                key={String(line.key)}
                type="monotone"
                dataKey={line.key as string}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function MetricSummary({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <div className={`text-lg font-semibold mb-1 ${accent}`}>{value}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: "oklch(0.18 0 0)",
  border: "1px solid oklch(0.3 0 0)",
  borderRadius: "8px",
  color: "oklch(0.74 0 0)",
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B"
  }
  const units = ["B", "KiB", "MiB", "GiB", "TiB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[exponent]}`
}
