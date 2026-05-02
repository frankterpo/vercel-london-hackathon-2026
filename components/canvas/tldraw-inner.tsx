"use client"

import type { CheckpointBody } from "@/lib/canvas-schema"
import { useCallback } from "react"
import type { Editor, TLShape, TLRichText } from "tldraw"
import { Tldraw, renderPlaintextFromRichText } from "tldraw"
import "tldraw/tldraw.css"

type TldrawInnerProps = {
  canvasId: string
  persistenceKey: string
}

export function buildCheckpointPayload(editor: Editor, canvasId: string): CheckpointBody {
  const shapes = editor.getCurrentPageShapes()
  const shapeStats: Record<string, number> = {}
  const texts: string[] = []

  for (const s of shapes as TLShape[]) {
    shapeStats[s.type] = (shapeStats[s.type] ?? 0) + 1
    if (s.type === "text") {
      const props = s.props as { richText?: TLRichText }
      const rt = props.richText
      if (!rt) continue
      const plain = renderPlaintextFromRichText(editor, rt).trim()
      if (plain) texts.push(plain)
    }
  }

  const summary =
    texts.length > 0
      ? texts.slice(0, 32).join(" · ")
      : `Canvas (${shapes.length} shapes — ${formatShapeStats(shapeStats)})`

  return {
    canvasId,
    summary: summary.slice(0, 8000),
    shapeStats,
    shapeCount: shapes.length,
  }
}

function formatShapeStats(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([k, v]) => `${v}× ${k}`)
    .join(", ")
}

async function postCheckpoint(editor: Editor, canvasId: string) {
  const payload = buildCheckpointPayload(editor, canvasId)
  try {
    await fetch("/api/canvas/checkpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn("[canvas] checkpoint network error:", e)
  }
}

export function TldrawInner({ canvasId, persistenceKey }: TldrawInnerProps) {
  const onMount = useCallback(
    (editor: Editor) => {
      let timeout: ReturnType<typeof setTimeout> | undefined
      const schedule = () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          void postCheckpoint(editor, canvasId)
        }, 9000)
      }
      const unsub = editor.store.listen(() => {
        schedule()
      })
      queueMicrotask(() => {
        void postCheckpoint(editor, canvasId)
      })
      return () => {
        unsub()
        clearTimeout(timeout)
      }
    },
    [canvasId]
  )

  return (
    <div className="h-full min-h-[320px] w-full">
      <Tldraw persistenceKey={persistenceKey} onMount={onMount} />
    </div>
  )
}
