import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type ToolSet,
} from "ai"
import { vercelTools } from "@/lib/tools"
import { SYSTEM_PROMPT } from "@/lib/system-prompt"
import type { CopilotMessage } from "@/lib/copilot-message"
import { mergeLocalDocumentationMcp } from "@/lib/local-mcp-client"

export const maxDuration = 60

export type { CopilotMessage }

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: CopilotMessage[] }

  const localMcp = await mergeLocalDocumentationMcp()

  let teardownDone = false
  const teardownMcp = async () => {
    if (teardownDone) return
    teardownDone = true
    await localMcp?.close?.()
  }

  const tools = {
    ...vercelTools,
    ...localMcp?.tools,
  } satisfies ToolSet

  let result
  try {
    result = streamText({
      model: "anthropic/claude-sonnet-4",
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(8),
    })
  } catch (e) {
    await teardownMcp()
    throw e
  }

  void Promise.resolve(result.response).finally(teardownMcp)

  return result.toUIMessageStreamResponse()
}
