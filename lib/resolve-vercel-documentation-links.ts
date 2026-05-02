/** Keyword → canonical Vercel doc paths used by the app MCP docs helper. */

const DOC_TOPICS: Record<string, readonly string[]> = {
  env: ["/docs/environment-variables", "/docs/projects/environment-variables"],
  deployment: [
    "/docs/deployments/overview",
    "/docs/concepts/deployments/overview",
    "/docs/rest-api/endpoints/deployments",
  ],
  domain: [
    "/docs/domains/overview",
    "/docs/getting-started/domains",
  ],
  mcp: ["/docs/mcp/deploy-mcp-servers-to-vercel", "/changelog"],
  build: [
    "/docs/builds/overview",
    "/docs/deployments/logs",
    "/docs/errors",
  ],
  preview: ["/docs/deployments/automatic-branch-deployments"],
}

export function resolveVercelDocumentationLinks(
  query: string,
  limit = 8
): readonly string[] {
  const q = query.toLowerCase()
  const out = new Set<string>()

  for (const [key, paths] of Object.entries(DOC_TOPICS)) {
    if (q.includes(key)) {
      for (const p of paths) {
        out.add(`https://vercel.com${p}`)
      }
    }
  }

  out.add(
    `https://vercel.com/docs/search?q=${encodeURIComponent(query.trim())}`
  )

  return Array.from(out).slice(0, limit)
}
