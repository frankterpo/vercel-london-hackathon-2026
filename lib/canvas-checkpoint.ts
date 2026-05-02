import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { CheckpointBody } from "@/lib/canvas-schema"
import { normalizeDrawingSubject } from "@/lib/drawing-subjects"

function formatShapeStats(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([k, v]) => `${v}× ${k}`)
    .join(", ")
}

export function buildCheckpointPayloadFromElements(
  elements: readonly ExcalidrawElement[],
  canvasId: string,
  drawingSubjects?: string[]
): CheckpointBody {
  const shapes = elements.filter((e) => !e.isDeleted)
  const shapeStats: Record<string, number> = {}
  const texts: string[] = []

  for (const s of shapes) {
    shapeStats[s.type] = (shapeStats[s.type] ?? 0) + 1
    if (s.type === "text" && "text" in s && typeof (s as { text?: string }).text === "string") {
      const t = (s as { text: string }).text.trim()
      if (t) texts.push(t)
    }
  }

  const summary =
    texts.length > 0
      ? texts.slice(0, 32).join(" · ")
      : `Canvas (${shapes.length} elements — ${formatShapeStats(shapeStats)})`

  const body: CheckpointBody = {
    canvasId,
    summary: summary.slice(0, 8000),
    shapeStats,
    shapeCount: shapes.length,
  }

  if (drawingSubjects?.length) {
    const uniq = [
      ...new Set(drawingSubjects.map((x) => normalizeDrawingSubject(x)).filter(Boolean)),
    ].slice(0, 24)
    if (uniq.length > 0) body.drawingSubjects = uniq
  }

  return body
}
