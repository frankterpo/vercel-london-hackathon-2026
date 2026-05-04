import { describe, expect, it } from "vitest"
import { drawingTipsForVisionError } from "./canvas-coach-analyze"

describe("drawingTipsForVisionError", () => {
  it("returns no duplicate tips when gateway asks for card (banner carries the links)", () => {
    const tips = drawingTipsForVisionError(
      "AI Gateway requires a valid credit card on file to service requests."
    )
    expect(tips).toHaveLength(0)
  })

  it("falls back without blaming contrast alone", () => {
    const tips = drawingTipsForVisionError("Unknown network failure")
    expect(tips.some((t) => t.toLowerCase().includes("contrast"))).toBe(false)
    expect(tips.some((t) => t.includes("Vision API panel above"))).toBe(true)
  })
})
