'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import BlogArticleBody from './blog-article-body'
import { ReadingProgress } from './reading-progress'
import type { BlogPostWithRelations } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

interface BlogPostContentProps {
  post: BlogPostWithRelations
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={contentRef} className="relative min-w-0 max-w-full overflow-hidden">
      <ReadingProgress />
      <BlogArticleBody content={post.content} />
    </div>
  )
}
