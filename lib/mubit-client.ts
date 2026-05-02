import { Client } from "@mubit-ai/sdk"
import type { TransportMode } from "@mubit-ai/sdk"

let cached: Client | null | undefined

export function getServerMubitClient(): Client | null {
  if (cached !== undefined) return cached
  const apiKey = process.env.MUBIT_API_KEY?.trim()
  if (!apiKey) {
    cached = null
    return null
  }
  const transport = (process.env.MUBIT_TRANSPORT as TransportMode) ?? "auto"
  cached = new Client({
    api_key: apiKey,
    endpoint:
      process.env.MUBIT_ENDPOINT?.trim() ||
      process.env.MUBIT_HTTP_ENDPOINT?.trim() ||
      "https://api.mubit.ai",
    transport,
  })
  return cached
}
