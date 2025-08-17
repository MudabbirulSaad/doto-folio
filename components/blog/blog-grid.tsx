'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { BlogCard } from './blog-card'
import type { BlogPost } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

interface BlogGridProps {
  posts: BlogPost[]
  className?: string
}

export function BlogGrid({ posts, className = '' }: BlogGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const cards = grid.querySelectorAll('.blog-card')

    // Staggered animation for cards
    gsap.fromTo(cards,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: grid,
          start: 'top bottom-=100',
          toggleActions: 'play none none reverse'
        }
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === grid) {
          trigger.kill()
        }
      })
    }
  }, [posts])

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">No articles found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse all articles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={gridRef}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {posts.map((post) => (
        <div key={post.id} className="blog-card">
          <BlogCard
            post={post}
            variant="default"
            showCategory={true}
            showTags={true}
            showAuthor={true}
            showReadingTime={true}
          />
        </div>
      ))}
    </div>
  )
}
