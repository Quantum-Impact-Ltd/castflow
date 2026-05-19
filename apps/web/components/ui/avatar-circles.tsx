'use client'

import { cn } from '@/lib/utils'

interface AvatarEntry {
  imageUrl: string
  profileUrl?: string
}

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: AvatarEntry[]
}

export function AvatarCircles({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) {
  return (
    <div className={cn('z-10 flex -space-x-3', className)}>
      {avatarUrls.map((url, index) => {
        const img = (
          <img
            className="h-9 w-9 rounded-full border-2 border-background object-cover"
            src={url.imageUrl}
            width={36}
            height={36}
            alt={`Avatar ${index + 1}`}
          />
        )
        return url.profileUrl ? (
          <a
            key={index}
            href={url.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {img}
          </a>
        ) : (
          <span key={index} aria-hidden>
            {img}
          </span>
        )
      })}
      {(numPeople ?? 0) > 0 && (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-foreground text-center text-[10px] font-medium text-background">
          +{numPeople}
        </span>
      )}
    </div>
  )
}
