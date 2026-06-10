'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RichContentRenderer } from '@/components/markdown/markdown-renderer'
import { ReadingProgress } from './reading-progress'
import type { BlogPostWithRelations } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

interface BlogPostContentProps {
  post: BlogPostWithRelations
}

const portfolioCodeTheme = {
  ...oneDark,
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    color: 'var(--foreground)',
    textShadow: 'none'
  },
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    color: 'var(--foreground)',
    textShadow: 'none'
  },
  comment: {
    color: 'var(--muted-foreground)',
    fontStyle: 'italic'
  },
  prolog: {
    color: 'var(--muted-foreground)'
  },
  doctype: {
    color: 'var(--muted-foreground)'
  },
  cdata: {
    color: 'var(--muted-foreground)'
  },
  punctuation: {
    color: 'var(--muted-foreground)'
  },
  property: {
    color: 'var(--primary)'
  },
  tag: {
    color: 'var(--primary)'
  },
  boolean: {
    color: 'var(--primary)'
  },
  number: {
    color: 'var(--primary)'
  },
  constant: {
    color: 'var(--primary)'
  },
  symbol: {
    color: 'var(--primary)'
  },
  selector: {
    color: 'var(--secondary-foreground)'
  },
  'attr-name': {
    color: 'var(--secondary-foreground)'
  },
  string: {
    color: 'var(--secondary-foreground)'
  },
  char: {
    color: 'var(--secondary-foreground)'
  },
  builtin: {
    color: 'var(--secondary-foreground)'
  },
  inserted: {
    color: 'var(--secondary-foreground)'
  },
  operator: {
    color: 'var(--foreground)'
  },
  entity: {
    color: 'var(--foreground)'
  },
  url: {
    color: 'var(--primary)'
  },
  variable: {
    color: 'var(--foreground)'
  },
  atrule: {
    color: 'var(--primary)'
  },
  'attr-value': {
    color: 'var(--secondary-foreground)'
  },
  function: {
    color: 'var(--primary)'
  },
  'class-name': {
    color: 'var(--foreground)'
  },
  keyword: {
    color: 'var(--primary)'
  },
  regex: {
    color: 'var(--secondary-foreground)'
  },
  important: {
    color: 'var(--primary)',
    fontWeight: '600'
  }
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

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

  const renderCodeBlock = (code: string, language: string, id: string) => {
    const codeString = code.replace(/\n$/, '')

    return (
      <div key={id} className="group relative my-8 overflow-hidden rounded-xl border border-border bg-background/5 shadow-sm shadow-black/10">
        <div className="flex items-center justify-between border-b border-border bg-card/30 px-4 py-1.5">
          <span className="font-mono text-[0.65rem] font-medium uppercase text-muted-foreground/80">{language || 'code'}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/40 hover:text-foreground group-hover:opacity-100"
            onClick={() => copyToClipboard(codeString, id)}
          >
            {copiedCode === id ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
        <SyntaxHighlighter
          style={portfolioCodeTheme}
          language={language || 'text'}
          PreTag="div"
          className="!mt-0 overflow-x-auto !bg-transparent !p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          customStyle={{ margin: 0, background: 'transparent' }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <div className="relative">
      <ReadingProgress />

      <div ref={contentRef} className="prose prose-lg max-w-none">
        <RichContentRenderer
          content={post.content}
          policy="trustedBlog"
          mode="blog"
          renderCodeBlock={renderCodeBlock}
        />
      </div>
    </div>
  )
}
