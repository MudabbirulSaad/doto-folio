"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  animation?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scale"
  delay?: number
  duration?: number
}

export function AnimatedSection({ 
  children, 
  className = "", 
  animation = "fadeUp",
  delay = 0,
  duration = 0.8
}: AnimatedSectionProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Set initial state based on animation type
    const initialState = {
      fadeUp: { opacity: 0, y: 50 },
      fadeIn: { opacity: 0 },
      slideLeft: { opacity: 0, x: -50 },
      slideRight: { opacity: 0, x: 50 },
      scale: { opacity: 0, scale: 0.8 }
    }

    const finalState = {
      fadeUp: { opacity: 1, y: 0 },
      fadeIn: { opacity: 1 },
      slideLeft: { opacity: 1, x: 0 },
      slideRight: { opacity: 1, x: 0 },
      scale: { opacity: 1, scale: 1 }
    }

    // Set initial state
    gsap.set(element, initialState[animation])

    // Create animation with ScrollTrigger
    gsap.to(element, {
      ...finalState[animation],
      duration,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === element) {
          trigger.kill()
        }
      })
    }
  }, [animation, delay, duration])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedCard({ children, className = "", delay = 0 }: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    // Set initial state
    gsap.set(card, { opacity: 0, y: 30, scale: 0.95 })

    // Create staggered animation
    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        toggleActions: "play none none reverse"
      }
    })

    // Add hover animations
    const handleMouseEnter = () => {
      gsap.to(card, {
        scale: 1.02,
        y: -5,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    card.addEventListener("mouseenter", handleMouseEnter)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter)
      card.removeEventListener("mouseleave", handleMouseLeave)
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === card) {
          trigger.kill()
        }
      })
    }
  }, [delay])

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  )
}

// Hook for button hover animations
export function useButtonAnimation() {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      })
    }

    const handleMouseDown = () => {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out"
      })
    }

    const handleMouseUp = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.1,
        ease: "power2.out"
      })
    }

    button.addEventListener("mouseenter", handleMouseEnter)
    button.addEventListener("mouseleave", handleMouseLeave)
    button.addEventListener("mousedown", handleMouseDown)
    button.addEventListener("mouseup", handleMouseUp)

    return () => {
      button.removeEventListener("mouseenter", handleMouseEnter)
      button.removeEventListener("mouseleave", handleMouseLeave)
      button.removeEventListener("mousedown", handleMouseDown)
      button.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return buttonRef
}

interface AnimatedHeroTitleProps {
  text: string
  className?: string
  delay?: number
}

export function AnimatedHeroTitle({ text, className = "", delay = 0 }: AnimatedHeroTitleProps) {
  const containerRef = useRef<HTMLHeadingElement>(null)
  const wordsRef = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const words = wordsRef.current.filter(Boolean)
    if (words.length === 0) return

    // Set initial state for container and words
    gsap.set(container, { opacity: 0 })
    gsap.set(words, {
      opacity: 0,
      y: 60,
      rotationX: 45,
      transformOrigin: "50% 100%"
    })

    // Create timeline for sequential word animation
    const tl = gsap.timeline({
      delay,
      scrollTrigger: {
        trigger: container,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    })

    // First, fade in the container
    tl.to(container, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    // Then animate each word with staggered timing
    words.forEach((word, index) => {
      tl.to(word, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.9,
        ease: "power3.out"
      }, 0.2 + (index * 0.12)) // Start after container fade + 120ms delay between words
    })

    // Add subtle hover effect for individual words
    words.forEach((word) => {
      const handleMouseEnter = () => {
        gsap.to(word, {
          y: -3,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        })
      }

      const handleMouseLeave = () => {
        gsap.to(word, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        })
      }

      word.addEventListener("mouseenter", handleMouseEnter)
      word.addEventListener("mouseleave", handleMouseLeave)
    })

    return () => {
      // Clean up event listeners
      words.forEach((word) => {
        word.removeEventListener("mouseenter", () => {})
        word.removeEventListener("mouseleave", () => {})
      })

      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
          trigger.kill()
        }
      })
    }
  }, [delay])

  // Split text into words and create spans
  const words = text.split(' ')

  return (
    <h1 ref={containerRef} className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) wordsRef.current[index] = el
          }}
          className="inline-block mr-[0.25em] last:mr-0 cursor-pointer transition-colors duration-300 hover:text-primary"
        >
          {word}
        </span>
      ))}
    </h1>
  )
}

interface AnimatedButtonProps {
  children: React.ReactNode
  className?: string
  delay?: number
  onClick?: () => void
}

export function AnimatedButton({
  children,
  className = "",
  delay = 0,
  onClick
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    // Create a timeline for better control
    const tl = gsap.timeline()

    // Set initial state immediately
    tl.set(button, {
      opacity: 0,
      y: 60,
      rotationX: 45,
      transformOrigin: "50% 100%"
    })
    // Add the animation at the specified delay
    .to(button, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 0.9,
      ease: "power3.out"
    }, delay)

    // Add hover animations
    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        y: -3,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    button.addEventListener("mouseenter", handleMouseEnter)
    button.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      tl.kill()
      button.removeEventListener("mouseenter", handleMouseEnter)
      button.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [delay])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`text-base sm:text-lg px-8 py-6 h-auto font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ${className}`}
      style={{
        opacity: 0
      }}
    >
      {children}
    </button>
  )
}

interface AnimatedNavbarProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedNavbar({ children, className = "", delay = 0 }: AnimatedNavbarProps) {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    // Set initial state - navbar starts below screen
    gsap.set(nav, {
      opacity: 0,
      y: 100,
      scale: 0.95
    })

    // Create animation - slide up from bottom
    gsap.to(nav, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      delay,
      ease: "power3.out"
    })

    return () => {
      // Cleanup if needed
    }
  }, [delay])

  return (
    <header ref={navRef} className={className}>
      {children}
    </header>
  )
}

export function PageLoadingOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    // Set initial state - full black screen
    gsap.set(overlay, {
      opacity: 1,
      zIndex: 9999
    })

    // Fade out the overlay as navbar starts animating
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.8,
      delay: 0.1,
      ease: "power2.out",
      onComplete: () => {
        // Remove from DOM after animation
        overlay.style.display = 'none'
      }
    })

    return () => {
      // Cleanup if needed
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black z-[9999] pointer-events-none"
      style={{ opacity: 1 }}
    />
  )
}
