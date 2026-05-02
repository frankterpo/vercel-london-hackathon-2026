"use client"

import { useRouter } from "next/navigation"
import type { PriorCanvasSuggestion } from "@/lib/canvas-schema"

type PriorCanvasModalProps = {
  open: boolean
  suggestion: PriorCanvasSuggestion | null
  onDismissNew: () => void
}

export function PriorCanvasModal({ open, suggestion, onDismissNew }: PriorCanvasModalProps) {
  const router = useRouter()

  if (!open || !suggestion) return null

  const preview =
    suggestion.content?.trim().slice(0, 220) ??
    `Prior canvas (${suggestion.canvasId.slice(0, 8)}…)`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prior-canvas-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <h2 id="prior-canvas-title" className="text-sm font-semibold text-foreground">
          Similar workspace found
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          MuBit matched topic overlap with another canvas checkpoint. Continue there or keep this blank
          canvas.
        </p>
        <blockquote className="mt-3 rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          {preview}
        </blockquote>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            onClick={() => {
              router.push(`/canvas/${suggestion.canvasId}`)
            }}
          >
            Open previous canvas
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
            onClick={onDismissNew}
          >
            Start fresh here
          </button>
        </div>
      </div>
    </div>
  )
}
