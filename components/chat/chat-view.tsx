'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { supabasePublic } from '@/lib/supabase/public-client'
import { MessageItem } from './message-item'
import { ChatInput, type Attachment } from './chat-input'
import { WelcomeScreen } from './welcome-screen'
import { ScrollToBottom } from './scroll-to-bottom'
import { StreamingIndicator } from './streaming-indicator'
import { useAutoScroll } from '@/hooks/use-auto-scroll'
import type { Document } from '@/lib/types'

interface ChatViewProps {
  chatId: string
  initialMessages: UIMessage[]
  initialDocuments?: Document[]
}

async function uploadFiles(
  attachments: Attachment[],
  chatId: string
): Promise<{
  imageUrls: string[]
  documentUrls: Array<{
    fileName: string
    fileUrl: string
    extractedText?: string
  }>
}> {
  const imageUrls: string[] = []
  const documentUrls: Array<{
    fileName: string
    fileUrl: string
    extractedText?: string
  }> = []

  for (const att of attachments) {
    // Step 1: Get signed URL from server
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: att.file.name,
        contentType: att.file.type,
        size: att.file.size,
        chatId,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to get upload URL')
    }
    const { signedUrl: _signedUrl, token, path } = await res.json()

    // Step 2: Upload directly to Supabase Storage
    const { error } = await supabasePublic.storage
      .from('attachments')
      .uploadToSignedUrl(path, token, att.file, {
        contentType: att.file.type,
      })
    if (error) throw new Error('Failed to upload file')

    // Step 3: Complete upload (triggers text extraction for docs)
    const completeRes = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        chatId,
        fileName: att.file.name,
        fileType: att.file.type,
      }),
    })
    if (!completeRes.ok) throw new Error('Failed to process upload')
    const result = await completeRes.json()

    if (att.type === 'image') {
      imageUrls.push(result.fileUrl)
    } else {
      documentUrls.push({
        fileName: att.file.name,
        fileUrl: result.fileUrl,
        extractedText: result.extractedText,
      })
    }
  }
  return { imageUrls, documentUrls }
}

export function ChatView({
  chatId,
  initialMessages,
  initialDocuments: _initialDocuments,
}: ChatViewProps) {
  const queryClient = useQueryClient()
  const titleGeneratedRef = useRef(false)
  const searchParams = useSearchParams()
  const promptSent = useRef(false)
  const [isUploading, setIsUploading] = useState(false)

  const { messages, sendMessage, stop, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatId },
    }),
    onError: () => {
      toast.error('Failed to send message. Please try again.')
    },
    onFinish: ({ message }) => {
      // Title generation: fire-and-forget after first assistant response
      if (!titleGeneratedRef.current && message.role === 'assistant') {
        titleGeneratedRef.current = true
        fetch(`/api/chats/${chatId}/title`, { method: 'POST' })
          .then(() => queryClient.invalidateQueries({ queryKey: ['chats'] }))
          .catch(() => {}) // silent failure per spec
      }
    },
  })

  // If chat already has messages, don't re-trigger title generation
  useEffect(() => {
    if (initialMessages.length > 0) {
      titleGeneratedRef.current = true
    }
  }, [initialMessages.length])

  // Auto-send prompt from URL search param (home page -> new chat flow)
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt && !promptSent.current && messages.length === 0) {
      promptSent.current = true
      sendMessage({ text: prompt })
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const isStreaming = status === 'streaming' || status === 'submitted'
  const hasMessages = messages.length > 0

  // Auto-scroll on messages change
  const { containerRef, showScrollButton, scrollToBottom } =
    useAutoScroll([messages])

  // Handle sending with optional attachments (upload before send)
  const handleSend = async (text: string, attachments: Attachment[] = []) => {
    if (attachments.length > 0) {
      setIsUploading(true)
      try {
        const { imageUrls } = await uploadFiles(attachments, chatId)

        // Build parts array for sendMessage
        const parts: Array<
          | { type: 'text'; text: string }
          | { type: 'file'; mediaType: string; url: string }
        > = []

        // Add image file parts
        for (const url of imageUrls) {
          parts.push({ type: 'file' as const, mediaType: 'image/png', url })
        }

        // Add text part
        parts.push({ type: 'text' as const, text })

        sendMessage({ parts })
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Failed to upload file. Please try again.'
        )
      } finally {
        setIsUploading(false)
      }
    } else {
      sendMessage({ text })
    }
    setTimeout(() => scrollToBottom(), 50)
  }

  // Handle retry: re-send the last user message
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      const textPart = lastUserMsg.parts.find((p) => p.type === 'text')
      if (textPart && textPart.type === 'text') {
        sendMessage({ text: textPart.text })
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Message area */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto"
          role="log"
          aria-label="Chat messages"
        >
          {!hasMessages && !isStreaming ? (
            <WelcomeScreen onPromptClick={handleSend} />
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
              {messages.map((msg, i) => (
                <div key={msg.id} className={i > 0 ? 'mt-4' : ''}>
                  <MessageItem
                    message={msg}
                    isStreaming={
                      status === 'streaming' &&
                      i === messages.length - 1 &&
                      msg.role === 'assistant'
                    }
                    isError={
                      status === 'error' &&
                      i === messages.length - 1 &&
                      msg.role === 'assistant'
                    }
                    onRetry={handleRetry}
                  />
                </div>
              ))}
              {status === 'submitted' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                  <div className="mt-4">
                    <StreamingIndicator />
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Scroll to bottom FAB */}
        <ScrollToBottom visible={showScrollButton} onClick={scrollToBottom} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={isUploading}
      />
    </div>
  )
}
