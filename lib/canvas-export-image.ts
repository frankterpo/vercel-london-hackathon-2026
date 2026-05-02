import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import { exportToBlob, getNonDeletedElements, MIME_TYPES } from "@excalidraw/excalidraw"

export async function excalidrawSceneToDataUrl(api: ExcalidrawImperativeAPI): Promise<string | null> {
  const elements = api.getSceneElements()
  const visible = getNonDeletedElements(elements)
  if (visible.length === 0) return null
  const appState = api.getAppState()
  const files = api.getFiles()
  const blob = await exportToBlob({
    elements: visible,
    appState: {
      ...appState,
      exportBackground: true,
      exportEmbedScene: false,
    },
    files,
    mimeType: MIME_TYPES.png,
    exportPadding: 24,
    maxWidthOrHeight: 1280,
  })
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(String(r.result ?? ""))
    r.onerror = () => reject(r.error ?? new Error("read failed"))
    r.readAsDataURL(blob)
  })
}
