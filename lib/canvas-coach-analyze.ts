import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { z } from "zod"

const coachSchema = z.object({
  subjects: z
    .array(z.string().max(80))
    .max(12)
    .describe("Concrete nouns the sketch is trying to depict, e.g. dog, house, tree"),
  primarySubject: z
    .string()
    .max(120)
    .nullable()
    .describe("Best single label for image search, or null if blank/abstract"),
  drawingTips: z
    .array(z.string().max(400))
    .max(6)
    .describe("Short practical tips to improve the drawing"),
  encouragement: z.string().max(500),
  confidence: z.enum(["low", "medium", "high"]),
})

export type DrawingCoachAnalysis = z.infer<typeof coachSchema>

/** Sonnet-class model with vision; override via DRAWING_COACH_ANTHROPIC_MODEL if Anthropic renames snapshots. */
const DEFAULT_ANTHROPIC_VISION_MODEL = "claude-sonnet-4-20250514"
const GATEWAY_VISION_MODEL = "anthropic/claude-sonnet-4"

const SYSTEM = `You are a supportive drawing coach. Look at the rough whiteboard/sketch image.
Identify what the artist is most likely trying to draw (real-world objects, animals, people, plants, vehicles, buildings).
If the canvas is empty or only abstract squiggles, return low confidence, empty or generic subjects, and tips about blocking in basic shapes.
Keep subject labels short and search-friendly in English (e.g. "golden retriever" -> "dog" unless breed is clear).
Tips should be specific to the subject (proportions, line quality, silhouette, negative space) not generic platitudes.`

/** Map SDK / Gateway errors to tips that match the failure (not generic "contrast"). */
export function drawingTipsForVisionError(message: string): string[] {
  const m = message.toLowerCase()
  if (
    m.includes("credit card") ||
    m.includes("add a card") ||
    (m.includes("billing") &&
      (m.includes("gateway") || m.includes("vercel AI") || m.includes("service requests"))) ||
    (m.includes("/ai") && m.includes("vercel"))
  ) {
    return [
      "Enable Vercel AI Gateway for your team: add a billing method so Gateway accepts `anthropic/claude-sonnet-4` (see https://vercel.com/ai-gateway).",
      "Bypass only for drawing coach: set ANTHROPIC_API_KEY to call Claude directly (`@ai-sdk/anthropic`).",
    ]
  }
  if (m.includes("401") || m.includes("unauthorized") || m.includes("authentication") || m.includes("api key")) {
    return [
      "The model rejected the request. Confirm Vercel AI / Anthropic routing and env vars for your deployment.",
    ]
  }
  if (m.includes("429") || m.includes("rate limit") || m.includes("too many requests")) {
    return ["Hit a rate limit. Wait a minute and analyze again."]
  }
  return [
    "Vision could not complete. Read the Vision note below for the raw error. If it mentions the network or timeout, retry once.",
    "Still stuck? Try Analyze again after adding a couple of clear strokes so the PNG is not basically empty.",
  ]
}

/** Uses `@ai-sdk/anthropic` when `ANTHROPIC_API_KEY` is set; otherwise the AI Gateway slug (needs team billing on many accounts). */
export function coachVisionUsesDirectAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

export function coachVisionModel() {
  if (coachVisionUsesDirectAnthropic()) {
    const id =
      process.env.DRAWING_COACH_ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_VISION_MODEL
    return anthropic(id)
  }
  return GATEWAY_VISION_MODEL
}

export async function analyzeSketchPngBase64(
  pngBase64: string
): Promise<{ analysis: DrawingCoachAnalysis; error?: string }> {
  const trimmed = pngBase64.replace(/^data:image\/\w+;base64,/, "").trim()
  if (!trimmed) {
    return {
      analysis: {
        subjects: [],
        primarySubject: null,
        drawingTips: ["Add a few lines or shapes so I can see what you are going for."],
        encouragement: "Blank canvas is a fresh start.",
        confidence: "low",
      },
    }
  }

  const dataUrl = `data:image/png;base64,${trimmed}`

  try {
    const { object } = await generateObject({
      model: coachVisionModel(),
      schema: coachSchema,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What is this sketch trying to depict? Return structured fields only.",
            },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    })
    return { analysis: object }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn("[canvas-coach] vision failed:", msg)
    return {
      analysis: {
        subjects: [],
        primarySubject: null,
        drawingTips: drawingTipsForVisionError(msg),
        encouragement: "Fix the Vision issue below, then tap Analyze again.",
        confidence: "low",
      },
      error: msg,
    }
  }
}
