"use client"

import { useEffect, useState } from "react"
import { AnimatedHeroTitle, AnimatedButton } from "./animations"

interface SiteContent {
  hero_title: string
  hero_subtitle?: string
  hero_cta_text: string
  hero_cta_link: string
}

export function HeroSection() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/admin/content/site')
        if (response.ok) {
          const result = await response.json()
          setContent(result.data)
        } else {
          throw new Error(`Failed to fetch content: ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching hero content:', error)
        // Let the error surface - no fallback
        throw error
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])
  return (
    <section
      id="home"
      className="relative h-screen pt-24 md:pt-32"
      aria-label="Hero section introducing Mudabbirul Saad"
      role="banner"
    >
      {/* Fallback Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />

      {/* Unicorn Studio Interactive Background - positioned as background */}
      <div className="absolute inset-0 z-0">
        <div
          data-us-project="ToMaQaK6KTf3mSOpRM7k"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      </div>

      {/* Hero Content - Mobile: 90% from top, Desktop: bottom positioning */}
      <div className="absolute inset-x-0 top-[90%] -translate-y-full lg:top-auto lg:bottom-0 lg:translate-y-0 z-10">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16 pb-8 lg:pb-16 xl:pb-24">
          <div className="max-w-5xl">
            {!loading && content && (
              <AnimatedHeroTitle
                text={content.hero_title}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-[1.1] mb-8 sm:mb-12 font-serif"
                delay={0.8}
              />
            )}

            {!loading && content?.hero_subtitle && (
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl">
                {content.hero_subtitle}
              </p>
            )}

            {!loading && content && (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <AnimatedButton
                  delay={2.5} // Start after title animation completes (0.8s + 7 words * 0.12s + 0.9s duration)
                  onClick={() => {
                    const targetId = content.hero_cta_link?.replace('#', '') || 'projects'
                    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {content.hero_cta_text}
                </AnimatedButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
