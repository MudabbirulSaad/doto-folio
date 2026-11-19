'use client'

import { lazy, Suspense, useEffect, useState, type RefObject } from 'react'
import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { NotionEditorHandle } from './notion-editor'

const ArticleBody = lazy(() => import('@/components/blog/blog-article-body'))

interface PostPreviewProps {
  title: string
  excerpt: string
  editor: RefObject<NotionEditorHandle | null>
  markdownSource?: string | null
  disabled: boolean
}

type Snapshot = { content: string } | { error: string }

export function PostPreview({ title, excerpt, editor, markdownSource = null, disabled }: PostPreviewProps) {
  const [open, setOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  useEffect(() => {
    if (!open || markdownSource !== null) return
    let active = true
    async function readEditor() {
      try {
        if (!editor.current) throw new Error('The editor is still loading. Close the preview and try again.')
        const draft = await editor.current.readDraft()
        if (active) setSnapshot({ content: draft.blocks.length ? JSON.stringify(draft) : '' })
      } catch (error) {
        if (active) setSnapshot({ error: error instanceof Error ? error.message : 'Could not read the current draft.' })
      }
    }
    void readEditor()
    return () => { active = false }
  }, [open, editor, markdownSource])

  const preview = markdownSource !== null ? { content: markdownSource } : snapshot
  const loading = <p role="status" className="text-muted-foreground">Loading preview…</p>
  return (
    <Dialog open={open} onOpenChange={next => {
      if (next) setSnapshot(null)
      setOpen(next)
    }}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} className="text-muted-foreground hover:text-foreground">
          <Eye className="mr-1 h-4 w-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} showCloseButton={false}
        className="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <DialogTitle>Post preview</DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Close preview"><X /></Button>
          </DialogClose>
        </header>
        <div className="min-w-0 overflow-y-auto overscroll-contain p-5 sm:p-8">
          {!preview && loading}
          {preview && 'error' in preview && <p role="alert">{preview.error}</p>}
          {preview && 'content' in preview && (
            <article className="min-w-0 space-y-6 [overflow-wrap:anywhere]" onClick={event => {
              // Follow article links without navigating away from the unsaved editor.
              const link = event.target instanceof Element && event.target.closest('a[href]')
              if (link instanceof HTMLAnchorElement) {
                link.target = '_blank'
                link.relList.add('noopener', 'noreferrer')
              }
            }}>
              <h1 className="font-display text-4xl font-bold leading-tight">{title.trim() || 'Untitled'}</h1>
              {excerpt.trim() && <p className="text-lg text-muted-foreground">{excerpt}</p>}
              {preview.content.trim() ? (
                <Suspense fallback={loading}><ArticleBody content={preview.content} /></Suspense>
              ) : <p className="text-muted-foreground">This post has no content yet.</p>}
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
