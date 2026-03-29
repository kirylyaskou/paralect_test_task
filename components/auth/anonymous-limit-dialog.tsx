'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AnonymousLimitDialogProps {
  open: boolean
}

export function AnonymousLimitDialog({ open }: AnonymousLimitDialogProps) {
  const router = useRouter()

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Non-dismissible: prevent closing via ESC or outside click
      }}
      disablePointerDismissal
    >
      <DialogContent
        className="max-w-[400px] p-8"
        showCloseButton={false}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold">
            Free questions limit reached
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-4">
            You&apos;ve used your 3 free questions. Create an account to
            continue chatting with AI.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-center mt-6">
          <Button
            variant="default"
            className="flex-1 sm:flex-initial"
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-initial"
            onClick={() => router.push('/login')}
          >
            Log In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
