'use client'

import { useDeleteChat } from '@/hooks/use-chats'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DeleteChatDialogProps {
  chatId: string
  chatTitle: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteChatDialog({
  chatId,
  chatTitle,
  open,
  onOpenChange,
}: DeleteChatDialogProps) {
  const deleteChat = useDeleteChat()

  function handleDelete() {
    deleteChat.mutate(chatId, {
      onSettled: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this chat? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Keep chat
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteChat.isPending}
          >
            {deleteChat.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Delete chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
