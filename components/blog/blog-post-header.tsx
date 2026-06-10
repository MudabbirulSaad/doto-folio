'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Calendar, Clock, Eye, ArrowLeft, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { BlogPostWithRelations } from '@/lib/types/blog'

interface BlogPostHeaderProps {
  post: BlogPostWithRelations
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const backButtonRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elements = [backButtonRef.current, categoryRef.current, titleRef.current, metaRef.current, imageRef.current].filter(Boolean)

    // Initial state
    gsap.set(elements, { opacity: 0, y: 30 })

    // Animation timeline
    const tl = gsap.timeline({ delay: 0.2 })

    elements.forEach((element, index) => {
      tl.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, index * 0.1)
    })

    return () => {
      tl.kill()
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${post.slug}`
    const title = post.title
    const text = post.excerpt

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        // You could show a toast notification here
        console.log('URL copied to clipboard')
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }

  return (
    <header ref={headerRef} className="space-y-8 mb-12">
      {/* Back Button */}
      <div ref={backButtonRef}>
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Category under title */}
        {post.category && (
          <div ref={categoryRef}>
            <Link href={`/blog/category/${post.category.slug}`}>
              <Badge
                variant="secondary"
                className="text-sm px-3 py-1 hover:bg-primary/10 transition-colors cursor-pointer backdrop-blur-sm border border-white/10"
                style={{
                  backgroundColor: `${post.category.color}15`,
                  color: post.category.color,
                  borderColor: `${post.category.color}30`
                }}
              >
                {post.category.name}
              </Badge>
            </Link>
          </div>
        )}

        {/* Title */}
        <h1
          ref={titleRef}
          className="max-w-[22rem] sm:max-w-full text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight drop-shadow-lg font-display text-wrap-safe"
        >
          {post.title}
        </h1>

        {/* Meta Information */}
        <div ref={metaRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-10 h-10 flex-shrink-0 border border-white/10 ring-2 ring-background">
                <AvatarImage src={post.author_avatar} alt={post.author_name} />
                <AvatarFallback>
                  {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground truncate">{post.author_name}</div>
                <div className="text-xs truncate opacity-70">{post.author_bio}</div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/10 flex-shrink-0" />

            {/* Meta Items - Stack on mobile, inline on desktop */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Date */}
              <div className="flex items-center gap-2 flex-shrink-0 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="whitespace-nowrap">{formatDate(post.published_at || post.created_at)}</span>
              </div>

              {/* Reading Time */}
              <div className="flex items-center gap-2 flex-shrink-0 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Clock className="w-3.5 h-3.5 text-secondary" />
                <span className="whitespace-nowrap">{post.reading_time} min read</span>
              </div>

              {/* View Count */}
              <div className="flex items-center gap-2 flex-shrink-0 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="whitespace-nowrap">{post.view_count} views</span>
              </div>
            </div>
          </div>

          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2 self-start sm:self-auto flex-shrink-0 border-white/10 hover:bg-white/5 hover:text-primary"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div ref={imageRef} className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-primary/5">
          <Image
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
              <Badge
                variant="outline"
                className="text-xs py-1 px-3 hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer border-white/10 bg-white/5 backdrop-blur-sm"
              >
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
