'use client'

import { useState, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import type { PortfolioEntryType, PortfolioItem } from '@castflow/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useUpdatePortfolioItem } from '@/lib/hooks/use-uploads'
import { ENTRY_TYPES, ENTRY_TYPE_LABEL } from '@/lib/portfolio-meta'

/**
 * Edit a portfolio entry's type / title / description / links. Shared between
 * the profile editor and onboarding so both surfaces use the new typed model.
 * Renders in a shadcn Dialog (portaled), so it looks consistent regardless of
 * the host page's theme.
 */
export function PortfolioEntryEditDialog({
  item,
  trigger,
}: {
  item: PortfolioItem
  trigger?: ReactNode
}) {
  const update = useUpdatePortfolioItem()
  const [open, setOpen] = useState(false)
  const [entryType, setEntryType] = useState<PortfolioEntryType>(item.entryType)
  const [title, setTitle] = useState(item.title ?? '')
  const [description, setDescription] = useState(item.description ?? '')
  const [linksText, setLinksText] = useState((item.links ?? []).join('\n'))

  const save = () => {
    const links = linksText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    update.mutate(
      { id: item.id, entryType, title, description, links },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm" variant="outline" className="w-full">
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit portfolio entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Entry type</Label>
            <Select value={entryType} onValueChange={(v) => setEntryType(v as PortfolioEntryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ENTRY_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editEntryTitle">Title</Label>
            <Input
              id="editEntryTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Vogue Italia — AW26"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editEntryDescription">Description</Label>
            <Textarea
              id="editEntryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What was this work? Role, client, photographer…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editEntryLinks">Links (one per line)</Label>
            <Textarea
              id="editEntryLinks"
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              rows={3}
              placeholder="https://…"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save details'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
