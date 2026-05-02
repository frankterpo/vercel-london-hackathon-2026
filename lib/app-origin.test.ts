import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getAppOrigin } from "./app-origin"

describe("getAppOrigin", () => {
  const env = { ...process.env }

  beforeEach(() => {
    vi.stubEnv("APP_ORIGIN", "")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
    vi.stubEnv("VERCEL_URL", "")
    vi.stubEnv("PORT", "")
    delete process.env.APP_ORIGIN
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.VERCEL_URL
    delete process.env.PORT
  })

  afterEach(() => {
    process.env = { ...env }
    vi.unstubAllEnvs()
  })

  it("prefers APP_ORIGIN when set", () => {
    vi.stubEnv("APP_ORIGIN", "https://custom.example/v1/")
    vi.stubEnv("VERCEL_URL", "ignore.vercel.app")
    expect(getAppOrigin()).toBe("https://custom.example/v1")
  })

  it("prepends https for APP_ORIGIN without scheme", () => {
    vi.stubEnv("APP_ORIGIN", "my.app")
    expect(getAppOrigin()).toBe("https://my.app")
  })

  it("uses NEXT_PUBLIC_APP_URL when APP_ORIGIN missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://prod.example")
    expect(getAppOrigin()).toBe("https://prod.example")
  })

  it("uses https + VERCEL_URL when no explicit URL", () => {
    vi.stubEnv("VERCEL_URL", "app-xyz.vercel.app")
    expect(getAppOrigin()).toBe("https://app-xyz.vercel.app")
  })

  it("strips protocol from VERCEL_URL if present", () => {
    vi.stubEnv("VERCEL_URL", "https://app-xyz.vercel.app/")
    expect(getAppOrigin()).toBe("https://app-xyz.vercel.app")
  })

  it("falls back to localhost with PORT default 3000", () => {
    expect(getAppOrigin()).toBe("http://localhost:3000")
  })

  it("respects PORT for localhost fallback", () => {
    vi.stubEnv("PORT", "4001")
    expect(getAppOrigin()).toBe("http://localhost:4001")
  })
})
