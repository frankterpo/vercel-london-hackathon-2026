import { afterEach, describe, expect, it } from "vitest"
import {
  resolveBrightDataCredentials,
  scrapeImageHitsFromBrightDataJson,
} from "./brightdata-reference-images"

describe("resolveBrightDataCredentials", () => {
  const orig = { ...process.env }

  afterEach(() => {
    process.env = { ...orig }
  })

  it("prefers BRIGHTDATA_ZONE, then unlocker, then SERP", () => {
    process.env.BRIGHTDATA_API_KEY = "key"
    process.env.BRIGHTDATA_ZONE = "z-main"
    process.env.BRIGHTDATA_UNLOCKER_ZONE = "z-unlock"
    process.env.BRIGHTDATA_SERP_ZONE = "z-serp"
    expect(resolveBrightDataCredentials()).toEqual({ apiKey: "key", zone: "z-main" })

    delete process.env.BRIGHTDATA_ZONE
    expect(resolveBrightDataCredentials().zone).toBe("z-unlock")

    delete process.env.BRIGHTDATA_UNLOCKER_ZONE
    expect(resolveBrightDataCredentials().zone).toBe("z-serp")
  })
})

describe("scrapeImageHitsFromBrightDataJson", () => {
  it("collects urls from SERP-ish nodes", () => {
    const sample = {
      organic: [
        {
          original_image: "https://example.com/full.jpg",
          image: "https://cdn.example/thumb.webp",
          title: "Puppy",
        },
      ],
      nested: { deep: [{ thumbnail: "https://x.invalid/t.png", title: "t" }] },
    }
    const hits = scrapeImageHitsFromBrightDataJson(sample)
    expect(hits.length).toBeGreaterThanOrEqual(2)
    expect(hits.some((h) => h.url.includes("example.com/full"))).toBe(true)
  })
})
