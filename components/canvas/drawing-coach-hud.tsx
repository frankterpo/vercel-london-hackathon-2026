"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import type { MutableRefObject } from "react"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import { excalidrawSceneToDataUrl } from "@/lib/canvas-export-image"

type CoachResponse = {
  analysis: {
    subjects: string[]
    primarySubject: string | null
    drawingTips: string[]
    encouragement: string
    confidence: string
  }
  referenceImages: { url: string; thumbnailUrl?: string; title?: string }[]
  referenceMeta: { brightReason: string | null }
  priorSameSubject: {
    canvasId: string
    content?: string
    drawingSubjects?: string[]
  }[]
  visionError?: string | null
  /** Where vision runs: Anthropic API vs Vercel AI Gateway (needs team billing/card for many setups). */
  visionTransport?: "anthropic" | "gateway"
  error?: string
}

type DrawingCoachHudProps = {
  canvasId: string
  subjectsRef: MutableRefObject<string[]>
  excalidrawApiRef: MutableRefObject<ExcalidrawImperativeAPI | null>
}

export function DrawingCoachHud({ canvasId, subjectsRef, excalidrawApiRef }: DrawingCoachHudProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [coach, setCoach] = useState<CoachResponse | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const analyze = useCallback(async () => {
    setBusy(true)
    setLocalError(null)
    try {
      const api = excalidrawApiRef.current
      if (!api) {
        setLocalError("Canvas is still loading. Try again.")
        return
      }

      const strokes = api.getSceneElements().filter((e) => !e.isDeleted)
      if (strokes.length === 0) {
        setLocalError("Sketch something first, then analyze.")
        return
      }

      const dataUrl = await excalidrawSceneToDataUrl(api)
      if (!dataUrl) {
        setLocalError("Could not export the canvas.")
        return
      }
      const res = await fetch("/api/canvas/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ canvasId, imageBase64: dataUrl }),
      })

      const json = (await res.json()) as CoachResponse & { detail?: unknown }
      if (!res.ok) {
        const msg =
          typeof json.error === "string"
            ? json.error
            : `Coach failed (${res.status})`
        setLocalError(msg)
        return
      }

      setCoach(json)
      const next = [...(json.analysis?.subjects ?? [])]
        .map((s) => s.trim())
        .filter(Boolean)
      subjectsRef.current = [...new Set(next)]
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Coach failed")
    } finally {
      setBusy(false)
    }
  }, [canvasId, excalidrawApiRef, subjectsRef])

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto fixed right-4 top-[4.75rem] z-[200] rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-md hover:bg-secondary"
      >
        Drawing coach
      </button>
    )
  }

  return (
    <div className="pointer-events-auto fixed right-4 top-[4.75rem] z-[200] flex max-h-[calc(100dvh-7rem)] w-[min(100vw-2rem,340px)] flex-col overflow-hidden rounded-xl border border-border bg-card/98 text-xs shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-semibold text-foreground">Drawing coach</span>
        <button
          type="button"
          className="text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(true)}
        >
          Hide
        </button>
      </div>

      <div className="overflow-y-auto p-3 space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          Snapshots your strokes, guesses the subject, fetches reference photos when Bright Data is
          configured, and checks MuBit for similar past canvases.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => void analyze()}
          className="w-full rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Analyzing…" : "Analyze sketch"}
        </button>

        {localError ?
          <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive">{localError}</p>
        : null}

        {coach?.visionError ?
          <div
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-amber-950 dark:text-amber-50"
            role="alert"
          >
            <p className="text-[11px] font-semibold text-foreground">Vision API</p>
            <p className="mt-1 break-words font-mono text-[10px] leading-snug">{coach.visionError}</p>
          </div>
        : null}

        {coach && coach.referenceImages.length === 0 && coach.referenceMeta.brightReason ?
          <p className="text-[11px] text-muted-foreground">
            {coach.referenceMeta.brightReason === "brightdata_unconfigured" ?
              "Reference photos: run `pnpm brightdata:login` then `pnpm brightdata:print-env`, paste into .env (or set BRIGHTDATA_* in Vercel). Keys: see .env.example."
            : coach.referenceMeta.brightReason === "skipped_vision_unavailable" ?
              "Reference photos skipped until vision runs: enable AI Gateway billing or set ANTHROPIC_API_KEY on the deployment."
            : coach.referenceMeta.brightReason === "skipped_no_subject" ?
              "Reference photos skipped: no searchable subject detected yet — add clearer strokes, then Analyze again."
            : `No reference images (${coach.referenceMeta.brightReason}).`}
          </p>
        : null}

        {coach?.analysis ?
          <div className="space-y-2">
            {coach.analysis.subjects.length > 0 ?
              <div>
                <p className="font-medium text-foreground">Looks like</p>
                <p className="text-muted-foreground">{coach.analysis.subjects.join(", ")}</p>
              </div>
            : null}

            <p className="text-muted-foreground">{coach.analysis.encouragement}</p>

            {coach.analysis.drawingTips.length > 0 ?
              <div>
                <p className="font-medium text-foreground">Tips</p>
                <ul className="list-disc pl-4 text-muted-foreground">
                  {coach.analysis.drawingTips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            : null}

            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              confidence: {coach.analysis.confidence}
            </p>
          </div>
        : null}

        {coach?.referenceImages && coach.referenceImages.length > 0 ?
          <div>
            <p className="mb-2 font-medium text-foreground">Reference photos</p>
            <div className="grid grid-cols-2 gap-2">
              {coach.referenceImages.slice(0, 4).map((im, i) => (
                <img
                  key={`${im.url}-${i}`}
                  src={im.thumbnailUrl || im.url}
                  alt={im.title || "reference"}
                  className="h-20 w-full rounded-md border border-border object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        : null}

        {coach?.priorSameSubject && coach.priorSameSubject.length > 0 ?
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
            <p className="font-medium text-foreground">You sketched similar things before</p>
            <ul className="mt-2 space-y-2">
              {coach.priorSameSubject.map((p) => (
                <li key={p.canvasId} className="text-muted-foreground">
                  <Link
                    href={`/canvas/${p.canvasId}`}
                    className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
                  >
                    Open earlier canvas
                  </Link>
                  <span className="block font-mono text-[10px] opacity-70">
                    {p.drawingSubjects?.length ? p.drawingSubjects.join(" · ") : p.content ?? p.canvasId}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        : null}
      </div>
    </div>
  )
}
