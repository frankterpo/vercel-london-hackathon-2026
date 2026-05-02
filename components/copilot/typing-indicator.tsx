"use client"

import { Bot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex gap-3 py-4 px-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent border border-accent/30">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      </div>
    </div>
  )
}
