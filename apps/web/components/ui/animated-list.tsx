'use client'

import React, {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from 'react'
import { AnimatePresence, motion, type MotionProps } from 'motion/react'

import { cn } from '@/lib/utils'

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations: MotionProps = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
  /** Milliseconds between item additions. Defaults to 1000ms. */
  delay?: number
  /** Maximum items visible at once. Older items animate out as new ones arrive. */
  maxVisible?: number
}

export const AnimatedList = React.memo(
  ({
    children,
    className,
    delay = 1000,
    maxVisible = 5,
    ...props
  }: AnimatedListProps) => {
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    )
    const [tick, setTick] = useState(0)

    useEffect(() => {
      if (childrenArray.length === 0) return
      const timeout = setTimeout(() => setTick((t) => t + 1), delay)
      return () => clearTimeout(timeout)
    }, [tick, delay, childrenArray.length])

    const itemsToShow = useMemo(() => {
      if (childrenArray.length === 0) return [] as Array<{
        node: React.ReactNode
        key: string
      }>
      const window = Math.min(maxVisible, childrenArray.length)
      const start = Math.max(0, tick - window + 1)
      const visible: Array<{ node: React.ReactNode; key: string }> = []
      for (let i = start; i <= tick; i++) {
        const child = childrenArray[i % childrenArray.length]
        const baseKey =
          (child as React.ReactElement)?.key ?? String(i % childrenArray.length)
        visible.push({ node: child, key: `${baseKey}-${i}` })
      }
      return visible.reverse()
    }, [tick, childrenArray, maxVisible])

    return (
      <div
        className={cn('flex flex-col items-center gap-3', className)}
        {...props}
      >
        <AnimatePresence mode="popLayout">
          {itemsToShow.map((item) => (
            <AnimatedListItem key={item.key}>{item.node}</AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  },
)

AnimatedList.displayName = 'AnimatedList'
