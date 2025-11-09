import { promises as fs } from "node:fs"
import { runCommand } from "../command"

export interface NetworkInterface {
  name: string
  macAddress?: string
  ipv4: string[]
  ipv6: string[]
  up: boolean
}

export interface FirewallStatus {
  enabled: boolean
  rawStatus: string
  rules: string[]
}

export interface NetworkOverview {
  hostname: string
  defaultGateway?: string
  forwardingEnabled: boolean
  interfaces: NetworkInterface[]
  firewall: FirewallStatus
}

const UFW_RULE_REGEX = /^\[\s*\d+\]\s+(.+)$/

export async function getNetworkOverview(): Promise<NetworkOverview> {
  const [{ stdout: ipJson }, { stdout: hostname }, gateway, forwarding, firewall] = await Promise.all([
    runCommand("ip", ["-j", "address"]),
    runCommand("hostname", []),
    getDefaultGateway(),
    getIpv4Forwarding(),
    getFirewallStatus(),
  ])

  const interfaces = parseInterfaces(ipJson)

  return {
    hostname: hostname.trim(),
    defaultGateway: gateway,
    forwardingEnabled: forwarding,
    interfaces,
    firewall,
  }
}

export async function setFirewallState(enabled: boolean): Promise<void> {
  if (enabled) {
    await runCommand("ufw", ["--force", "enable"], { requireRoot: true })
  } else {
    await runCommand("ufw", ["--force", "disable"], { requireRoot: true })
  }
}

export async function reloadFirewall(): Promise<void> {
  await runCommand("ufw", ["reload"], { requireRoot: true })
}

export async function allowFirewallRule(rule: string): Promise<void> {
  await runCommand("ufw", ["allow", rule], { requireRoot: true })
}

export async function denyFirewallRule(rule: string): Promise<void> {
  await runCommand("ufw", ["deny", rule], { requireRoot: true })
}

async function getDefaultGateway(): Promise<string | undefined> {
  try {
    const { stdout } = await runCommand("ip", ["route", "show", "default"])
    const line = stdout.split("\n").find((entry) => entry.startsWith("default"))
    if (!line) return undefined
    const parts = line.split(/\s+/)
    const viaIndex = parts.indexOf("via")
    if (viaIndex !== -1 && parts[viaIndex + 1]) {
      return parts[viaIndex + 1]
    }
    return undefined
  } catch {
    return undefined
  }
}

async function getIpv4Forwarding(): Promise<boolean> {
  try {
    const content = await fs.readFile("/proc/sys/net/ipv4/ip_forward", "utf8")
    return content.trim() === "1"
  } catch {
    return false
  }
}

async function getFirewallStatus(): Promise<FirewallStatus> {
  try {
    const { stdout } = await runCommand("ufw", ["status", "--format", "json"])
    const data = JSON.parse(stdout) as {
      status: string
      rules: Array<{ to: string; action: string; comment?: string }>
    }
    return {
      enabled: data.status === "active",
      rawStatus: stdout,
      rules: data.rules.map((rule) => `${rule.action} ${rule.to}${rule.comment ? ` (${rule.comment})` : ""}`),
    }
  } catch {
    const { stdout } = await runCommand("ufw", ["status", "numbered"])
    return parseFirewallStatusFallback(stdout)
  }
}

function parseInterfaces(rawJson: string): NetworkInterface[] {
  try {
    const parsed = JSON.parse(rawJson) as Array<{
      ifname: string
      address?: string
      operstate?: string
      addr_info?: Array<{
        family: "inet" | "inet6"
        local: string
        prefixlen: number
        scope: string
      }>
    }>

    return parsed.map((entry) => {
      const ipv4 = (entry.addr_info ?? [])
        .filter((addr) => addr.family === "inet")
        .map((addr) => `${addr.local}/${addr.prefixlen}`)
      const ipv6 = (entry.addr_info ?? [])
        .filter((addr) => addr.family === "inet6")
        .map((addr) => `${addr.local}/${addr.prefixlen}`)

      return {
        name: entry.ifname,
        macAddress: entry.address,
        ipv4,
        ipv6,
        up: (entry.operstate ?? "").toLowerCase() === "up",
      }
    })
  } catch {
    return []
  }
}

function parseFirewallStatusFallback(output: string): FirewallStatus {
  const lines = output.split("\n").map((line) => line.trim())
  const enabled = lines.some((line) => line.toLowerCase().startsWith("status: active"))
  const rules = lines
    .map((line) => {
      const match = line.match(UFW_RULE_REGEX)
      return match ? match[1] : undefined
    })
    .filter((rule): rule is string => Boolean(rule))

  return {
    enabled,
    rawStatus: output,
    rules,
  }
}


