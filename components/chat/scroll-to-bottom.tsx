'use client'

import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScrollToBottomProps {
  visible: boolean
  onClick: () => void
}

export function ScrollToBottom({ visible, onClick }: ScrollToBottomProps) {
  return (
    <Button
      size="icon"
      className={[
        'absolute bottom-4 right-4 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        'transition-opacity duration-200',
      ].join(' ')}
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      <ArrowDown size={20} />
    </Button>
  )
}
