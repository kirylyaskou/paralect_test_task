'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { WelcomeScreen } from '@/components/chat/welcome-screen'
import { ChatInput } from '@/components/chat/chat-input'
import { toast } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleSend = async (text: string) => {
    if (isCreating) return
    setIsCreating(true)
    try {
      // Create a new chat
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to create chat')
      const data = await res.json()
      const chatId = data.chat.id

      // Navigate to chat page with prompt as query param
      router.push(`/chat/${chatId}?prompt=${encodeURIComponent(text)}`)
    } catch {
      toast.error('Failed to create chat. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <WelcomeScreen onPromptClick={handleSend} />
      </div>
      <ChatInput
        onSend={handleSend}
        onStop={() => {}}
        isStreaming={false}
        disabled={isCreating}
      />
    </div>
  )
}
