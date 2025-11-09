import { promises as fs } from "node:fs"
import { dirname, resolve } from "node:path"
import { runCommand } from "../command"

export interface ManagedConfigFile {
  id: string
  label: string
  path: string
  description: string
  requiresReload?: string
}

interface ConfigDescriptor {
  path: string
  label: string
  description: string
  requiresReload?: string
}

const MANAGED_CONFIGS: Record<string, ConfigDescriptor> = {
  "nginx-default": {
    path: "/etc/nginx/sites-available/default",
    label: "Nginx Default Site",
    description: "Main server block served by Nginx on Ubuntu installations.",
    requiresReload: "sudo systemctl reload nginx",
  },
  "sshd-config": {
    path: "/etc/ssh/sshd_config",
    label: "OpenSSH Server",
    description: "Configuration for the OpenSSH daemon.",
    requiresReload: "sudo systemctl reload sshd",
  },
  "ufw-before-rules": {
    path: "/etc/ufw/before.rules",
    label: "UFW IPv4 Rules",
    description: "Early firewall rules applied by UFW for IPv4 traffic.",
    requiresReload: "sudo ufw reload",
  },
}

export async function listManagedConfigs(): Promise<ManagedConfigFile[]> {
  return Object.entries(MANAGED_CONFIGS).map(([id, config]) => ({
    id,
    label: config.label,
    path: config.path,
    description: config.description,
    requiresReload: config.requiresReload,
  }))
}

export async function readManagedConfig(id: string): Promise<string> {
  const descriptor = MANAGED_CONFIGS[id]
  if (!descriptor) {
    throw new Error("Unknown configuration file")
  }

  const content = await fs.readFile(descriptor.path, "utf8")
  return content
}

export async function writeManagedConfig(id: string, content: string): Promise<void> {
  const descriptor = MANAGED_CONFIGS[id]
  if (!descriptor) {
    throw new Error("Unknown configuration file")
  }

  await ensureWritable(descriptor.path)
  await runCommand("tee", [descriptor.path], { requireRoot: true, input: content })
}

async function ensureWritable(path: string): Promise<void> {
  const resolved = resolve(path)
  const dir = dirname(resolved)
  await runCommand("mkdir", ["-p", dir], { requireRoot: true })
}


