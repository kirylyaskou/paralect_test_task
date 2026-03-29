'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAX_HEIGHT = 6 * 24 // 6 rows * ~24px line height

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [inputValue])

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming || disabled) return
    onSend(inputValue.trim())
    setInputValue('')
    // Refocus after send
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = disabled || isStreaming

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto w-full">
        <div className="relative">
          <label htmlFor="chat-input" className="sr-only">
            Message input
          </label>
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={isDisabled}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
          />
          <div className="absolute bottom-2 right-2">
            {isStreaming ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-lg text-destructive"
                onClick={onStop}
                aria-label="Stop generating"
              >
                <Square size={20} />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-9 w-9 rounded-lg bg-primary text-primary-foreground"
                onClick={handleSend}
                disabled={!inputValue.trim() || disabled}
                aria-label="Send message"
              >
                <Send size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
