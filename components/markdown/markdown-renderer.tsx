'use client'

import { createElement, type ReactNode } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import type { Components, Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'
import { cn } from '@/lib/utils'

export type MarkdownSecurityPolicy = 'trustedBlog' | 'userComment'
export type MarkdownVisualMode = 'blog' | 'comment' | 'inline'
type InlineMarkdownTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface MarkdownRendererProps {
  source: string
  policy: MarkdownSecurityPolicy
  mode?: MarkdownVisualMode
}

interface InlineMarkdownRendererProps extends MarkdownRendererProps {
  as?: InlineMarkdownTag
  className?: string
}

type EditorListItem = string | { content?: string; items?: EditorListItem[] }

interface EditorJSBlock {
  type: string
  data: {
    text?: string
    level?: number
    style?: 'ordered' | 'unordered'
    items?: EditorListItem[]
    code?: string
    language?: string
    caption?: string
    file?: { url?: string }
    url?: string
  }
}

interface EditorJSContent {
  blocks?: EditorJSBlock[]
}

interface RichContentRendererProps {
  content: string
  policy: MarkdownSecurityPolicy
  mode?: MarkdownVisualMode
  renderCodeBlock?: (code: string, language: string, key: string) => ReactNode
}

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  node?: unknown
}

const trustedBlogSchema: RehypeSanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'kbd',
    'mark',
    'details',
    'summary',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td'
  ].filter(tag => !['script', 'iframe', 'style', 'form', 'input', 'svg', 'object', 'embed'].includes(tag)),
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'title'],
    code: [['className', /^language-[\w-]+$/, 'inline-code']],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['align'],
    td: ['align'],
    details: ['open']
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https']
  },
  clobberPrefix: 'md-'
}

function isSafeUrl(value: string | undefined, allowRelative: boolean) {
  if (!value) return false
  if (allowRelative && value.startsWith('/')) return true

  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
  } catch {
    return false
  }
}

function canUseOptimizedImage(src: string) {
  return src.startsWith('/')
}

function BlogContentImage({ src = '', alt = '', node, ...props }: MarkdownImageProps) {
  void node
  const imageSrc = typeof src === 'string' ? src : ''
  if (!isSafeUrl(imageSrc, true)) return null

  return (
    <span className="my-6 block">
      {canUseOptimizedImage(imageSrc) ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={1200}
          height={675}
          className="h-auto w-full rounded-lg border border-border"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          loading="lazy"
        />
      ) : (
        createElement('img', {
          ...props,
          src: imageSrc,
          alt,
          className: 'w-full rounded-lg border border-border',
          loading: 'lazy'
        })
      )}
      {alt && <span className="mt-2 block text-center text-sm italic text-muted-foreground">{alt}</span>}
    </span>
  )
}

