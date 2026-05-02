#!/usr/bin/env node
/**
 * After `pnpm brightdata:login`, prints .env-style lines by reading Bright Data CLI
 * storage plus `brightdata config get` defaults.
 *
 * Does not write files. Copy output into `.env` (local) or Vercel env (prod).
 */

import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

function cliConfigGet(key) {
  const r = spawnSync("pnpm", ["exec", "--", "brightdata", "config", "get", key], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
  if (r.status !== 0) return ""
  return String(r.stdout || "").trim()
}

function brightdataConfigDir() {
  const plat = os.platform()
  if (plat === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "brightdata-cli")
  }
  if (plat === "win32") {
    const base = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming")
    return path.join(base, "brightdata-cli")
  }
  return path.join(os.homedir(), ".config", "brightdata-cli")
}

function readCredentialsApiKey() {
  const p = path.join(brightdataConfigDir(), "credentials.json")
  if (!fs.existsSync(p)) return ""
  try {
    const raw = fs.readFileSync(p, "utf8")
    const j = JSON.parse(raw)
    return (
      typeof j.apiKey === "string" ?
        j.apiKey
      : typeof j.api_key === "string" ? j.api_key
      : typeof j.token === "string" ? j.token
      : typeof j.key === "string" ? j.key
      : ""
    ).trim()
  } catch {
    return ""
  }
}

const apiKey = readCredentialsApiKey()
const unlockerZone = cliConfigGet("default_zone_unlocker") || "cli_unlocker"
const serpZone = cliConfigGet("default_zone_serp")

console.log("")
console.log("# Paste into .env (or Vercel). Same API key Bright Data CLI uses.")
console.log("")

if (!apiKey) {
  console.log("# No CLI credentials yet. Run:  pnpm brightdata:login")
  console.log("# Then run this script again.")
  console.log("")
  process.exitCode = 1
} else {
  console.log(`BRIGHTDATA_API_KEY=${JSON.stringify(apiKey)}`)
}

console.log(
  `# Web Unlocker zone for POST https://api.brightdata.com/request (drawing coach).\n` +
    `# After login the CLI usually auto-creates "cli_unlocker".\n` +
    `BRIGHTDATA_ZONE=${JSON.stringify(unlockerZone)}`
)

if (serpZone && serpZone !== unlockerZone) {
  console.log("")
  console.log("# Optional SERP-only zone from CLI (we prefer unlocker for raw Google URLs):")
  console.log(`# BRIGHTDATA_SERP_ZONE=${JSON.stringify(serpZone)}`)
}

console.log("")
console.log("# Sanity check zones:")
console.log("#   pnpm brightdata:zones")
console.log("")
