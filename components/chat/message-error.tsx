'use client'

import { Button } from '@/components/ui/button'

interface MessageErrorProps {
  onRetry?: () => void
}

export function MessageError({ onRetry }: MessageErrorProps) {
  return (
    <div className="bg-destructive/10 border-l-2 border-destructive rounded-md px-3 py-2 mt-2">
      <p className="text-xs text-destructive">
        Response was interrupted. Click retry to try again.
      </p>
      {onRetry && (
        <Button
          variant="ghost"
          size="xs"
          className="text-destructive text-xs mt-1 px-0 hover:bg-transparent hover:underline"
          onClick={onRetry}
        >
          Retry message
        </Button>
      )}
    </div>
  )
}