function createComponents(policy: MarkdownSecurityPolicy, mode: MarkdownVisualMode): Components {
  const isComment = mode === 'comment'

  return {
    h1: ({ children, ...props }) => <h1 className="text-3xl font-bold text-foreground mt-8 mb-4 scroll-mt-20" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-20" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="text-xl font-semibold text-foreground mt-6 mb-3 scroll-mt-20" {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 className="text-lg font-semibold text-foreground mt-6 mb-3 scroll-mt-20" {...props}>{children}</h4>,
    h5: ({ children, ...props }) => <h5 className="text-base font-semibold text-foreground mt-4 mb-2 scroll-mt-20" {...props}>{children}</h5>,
    h6: ({ children, ...props }) => <h6 className="text-sm font-semibold text-foreground mt-4 mb-2 scroll-mt-20" {...props}>{children}</h6>,
    p: ({ children, ...props }) => (
      <p className={cn('text-foreground leading-relaxed', isComment ? 'mb-2' : 'mb-4')} {...props}>
        {children}
      </p>
    ),
    a: ({ children, href, ...props }) => {
      if (!isSafeUrl(href, false)) return <span>{children}</span>
      const safeHref = href || ''

      return (
        <a
          href={safeHref}
          className="text-primary decoration-primary/40 underline underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary"
          target={safeHref.startsWith('http') ? '_blank' : undefined}
          rel={policy === 'userComment' ? 'noopener noreferrer nofollow ugc' : safeHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          {...props}
        >
          {children}
        </a>
      )
    },
    ul: ({ children, ...props }) => <ul className={cn('list-disc list-inside text-foreground', isComment ? 'mb-2 space-y-1' : 'mb-4 space-y-2')} {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className={cn('list-decimal list-inside text-foreground', isComment ? 'mb-2 space-y-1' : 'mb-4 space-y-2')} {...props}>{children}</ol>,
    li: ({ children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
    blockquote: ({ children, ...props }) => (
      <blockquote className={cn('border-l-4 border-primary text-muted-foreground', isComment ? 'my-3 pl-4 italic' : 'pl-6 py-4 my-8 bg-background/5 backdrop-blur-sm rounded-r-xl italic shadow-sm')} {...props}>
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }) => {
      const match = /language-([\w-]+)/.exec(className || '')
      if (match) {
        return (
          <code className={cn('font-mono text-sm', className)} {...props}>
            {children}
          </code>
        )
      }

      return (
        <code className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-sm text-foreground shadow-sm shadow-black/10" {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => (
      <pre className={cn('overflow-x-auto rounded-lg border border-border bg-background/5 p-4 font-mono text-sm leading-relaxed text-foreground shadow-sm shadow-black/10', isComment ? 'my-3' : 'my-6')} {...props}>
        {children}
      </pre>
    ),
    table: ({ children, ...props }) => (
      <div className="table-wrapper overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border rounded-lg" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }) => <thead className="bg-muted/50" {...props}>{children}</thead>,
    th: ({ children, ...props }) => <th className="border border-border px-4 py-2 text-left font-semibold text-foreground" {...props}>{children}</th>,
    td: ({ children, ...props }) => <td className="border border-border px-4 py-2 text-foreground" {...props}>{children}</td>,
    hr: ({ ...props }) => <hr className="my-8 border-border" {...props} />,
    img: policy === 'trustedBlog' ? BlogContentImage : () => null
  }
}

const markdownRemarkPlugins: Options['remarkPlugins'] = [remarkGfm, remarkBreaks]
const trustedBlogRehypePlugins: Options['rehypePlugins'] = [rehypeRaw, [rehypeSanitize, trustedBlogSchema]]

function markdownOptions(policy: MarkdownSecurityPolicy, mode: MarkdownVisualMode): Options {
  return {
    components: createComponents(policy, mode),
    remarkPlugins: markdownRemarkPlugins,
    rehypePlugins: policy === 'trustedBlog' ? trustedBlogRehypePlugins : [],
    skipHtml: policy === 'userComment',
    disallowedElements: policy === 'userComment' ? ['img'] : undefined,
    unwrapDisallowed: true
  }
}

export function MarkdownRenderer({ source, policy, mode = 'blog' }: MarkdownRendererProps) {
  const options = markdownOptions(policy, mode)

  return (
    <ReactMarkdown {...options}>
      {source}
    </ReactMarkdown>
  )
}

export function InlineMarkdownRenderer({ source, policy, mode = 'inline', as: Tag = 'span', className }: InlineMarkdownRendererProps) {
  const options = markdownOptions(policy, mode)

  return (
    <Tag className={className}>
      <ReactMarkdown
        {...options}
        allowedElements={['a', 'strong', 'em', 'del', 'code', 'span', 'br', 'kbd', 'mark']}
        unwrapDisallowed
      >
        {source}
      </ReactMarkdown>
    </Tag>
  )
}

function parseEditorJSContent(content: string): EditorJSBlock[] | null {
  try {
    const parsed = JSON.parse(content) as EditorJSContent
    return Array.isArray(parsed.blocks) ? parsed.blocks : null
  } catch {
    return null
  }
}

function renderEditorListItem(item: EditorListItem, index: number) {
  const content = typeof item === 'string' ? item : item.content || ''
  return (
    <li key={index} className="leading-relaxed">
      <InlineMarkdownRenderer source={content} policy="trustedBlog" />
    </li>
  )
}

export function RichContentRenderer({ content, policy, mode = 'blog', renderCodeBlock }: RichContentRendererProps) {
  const editorBlocks = parseEditorJSContent(content)

  if (!editorBlocks) {
    return <MarkdownRenderer source={content} policy={policy} mode={mode} />
  }

  return (
    <div className="space-y-4">
      {editorBlocks.map((block, index) => {
        const key = `${block.type}-${index}`
        const text = block.data.text || ''

        if (block.type === 'paragraph') {
          return <InlineMarkdownRenderer key={key} source={text} policy={policy} as="p" className="mb-4 text-foreground leading-relaxed" />
        }

        if (block.type === 'header') {
          const level = Math.min(Math.max(block.data.level || 2, 1), 6)
          const Tag = `h${level}` as InlineMarkdownTag
          const headerClassName = cn(
            'font-bold mb-4 text-foreground scroll-mt-20',
            level === 1 && 'text-3xl',
            level === 2 && 'text-2xl',
            level === 3 && 'text-xl',
            level === 4 && 'text-lg',
            level >= 5 && 'text-base'
          )
          return <InlineMarkdownRenderer key={key} source={text} policy={policy} as={Tag} className={headerClassName} />
        }

        if (block.type === 'list') {
          const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul'
          return (
            <ListTag key={key} className={cn('mb-4 list-inside space-y-2', block.data.style === 'ordered' ? 'list-decimal' : 'list-disc')}>
              {(block.data.items || []).map(renderEditorListItem)}
            </ListTag>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="border-l-4 border-primary pl-4 mb-4 italic text-muted-foreground">
              <InlineMarkdownRenderer source={text} policy={policy} />
              {block.data.caption && <cite className="block mt-2 text-sm not-italic">- {block.data.caption}</cite>}
            </blockquote>
          )
        }

        if (block.type === 'code') {
          const language = block.data.language || ''
          const code = block.data.code || ''
          return renderCodeBlock ? renderCodeBlock(code, language, key) : (
            <pre key={key} className="bg-muted p-4 rounded-lg mb-4 overflow-x-auto">
              <code className="text-sm text-foreground">{code}</code>
            </pre>
          )
        }

        if (block.type === 'image') {
          const src = block.data.file?.url || block.data.url || ''
          if (!src) return null
          return <MarkdownRenderer key={key} source={`![${block.data.caption || ''}](${src})`} policy={policy} mode={mode} />
        }

        if (block.type === 'delimiter') {
          return <hr key={key} className="my-8 border-border" />
        }

        return null
      })}
    </div>
  )
}
