'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Mail, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableOfContents } from './table-of-contents'
import type { BlogPostWithRelations } from '@/lib/types/blog'

interface BlogPostSidebarProps {
  post: BlogPostWithRelations
}

export function BlogPostSidebar({ post }: BlogPostSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const cards = sidebar.querySelectorAll('.sidebar-card')

    // Staggered animation for sidebar cards
    gsap.fromTo(cards,
      { opacity: 0, x: 20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        delay: 0.3
      }
    )
  }, [])



  return (
    <div ref={sidebarRef} className="relative">
      {/* Sidebar Container */}
      <div className="space-y-6">
        {/* Table of Contents */}
        <TableOfContents content={post.content} className="sidebar-card" />

        {/* Stay Updated Card */}
        <Card className="sidebar-card bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Stay Updated
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get notified when I publish new articles about AI, technology, and development.
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/subscribe">
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
