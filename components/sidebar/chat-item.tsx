'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, MoreHorizontal } from 'lucide-react'
import type { Chat } from '@/lib/types'
import {
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
      <SidebarMenuAction showOnHover>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Chat options">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteDialogOpen(true)}
            >
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuAction>
      <DeleteChatDialog
        chatId={chat.id}
        chatTitle={chat.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </SidebarMenuItem>
  )
}
