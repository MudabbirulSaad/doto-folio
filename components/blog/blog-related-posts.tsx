'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlogCard } from './blog-card'
import type { BlogPost } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

interface BlogRelatedPostsProps {
  posts: BlogPost[]
  className?: string
}

export function BlogRelatedPosts({ posts, className = '' }: BlogRelatedPostsProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const title = titleRef.current
    const grid = gridRef.current

    if (!section) return

    // Initial states
    gsap.set([title, grid], { opacity: 0, y: 30 })

    // Animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse'
      }
    })

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    })
    .to(grid, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.3')

    // Animate individual cards
    const cards = grid?.querySelectorAll('.related-post-card')
    if (cards) {
      gsap.fromTo(cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          delay: 0.3,
          scrollTrigger: {
            trigger: grid,
            start: 'top bottom-=50',
            toggleActions: 'play none none reverse'
          }
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === section || trigger.trigger === grid) {
          trigger.kill()
        }
      })
    }
  }, [posts])

  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <section ref={sectionRef} className={`space-y-8 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 ref={titleRef} className="text-2xl md:text-3xl font-bold text-foreground font-display">
          Related Articles
        </h2>
        <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/blog">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Posts Grid */}
      <div 
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {posts.slice(0, 3).map((post) => (
          <div key={post.id} className="related-post-card">
            <BlogCard
              post={post}
              variant="compact"
              showCategory={true}
              showTags={false}
              showAuthor={false}
              showReadingTime={true}
            />
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center pt-8 border-t border-border/50">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-semibold text-foreground font-display">
            Enjoyed this article?
          </h3>
          <p className="text-sm text-muted-foreground">
            Explore more insights on AI, technology, and development in my blog.
          </p>
          <Button asChild>
            <Link href="/blog">
              Browse All Articles
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
