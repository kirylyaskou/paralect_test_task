'use client'

import type { UIMessage } from 'ai'
import { User, Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageMarkdown } from './message-markdown'
import { MessageError } from './message-error'
import { StreamingIndicator } from './streaming-indicator'

interface MessageItemProps {
  message: UIMessage
  isStreaming?: boolean
  isError?: boolean
  onRetry?: () => void
}

export function MessageItem({ message, isStreaming, isError, onRetry }: MessageItemProps) {
  const isUser = message.role === 'user'
  const textContent = message.parts
    .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('')

  return (
    <div
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      aria-label={isUser ? 'You said:' : 'Assistant said:'}
    >
      {/* Avatar */}
      <Avatar className="hidden sm:flex shrink-0">
        <AvatarFallback
          className={
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className={isUser ? 'max-w-[85%] sm:max-w-[80%]' : 'flex-1 min-w-0'}>
        {isUser ? (
          <div className="bg-muted rounded-2xl px-4 py-3 text-sm">
            {textContent}
          </div>
        ) : (
          <>
            {isStreaming && !textContent ? (
              <StreamingIndicator />
            ) : (
              <>
                <MessageMarkdown content={textContent} />
                {isStreaming && textContent && (
                  <span className="inline-block w-[2px] h-4 bg-foreground animate-pulse ml-0.5 align-text-bottom" />
                )}
              </>
            )}
          </>
        )}

        {isError && <MessageError onRetry={onRetry} />}
      </div>
    </div>
  )
}
