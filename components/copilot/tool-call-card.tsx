"use client"

import { useState } from "react"
import { ChevronRight, Wrench, Check, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolCallCardProps {
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  state: string
}

export function ToolCallCard({
  toolName,
  input,
  output,
  state,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isLoading =
    state === "input-streaming" || state === "input-available"
  const isError = state === "output-error"
  const isDone = state === "output-available"

  const stateIcon = isLoading ? (
    <Loader2 className="h-3 w-3 animate-spin text-accent" />
  ) : isError ? (
    <AlertCircle className="h-3 w-3 text-destructive" />
  ) : (
    <Check className="h-3 w-3 text-emerald-400" />
  )

  const inputSummary = Object.entries(input)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ")

  return (
    <div className="my-1.5 rounded-md border border-border bg-secondary/30 text-xs font-mono">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary/50 transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
        />
        <Wrench className="h-3 w-3 text-accent" />
        <span className="text-accent font-medium">{toolName}</span>
        <span className="truncate text-muted-foreground flex-1">
          ({inputSummary})
        </span>
        {stateIcon}
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-2">
          <div>
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              Args
            </span>
            <pre className="mt-1 overflow-x-auto rounded bg-background/50 p-2 text-[11px] text-foreground/80 leading-relaxed">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {isDone && output !== undefined && (
            <div>
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Result
              </span>
              <pre className="mt-1 overflow-x-auto rounded bg-background/50 p-2 text-[11px] text-foreground/80 leading-relaxed max-h-48">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          {isError && (
            <div className="text-destructive text-[11px]">
              Tool execution failed. Check API token and project ID.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
