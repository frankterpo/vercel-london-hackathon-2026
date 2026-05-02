import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"
import type { ToolSet } from "ai"

import { getAppOrigin } from "@/lib/app-origin"

export type LocalMcpMerge = {
  tools: ToolSet
  close: () => Promise<void>
}

/** Load in-process MCP over HTTP Streamable POST to `/api/mcp` (OAuth-free). */
export async function mergeLocalDocumentationMcp(): Promise<
  LocalMcpMerge | undefined
> {
  if (process.env.VERCEL_DISABLE_LOCAL_MCP === "true") {
    return undefined
  }

  let client: MCPClient | undefined
  try {
    const origin = getAppOrigin()
    client = await createMCPClient({
      transport: {
        type: "http",
        url: `${origin}/api/mcp`,
      },
      name: "ship-check-copilot-internal",
      version: "0.1.0",
    })
    const fromMcp = await client.tools()

    const search_documentation =
      "search_documentation" in fromMcp
        ? fromMcp.search_documentation
        : undefined

    if (!search_documentation) {
      await client.close().catch(() => {})
      return undefined
    }

    let closed = false
    const close = async () => {
      if (closed) return
      closed = true
      await client?.close().catch(() => {})
    }

    const tools = {
      search_documentation,
    } as ToolSet

    return { tools, close }
  } catch (err) {
    console.warn("[mergeLocalDocumentationMcp] skipped:", err)
    await client?.close().catch(() => {})
    return undefined
  }
}
