import type { PriorCanvasSuggestion } from "@/lib/canvas-schema"

/** Best-effort extraction: MuBit query responses vary by deployment/version. */
export function extractPriorCanvasSuggestions(
  raw: unknown,
  excludeCanvasId: string
): PriorCanvasSuggestion[] {
  const found: PriorCanvasSuggestion[] = []

  const visit = (node: unknown) => {
    if (node === null || node === undefined) return
    if (Array.isArray(node)) {
      for (const x of node) visit(x)
      return
    }
    if (typeof node !== "object") return

    const obj = node as Record<string, unknown>
    const canvasId = readCanvasId(obj)
    const content =
      typeof obj.content === "string"
        ? obj.content
        : typeof obj.text === "string"
          ? obj.text
          : undefined
    const score =
      typeof obj.score === "number"
        ? obj.score
        : typeof obj.similarity === "number"
          ? obj.similarity
          : typeof obj.rank === "number"
            ? obj.rank
            : undefined

    if (canvasId && canvasId !== excludeCanvasId) {
      found.push({ canvasId, content, score })
    }

    for (const v of Object.values(obj)) visit(v)
  }

  visit(raw)

  const byId = new Map<string, PriorCanvasSuggestion>()
  for (const hit of found) {
    const prev = byId.get(hit.canvasId)
    if (!prev || (hit.score ?? 0) > (prev.score ?? 0)) {
      byId.set(hit.canvasId, hit)
    }
  }

  return [...byId.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

function readCanvasId(obj: Record<string, unknown>): string | undefined {
  const meta = obj.metadata ?? obj.meta
  if (meta && typeof meta === "object") {
    const m = meta as Record<string, unknown>
    const id =
      typeof m.canvas_id === "string"
        ? m.canvas_id
        : typeof m.canvasId === "string"
          ? m.canvasId
          : undefined
    if (id) return id
  }
  const top =
    typeof obj.canvas_id === "string"
      ? obj.canvas_id
      : typeof obj.canvasId === "string"
        ? obj.canvasId
        : undefined
  return top
}
