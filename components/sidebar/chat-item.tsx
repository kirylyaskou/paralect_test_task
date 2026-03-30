'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { Chat } from '@/lib/types'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { DeleteChatDialog } from '@/components/chat/delete-chat-dialog'

interface ChatItemProps {
  chat: Chat
  isActive: boolean
}

export function ChatItem({ chat, isActive }: ChatItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} render={<Link href={`/chat/${chat.id}`} />}>
        <MessageSquare className="h-4 w-4" />
        {chat.title ? (
          <span className="truncate">{chat.title}</span>
        ) : (
          <span className="text-muted-foreground italic truncate">New chat</span>
        )}
      </SidebarMenuButton>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDeleteDialogOpen(true)
        }}
        aria-label="Delete chat"
        className="absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <DeleteChatDialog
        chatId={chat.id}
        chatTitle={chat.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </SidebarMenuItem>
  )
}
