import { createMcpHandler } from "mcp-handler"
import { z } from "zod"

import { resolveVercelDocumentationLinks } from "@/lib/resolve-vercel-documentation-links"

export const maxDuration = 60

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "search_documentation",
      {
        description:
          "Suggested Vercel documentation URLs keyed off common keywords in the user's question plus the canonical docs search link. Uses heuristics, not live search — pair with REST tools for factual deployment data.",
        inputSchema: {
          query: z
            .string()
            .min(2)
            .describe("Natural language question or topic"),
          limit: z
            .number()
            .min(1)
            .max(10)
            .optional()
            .describe("Max heuristic links (default 8)"),
        },
      },
      async ({ query, limit }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              links: resolveVercelDocumentationLinks(query, limit ?? 8),
              docsSearchUrl: `https://vercel.com/docs/search?q=${encodeURIComponent(query.trim())}`,
            }),
          },
        ],
      })
    )
  },
  {
    serverInfo: { name: "ship-check-copilot", version: "0.1.0" },
  },
  {
    basePath: "/api",
    disableSse: true,
  }
)

export async function POST(request: Request) {
  return handler(request)
}

export async function GET(request: Request) {
  return handler(request)
}
