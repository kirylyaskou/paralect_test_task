'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { WelcomeScreen } from '@/components/chat/welcome-screen'
import { ChatInput, type Attachment } from '@/components/chat/chat-input'
import { useAnonymousUsage } from '@/hooks/use-anonymous-usage'
import { AnonymousLimitDialog } from '@/components/auth/anonymous-limit-dialog'
import { toast } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = loading

  // Check authentication status on mount
  useEffect(() => {
    fetch('/api/chats', { method: 'GET' })
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
  }, [])

  // Anonymous usage tracking (always called to satisfy hook rules, only used when unauthenticated)
  const {
    fingerprint,
    limitReached,
    incrementCount,
    isLoading: isFingerprintLoading,
  } = useAnonymousUsage()

  // Anonymous chat via useChat pointing to anonymous endpoint
  const {
    messages: anonymousMessages,
    sendMessage: sendAnonymousMessage,
    status: anonymousStatus,
  } = useChat({
    id: 'anonymous-chat',
    transport: new DefaultChatTransport({
      api: '/api/anonymous/chat',
      body: { fingerprint },
    }),
    onFinish: () => {
      incrementCount()
    },
    onError: (error) => {
      if (error.message?.includes('limit_reached')) {
        // limitReached will be set by incrementCount
      } else {
        toast.error('Failed to get response. Please try again.')
      }
    },
  })

  const isAnonymousStreaming =
    anonymousStatus === 'streaming' || anonymousStatus === 'submitted'

  const handleSend = async (text: string, _attachments?: Attachment[]) => {
    if (isAuthenticated) {
      // Existing behavior: create chat and navigate
      if (isCreating) return
      setIsCreating(true)
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!res.ok) throw new Error('Failed to create chat')
        const data = await res.json()
        router.push(`/chat/${data.chat.id}?prompt=${encodeURIComponent(text)}`)
      } catch {
        toast.error('Failed to create chat. Please try again.')
        setIsCreating(false)
      }
    } else {
      // Anonymous: send message to anonymous chat API
      if (limitReached) return // Dialog will be showing
      sendAnonymousMessage({ text })
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        {isAuthenticated === false && anonymousMessages.length > 0 ? (
          // Render anonymous messages inline (simple message list)
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
            {anonymousMessages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? 'text-right' : 'text-left'}
              >
                <div
                  className={`inline-block rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'bg-muted' : ''
                  }`}
                >
                  {msg.parts
                    .filter((p) => p.type === 'text')
                    .map((p, i) => (
                      <span key={i}>
                        {p.type === 'text' ? p.text : ''}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <WelcomeScreen onPromptClick={handleSend} />
        )}
      </div>
      <ChatInput
        onSend={handleSend}
        onStop={() => {}}
        isStreaming={isAuthenticated === false ? isAnonymousStreaming : false}
        disabled={isCreating || limitReached || isFingerprintLoading}
      />
      {/* Anonymous limit dialog -- only rendered for unauthenticated users */}
      {isAuthenticated === false && (
        <AnonymousLimitDialog open={limitReached} />
      )}
    </div>
  )
}
