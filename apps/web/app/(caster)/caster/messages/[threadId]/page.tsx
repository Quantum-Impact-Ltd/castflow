import { MessageThreadView } from '@/components/dashboard/message-thread'

export default async function CasterMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params
  return <MessageThreadView threadId={threadId} backHref="/caster/messages" />
}
