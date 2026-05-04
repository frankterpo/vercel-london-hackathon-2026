import { generateText } from "ai"

/** One-shot check that Vercel AI Gateway + AI SDK accept a provider/model id string. */
const MODEL = "openai/gpt-5-mini" as const

export const dynamic = "force-dynamic"

export async function GET() {
  const { text } = await generateText({
    model: MODEL,
    prompt: "Respond with exactly two words: gateway ok",
  })
  return Response.json({ model: MODEL, text })
}

export async function POST(req: Request) {
  let prompt = "Reply with one word: pong"
  try {
    const body = (await req.json()) as { prompt?: unknown }
    if (typeof body.prompt === "string" && body.prompt.trim()) {
      prompt = body.prompt.trim()
    }
  } catch {
    // empty or non-JSON body → default prompt
  }

  const { text } = await generateText({
    model: MODEL,
    prompt,
  })
  return Response.json({ model: MODEL, text })
}
