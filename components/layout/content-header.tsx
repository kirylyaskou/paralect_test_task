'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export function ContentHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4 bg-background">
      <SidebarTrigger />
      <ThemeToggle />
    </header>
  )
}
