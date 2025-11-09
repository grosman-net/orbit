import { promises as fs } from "node:fs"
import { runCommand } from "../command"

export interface SystemSummary {
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

let previousCpuSample: CpuSample | undefined
let previousNetworkSample: NetworkSample | undefined
let previousDiskSample: DiskSample | undefined

interface CpuSample {
  idle: number
  total: number
  timestamp: number
}

interface NetworkSample {
  rx: number
  tx: number
  timestamp: number
}

interface DiskSample {
  readBytes: number
  writeBytes: number
  timestamp: number
}

export async function getSystemSummary(): Promise<SystemSummary> {
  const [
    hostname,
    osRelease,
    kernel,
    architecture,
    uptimeSeconds,
    cpuUsage,
    memory,
    swap,
    disk,
    network,
    diskIo,
    processCount,
    loadAverage,
  ] =
    await Promise.all([
      readHostname(),
      readOsRelease(),
      readKernelVersion(),
      readArchitecture(),
      readUptime(),
      readCpuUsage(),
      readMemoryUsage(),
      readSwapUsage(),
      readDiskUsage(),
      readNetworkUsage(),
      readDiskIo(),
      readProcessCount(),
      readLoadAverage(),
    ])

  return {
    hostname,
    os: osRelease,
    kernel,
    architecture,
    uptimeSeconds,
    cpuUsage,
    memoryUsage: memory.usage,
    memoryTotal: memory.total,
    memoryUsed: memory.used,
    swapUsage: swap.usage,
    swapTotal: swap.total,
    swapUsed: swap.used,
    diskUsage: disk.usage,
    diskTotal: disk.total,
    diskUsed: disk.used,
    networkRx: network.rx,
    networkTx: network.tx,
    diskReadBps: diskIo.readBps,
    diskWriteBps: diskIo.writeBps,
    processCount,
    loadAverage,
  }
}

async function readHostname(): Promise<string> {
  const { stdout } = await runCommand("hostname", [])
  return stdout.trim()
}

async function readOsRelease(): Promise<string> {
  try {
    const content = await fs.readFile("/etc/os-release", "utf8")
    const nameMatch = content.match(/^PRETTY_NAME="?(.*?)"?$/m)
    return nameMatch ? nameMatch[1] : "Unknown Linux"
  } catch {
    return "Unknown Linux"
  }
}

async function readKernelVersion(): Promise<string> {
  const { stdout } = await runCommand("uname", ["-r"])
  return stdout.trim()
}

async function readArchitecture(): Promise<string> {
  const { stdout } = await runCommand("uname", ["-m"])
  return stdout.trim()
}

async function readUptime(): Promise<number> {
  const content = await fs.readFile("/proc/uptime", "utf8")
  const [uptime] = content.split(" ")
  return Number.parseFloat(uptime)
}

async function readCpuUsage(): Promise<number> {
  const sample = await sampleCpu()
  if (!previousCpuSample) {
    previousCpuSample = sample
    return 0
  }

  const idleDiff = sample.idle - previousCpuSample.idle
  const totalDiff = sample.total - previousCpuSample.total

  previousCpuSample = sample

  if (totalDiff === 0) {
    return 0
  }

  return (1 - idleDiff / totalDiff) * 100
}

async function sampleCpu(): Promise<CpuSample> {
  const content = await fs.readFile("/proc/stat", "utf8")
  const cpuLine = content.split("\n").find((line) => line.startsWith("cpu "))

  if (!cpuLine) {
    return { idle: 0, total: 0, timestamp: Date.now() }
  }

  const parts = cpuLine.split(/\s+/).slice(1).map(Number)
  const idle = parts[3] + parts[4] // idle + iowait
  const total = parts.reduce((acc, value) => acc + value, 0)

  return {
    idle,
    total,
    timestamp: Date.now(),
  }
}

async function readMemoryUsage(): Promise<{ usage: number; total: number; used: number }> {
  const content = await fs.readFile("/proc/meminfo", "utf8")
  const memTotal = parseMeminfo(content, "MemTotal")
  const memAvailable = parseMeminfo(content, "MemAvailable")

  if (memTotal === 0) {
    return { usage: 0, total: 0, used: 0 }
  }

  const used = memTotal - memAvailable
  const usage = (used / memTotal) * 100

  return {
    usage,
    total: memTotal,
    used,
  }
}

function parseMeminfo(content: string, key: string): number {
  const regex = new RegExp(`^${key}:\\s+(\\d+)\\s+kB$`, "m")
  const match = content.match(regex)
  return match ? Number.parseInt(match[1], 10) * 1024 : 0
}

async function readDiskUsage(): Promise<{ usage: number; total: number; used: number }> {
  const { stdout } = await runCommand("df", ["-Pk", "/"])
  const lines = stdout.trim().split("\n")
  const data = lines[lines.length - 1]?.split(/\s+/) ?? []

  const total = Number.parseInt(data[1] ?? "0", 10) * 1024
  const used = Number.parseInt(data[2] ?? "0", 10) * 1024

  const usage = total > 0 ? (used / total) * 100 : 0

  return { usage, total, used }
}

async function readSwapUsage(): Promise<{ usage: number; total: number; used: number }> {
  const content = await fs.readFile("/proc/meminfo", "utf8")
  const total = parseMeminfo(content, "SwapTotal")
  const free = parseMeminfo(content, "SwapFree")

  if (total === 0) {
    return { usage: 0, total: 0, used: 0 }
  }

  const used = total - free
  const usage = (used / total) * 100

  return { usage, total, used }
}

async function readNetworkUsage(): Promise<{ rx: number; tx: number }> {
  const sample = await sampleNetwork()

  if (!previousNetworkSample) {
    previousNetworkSample = sample
    return { rx: 0, tx: 0 }
  }

  const timeDiff = (sample.timestamp - previousNetworkSample.timestamp) / 1000
  if (timeDiff <= 0) {
    previousNetworkSample = sample
    return { rx: 0, tx: 0 }
  }

  const rxDiff = sample.rx - previousNetworkSample.rx
  const txDiff = sample.tx - previousNetworkSample.tx

  previousNetworkSample = sample

  return {
    rx: rxDiff / timeDiff,
    tx: txDiff / timeDiff,
  }
}

async function sampleNetwork(): Promise<NetworkSample> {
  const content = await fs.readFile("/proc/net/dev", "utf8")
  const lines = content.split("\n").slice(2)

  let rx = 0
  let tx = 0

  for (const line of lines) {
    if (!line.includes(":")) continue
    const [iface, data] = line.split(":")
    if (iface.trim().startsWith("lo")) continue
    const parts = data.trim().split(/\s+/)
    rx += Number.parseInt(parts[0] ?? "0", 10)
    tx += Number.parseInt(parts[8] ?? "0", 10)
  }

  return {
    rx,
    tx,
    timestamp: Date.now(),
  }
}

async function readDiskIo(): Promise<{ readBps: number; writeBps: number }> {
  const sample = await sampleDisk()

  if (!previousDiskSample) {
    previousDiskSample = sample
    return { readBps: 0, writeBps: 0 }
  }

  const timeDiff = (sample.timestamp - previousDiskSample.timestamp) / 1000
  if (timeDiff <= 0) {
    previousDiskSample = sample
    return { readBps: 0, writeBps: 0 }
  }

  const readDiff = sample.readBytes - previousDiskSample.readBytes
  const writeDiff = sample.writeBytes - previousDiskSample.writeBytes
  previousDiskSample = sample

  return {
    readBps: Math.max(readDiff / timeDiff, 0),
    writeBps: Math.max(writeDiff / timeDiff, 0),
  }
}

async function sampleDisk(): Promise<DiskSample> {
  const content = await fs.readFile("/proc/diskstats", "utf8")
  const lines = content.split("\n").filter(Boolean)

  let readSectors = 0
  let writeSectors = 0

  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 14) {
      continue
    }

