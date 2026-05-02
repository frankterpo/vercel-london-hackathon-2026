import { z } from "zod"
import { analyzeSketchPngBase64, coachVisionUsesDirectAnthropic } from "@/lib/canvas-coach-analyze"
import { fetchGoogleImageReferences } from "@/lib/brightdata-reference-images"
import { normalizeDrawingSubject, subjectsOverlap } from "@/lib/drawing-subjects"
import { getServerMubitClient } from "@/lib/mubit-client"
import { extractPriorCanvasSuggestions } from "@/lib/mubit-recall"
import { getTenantIdFromCookies } from "@/lib/tenant-server"

export const maxDuration = 120

const bodySchema = z.object({
  canvasId: z.string().uuid(),
  /** PNG data URL or raw base64 */
  imageBase64: z.string().min(20).max(9_500_000),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "validation_error", detail: parsed.error.flatten() }, { status: 400 })
  }

  const tenantId = await getTenantIdFromCookies()
  if (!tenantId) {
    return Response.json({ error: "missing_tenant" }, { status: 401 })
  }

  const { canvasId, imageBase64 } = parsed.data

  const { analysis, error: visionError } = await analyzeSketchPngBase64(imageBase64)

  const subjects = analysis.subjects
    .map((s) => normalizeDrawingSubject(s))
    .filter(Boolean)
  const uniqueSubjects = [...new Set(subjects)].slice(0, 16)

  const searchQuery =
    analysis.primarySubject?.trim() ||
    uniqueSubjects[0] ||
    "reference subject"

  const { hits: referenceImages, reason: brightReason } = await fetchGoogleImageReferences({
    query: `${searchQuery} photo`,
    limit: 6,
  })

  let priorSameSubject: {
    canvasId: string
    content?: string
    score?: number
    drawingSubjects?: string[]
  }[] = []

  const client = getServerMubitClient()
  if (client && uniqueSubjects.length > 0) {
    try {
      const raw = await client.recall({
        session_id: `tenant:${tenantId}`,
        query: `Whiteboard sketch checkpoints where the user drew: ${uniqueSubjects.join(", ")}.`,
        agent_id: "canvas-checkpoint",
        limit: 12,
        include_working_memory: true,
      })
      const all = extractPriorCanvasSuggestions(raw, canvasId)
      priorSameSubject = all
        .filter((s) => subjectsOverlap(uniqueSubjects, s.drawingSubjects))
        .slice(0, 5)
    } catch (e) {
      console.warn("[canvas/coach] recall failed:", e)
    }
  }

  return Response.json({
    analysis,
    referenceImages,
    referenceMeta: { brightReason: brightReason ?? null },
    priorSameSubject,
    visionError: visionError ?? null,
    visionTransport: coachVisionUsesDirectAnthropic() ? "anthropic" : "gateway",
  })
}
