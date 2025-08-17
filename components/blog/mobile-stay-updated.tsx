'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Mail, Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function MobileStayUpdated() {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    // Animate card entrance
    gsap.fromTo(card,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.2
      }
    )
  }, [])

  return (
    <Card ref={cardRef} className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground">Stay Updated</CardTitle>
        <CardDescription className="text-muted-foreground">
          Get notified when I publish new articles about AI, technology, and development.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button asChild size="sm" className="w-full gap-2">
          <Link href="/subscribe">
            <Mail className="w-4 h-4" />
            Subscribe to Newsletter
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Join the community • No spam • Unsubscribe anytime
        </p>
      </CardContent>
    </Card>
  )
}
