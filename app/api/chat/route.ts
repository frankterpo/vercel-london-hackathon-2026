import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  UIMessage,
  InferUITools,
  UIDataTypes,
} from "ai"
import { vercelTools } from "@/lib/tools"
import { SYSTEM_PROMPT } from "@/lib/system-prompt"

export const maxDuration = 60

export type CopilotMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof vercelTools>
>

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: CopilotMessage[] }

  const result = streamText({
    model: "anthropic/claude-sonnet-4",
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: vercelTools,
    stopWhen: stepCountIs(8),
  })

  return result.toUIMessageStreamResponse()
}
