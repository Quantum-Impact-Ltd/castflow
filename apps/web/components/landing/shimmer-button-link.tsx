'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode } from 'react'

import {
  ShimmerButton,
  type ShimmerButtonProps,
} from '@/components/ui/shimmer-button'

interface Props extends Omit<ShimmerButtonProps, 'onClick' | 'children'> {
  href: string
  children: ReactNode
}

export function ShimmerButtonLink({ href, children, ...props }: Props) {
  const router = useRouter()
  return (
    <ShimmerButton onClick={() => router.push(href)} {...props}>
      {children}
    </ShimmerButton>
  )
}
