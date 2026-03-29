'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, LogOut } from 'lucide-react'
import { useCreateChat } from '@/hooks/use-chats'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ChatList } from '@/components/sidebar/chat-list'

export function AppSidebar() {
  const createChat = useCreateChat()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUserEmail(data.user?.email ?? ''))
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <Sidebar collapsible="offcanvas" side="left">
      <SidebarHeader>
        <Button
          variant="default"
          className="w-full gap-2"
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
      </SidebarHeader>
      <SidebarContent>
        <ChatList />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <span className="text-sm text-sidebar-foreground truncate flex-1">
            {userEmail}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
