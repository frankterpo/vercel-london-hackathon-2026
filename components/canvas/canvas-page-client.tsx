"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { PriorCanvasSuggestion } from "@/lib/canvas-schema"
import { PriorCanvasModal } from "@/components/canvas/prior-canvas-modal"

const ExcalidrawInner = dynamic(
  () => import("@/components/canvas/excalidraw-inner").then((m) => m.ExcalidrawInner),
  { ssr: false, loading: () => <CanvasLoading /> }
)

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground">
      Loading canvas…
    </div>
  )
}

type CanvasPageClientProps = {
  canvasId: string
}

function recallStorageKey(canvasId: string) {
  return `sc_canvas_recall_dismiss:${canvasId}`
}

export function CanvasPageClient({ canvasId }: CanvasPageClientProps) {
  const params = useSearchParams()
  const topicHint = params.get("topic") ?? undefined
  const forcedNew = params.get("new") === "1"

  const persistenceKey = useMemo(() => `sc-canvas-${canvasId}`, [canvasId])

  const [suggestion, setSuggestion] = useState<PriorCanvasSuggestion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (forcedNew) return

    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(recallStorageKey(canvasId))) {
        return
      }
    } catch {
      /* ignore storage */
    }

    let canceled = false
    ;(async () => {
      try {
        const res = await fetch("/api/canvas/session-open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ canvasId, topicHint }),
        })
        const data = (await res.json()) as {
          degraded?: boolean
          suggestions?: PriorCanvasSuggestion[]
        }
        if (canceled) return
        const best = data.suggestions?.length ? data.suggestions[0] : null
        if (best) {
          setSuggestion(best)
          setModalOpen(true)
        }
      } catch {
        /* fail open */
      }
    })()

    return () => {
      canceled = true
    }
  }, [canvasId, topicHint, forcedNew])

  const dismissNew = () => {
    try {
      sessionStorage.setItem(recallStorageKey(canvasId), "1")
    } catch {
      /* ignore */
    }
    setModalOpen(false)
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="min-h-0 flex-1">
        <ExcalidrawInner canvasId={canvasId} persistenceKey={persistenceKey} />
      </div>

      <PriorCanvasModal open={modalOpen} suggestion={suggestion} onDismissNew={dismissNew} />
    </div>
  )
}
