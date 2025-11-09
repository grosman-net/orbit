import { runCommand } from "../command"

export interface SystemUser {
  username: string
  uid: number
  gid: number
  gecos?: string
  home: string
  shell: string
  locked: boolean
  loggedIn: boolean
  lastLogin?: string
}

const PASSWD_FIELDS = ["username", "password", "uid", "gid", "gecos", "home", "shell"] as const

export async function listSystemUsers(): Promise<SystemUser[]> {
  const [{ stdout: passwdOutput }, loggedIn, lastLogins] = await Promise.all([
    runCommand("getent", ["passwd"]),
    getLoggedInUsers(),
    getLastLoginMap(),
  ])

  return passwdOutput
    .trim()
    .split("\n")
    .map((line) => parsePasswdEntry(line, loggedIn, lastLogins))
    .filter((user): user is SystemUser => user !== null && user.uid >= 1000 && user.username !== "nobody")
}

export async function setUserLocked(username: string, locked: boolean): Promise<void> {
  await runCommand("passwd", [locked ? "-l" : "-u", username], { requireRoot: true })
}

export async function deleteUser(username: string): Promise<void> {
  await runCommand("userdel", ["-r", username], { requireRoot: true })
}

export async function createUser(username: string, options?: { shell?: string; home?: string }): Promise<void> {
  const args = ["-m"]
  if (options?.shell) {
    args.push("-s", options.shell)
  }
  if (options?.home) {
    args.push("-d", options.home)
  }
  args.push(username)
  await runCommand("useradd", args, { requireRoot: true })
}

async function getLoggedInUsers(): Promise<Set<string>> {
  try {
    const { stdout } = await runCommand("who", [])
    const entries = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split(/\s+/)[0])
    return new Set(entries)
  } catch {
    return new Set()
  }
}

async function getLastLoginMap(): Promise<Map<string, string>> {
  try {
    const { stdout } = await runCommand("lastlog", ["-u", "1000-65000"])
    const lines = stdout.trim().split("\n").slice(1) // skip header
    const map = new Map<string, string>()

    for (const line of lines) {
      const username = line.slice(0, 16).trim()
      const lastLogin = line.slice(38).trim()
      if (username) {
        map.set(username, lastLogin === "**Never logged in**" ? undefined : lastLogin)
      }
    }
    return map
  } catch {
    return new Map()
  }
}

function parsePasswdEntry(
  line: string,
  loggedIn: Set<string>,
  lastLogins: Map<string, string>,
): SystemUser | null {
  const parts = line.split(":")
  if (parts.length !== PASSWD_FIELDS.length) {
    return null
  }

  const [username, , uid, gid, gecos, home, shell] = parts
  const locked = shell.trim() === "/usr/sbin/nologin" || shell.trim() === "/bin/false"

  return {
    username,
    uid: Number.parseInt(uid, 10),
    gid: Number.parseInt(gid, 10),
    gecos: gecos || undefined,
    home,
    shell,
    locked,
    loggedIn: loggedIn.has(username),
    lastLogin: lastLogins.get(username),
  }
}


