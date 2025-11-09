import { execFile as execFileCallback, ExecFileOptions } from "node:child_process"
import { promisify } from "node:util"

const execFile = promisify(execFileCallback)

type CommandResult = {
  stdout: string
  stderr: string
}

export class CommandError extends Error {
  public readonly code?: number | string
  public readonly stderr: string

  constructor(message: string, stderr: string, code?: number | string) {
    super(message)
    this.name = "CommandError"
    this.stderr = stderr
    this.code = code
  }
}

export interface RunCommandOptions extends ExecFileOptions {
  requireRoot?: boolean
  timeoutMs?: number
}

const DEFAULT_TIMEOUT = 30_000

export async function runCommand(
  rawCommand: string,
  args: string[] = [],
  options: RunCommandOptions = {},
): Promise<CommandResult> {
  const { requireRoot, timeoutMs, ...execOptions } = options
  const command = normalizeCommand(rawCommand, requireRoot === true)

  try {
    const result = await execFile(command.binary, [...command.args, ...args], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs ?? DEFAULT_TIMEOUT,
      ...execOptions,
    })

    return {
      stdout: result.stdout?.toString() ?? "",
      stderr: result.stderr?.toString() ?? "",
    }
  } catch (error: unknown) {
    if (isExecFileError(error)) {
      const stdout = error.stdout?.toString() ?? ""
      const stderr = error.stderr?.toString() ?? ""
      const message = stderr || stdout || error.message
      throw new CommandError(message, stderr, error.code)
    }
    throw error
  }
}

interface NormalizedCommand {
  binary: string
  args: string[]
}

function normalizeCommand(command: string, requireRoot: boolean): NormalizedCommand {
  if (!requireRoot) {
    return { binary: command, args: [] }
  }

  const isRoot = typeof process.geteuid === "function" ? process.geteuid() === 0 : false

  if (isRoot) {
    return { binary: command, args: [] }
  }

  return {
    binary: "sudo",
    args: ["-n", command],
  }
}

interface ExecFileError extends Error {
  code?: string | number
  stdout?: Buffer | string
  stderr?: Buffer | string
}

function isExecFileError(error: unknown): error is ExecFileError {
  return typeof error === "object" && error !== null && "stderr" in error
}


