import { requireAuth } from '@/lib/auth/helpers'
import { getChatById } from '@/lib/db/chats'
import { getMessagesByChatId } from '@/lib/db/messages'
import { dbMessagesToUIMessages } from '@/lib/ai/convert-messages'
import { redirect } from 'next/navigation'
import { ChatView } from '@/components/chat/chat-view'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let userId: string
  try {
    const auth = await requireAuth()
    userId = auth.userId
  } catch {
    redirect('/login')
  }

  let chat
  try {
    chat = await getChatById(id)
  } catch {
    redirect('/')
  }

  if (chat.user_id !== userId) {
    redirect('/')
  }

  const dbMessages = await getMessagesByChatId(id)
  const initialMessages = dbMessagesToUIMessages(dbMessages)

  return <ChatView chatId={id} initialMessages={initialMessages} />
}
