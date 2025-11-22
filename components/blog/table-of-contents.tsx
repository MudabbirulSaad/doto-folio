'use client'

import { useEffect, useState, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { List, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TOCItem } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

interface TableOfContentsProps {
  content: string
  className?: string
}

export function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const tocRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Extract headings from content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const items: TOCItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      items.push({
        id,
        title,
        level,
        children: []
      })
    }

    setTocItems(items)
  }, [content])

  useEffect(() => {
    if (tocItems.length === 0) return

    // Create intersection observer for active heading
    const headingElements = tocItems.map(item =>
      document.getElementById(item.id)
    ).filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((top, entry) =>
            entry.boundingClientRect.top < top.boundingClientRect.top ? entry : top
          )
          setActiveId(topEntry.target.id)
        }
      },
      {
        rootMargin: '-120px 0% -35% 0%',
        threshold: 0
      }
    )

    headingElements.forEach(element => {
      if (element) observer.observe(element)
    })

    return () => {
      headingElements.forEach(element => {
        if (element) observer.unobserve(element)
      })
    }
  }, [tocItems])

  useEffect(() => {
    const toc = tocRef.current
    if (!toc) return

    // Animate TOC appearance
    gsap.fromTo(toc,
      { opacity: 0, x: 20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.5
      }
    )
  }, [])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 120 // Account for fixed header and padding
      const elementPosition = element.offsetTop - offset

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  if (tocItems.length === 0) {
    return null
  }

  return (
    <Card ref={tocRef} className={`bg-background/5 backdrop-blur-md border-white/10 shadow-[0_0_20px_-10px_rgba(var(--primary),0.1)] transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <List className="w-4 h-4 text-primary" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <nav className="space-y-1">
          {tocItems.map((item) => {
            const isActive = activeId === item.id
            const paddingLeft = (item.level - 1) * 12

            return (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`
                  w-full text-left text-sm py-1.5 px-2 rounded-md transition-all duration-200
                  hover:bg-white/5 hover:text-foreground
                  ${isActive
                    ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary shadow-[0_0_10px_-5px_rgba(var(--primary),0.3)]'
                    : 'text-muted-foreground hover:text-foreground border-l-2 border-transparent'
                  }
                `}
                style={{ paddingLeft: `${paddingLeft + 8}px` }}
              >
                <div className="flex items-center gap-2">
                  {item.level > 1 && (
                    <ChevronRight className={`w-3 h-3 transition-transform ${isActive ? 'text-primary opacity-100' : 'opacity-30'}`} />
                  )}
                  <span className="line-clamp-2 leading-tight">
                    {item.title}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
