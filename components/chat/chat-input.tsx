'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AttachmentPreview } from './attachment-preview'

const MAX_HEIGHT = 6 * 24 // 6 rows * ~24px line height
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export type Attachment = {
  file: File
  previewUrl: string
  type: 'image' | 'document'
}

function getAttachmentType(file: File): 'image' | 'document' {
  return file.type.startsWith('image/') ? 'image' : 'document'
}

function validateFile(file: File): string | null {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'
  const isDocx =
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  if (!isImage && !isPdf && !isDocx) {
    return 'Unsupported file type. Please attach an image, PDF, or DOCX file.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 10 MB.'
  }

  return null
}

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const height = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${height}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [inputValue])

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => URL.revokeObjectURL(att.previewUrl))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if ((!inputValue.trim() && attachments.length === 0) || isStreaming || disabled) return
    onSend(inputValue.trim(), attachments)
    setInputValue('')
    setAttachments([])
    // Refocus after send
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        continue
      }
      newAttachments.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: getAttachmentType(file),
      })
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
    }

    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue

        const error = validateFile(file)
        if (error) {
          toast.error(error)
          continue
        }

        setAttachments((prev) => [
          ...prev,
          {
            file,
            previewUrl: URL.createObjectURL(file),
            type: 'image',
          },
        ])
      }
    }
    // Let text paste proceed normally -- do not prevent default for text
  }

  const handleRemove = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index]
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const isDisabled = disabled || isStreaming
  const hasContent = inputValue.trim().length > 0 || attachments.length > 0

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto w-full">
        {/* Attachment preview bar */}
        <AttachmentPreview attachments={attachments} onRemove={handleRemove} />

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
            onPaste={handlePaste}
            placeholder="Type a message..."
            rows={1}
            disabled={isDisabled}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 pr-24 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {/* Paperclip attach button */}
            <Button
              size="icon"
              variant="ghost"
              className={`h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent ${
                isStreaming ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </Button>

            {/* Send / Stop button */}
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
                disabled={!hasContent || disabled}
                aria-label="Send message"
              >
                <Send size={20} />
              </Button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.docx,.doc"
            multiple
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  )
}
