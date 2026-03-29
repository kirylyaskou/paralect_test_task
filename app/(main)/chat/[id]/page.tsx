export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await params per Next.js 16 convention; id used in future phases
  await params
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Messages will appear here
      </p>
    </div>
  )
}
