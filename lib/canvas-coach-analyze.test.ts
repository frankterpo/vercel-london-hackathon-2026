import { describe, expect, it } from "vitest"
import { drawingTipsForVisionError } from "./canvas-coach-analyze"

describe("drawingTipsForVisionError", () => {
  it("mentions billing when gateway asks for card", () => {
    const tips = drawingTipsForVisionError(
      "AI Gateway requires a valid credit card on file to service requests."
    )
    expect(tips[0]).toMatch(/AI Gateway/)
    expect(tips[0]).toMatch(/billing/i)
  })

  it("falls back without blaming contrast alone", () => {
    const tips = drawingTipsForVisionError("Unknown network failure")
    expect(tips.some((t) => t.toLowerCase().includes("contrast"))).toBe(false)
    expect(tips.some((t) => t.includes("Vision note"))).toBe(true)
  })
})
