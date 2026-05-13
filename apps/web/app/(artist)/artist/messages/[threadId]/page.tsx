import { MessageThread } from '@/components/messaging/thread'

export default async function ArtistMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params
  return <MessageThread threadId={threadId} backHref="/artist/messages" />
}
