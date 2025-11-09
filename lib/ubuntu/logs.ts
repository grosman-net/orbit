import { runCommand } from "../command"

export interface JournalOptions {
  unit?: string
  lines?: number
  priority?: "emerg" | "alert" | "crit" | "err" | "warning" | "notice" | "info" | "debug"
  since?: string
}

export interface JournalEntry {
  id: string
  message: string
  unit?: string
  priority?: number
  timestamp: string
}

const PRIORITY_MAP: Record<string, number> = {
  emerg: 0,
  alert: 1,
  crit: 2,
  err: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7,
}

export async function getJournalEntries(options: JournalOptions = {}): Promise<JournalEntry[]> {
  const args = ["-n", String(options.lines ?? 200), "--output=json"]

  if (options.unit) {
    args.push("-u", options.unit)
  }

  if (options.priority) {
    const level = PRIORITY_MAP[options.priority]
    if (typeof level === "number") {
      args.push(`PRIORITY<=${level}`)
    }
  }

  if (options.since) {
    args.push("--since", options.since)
  }

  args.push("--no-pager")

  const { stdout } = await runCommand("journalctl", args, {
    requireRoot: options.unit ? true : false,
    timeoutMs: 20_000,
  })

  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => safeJsonParse(line))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .map((entry) => ({
      id: String(entry.__REALTIME_TIMESTAMP ?? entry._SOURCE_REALTIME_TIMESTAMP ?? entry.MESSAGE_ID ?? Date.now()),
      message: String(entry.MESSAGE ?? ""),
      unit: typeof entry._SYSTEMD_UNIT === "string" ? entry._SYSTEMD_UNIT : undefined,
      priority: typeof entry.PRIORITY === "string" ? Number.parseInt(entry.PRIORITY, 10) : undefined,
      timestamp: normalizeTimestamp(entry.__REALTIME_TIMESTAMP ?? entry._SOURCE_REALTIME_TIMESTAMP),
    }))
    .filter((entry) => entry.message.trim() !== "")
}

function safeJsonParse(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line)
  } catch {
    return null
  }
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value === "string" && value.length >= 12) {
    const millis = Number.parseInt(value, 10) / 1000
    return new Date(millis).toISOString()
  }
  if (typeof value === "number") {
    return new Date(value).toISOString()
  }
  return new Date().toISOString()
}


