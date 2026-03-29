'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import type { Chat } from '@/lib/types'

export function useChats() {
  return useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await fetch('/api/chats')
      if (!res.ok) throw new Error('Failed to fetch chats')
      const data = await res.json()
      return data.chats
    },
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to create chat')
      const data = await res.json()
      return data.chat as Chat
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['chats'] })

      const previousChats = queryClient.getQueryData<Chat[]>(['chats'])

      const tempChat: Chat = {
        id: crypto.randomUUID(),
        user_id: '',
        title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Chat[]>(['chats'], (old) => [
        tempChat,
        ...(old ?? []),
      ])

      return { previousChats }
    },
    onSuccess: (newChat) => {
      router.push(`/chat/${newChat.id}`)
    },
    onError: (_err, _vars, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats'], context.previousChats)
      }
      console.error('Failed to create chat. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()

  return useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete chat')
    },
    onMutate: async (chatId: string) => {
      await queryClient.cancelQueries({ queryKey: ['chats'] })

      const previousChats = queryClient.getQueryData<Chat[]>(['chats'])

      queryClient.setQueryData<Chat[]>(['chats'], (old) =>
        (old ?? []).filter((chat) => chat.id !== chatId)
      )

      return { previousChats }
    },
    onSuccess: (_data, chatId) => {
      if (pathname.includes(chatId)) {
        router.push('/')
      }
    },
    onError: (_err, _chatId, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats'], context.previousChats)
      }
      console.error('Failed to delete chat. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}
