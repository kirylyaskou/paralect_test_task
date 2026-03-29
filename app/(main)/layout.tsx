import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { ContentHeader } from '@/components/layout/content-header'
import { RealtimeProvider } from '@/components/layout/realtime-provider'
import { requireAuth } from '@/lib/auth/helpers'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userId: string | null = null
  try {
    const auth = await requireAuth()
    userId = auth.userId
  } catch {
    // Anonymous user -- no realtime needed
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ContentHeader />
        <RealtimeProvider userId={userId}>
          <main className="flex flex-1 flex-col">{children}</main>
        </RealtimeProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
