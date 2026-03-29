'use client'

import { useRealtimeChats } from '@/hooks/use-realtime-chats'

interface RealtimeProviderProps {
  userId: string | null
  children: React.ReactNode
}

export function RealtimeProvider({ userId, children }: RealtimeProviderProps) {
  useRealtimeChats(userId)
  return <>{children}</>
}
