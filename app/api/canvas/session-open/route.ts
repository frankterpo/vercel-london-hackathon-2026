import { sessionOpenBodySchema } from "@/lib/canvas-schema"
import { getServerMubitClient } from "@/lib/mubit-client"
import { extractPriorCanvasSuggestions } from "@/lib/mubit-recall"
import { getTenantIdFromCookies } from "@/lib/tenant-server"

const DEFAULT_TOPIC_QUERY =
  "Prior whiteboard or canvas about deployments, ship checks, Vercel, or sprint planning."

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = sessionOpenBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "validation_error", detail: parsed.error.flatten() }, { status: 400 })
  }

  const tenantId = await getTenantIdFromCookies()
  if (!tenantId) {
    return Response.json({ degraded: true, suggestions: [], reason: "missing_tenant" })
  }

  const { canvasId, topicHint } = parsed.data

  const client = getServerMubitClient()
  if (!client) {
    return Response.json({ degraded: true, suggestions: [], reason: "mubit_unconfigured" })
  }

  const query =
    topicHint?.trim()?.length ?
      `${topicHint.trim()} — Related prior canvas checkpoints.`
    : DEFAULT_TOPIC_QUERY

  try {
    const raw = await client.recall({
      session_id: `tenant:${tenantId}`,
      query,
      agent_id: "canvas-checkpoint",
      limit: 8,
      include_working_memory: true,
    })
    const suggestions = extractPriorCanvasSuggestions(raw, canvasId).slice(0, 3)
    return Response.json({ degraded: false, suggestions })
  } catch (e) {
    console.warn("[canvas/session-open] MuBit recall failed:", e)
    return Response.json({
      degraded: true,
      suggestions: [],
      reason: "mubit_error",
    })
  }
}
