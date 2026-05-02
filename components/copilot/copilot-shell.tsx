"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import useSWR from "swr"
import { Header } from "./header"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { EmptyState } from "./empty-state"
import { ToolingRail } from "./tooling-rail"
import { TypingIndicator } from "./typing-indicator"
import { Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CopilotMessage } from "@/app/api/chat/route"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CopilotShell() {
  const { data: config } = useSWR<{
    hasApiToken: boolean
    hasTeamId: boolean
  }>("/api/config", fetcher)

  const [showRail, setShowRail] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop } = useChat<CopilotMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  const handleSend = useCallback(
    (text: string) => {
      sendMessage({ text })
    },
    [sendMessage]
  )

  const hasApiToken = config?.hasApiToken ?? false
  const hasMessages = messages.length > 0

  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header hasApiToken={hasApiToken} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl">
              {!hasMessages ? (
                <EmptyState onSelectPrompt={handleSend} />
              ) : (
                <div className="px-2 py-4 md:px-4">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {isStreaming &&
                    messages[messages.length - 1]?.role === "user" && (
                      <TypingIndicator />
                    )}
                </div>
              )}
            </div>
          </div>

          <ChatInput
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={stop}
          />
        </div>

        {/* Tooling rail - desktop */}
        <div className="hidden w-72 shrink-0 lg:block">
          <ToolingRail hasApiToken={hasApiToken} />
        </div>

        {/* Tooling rail - mobile overlay */}
        {showRail && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowRail(false)}
              onKeyDown={(e) => e.key === "Escape" && setShowRail(false)}
              role="button"
              tabIndex={0}
              aria-label="Close panel"
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw]">
              <ToolingRail
                hasApiToken={hasApiToken}
                onClose={() => setShowRail(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB for tooling */}
      <button
        type="button"
        onClick={() => setShowRail(!showRail)}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-colors lg:hidden",
          showRail
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Toggle tooling panel"
      >
        <Wrench className="h-4 w-4" />
      </button>
    </div>
  )
}
