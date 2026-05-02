"use client"

import Link from "next/link"
import { Triangle, LayoutDashboard } from "lucide-react"

interface ConnectionBadgeProps {
  label: string
  connected: boolean
}

function ConnectionBadge({ label, connected }: ConnectionBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs font-mono">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          connected
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
            : "bg-muted-foreground/40"
        }`}
        aria-label={connected ? "Connected" : "Disconnected"}
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

interface HeaderProps {
  hasApiToken: boolean
}

export function Header({ hasApiToken }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
          <Triangle className="h-4 w-4 fill-background text-background" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Ship Check Copilot
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono">
            deployment intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/canvas"
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
          Canvas
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <ConnectionBadge label="AI Gateway" connected={true} />
          <ConnectionBadge label="Vercel API" connected={hasApiToken} />
        </div>
      </div>
    </header>
  )
}