    const name = parts[2] ?? ""
    if (!isBlockDevice(name)) {
      continue
    }

    const sectorsRead = Number.parseInt(parts[5] ?? "0", 10)
    const sectorsWritten = Number.parseInt(parts[9] ?? "0", 10)

    readSectors += Number.isFinite(sectorsRead) ? sectorsRead : 0
    writeSectors += Number.isFinite(sectorsWritten) ? sectorsWritten : 0
  }

  const bytesPerSector = 512
  return {
    readBytes: readSectors * bytesPerSector,
    writeBytes: writeSectors * bytesPerSector,
    timestamp: Date.now(),
  }
}

function isBlockDevice(name: string): boolean {
  if (!name) {
    return false
  }
  if (name.startsWith("loop") || name.startsWith("ram") || name.startsWith("dm-")) {
    return false
  }
  // Ignore partitions (e.g. sda1, nvme0n1p1)
  return !/\d$/.test(name)
}

async function readProcessCount(): Promise<number> {
  const { stdout } = await runCommand("ps", ["-e", "--no-headers"])
  return stdout.trim() === "" ? 0 : stdout.trim().split("\n").length
}

async function readLoadAverage(): Promise<[number, number, number]> {
  const content = await fs.readFile("/proc/loadavg", "utf8")
  const [one, five, fifteen] = content.split(" ").slice(0, 3).map(Number)
  return [one, five, fifteen]
}


