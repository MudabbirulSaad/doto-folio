'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Mail, Bell, Zap, BookOpen } from 'lucide-react'

export function SubscribeHero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    const description = descriptionRef.current
    const features = featuresRef.current

    if (!hero) return

    // Set initial states
    gsap.set([title, description, features], { opacity: 0, y: 30 })

    // Animation timeline
    const tl = gsap.timeline({ delay: 0.2 })

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out'
    })
    .to(description, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.4')
    .to(features, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.3')

    // Animate feature cards
    const featureCards = features?.querySelectorAll('.feature-card')
    if (featureCards) {
      gsap.fromTo(featureCards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          delay: 0.8
        }
      )
    }
  }, [])

  return (
    <section ref={heroRef} className="relative py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Mail className="w-4 h-4" />
              Newsletter Subscription
            </div>
            
            <h1 ref={titleRef} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Stay Updated with{' '}
              <span className="text-primary">Latest Insights</span>
            </h1>
            
            <p ref={descriptionRef} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get notified when I publish new articles about AI, technology trends, and development insights. 
              Join a community of developers and tech enthusiasts.
            </p>
          </div>

          {/* Features */}
          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="feature-card p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Instant Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to know when new articles are published
              </p>
            </div>

            <div className="feature-card p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Curated Content</h3>
              <p className="text-sm text-muted-foreground">
                Handpicked insights on AI, technology, and development
              </p>
            </div>

            <div className="feature-card p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Deep Dives</h3>
              <p className="text-sm text-muted-foreground">
                In-depth tutorials and technical insights you won&apos;t find elsewhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
