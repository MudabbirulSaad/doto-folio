'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { TrendingUp, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlogCard } from './blog-card'
import type { BlogHeroProps } from '@/lib/types/blog'

gsap.registerPlugin(ScrollTrigger)

export function BlogHero({
  title = "Blog & Insights",
  description = "Exploring AI, technology trends, and development insights through detailed articles and tutorials.",
  featuredPosts = [],
  className = ''
}: BlogHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    const titleEl = titleRef.current
    const descEl = descriptionRef.current
    const searchEl = searchRef.current
    const statsEl = statsRef.current
    const featuredEl = featuredRef.current

    if (!hero) return

    // Initial states
    gsap.set([titleEl, descEl, searchEl, statsEl], { opacity: 0, y: 30 })
    gsap.set(featuredEl, { opacity: 0, y: 50 })

    // Animation timeline
    const tl = gsap.timeline({ delay: 0.2 })

    tl.to(titleEl, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out'
    })
      .to(descEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.4')
      .to(searchEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3')
      .to(statsEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3')
      .to(featuredEl, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, '-=0.2')

    // Parallax effect for hero background
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress
        gsap.to(hero, {
          y: progress * 100,
          duration: 0.3,
          ease: 'none'
        })
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === hero) {
          trigger.kill()
        }
      })
    }
  }, [])



  return (
    <section ref={heroRef} className={`relative py-20 md:py-32 overflow-hidden ${className}`}>
      {/* Background Elements - Removed for Nebula visibility */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" /> */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" /> */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,107,107,0.1),transparent_50%)]" /> */}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Title */}
          <h1
            ref={titleRef}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight drop-shadow-lg"
          >
            {title}
          </h1>

          {/* Description */}
          <p
            ref={descriptionRef}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium"
          >
            {description}
          </p>

          {/* Call to Action */}
          <div ref={searchRef} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <a href="#featured">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Articles
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#latest">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Latest Posts
                </a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{featuredPosts.length}+ Articles</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>AI & Tech Focus</span>
            </div>
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div ref={featuredRef} className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Featured Articles
              </h2>
              <p className="text-muted-foreground">
                Handpicked insights and deep dives into the latest in AI and technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {featuredPosts.slice(0, 3).map((post, index) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  variant={index === 0 ? 'featured' : 'default'}
                  showCategory={true}
                  showTags={false}
                  showAuthor={false}
                  showReadingTime={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
