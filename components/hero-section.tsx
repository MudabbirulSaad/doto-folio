"use client"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section id="home" className="relative h-screen pt-24 md:pt-32">
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-[1.1] mb-8 sm:mb-12 font-serif">
              I build beautiful and intelligent digital experiences.
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Button
                size="lg"
                className="text-base sm:text-lg px-8 py-6 h-auto font-medium"
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore My Work
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
