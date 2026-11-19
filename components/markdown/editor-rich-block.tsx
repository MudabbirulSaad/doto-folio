import { useId, type CSSProperties } from 'react'
import Image from 'next/image'
import ReactMarkdown, { type Options } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { cn } from '@/lib/utils'

type ListItem = string | { content: string; items?: ListItem[]; meta?: { checked?: boolean } }
type ListStyle = 'ordered' | 'unordered' | 'checklist'
type ListData = {
  items: ListItem[]
  style: ListStyle
  meta?: { start?: number; counterType?: 'numeric' | 'upper-alpha' | 'lower-alpha' | 'upper-roman' | 'lower-roman' }
}
type TableData = { content: string[][]; withHeadings?: boolean; stretched?: boolean }
type EmbedData = { service: string; embed: string; source?: string; caption?: string; width?: number; height?: number }
type LinkData = { link: string; meta?: { title?: string; description?: string; image?: { url?: string } } }

export type EditorRichBlock =
  | { type: 'list'; data: ListData }
  | { type: 'table'; data: TableData }
  | { type: 'embed'; data: EmbedData }
  | { type: 'linkTool'; data: LinkData }

// Editor.js saves inline HTML. A literal "*", pipe or list marker is authored text.
const editorHtmlParser: Options['remarkPlugins'] = [function () {
  this.parser = value => ({ type: 'root', children: [{ type: 'html', value }] })
}]
const inlineTags = ['a', 'b', 'strong', 'i', 'em', 's', 'del', 'code', 'br', 'kbd', 'mark', 'u', 'sub', 'sup']
const editorHtmlPlugins: Options['rehypePlugins'] = [rehypeRaw, [rehypeSanitize, {
  ...defaultSchema,
  tagNames: inlineTags,
  attributes: { a: ['href', 'title'] },
  protocols: { href: ['http', 'https', 'mailto'] }
}]]

function EditorInline({ value }: { value?: string }) {
  if (typeof value !== 'string' || !value) return null
  if (!/[<&]/.test(value)) return <span>{value}</span>
  return (
    <span className="[&_a]:text-primary [&_a]:underline">
      <ReactMarkdown remarkPlugins={editorHtmlParser} rehypePlugins={editorHtmlPlugins}>{value}</ReactMarkdown>
    </span>
  )
}

export function EditorTable({ content, withHeadings, stretched }: TableData) {
  if (!Array.isArray(content)) return null
  const rows = content.filter(Array.isArray)
  if (!rows.length) return null
  function renderRow(cells: string[], index: number, heading = false) {
    const Cell = heading ? 'th' : 'td'
    return (
      <tr key={index}>
        {cells.map((value, column) => (
          <Cell key={column} scope={heading ? 'col' : undefined} className="border border-border px-4 py-2 text-start align-top">
            <EditorInline value={value} />
          </Cell>
        ))}
      </tr>
    )
  }
  return (
    <div className="table-wrapper my-6 max-w-full overflow-x-auto">
      <table className={cn('border-collapse', stretched && 'w-full')}>
        {withHeadings && <thead className="bg-muted/50">{renderRow(rows[0], 0, true)}</thead>}
        <tbody>{rows.slice(withHeadings ? 1 : 0).map((cells, index) => renderRow(cells, index))}</tbody>
      </table>
    </div>
  )
}

export function EditorList({ style, items, meta }: ListData) {
  if (!Array.isArray(items) || !items.length) return null
  const ordered = style === 'ordered'
  const checklist = style === 'checklist'
  const List = ordered ? 'ol' : 'ul'
  const counter = meta?.counterType
  const marker = ['upper-alpha', 'lower-alpha', 'upper-roman', 'lower-roman'].find(type => type === counter) ?? 'decimal'
  return (
    <List
      start={ordered ? meta?.start : undefined}
      className={cn('my-2 space-y-1 list-inside', ordered && 'editor-ordered-list', checklist ? 'list-none' : !ordered && 'list-disc')}
      style={ordered ? { listStyleType: marker, '--editor-list-counter': marker } as CSSProperties : undefined}
    >
      {items.map((item, index) => {
        if (!item) return null
        const entry = typeof item === 'string' ? { content: item } : item
        const content = <EditorInline value={entry.content} />
        return (
          <li key={index} className="leading-relaxed [overflow-wrap:anywhere] [&>ol]:ps-5 [&>ul]:ps-5">
            {checklist ? (
              <label>
                <input type="checkbox" checked={entry.meta?.checked === true} disabled className="me-2" />
                {content}
              </label>
            ) : content}
            {entry.items?.length ? (
              <EditorList items={entry.items} style={style} meta={{ counterType: counter }} />
            ) : null}
          </li>
        )
      })}
    </List>
  )
}

function webUrl(value?: string, base?: URL) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value, base)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url : null
  } catch {
    return null
  }
}

const players = {
  youtube: { label: 'YouTube', origin: 'https://www.youtube.com', path: /^\/embed\/[\w-]+$/ },
  coub: { label: 'Coub', origin: 'https://coub.com', path: /^\/embed\/[\w-]+$/ },
  codepen: { label: 'CodePen', origin: 'https://codepen.io', path: /^\/[\w-]+\/embed\/[\w-]+$/ }
}

export function EditorEmbed({ service, embed, source, caption, width, height }: EmbedData) {
  const player = Object.hasOwn(players, service) ? players[service as keyof typeof players] : undefined
  const url = webUrl(embed)
  const canEmbed = player && url && url.origin === player.origin && player.path.test(url.pathname)
  const link = webUrl(source) ?? url
  const aspectRatio = width && height && width > 0 && height > 0 ? `${width} / ${height}` : '16 / 9'
  return (
    <figure className="my-6">
      {canEmbed && (
        <iframe
          title={`${player.label} player`}
          src={url.href}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          className="w-full rounded-lg border border-border"
          style={{ aspectRatio }}
        />
      )}
      <figcaption className="mt-2 space-y-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">
        {caption && <div><EditorInline value={caption} /></div>}
        {link ? <a className="text-primary underline" href={link.href}>Open on {link.hostname}</a> : 'Embed unavailable'}
      </figcaption>
    </figure>
  )
}

export function EditorLinkCard({ link, meta }: LinkData) {
  const descriptionId = useId()
  const url = webUrl(link)
  const title = typeof meta?.title === 'string' && meta.title.trim()
  const description = typeof meta?.description === 'string' && meta.description.trim()
  const image = url && webUrl(meta?.image?.url, url)
  const label = title || url?.href || 'Link unavailable'
  const body = (
    <>
      {image && <Image src={image.href} alt="" width={80} height={80} unoptimized className="size-16 shrink-0 rounded object-cover sm:size-20" />}
      <span className="min-w-0 space-y-1 [overflow-wrap:anywhere]">
        <strong className="block">{label}</strong>
        {description && <span id={descriptionId} className="block text-sm">{description}</span>}
        {url && title && <span className="block text-sm text-muted-foreground">{url.hostname}</span>}
      </span>
    </>
  )
  const className = 'my-4 flex items-start gap-3 rounded-lg border border-border p-4'
  if (!url) return <div className={className}>{body}</div>
  return (
    <a
      href={url.href}
      aria-label={label}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(className, 'hover:border-primary focus-visible:outline-primary')}
    >
      {body}
    </a>
  )
}
