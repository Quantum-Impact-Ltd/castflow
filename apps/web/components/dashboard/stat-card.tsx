import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComponentType } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ComponentType<{ className?: string }>
}

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
        {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
