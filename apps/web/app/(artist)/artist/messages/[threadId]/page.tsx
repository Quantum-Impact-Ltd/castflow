import { MessageThreadView } from '@/components/dashboard/message-thread'

export default async function ArtistMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params
  return <MessageThreadView threadId={threadId} backHref="/artist/messages" />
}
