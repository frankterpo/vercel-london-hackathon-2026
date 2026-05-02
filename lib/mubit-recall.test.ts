import { describe, expect, it } from "vitest"
import { extractPriorCanvasSuggestions } from "./mubit-recall"

describe("extractPriorCanvasSuggestions", () => {
  it("reads canvas_id nested in metadata", () => {
    const raw = {
      memories: [
        {
          metadata: { canvas_id: "11111111-1111-4111-8111-111111111111", schema_version: 1 },
          content: "sprint retro board",
          score: 0.9,
        },
      ],
    }
    expect(extractPriorCanvasSuggestions(raw, "22222222-2222-4222-8222-222222222222")).toEqual([
      {
        canvasId: "11111111-1111-4111-8111-111111111111",
        content: "sprint retro board",
        score: 0.9,
      },
    ])
  })

  it("dedupes by canvasId and excludes current canvas", () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    const raw = {
      x: [{ canvas_id: id, similarity: 0.5 }],
      y: [{ canvas_id: id, similarity: 0.9 }],
    }
    expect(extractPriorCanvasSuggestions(raw, id)).toEqual([])
    expect(extractPriorCanvasSuggestions(raw, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")).toHaveLength(
      1
    )
    expect(
      extractPriorCanvasSuggestions(raw, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")[0]?.score
    ).toBe(0.9)
  })
})
