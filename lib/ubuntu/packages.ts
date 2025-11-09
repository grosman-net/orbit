import { CommandError, runCommand } from "../command"

export interface UbuntuPackage {
  name: string
  version: string
  status: "installed" | "config-files" | "half-installed" | "not-installed"
  priority?: string
  description?: string
}

export interface PackageSearchResult {
  name: string
  description: string
}

const PACKAGE_NAME_REGEX = /^[a-z0-9.+-]+$/

export async function listInstalledPackages(limit = 200): Promise<UbuntuPackage[]> {
  const { stdout } = await runCommand("dpkg-query", [
    "-W",
    "-f=${Package}\\t${Version}\\t${Status}\\t${Priority}\\n",
  ])

  const lines = stdout.trim().split("\n").filter(Boolean)

  return lines.slice(0, limit).map((line) => {
    const [name, version, status, priority] = line.split("\t")
    return {
      name,
      version,
      status: normalizeStatus(status),
      priority: priority || undefined,
    }
  })
}

export async function searchPackages(term: string, limit = 50): Promise<PackageSearchResult[]> {
  const query = term.trim()
  if (!query) {
    return []
  }

  const { stdout } = await runCommand("apt-cache", ["search", query])

  const lines = stdout.trim().split("\n").filter(Boolean)

  return lines.slice(0, limit).map((line) => {
    const [name, ...descriptionParts] = line.split(" - ")
    return {
      name: name.trim(),
      description: descriptionParts.join(" - ").trim(),
    }
  })
}

export type AptAction = "install" | "remove" | "purge" | "update" | "upgrade"

export async function executeAptAction(
  action: AptAction,
  packageName?: string,
): Promise<{ message: string }> {
  const args = buildAptArgs(action, packageName)

  try {
    const { stdout, stderr } = await runCommand("apt-get", args, { requireRoot: true, timeoutMs: 60_000 })
    return {
      message: stdout || stderr || `apt-get ${action} completed`,
    }
  } catch (error) {
    if (error instanceof CommandError) {
      throw new CommandError(`apt-get ${action} failed`, error.stderr || error.message, error.code)
    }
    throw error
  }
}

function buildAptArgs(action: AptAction, packageName?: string): string[] {
  switch (action) {
    case "update":
      return ["update"]
    case "upgrade":
      return ["upgrade", "-y"]
    case "install":
      assertValidPackageName(packageName)
      return ["install", "-y", packageName!]
    case "remove":
      assertValidPackageName(packageName)
      return ["remove", "-y", packageName!]
    case "purge":
      assertValidPackageName(packageName)
      return ["purge", "-y", packageName!]
    default:
      throw new Error(`Unsupported apt action: ${action}`)
  }
}

function assertValidPackageName(value?: string): asserts value is string {
  if (!value || !PACKAGE_NAME_REGEX.test(value)) {
    throw new Error("Invalid package name")
  }
}

function normalizeStatus(status: string): UbuntuPackage["status"] {
  if (status.includes("install ok installed")) {
    return "installed"
  }
  if (status.includes("deinstall ok config-files")) {
    return "config-files"
  }
  if (status.includes("half-installed")) {
    return "half-installed"
  }
  return "not-installed"
}


