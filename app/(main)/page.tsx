'use client'

import { MessageSquare, Plus, Loader2 } from 'lucide-react'
import { useCreateChat } from '@/hooks/use-chats'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const createChat = useCreateChat()

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <MessageSquare className="h-12 w-12 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">Start a conversation</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
        Create a new chat to begin talking with the AI assistant.
      </p>
      <Button
        variant="default"
        className="mt-6"
        onClick={() => createChat.mutate()}
        disabled={createChat.isPending}
      >
        {createChat.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {createChat.isPending ? 'Creating...' : 'New chat'}
      </Button>
    </div>
  )
}
