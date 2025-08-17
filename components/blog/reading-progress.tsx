'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article')
      if (!article) return

      const articleTop = article.offsetTop
      const articleHeight = article.offsetHeight
      const windowHeight = window.innerHeight
      const scrollTop = window.scrollY

      const articleStart = articleTop - windowHeight / 2
      const articleEnd = articleTop + articleHeight - windowHeight / 2

      if (scrollTop < articleStart) {
        setProgress(0)
      } else if (scrollTop > articleEnd) {
        setProgress(100)
      } else {
        const progressPercent = ((scrollTop - articleStart) / (articleEnd - articleStart)) * 100
        setProgress(Math.min(100, Math.max(0, progressPercent)))
      }
    }

    // Initial calculation
    updateProgress()

    // Update on scroll
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <>
      {/* Fixed progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background/80 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating progress indicator */}
      <div className="fixed bottom-8 right-8 z-40 hidden lg:block">
        <div className="relative w-12 h-12">
          <svg
            className="w-12 h-12 transform -rotate-90"
            viewBox="0 0 36 36"
          >
            <path
              className="text-muted/20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
