#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const readline = require("readline")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const os = require("os")
const { execSync } = require("child_process")

const args = process.argv.slice(2)

function hasFlag(flag) {
  return args.includes(flag)
}

function getFlagValue(flag) {
  const index = args.indexOf(flag)
  if (index === -1) {
    return undefined
  }
  return args[index + 1]
}

const quietMode = hasFlag("--quiet")

async function main() {
  const projectRoot = path.resolve(__dirname, "..")
  const envPath = path.join(projectRoot, ".env.local")

  if (!quietMode) {
    console.log("Orbit setup\n")
  }

  const existingEnv = fs.existsSync(envPath) ? parseEnv(envPath) : {}

  const defaultPort = getFlagValue("--port") ?? existingEnv.PORT ?? "3333"
  const port = await promptForPort(defaultPort)

  const username = await promptForUsername(existingEnv.ORBIT_ADMIN_USERNAME ?? "admin")

  let passwordHash = existingEnv.ORBIT_ADMIN_PASSWORD_HASH
  if (!passwordHash) {
    passwordHash = await promptForPassword()
  } else {
    const reusePassword = await confirm("Keep existing admin password?", true)
    if (!reusePassword) {
      passwordHash = await promptForPassword()
    } else if (!quietMode) {
      console.log("Keeping existing password hash")
    }
  }

  const sanitizedSecret = sanitizeSecret(existingEnv.NEXTAUTH_SECRET)
  const nextAuthSecret = sanitizedSecret ?? crypto.randomBytes(32).toString("hex")

  const sanitizedExistingUrl = sanitizeExistingUrl(existingEnv.NEXTAUTH_URL, port)
  const candidateUrls = buildCandidateUrls(port)
  const defaultUrl = sanitizedExistingUrl ?? candidateUrls[0] ?? buildDefaultPublicUrl(port)
  const nextAuthUrl = await promptForPublicUrl(candidateUrls, defaultUrl, port)

  const envContent = formatEnv({
    PORT: port,
    NEXTAUTH_URL: nextAuthUrl,
    NEXTAUTH_SECRET: nextAuthSecret,
    ORBIT_ADMIN_USERNAME: username,
    ORBIT_ADMIN_PASSWORD_HASH: passwordHash,
  })

  fs.writeFileSync(envPath, envContent, { encoding: "utf8" })

  if (!quietMode) {
    console.log(`\nSaved configuration to ${envPath}`)
    console.log(`- HTTP port: ${port}`)
    console.log(`- Admin user: ${username}`)
    console.log("Update the generated .env.local if you need to change values later.")
  }
  process.exit(0)
}

async function askQuestion(prompt, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = await new Promise((resolve) => rl.question(prompt, resolve))
  rl.close()
  const trimmed = answer.trim()
  return trimmed.length > 0 ? trimmed : defaultValue
}

async function promptForPort(defaultValue) {
  let currentDefault = defaultValue
  while (true) {
    const answer = await askQuestion(`HTTP port [${currentDefault}]: `, currentDefault)
    const numeric = Number.parseInt(answer, 10)
    if (Number.isFinite(numeric) && numeric > 0 && numeric < 65536) {
      return String(numeric)
    }
    console.log("Port must be a number between 1 and 65535. Please try again.")
    currentDefault = defaultValue
  }
}

async function confirm(prompt, defaultYes) {
  const suffix = defaultYes ? "[Y/n]" : "[y/N]"
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const answer = await new Promise((resolve) => rl.question(`${prompt} ${suffix} `, resolve))
  rl.close()
  const normalized = answer.trim().toLowerCase()
  if (!normalized) {
    return defaultYes
  }
  return ["y", "yes"].includes(normalized)
}

async function promptForPassword() {
  console.log("\nSet administrator password")
  while (true) {
    const password = await askHidden("Enter password (input hidden):")
    if (!password) {
      console.log("Password cannot be empty. Please try again.")
      continue
    }
    const confirmPassword = await askHidden("Confirm password (input hidden):")
    if (password !== confirmPassword) {
      console.log("Passwords do not match. Please try again.")
      continue
    }
    return await bcrypt.hash(password, 12)
  }
}

async function askHidden(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  rl._writeToOutput = function writeToOutput(stringToWrite) {
    if (this.stdoutMuted) {
      if (stringToWrite === "\n" || stringToWrite === "\r" || stringToWrite === "\r\n") {
        this.output.write(stringToWrite)
      } else {
        this.output.write("*")
      }
    } else {
      this.output.write(stringToWrite)
    }
  }

  rl.output.write(`${prompt} `)
  rl.stdoutMuted = true

  const answer = await new Promise((resolve) => {
    rl.question("", (value) => {
      rl.stdoutMuted = false
      rl.output.write("\n")
      resolve(value)
    })
  })

  rl.close()
  return answer.trim()
}

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=")
      acc[key] = rest.join("=").trim()
      return acc
    }, {})
}

