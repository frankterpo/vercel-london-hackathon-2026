import type { BinaryFiles } from "@excalidraw/excalidraw/types"
import type { AppState } from "@excalidraw/excalidraw/types"
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types"
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"

const PREFIX = "excal-scene:v1:"

export function canvasSceneStorageKey(persistenceKey: string): string {
  return `${PREFIX}${persistenceKey}`
}

export function loadCanvasScene(storageKey: string): ExcalidrawInitialDataState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      elements?: readonly OrderedExcalidrawElement[]
      appState?: Partial<AppState>
      files?: BinaryFiles
    }
    return {
      elements: [...(parsed.elements ?? [])],
      appState: parsed.appState,
      files: parsed.files ?? {},
    }
  } catch {
    return null
  }
}

export function saveCanvasScene(
  storageKey: string,
  elements: readonly OrderedExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles
): void {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        elements,
        appState: {
          theme: appState.theme,
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
      })
    )
  } catch (e) {
    console.warn("[canvas] persist scene failed:", e)
  }
}
