import { Suspense } from "react"
import { CanvasPageClient } from "@/components/canvas/canvas-page-client"

type PageProps = {
  params: Promise<{ canvasId: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function CanvasPage({ params }: PageProps) {
  const { canvasId } = await params
  if (!UUID_RE.test(canvasId)) {
    return (
      <div className="flex h-dvh items-center justify-center p-6 text-sm text-muted-foreground">
        Invalid canvas id (expected UUID).
      </div>
    )
  }
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center text-xs font-mono text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CanvasPageClient canvasId={canvasId} />
    </Suspense>
  )
}
