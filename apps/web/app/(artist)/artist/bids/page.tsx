import { PageHeader } from '@/components/dashboard'
import { ArtistBidsList } from './list'

export default function ArtistBidsPage() {
  return (
    <div>
      <PageHeader title="My Bids" description="Track every bid you've submitted." />
      <ArtistBidsList />
    </div>
  )
}
