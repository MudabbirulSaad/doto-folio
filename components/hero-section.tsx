"use client"

import { useEffect, useState } from "react"
import { AnimatedHeroTitle, AnimatedButton } from "./animations"
import { HeroAnimation } from "./hero-animation"

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
        const response = await fetch('/api/site-content')
        if (response.ok) {
          const result = await response.json()
          setContent(result.data)
        } else {
          throw new Error(`Failed to fetch content: ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching hero content:', error)
        // Fallback to default content if API fails
        setContent({
          hero_title: 'I build beautiful and intelligent digital experiences.',
          hero_subtitle: undefined,
          hero_cta_text: 'Explore My Work',
          hero_cta_link: '#projects'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])
  return (
    <section
      id="home"
      className="relative h-screen pt-24 md:pt-32 overflow-hidden"
      aria-label="Hero section introducing Mudabbirul Saad"
      role="banner"
    >
      {/* Fallback Background Gradient (visible while WebGL loads) */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/80 z-0 pointer-events-none" />

      {/* WebGL Interactive Background */}
      <HeroAnimation />

      {/* Hero Content */}
      <div className="absolute inset-x-0 top-[90%] -translate-y-full lg:top-auto lg:bottom-0 lg:translate-y-0 z-10">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16 pb-8 lg:pb-16 xl:pb-24">
          <div className="max-w-5xl">
            {!loading && content && (
              <AnimatedHeroTitle
                text={content.hero_title}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-[1.1] mb-8 sm:mb-12 font-serif drop-shadow-lg"
                delay={0.8}
              />
            )}

            {!loading && content?.hero_subtitle && (
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl drop-shadow-md font-medium">
                {content.hero_subtitle}
              </p>
            )}

            {!loading && content && (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <AnimatedButton
                  delay={2.5}
                  className="group relative px-8 py-4 bg-background/5 hover:bg-background/10 backdrop-blur-md border border-white/10 hover:border-primary/50 text-foreground transition-all duration-500 overflow-hidden rounded-full"
                  onClick={() => {
                    const targetId = content.hero_cta_link?.replace('#', '') || 'projects'
                    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2 font-medium tracking-wide">
                    {content.hero_cta_text}
                    <svg
                      className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>

                  {/* Gradient Glow Effect */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  {/* Button Shadow/Glow */}
                  <div className="absolute inset-0 -z-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_30px_-5px_rgba(var(--primary),0.3)]" />
                </AnimatedButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
