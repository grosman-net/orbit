#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { spawn } = require("node:child_process")
const dotenv = require("dotenv")

const envFiles = [".env.production", ".env.local"]
for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: true })
  }
}

const port = normalizePort(process.env.PORT) ?? 3333
process.env.PORT = String(port)

const child = spawn("next", ["start", "-p", String(port)], {
  stdio: "inherit",
  env: process.env,
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})

function normalizePort(value) {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

