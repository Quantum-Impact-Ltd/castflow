'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getContractPdfUrl } from '@/lib/api/contracts'
import { errorMessage } from '@/lib/hooks/util'

/**
 * Opens the signed contract PDF. The contracts bucket is private, so we can't
 * link to the stored s3:// key directly — fetch a short-lived presigned URL on
 * click and open it in a new tab.
 */
export function ContractPdfButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      const { url } = await getContractPdfUrl(bookingId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={() => void onClick()}>
      <Download className="mr-1.5 h-4 w-4" />
      {loading ? 'Preparing…' : 'Download PDF'}
    </Button>
  )
}
