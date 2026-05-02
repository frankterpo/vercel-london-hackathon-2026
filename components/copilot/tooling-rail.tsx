"use client"

import { TOOL_REGISTRY } from "@/lib/tools"
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolingRailProps {
  hasApiToken: boolean
  onClose?: () => void
}

export function ToolingRail({ hasApiToken, onClose }: ToolingRailProps) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Tooling
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors lg:hidden"
            aria-label="Close tooling panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="border-b border-border px-4 py-3 space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Connection
        </span>
        <div className="flex items-center gap-2">
          {hasApiToken ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-foreground/80">
                Vercel API connected
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-foreground/80">
                Missing API token
              </span>
            </>
          )}
        </div>
        {!hasApiToken && (
          <div className="rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200/80 space-y-1">
            <p>
              Set <code className="text-amber-300">VERCEL_API_TOKEN</code> in
              your project Vars to enable real deployment data.
            </p>
            <p>
              Optionally set{" "}
              <code className="text-amber-300">VERCEL_TEAM_ID</code> for team
              scoping.
            </p>
          </div>
        )}
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Exposed Tools ({TOOL_REGISTRY.length})
        </span>
        <ul className="mt-2 space-y-1">
          {TOOL_REGISTRY.map((t) => (
            <li
              key={t.name}
              className="group flex items-start gap-2 rounded-md px-2 py-2 hover:bg-secondary/50 transition-colors"
            >
              <div
                className={cn(
                  "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                  hasApiToken
                    ? "bg-emerald-400/80"
                    : "bg-muted-foreground/30"
                )}
              />
              <div className="min-w-0">
                <p className="text-xs font-mono text-foreground/90 truncate">
                  {t.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {t.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <a
          href="https://vercel.com/docs/rest-api"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-accent transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Vercel API Docs
        </a>
      </div>
    </aside>
  )
}
