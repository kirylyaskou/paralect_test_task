'use client'

import { usePathname } from 'next/navigation'
import { useChats } from '@/hooks/use-chats'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatItem } from '@/components/sidebar/chat-item'

export function ChatList() {
  const { data: chats, isLoading } = useChats()
  const pathname = usePathname()
  const activeChatId = pathname.startsWith('/chat/')
    ? pathname.split('/chat/')[1]
    : null

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {Array.from({ length: 5 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon={true} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (!chats || chats.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="p-4 text-center">
            <p className="text-sm font-semibold text-sidebar-foreground">
              No chats yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first chat to get started.
            </p>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <ScrollArea>
            {chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
              />
            ))}
          </ScrollArea>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
