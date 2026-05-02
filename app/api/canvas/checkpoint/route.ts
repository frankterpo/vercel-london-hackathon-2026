import { CHECKPOINT_SCHEMA_V, checkpointBodySchema } from "@/lib/canvas-schema"
import { getServerMubitClient } from "@/lib/mubit-client"
import { getTenantIdFromCookies } from "@/lib/tenant-server"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = checkpointBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "validation_error", detail: parsed.error.flatten() }, { status: 400 })
  }

  const tenantId = await getTenantIdFromCookies()
  if (!tenantId) {
    return Response.json({ error: "missing_tenant" }, { status: 401 })
  }

  const client = getServerMubitClient()
  if (!client) {
    return Response.json({ ok: true, persisted: false, reason: "mubit_unconfigured" })
  }

  const { canvasId, summary, shapeStats, shapeCount, topicTags } = parsed.data

  try {
    await client.remember({
      session_id: `tenant:${tenantId}`,
      agent_id: "canvas-checkpoint",
      user_id: tenantId,
      content: summary,
      intent: "canvas_checkpoint",
      content_type: "canvas_checkpoint",
      metadata: {
        canvas_id: canvasId,
        schema_version: CHECKPOINT_SCHEMA_V,
        shape_stats: shapeStats ?? {},
        shape_count: shapeCount ?? null,
        topic_tags: topicTags ?? [],
      },
      upsert_key: `canvas_cp:${tenantId}:${canvasId}`,
    })
    return Response.json({ ok: true, persisted: true })
  } catch (e) {
    console.warn("[canvas/checkpoint] MuBit remember failed:", e)
    return Response.json({ ok: false, persisted: false, reason: "mubit_error" }, { status: 502 })
  }
}
