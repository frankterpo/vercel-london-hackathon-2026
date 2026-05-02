import { z } from "zod"

/** Bump when checkpoint payload shape changes (MuBit metadata + API). */
export const CHECKPOINT_SCHEMA_V = 1

export const checkpointBodySchema = z.object({
  canvasId: z.string().uuid(),
  summary: z.string().min(1).max(8000),
  shapeStats: z.record(z.string(), z.number()).optional(),
  shapeCount: z.number().int().nonnegative().optional(),
  topicTags: z.array(z.string()).optional(),
})

export const sessionOpenBodySchema = z.object({
  canvasId: z.string().uuid(),
  topicHint: z.string().max(2000).optional(),
})

export type CheckpointBody = z.infer<typeof checkpointBodySchema>
export type SessionOpenBody = z.infer<typeof sessionOpenBodySchema>

export type PriorCanvasSuggestion = {
  canvasId: string
  content?: string
  score?: number
}
