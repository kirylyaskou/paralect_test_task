'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabasePublic } from '@/lib/supabase/public-client'

export function useRealtimeChats(userId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabasePublic
      .channel(`chat-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          // NOTE: Cannot filter DELETE events by column (Supabase limitation)
          // Filter client-side using payload.old
        },
        (payload) => {
          const oldRecord = payload.old as { user_id?: string } | undefined
          if (oldRecord?.user_id === userId) {
            queryClient.invalidateQueries({ queryKey: ['chats'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabasePublic.removeChannel(channel)
    }
  }, [userId, queryClient])
}
