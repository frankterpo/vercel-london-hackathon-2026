import { describe, expect, it } from "vitest"
import { resolveVercelDocumentationLinks } from "./resolve-vercel-documentation-links"

describe("resolveVercelDocumentationLinks", () => {
  it("maps deployment keyword to deployment-related URLs", () => {
    const links = resolveVercelDocumentationLinks("Why is my deployment stuck?", 8)
    expect(links.some((u) => u.includes("/docs/deployments/"))).toBe(true)
  })

  it("includes MCP doc path when query mentions mcp", () => {
    const links = resolveVercelDocumentationLinks("How do I ship MCP?", 12)
    expect(links.some((u) => u.includes("/docs/mcp/"))).toBe(true)
  })

  it("always caps at limit", () => {
    expect(resolveVercelDocumentationLinks("env domain build preview mcp deployment", 3)).toHaveLength(3)
  })

  it("includes canonical docs search for the trimmed query", () => {
    const q = "  edge config  "
    const links = resolveVercelDocumentationLinks(q, 20)
    expect(
      links.some((u) => u.includes("vercel.com/docs/search?q="))
    ).toBe(true)
  })
})
