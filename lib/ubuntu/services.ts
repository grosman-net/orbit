import { CommandError, runCommand } from "../command"

export interface UbuntuService {
  unit: string
  name: string
  description: string
  load: string
  active: string
  sub: string
}

export type ServiceAction = "start" | "stop" | "restart" | "reload" | "enable" | "disable"

const SERVICE_UNIT_REGEX = /^[a-zA-Z0-9@._-]+\.service$/

export async function listServices(): Promise<UbuntuService[]> {
  try {
    const { stdout } = await runCommand("systemctl", [
      "list-units",
      "--type=service",
      "--all",
      "--no-pager",
      "--no-legend",
      "--output=json",
    ])

    const units = JSON.parse(stdout) as Array<{
      unit: string
      load: string
      active: string
      sub: string
      description: string
    }>

    return units
      .filter((unit) => unit.unit.endsWith(".service"))
      .map((unit) => ({
        unit: unit.unit,
        name: unit.unit.replace(/\.service$/, ""),
        description: unit.description,
        load: unit.load,
        active: unit.active,
        sub: unit.sub,
      }))
  } catch (error) {
    if (error instanceof CommandError && /invalid argument/.test(error.message)) {
      // Older systemd versions without JSON output support
      const fallback = await runCommand("systemctl", [
        "list-units",
        "--type=service",
        "--all",
        "--no-pager",
        "--no-legend",
      ])
      return parsePlainListUnits(fallback.stdout)
    }
    throw error
  }
}

export async function performServiceAction(unitName: string, action: ServiceAction): Promise<{ message: string }> {
  assertValidServiceUnit(unitName)

  const args = buildServiceArgs(unitName, action)

  try {
    const { stdout, stderr } = await runCommand("systemctl", args, { requireRoot: true })
    return {
      message: stdout || stderr || `systemctl ${action} ${unitName} completed`,
    }
  } catch (error) {
    if (error instanceof CommandError) {
      throw new CommandError(`systemctl ${action} ${unitName} failed`, error.stderr || error.message, error.code)
    }
    throw error
  }
}

function buildServiceArgs(unitName: string, action: ServiceAction): string[] {
  if (action === "enable" || action === "disable") {
    return [action, unitName]
  }
  return [action, unitName]
}

function assertValidServiceUnit(value: string) {
  if (!SERVICE_UNIT_REGEX.test(value)) {
    throw new Error("Invalid service unit name")
  }
}

function parsePlainListUnits(output: string): UbuntuService[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/)
      const unit = parts[0] ?? ""
      const load = parts[1] ?? ""
      const active = parts[2] ?? ""
      const sub = parts[3] ?? ""
      const description = parts.slice(4).join(" ")
      return {
        unit,
        name: unit.replace(/\.service$/, ""),
        description,
        load,
        active,
        sub,
      }
    })
    .filter((service) => SERVICE_UNIT_REGEX.test(service.unit))
}


