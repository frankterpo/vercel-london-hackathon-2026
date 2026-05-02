import { describe, expect, it } from "vitest"
import { normalizeDrawingSubject, subjectsOverlap } from "./drawing-subjects"

describe("drawing subjects", () => {
  it("normalizes casing and whitespace", () => {
    expect(normalizeDrawingSubject("  Golden DOG \n")).toBe("golden dog")
  })

  it("detects overlap on exact normalized match", () => {
    expect(subjectsOverlap(["Dog"], ["dog"])).toBe(true)
  })

  it("detects substring overlap", () => {
    expect(subjectsOverlap(["dog"], ["golden retriever dog"])).toBe(true)
  })

  it("returns false when disjoint", () => {
    expect(subjectsOverlap(["cat"], ["dog", "house"])).toBe(false)
  })
})
