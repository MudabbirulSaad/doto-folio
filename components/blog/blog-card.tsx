'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { Calendar, Clock, Eye, User, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { BlogCardProps, BlogTag } from '@/lib/types/blog'

function getCardTag(tag: BlogTag | { tag: BlogTag }): BlogTag {
  return 'tag' in tag ? tag.tag : tag
}

gsap.registerPlugin(ScrollTrigger)

export function BlogCard({
  post,
  variant = 'default',
  showCategory = true,
  showTags = true,
  showAuthor = true,
  showReadingTime = true,
  className = ''
}: BlogCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const image = imageRef.current

    if (!card) return

    // Initial state
    gsap.set(card, { opacity: 0, y: 30 })

    // Scroll trigger animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top bottom-=100',
        end: 'bottom top',
        toggleActions: 'play none none reverse'
      }
    })

    tl.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    })

    // Hover animations
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -8,
        duration: 0.3,
        ease: 'power2.out'
      })

      if (image) {
        gsap.to(image, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out'
        })
      }
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })

      if (image) {
        gsap.to(image, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        })
      }
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === card) {
          trigger.kill()
        }
      })
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const cardVariants = {
    default: 'h-full',
    featured: 'h-full md:col-span-2 lg:col-span-2',
    compact: 'h-auto'
  }

  const imageVariants = {
    default: 'aspect-[16/10]',
    featured: 'aspect-[16/9]',
    compact: 'aspect-[16/10]'
  }

  return (
    <Card
      ref={cardRef}
      className={`group cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.2)] border-white/10 hover:border-primary/50 bg-background/5 backdrop-blur-md ${cardVariants[variant]} ${className}`}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* Featured Image */}
        {post.featured_image && (
          <div className={`relative overflow-hidden rounded-t-lg ${imageVariants[variant]}`}>
            <div ref={imageRef} className="w-full h-full">
              <Image
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                fill
                className="object-cover transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>

            {/* Category Badge */}
            {showCategory && post.category && (
              <div className="absolute top-4 left-4">
                <Badge
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-sm text-foreground border-0"
                  style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
                >
                  {post.category.name}
                </Badge>
              </div>
            )}

            {/* Featured Badge */}
            {post.featured && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="space-y-2">
            {/* Meta Information */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {showAuthor && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{post.author_name}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>

              {showReadingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{post.reading_time} min read</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{post.view_count}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 font-display ${variant === 'featured' ? 'text-xl md:text-2xl' : 'text-lg'
              }`}>
              {post.title}
            </h3>
          </div>
        </CardHeader>

        <CardContent ref={contentRef} className="pt-0">
          {/* Excerpt */}
          <p className={`text-muted-foreground mb-4 ${variant === 'featured' ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'
            }`}>
            {post.excerpt}
          </p>

          {/* Tags */}
          {showTags && post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {post.tags.slice(0, 3).map((tag) => {
                const displayTag = getCardTag(tag)
                return (
                <Badge
                  key={displayTag.id}
                  variant="outline"
                  className="text-xs border-border/50 hover:border-primary/50 transition-colors"
                >
                  {displayTag.name}
                </Badge>
                )
              })}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-border/50">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
