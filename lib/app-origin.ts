/**
 * Public origin for same-deployment HTTP MCP calls during chat streaming.
 */

export function getAppOrigin(): string {
  const explicit = process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL
  if (explicit) {
    const u = explicit.replace(/\/$/, "")
    return u.startsWith("http") ? u : `https://${u}`
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }

  const port = process.env.PORT ?? "3000"
  return `http://localhost:${port}`
}
