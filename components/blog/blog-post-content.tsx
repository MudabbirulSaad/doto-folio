'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingProgress } from './reading-progress'
import type { BlogPostWithRelations } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

interface BlogPostContentProps {
  post: BlogPostWithRelations
}

type EditorListItem = string | { content?: string }

interface EditorJSBlock {
  type: string
  data: {
    text?: string
    level?: number
    style?: 'ordered' | 'unordered'
    items?: EditorListItem[]
    code?: string
    caption?: string
  }
}

// Helper function to parse Editor.js content
function parseEditorJSContent(content: string): EditorJSBlock[] {
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed.blocks) ? parsed.blocks : []
  } catch (error) {
    console.error('Error parsing Editor.js content:', error)
    return []
  }
}

// Helper function to render Editor.js blocks
function renderEditorJSBlock(block: EditorJSBlock, index: number) {
  const { type, data } = block

  switch (type) {
    case 'paragraph':
      return (
        <p key={index} className="mb-4 text-foreground leading-relaxed">
          {data.text}
        </p>
      )

    case 'header':
      const headerClassName = `font-bold mb-4 text-foreground ${data.level === 1 ? 'text-3xl' :
        data.level === 2 ? 'text-2xl' :
          data.level === 3 ? 'text-xl' :
            data.level === 4 ? 'text-lg' :
              'text-base'
        }`

      if (data.level === 1) return <h1 key={index} className={headerClassName}>{data.text}</h1>
      if (data.level === 2) return <h2 key={index} className={headerClassName}>{data.text}</h2>
      if (data.level === 3) return <h3 key={index} className={headerClassName}>{data.text}</h3>
      if (data.level === 4) return <h4 key={index} className={headerClassName}>{data.text}</h4>
      if (data.level === 5) return <h5 key={index} className={headerClassName}>{data.text}</h5>
      return <h6 key={index} className={headerClassName}>{data.text}</h6>

    case 'list':
      const ListTag = data.style === 'ordered' ? 'ol' : 'ul'
      return (
        <ListTag key={index} className={`mb-4 ${data.style === 'ordered' ? 'list-decimal' : 'list-disc'} list-inside space-y-2`}>
          {(data.items || []).map((item, itemIndex) => (
            <li key={itemIndex} className="text-foreground">
              {typeof item === 'string' ? item : item.content}
            </li>
          ))}
        </ListTag>
      )

    case 'code':
      return (
        <pre key={index} className="bg-muted p-4 rounded-lg mb-4 overflow-x-auto">
          <code className="text-sm text-foreground">{data.code}</code>
        </pre>
      )

    case 'quote':
      return (
        <blockquote key={index} className="border-l-4 border-primary pl-4 mb-4 italic text-muted-foreground">
          {data.text}
          {data.caption && (
            <cite className="block mt-2 text-sm not-italic">— {data.caption}</cite>
          )}
        </blockquote>
      )

    default:
      return (
        <div key={index} className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Unsupported block type: {type}</p>
        </div>
      )
  }
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Check if content is Editor.js JSON or Markdown
  const isEditorJS = post.content.startsWith('{') && post.content.includes('"blocks"')
  const editorBlocks = isEditorJS ? parseEditorJSContent(post.content) : []

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    // Animate content sections
    const sections = content.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, .table-wrapper')

    gsap.fromTo(sections,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: content,
          start: 'top bottom-=100',
          toggleActions: 'play none none reverse'
        }
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === content) {
          trigger.kill()
        }
      })
    }
  }, [])

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const components: Components = {
    // Headings with anchor links
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-bold text-foreground mt-8 mb-4 scroll-mt-20" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-20" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-xl font-semibold text-foreground mt-6 mb-3 scroll-mt-20" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-lg font-semibold text-foreground mt-6 mb-3 scroll-mt-20" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="text-base font-semibold text-foreground mt-4 mb-2 scroll-mt-20" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="text-sm font-semibold text-foreground mt-4 mb-2 scroll-mt-20" {...props}>
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children, ...props }) => (
      <p className="text-foreground leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),

    // Links
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    ),

    // Lists
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-foreground" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-primary pl-6 py-4 my-8 bg-background/5 backdrop-blur-sm rounded-r-xl italic text-muted-foreground shadow-sm" {...props}>
        {children}
      </blockquote>
    ),

    // Code blocks
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''

      // Ensure children is properly converted to string
      let codeString = ''
      if (typeof children === 'string') {
        codeString = children
      } else if (Array.isArray(children)) {
        codeString = children.join('')
      } else {
        codeString = String(children)
      }
      codeString = codeString.replace(/\n$/, '')

      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`

      if (match) {
        return (
          <div className="relative group my-8 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#282c34]">
            <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{language}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-muted-foreground hover:text-white"
                onClick={() => copyToClipboard(codeString, codeId)}
              >
                {copiedCode === codeId ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!mt-0 !bg-transparent !p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              customStyle={{ margin: 0, background: 'transparent' }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        )
      }

      return (
        <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/20" {...props}>
          {typeof children === 'string' ? children : String(children)}
        </code>
      )
    },

    // Tables
    table: ({ children, ...props }) => (
      <div className="table-wrapper overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold text-foreground" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border px-4 py-2 text-foreground" {...props}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: ({ ...props }) => (
      <hr className="my-8 border-border" {...props} />
    ),

    // Images
    img: ({ src, alt, ...props }) => (
      <div className="my-6">
        <img
          src={src}
          alt={alt}
          className="w-full rounded-lg border border-border"
          loading="lazy"
          {...props}
        />
        {alt && (
          <p className="text-sm text-muted-foreground text-center mt-2 italic">
            {alt}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Reading Progress */}
      <ReadingProgress />

      {/* Main Content */}
      <div ref={contentRef} className="prose prose-lg max-w-none">
        {isEditorJS ? (
          // Render Editor.js content
          <div className="space-y-4">
            {editorBlocks.map((block, index) =>
              renderEditorJSBlock(block, index)
            )}
          </div>
        ) : (
          // Render Markdown content
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
          >
            {post.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
