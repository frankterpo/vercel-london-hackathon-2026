"use client"

import { cn } from "@/lib/utils"
import { ToolCallCard } from "./tool-call-card"
import { Bot, User } from "lucide-react"
import type { CopilotMessage } from "@/app/api/chat/route"

interface MessageBubbleProps {
  message: CopilotMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 py-4 px-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs",
          isUser
            ? "bg-foreground text-background"
            : "bg-accent/20 text-accent border border-accent/30"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "flex-1 space-y-1 min-w-0",
          isUser ? "text-right" : "text-left"
        )}
      >
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          {isUser ? "You" : "Copilot"}
        </span>

        <div className="space-y-1">
          {message.parts.map((part, idx) => {
            if (part.type === "text" && part.text) {
              return (
                <div
                  key={idx}
                  className={cn(
                    "prose prose-invert prose-sm max-w-none",
                    "text-foreground/90 leading-relaxed",
                    "[&_code]:bg-secondary [&_code]:text-accent [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono",
                    "[&_pre]:bg-secondary [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md",
                    "[&_strong]:text-foreground [&_strong]:font-semibold",
                    "[&_ul]:space-y-1 [&_ol]:space-y-1",
                    "[&_a]:text-accent [&_a]:underline",
                    isUser && "text-right"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(part.text),
                  }}
                />
              )
            }

            // Handle all tool-* parts generically
            if (part.type.startsWith("tool-")) {
              const toolPart = part as {
                type: string
                toolCallId: string
                state: string
                input: Record<string, unknown>
                output?: unknown
              }
              const toolName = part.type.replace("tool-", "")
              return (
                <ToolCallCard
                  key={idx}
                  toolName={toolName}
                  input={toolPart.input ?? {}}
                  output={toolPart.output}
                  state={toolPart.state}
                />
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}

function formatMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre><code class="language-$1">$2</code></pre>'
    )
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-semibold mt-3 mb-1">$1</h2>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Line breaks
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
}