function formatEnv(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
}

function sanitizeExistingUrl(value, port) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("orbit.local")) {
    return null
  }
  const normalized = normalizePublicUrl(trimmed, port)
  return normalized
}

async function promptForUsername(defaultValue) {
  while (true) {
    const value = await askQuestion(`Admin username [${defaultValue}]: `, defaultValue)
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      console.log("Username cannot be empty. Please try again.")
      continue
    }
    return trimmed
  }
}

function normalizePublicUrl(value, port) {
  let candidate = value.trim()
  if (!candidate) {
    candidate = buildDefaultPublicUrl(port)
  }
  candidate = appendProtocolIfMissing(candidate, port)
  if (!isValidHttpUrl(candidate)) {
    return null
  }
  return candidate
}

function buildDefaultPublicUrl(port) {
  const ip = getPrimaryIp()
  return `http://${ip ?? "127.0.0.1"}:${port}`
}

function getPrimaryIp() {
  const detectors = [getIpFromDefaultRoute, getIpFromAddr, getIpsFromHostname, getIpFromInterfaces]
  for (const detector of detectors) {
    const ip = detector()
    if (ip) {
      return ip
    }
  }
  const hostname = os.hostname()
  if (hostname && hostname !== "localhost") {
    return hostname
  }
  return "127.0.0.1"
}

function getIpFromDefaultRoute() {
  try {
    const output = execSync("ip -4 route get 1.1.1.1", { encoding: "utf8" })
    const match = output.match(/src\s+([0-9.]+)/)
    if (match && match[1]) {
      return match[1]
    }
  } catch {}
  return null
}

function getIpFromAddr() {
  try {
    const output = execSync("ip -4 addr show scope global", { encoding: "utf8" })
    const match = output.match(/inet\s+([0-9.]+)\//)
    if (match && match[1]) {
      return match[1]
    }
  } catch {}
  return null
}

function getIpsFromHostname() {
  try {
    const output = execSync("hostname -I", { encoding: "utf8" }).trim()
    const candidates = output
      .split(/\s+/)
      .map((ip) => ip.trim())
      .filter((ip) => ip && ip !== "127.0.0.1")
    if (candidates.length > 0) {
      return candidates[0]
    }
  } catch {
    // ignore
  }
  return null
}

function getIpFromInterfaces() {
  const interfaces = os.networkInterfaces()
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address
      }
    }
  }
  return null
}

function buildCandidateUrls(port) {
  const candidates = new Set()
  const detectors = [getIpFromDefaultRoute, getIpFromAddr, getIpsFromHostname, getIpFromInterfaces]
  for (const detector of detectors) {
    const ip = detector()
    if (ip) {
      candidates.add(`http://${ip}:${port}`)
    }
  }
  return Array.from(candidates)
}

function appendProtocolIfMissing(value, port) {
  let candidate = value
  if (/^[0-9.]+(:[0-9]+)?$/.test(candidate)) {
    candidate = candidate.includes(":") ? `http://${candidate}` : `http://${candidate}:${port}`
  } else if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`
  }
  return candidate
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function sanitizeSecret(value) {
  if (!value) return null
  const trimmed = value.replace(/^"(.*)"$/, "$1").trim()
  if (!trimmed || trimmed.toLowerCase().includes("secure_random_secret")) {
    return null
  }
  return trimmed
}

async function promptForPublicUrl(candidates, defaultUrl, port) {
  if (!quietMode) {
    console.log("\nDetected addresses:")
    if (candidates.length === 0) {
      console.log("  (none detected, defaulting to localhost)")
    } else {
      candidates.forEach((url, index) => {
        console.log(`  [${index + 1}] ${url}`)
      })
      console.log("  [C] Enter custom host or URL")
    }
  }

  while (true) {
    const answer = await askQuestion(`Public URL for auth callbacks [${defaultUrl}]: `, defaultUrl)
    const trimmed = answer.trim()

    if (/^[0-9]+$/.test(trimmed)) {
      const index = Number.parseInt(trimmed, 10) - 1
      if (candidates[index]) {
        return candidates[index]
      }
      console.log("Select a valid option from the list or enter a custom value.")
      continue
    }

    if (/^c$/i.test(trimmed) && candidates.length > 0) {
      const customInput = await askQuestion("Enter custom host/IP or full URL: ", defaultUrl)
      const normalizedCustom = normalizePublicUrl(customInput, port)
      if (normalizedCustom) {
        return normalizedCustom
      }
      console.log("Please enter a valid HTTP/HTTPS URL.")
      continue
    }

    const normalized = normalizePublicUrl(trimmed, port)
    if (normalized) {
      return normalized
    }
    console.log("Please enter a valid HTTP/HTTPS URL.")
  }
}

main().catch((error) => {
  console.error(`\nSetup failed: ${error.message}`)
  process.exit(1)
})
