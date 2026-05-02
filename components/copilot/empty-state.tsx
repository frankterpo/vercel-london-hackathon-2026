"use client"

import { Triangle } from "lucide-react"

const SUGGESTED_PROMPTS = [
  {
    label: "Deployment health",
    prompt: "List my projects and show which deployments are currently failing or errored.",
  },
  {
    label: "Find preview URL",
    prompt: "What is the latest preview deployment URL for my most recent project?",
  },
  {
    label: "Debug build failure",
    prompt: "Show me the build logs for the latest failed deployment and explain what went wrong.",
  },
  {
    label: "Compare prod vs preview",
    prompt: "Compare the current production deployment with the latest preview for my project.",
  },
  {
    label: "Rollback guidance",
    prompt: "My latest production deployment is broken. Help me identify the last healthy deployment I can rollback to.",
  },
  {
    label: "Env var audit",
    prompt: "List all environment variables for my project and check if any critical ones are missing.",
  },
]

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 mb-6">
        <Triangle className="h-7 w-7 text-accent" />
      </div>

      <h2 className="text-lg font-semibold text-foreground text-balance text-center">
        Ship Check Copilot
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm text-balance">
        Ask about your Vercel deployments, debug build failures, or find preview URLs. Powered by real API tools.
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelectPrompt(s.prompt)}
            className="group rounded-lg border border-border bg-secondary/30 px-4 py-3 text-left transition-all hover:bg-secondary/60 hover:border-accent/30"
          >
            <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors">
              {s.label}
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground leading-tight line-clamp-2">
              {s.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
