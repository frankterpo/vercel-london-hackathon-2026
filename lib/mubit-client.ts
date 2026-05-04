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
  /** `auto` may pick gRPC (`@grpc/grpc-js`), which breaks in Next (null `fs.readFileSync`). Prefer HTTP in server routes. */
  const transport = (process.env.MUBIT_TRANSPORT as TransportMode) ?? "http"
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
