import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { generateObject, type LanguageModel } from "ai"
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

/** Sonnet-class model with vision */
const DEFAULT_ANTHROPIC_VISION_MODEL = "claude-sonnet-4-20250514"
/** AI Gateway slug — last resort when no BYO provider keys exist (often needs team billing card). */
const GATEWAY_VISION_MODEL = "anthropic/claude-sonnet-4"
/** Vision-capable; cheap tier for sketches */
const DEFAULT_OPENAI_VISION_MODEL = "gpt-4o-mini"
/** OpenCode Zen — Anthropic Messages-compatible base (vision). Uses Zen model IDs, see https://dev.opencode.ai/docs/zen/ */
const ZEN_MESSAGES_BASE_URL = "https://opencode.ai/zen/v1"
const DEFAULT_ZEN_ANTHROPIC_MODEL = "claude-sonnet-4"

const SYSTEM = `You are a supportive drawing coach. Look at the rough whiteboard/sketch image.
Identify what the artist is most likely trying to draw (real-world objects, animals, people, plants, vehicles, buildings).
If the canvas is empty or only abstract squiggles, return low confidence, empty or generic subjects, and tips about blocking in basic shapes.
Keep subject labels short and search-friendly in English (e.g. "golden retriever" -> "dog" unless breed is clear).
Tips should be specific to the subject (proportions, line quality, silhouette, negative space) not generic platitudes.`

export type CoachVisionTransport = "anthropic" | "openai" | "gateway" | "opencode"

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
    /** Raw `visionError` already includes Gateway links — avoid repeating in Tips. */
    return []
  }
  if (m.includes("401") || m.includes("unauthorized") || m.includes("authentication") || m.includes("api key")) {
    return [
      "The model rejected the request. Confirm ANTHROPIC_API_KEY / OPENAI_API_KEY / OPENCODE_API_KEY (Zen) in .env or Vercel secrets.",
    ]
  }
  if (m.includes("429") || m.includes("rate limit") || m.includes("too many requests")) {
    return ["Hit a rate limit. Wait a minute and analyze again."]
  }
  return [
    "Vision could not complete. Read the Vision API panel above for the raw error. If it mentions the network or timeout, retry once.",
    "Still stuck? Try Analyze again after adding a couple of clear strokes so the PNG is not basically empty.",
  ]
}

function encouragementForVisionError(message: string): string {
  const m = message.toLowerCase()
  if (
    m.includes("credit card") ||
    m.includes("add a card") ||
    (m.includes("billing") &&
      (m.includes("gateway") || m.includes("vercel ai") || m.includes("service requests"))) ||
    (m.includes("/ai") && m.includes("vercel"))
  ) {
    return "Gateway blocked billing. Fallback: OPENCODE_API_KEY (OpenCode Zen → Claude vision on `/v1/messages`), or OPENAI_API_KEY / ANTHROPIC_API_KEY—see `.env.example`. Restart dev, Analyze again—or add a card under Vercel → AI Gateway."
  }
  return "Fix the Vision issue above, then tap Analyze again."
}

function anthropicApiKey(): string | undefined {
  const a = process.env.DRAWING_COACH_ANTHROPIC_API_KEY?.trim()
  const b = process.env.ANTHROPIC_API_KEY?.trim()
  return a || b
}

function openaiApiKey(): string | undefined {
  const a = process.env.DRAWING_COACH_OPENAI_API_KEY?.trim()
  const b = process.env.OPENAI_API_KEY?.trim()
  return a || b
}

/** OpenCode Zen key (dashboard at opencode.ai). Also accepts DRAWING_COACH_OPENCODE_API_KEY / OPEN_CODE_API_KEY aliases. */
function opencodeZenApiKey(): string | undefined {
  const a = process.env.DRAWING_COACH_OPENCODE_API_KEY?.trim()
  const b = process.env.OPENCODE_API_KEY?.trim()
  const c = process.env.OPEN_CODE_API_KEY?.trim()
  return a || b || c
}

type VisionAttempt = { transport: CoachVisionTransport; model: LanguageModel }

function coachVisionAttempts(): VisionAttempt[] {
  const tries: VisionAttempt[] = []

  const anthropicKey = anthropicApiKey()
  if (anthropicKey) {
    const anthropicProvider = createAnthropic({ apiKey: anthropicKey })
    const id =
      process.env.DRAWING_COACH_ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_VISION_MODEL
    tries.push({
      transport: "anthropic",
      model: anthropicProvider(id),
    })
  }

  const oKey = openaiApiKey()
  if (oKey) {
    const openAIProvider = createOpenAI({ apiKey: oKey })
    const id = process.env.DRAWING_COACH_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_VISION_MODEL
    tries.push({
      transport: "openai",
      model: openAIProvider(id),
    })
  }

  tries.push({ transport: "gateway", model: GATEWAY_VISION_MODEL })

  const zenKey = opencodeZenApiKey()
  if (zenKey) {
    /** Zen exposes Anthropic Messages at this prefix; `chat/completions` free models do not accept images. */
    const zenAnthropic = createAnthropic({
      apiKey: zenKey,
      baseURL: ZEN_MESSAGES_BASE_URL,
      name: "opencode.zen",
    })
    const zenModel =
      process.env.DRAWING_COACH_ZEN_ANTHROPIC_MODEL?.trim() ||
      process.env.DRAWING_COACH_ZEN_MODEL?.trim() ||
      DEFAULT_ZEN_ANTHROPIC_MODEL
    tries.push({ transport: "opencode", model: zenAnthropic(zenModel) })
  }

  return tries
}

/** First transport we try (Anthropic vs OpenAI vs Gateway); useful when vision failed overall. */
export function coachPrimaryVisionTransportPreference(): CoachVisionTransport {
  return coachVisionAttempts()[0].transport
}

/** True when coach can skip Gateway using a direct Anthropic key (checks both env names). */
export function coachVisionUsesDirectAnthropic(): boolean {
  return Boolean(anthropicApiKey())
}

/**
 * Resolved model for the drawing coach vision step (does not trigger network).
 * Matches `coachVisionAttempts` order: Anthropic → OpenAI → Vercel Gateway → OpenCode Zen (Claude Messages).
 */
export function coachVisionModel(): LanguageModel {
  const list = coachVisionAttempts()
  return list[0].model
}

const COACH_PROMPT_TEXT =
  "What is this sketch trying to depict? Return structured fields only."

export async function analyzeSketchPngBase64(
  pngBase64: string
): Promise<{
  analysis: DrawingCoachAnalysis
  error?: string
  /** Which backend produced `analysis` on success */
  visionTransport?: CoachVisionTransport
}> {
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

  const dataUrl = `data:image/png;base64,${trimmed}` as const

  const messages = [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: COACH_PROMPT_TEXT },
        { type: "image" as const, image: dataUrl },
      ],
    },
  ]

  let lastErr = ""
  for (const { transport, model } of coachVisionAttempts()) {
    try {
      const { object } = await generateObject({
        model,
        schema: coachSchema,
        system: SYSTEM,
        messages,
      })
      return { analysis: object, visionTransport: transport }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      lastErr = msg
      console.warn(`[canvas-coach] vision failed (${transport}):`, msg)
    }
  }

  console.warn("[canvas-coach] all vision transports failed:", lastErr)
  return {
    analysis: {
      subjects: [],
      primarySubject: null,
      drawingTips: drawingTipsForVisionError(lastErr),
      encouragement: encouragementForVisionError(lastErr),
      confidence: "low",
    },
    error: lastErr,
  }
}
