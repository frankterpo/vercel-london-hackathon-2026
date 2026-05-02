"use client"

import { DrawingCoachHud } from "@/components/canvas/drawing-coach-hud"
import { buildCheckpointPayloadFromElements } from "@/lib/canvas-checkpoint"
import {
  canvasSceneStorageKey,
  loadCanvasScene,
  saveCanvasScene,
} from "@/lib/canvas-scene-storage"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import type { BinaryFiles } from "@excalidraw/excalidraw/types"
import type { AppState } from "@excalidraw/excalidraw/types"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { Excalidraw } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { useCallback, useMemo, useRef } from "react"

type ExcalidrawInnerProps = {
  canvasId: string
  persistenceKey: string
}

async function postCheckpoint(
  elements: readonly ExcalidrawElement[],
  canvasId: string,
  coachSubjectsRef: { current: string[] }
) {
  const subjects = coachSubjectsRef.current
  const payload = buildCheckpointPayloadFromElements(elements, canvasId, subjects.length > 0 ? subjects : undefined)
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

export function ExcalidrawInner({ canvasId, persistenceKey }: ExcalidrawInnerProps) {
  const coachSubjectsRef = useRef<string[]>([])
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const storageKey = canvasSceneStorageKey(persistenceKey)
  const initialData = useMemo(() => loadCanvasScene(storageKey), [storageKey])
  const debounceCheckpoint = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const debouncePersist = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const scheduleCheckpoint = useCallback(
    (elements: readonly OrderedExcalidrawElement[]) => {
      const t = debounceCheckpoint.current
      if (t !== undefined) clearTimeout(t)
      debounceCheckpoint.current = setTimeout(() => {
        void postCheckpoint(elements, canvasId, coachSubjectsRef)
      }, 9000)
    },
    [canvasId]
  )

  const schedulePersist = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      const t = debouncePersist.current
      if (t !== undefined) clearTimeout(t)
      debouncePersist.current = setTimeout(() => {
        saveCanvasScene(storageKey, elements, appState, files)
      }, 450)
    },
    [storageKey]
  )

  const onChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      schedulePersist(elements, appState, files)
      scheduleCheckpoint(elements)
    },
    [scheduleCheckpoint, schedulePersist]
  )

  const onApiReady = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api
      queueMicrotask(() => {
        const els = api.getSceneElements()
        void postCheckpoint(els, canvasId, coachSubjectsRef)
      })
    },
    [canvasId]
  )

  return (
    <div className="relative h-full min-h-[320px] w-full [&_.excalidraw]:h-full [&_.excalidraw-modal-container]:z-[210]">
      <DrawingCoachHud
        canvasId={canvasId}
        subjectsRef={coachSubjectsRef}
        excalidrawApiRef={apiRef}
      />
      <Excalidraw
        initialData={initialData ?? undefined}
        excalidrawAPI={onApiReady}
        onChange={onChange}
      />
    </div>
  )
}
