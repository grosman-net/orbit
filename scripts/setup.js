#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const readline = require("readline")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

async function main() {
  const projectRoot = path.resolve(__dirname, "..")
  const envPath = path.join(projectRoot, ".env.local")

  console.log("Orbit setup\n")

  const existingEnv = fs.existsSync(envPath) ? parseEnv(envPath) : {}

  const port = await promptForPort(existingEnv.PORT ?? "3333")

  const username = await askQuestion(
    `Admin username [${existingEnv.ORBIT_ADMIN_USERNAME ?? "admin"}]: `,
    existingEnv.ORBIT_ADMIN_USERNAME ?? "admin",
  )

  let passwordHash = existingEnv.ORBIT_ADMIN_PASSWORD_HASH
  if (!passwordHash) {
    passwordHash = await promptForPassword()
  } else if (await confirm("Reuse existing admin password? [Y/n]: ", true)) {
    console.log("Keeping existing password hash")
  } else {
    passwordHash = await promptForPassword()
  }

  const nextAuthSecret =
    existingEnv.NEXTAUTH_SECRET && (await confirm("Reuse existing NEXTAUTH_SECRET? [Y/n]: ", true))
      ? existingEnv.NEXTAUTH_SECRET
      : crypto.randomBytes(32).toString("hex")

  const defaultUrl = existingEnv.NEXTAUTH_URL ?? `http://localhost:${port}`
  const nextAuthUrl = normalizePublicUrl(
    await askQuestion(`Public URL for auth callbacks [${defaultUrl}]: `, defaultUrl),
    port,
  )

  const envContent = formatEnv({
    PORT: port,
    NEXTAUTH_URL: nextAuthUrl,
    NEXTAUTH_SECRET: nextAuthSecret,
    ORBIT_ADMIN_USERNAME: username,
    ORBIT_ADMIN_PASSWORD_HASH: passwordHash,
  })

  fs.writeFileSync(envPath, envContent, { encoding: "utf8" })

  console.log(`\nSaved configuration to ${envPath}`)
  console.log(`- HTTP port: ${port}`)
  console.log(`- Admin user: ${username}`)
  console.log("\nNext steps:")
  console.log(" 1. pnpm install")
  console.log(" 2. pnpm build")
  console.log(" 3. pnpm start")
  console.log("\nUpdate the generated .env.local if you need to change values later.")
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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const suffix = defaultYes ? "[Y/n]" : "[y/N]"
  const answer = await new Promise((resolve) => rl.question(`${prompt.replace(/\s*\[.*\]\s*$/, "")} ${suffix} `, resolve))
  rl.close()
  const normalized = answer.trim().toLowerCase()
  if (!normalized) {
    return defaultYes
  }
  return ["y", "yes"].includes(normalized)
}

async function promptForPassword() {
  const password = await askHidden("Admin password (input hidden): ")
  if (!password) {
    throw new Error("Password cannot be empty.")
  }
  const confirmPassword = await askHidden("Confirm password (input hidden): ")
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match. Run setup again.")
  }
  return await bcrypt.hash(password, 12)
}

async function askHidden(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  const answer = await new Promise((resolve) => {
    const stdin = process.stdin
    const onData = (char) => {
      char = char.toString()
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.removeListener("data", onData)
          break
        default:
          process.stdout.write("*")
          break
      }
    }

    stdin.on("data", onData)

    rl.question(prompt, (value) => {
      stdin.removeListener("data", onData)
      process.stdout.write("\n")
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

function normalizePublicUrl(value, port) {
  let candidate = value.trim()
  if (!candidate) {
    candidate = `http://localhost:${port}`
  }
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`
  }
  return candidate
}

main().catch((error) => {
  console.error(`\nSetup failed: ${error.message}`)
  process.exit(1)
})

