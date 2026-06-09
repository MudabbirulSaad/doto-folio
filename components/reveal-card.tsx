"use client"

import { useCallback, useRef, useEffect, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RevealCardProps {
  children: ReactNode
  className?: string
  as?: "div" | "a"
  href?: string
  target?: string
  rel?: string
}

export function RevealCard({ 
  children, 
  className = "", 
  as: Component = "div",
  href,
  target,
  rel
}: RevealCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const setCardRef = useCallback((node: HTMLElement | null) => {
    cardRef.current = node
  }, [])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const updatePosition = (clientX: number, clientY: number) => {
      const rect = card.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 100
      const y = ((clientY - rect.top) / rect.height) * 100

      card.style.setProperty('--mouse-x', `${x}%`)
      card.style.setProperty('--mouse-y', `${y}%`)
    }

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY)
    }

    const handleMouseLeave = () => {
      // Reset to center when mouse leaves
      card.style.setProperty('--mouse-x', '50%')
      card.style.setProperty('--mouse-y', '50%')
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        updatePosition(touch.clientX, touch.clientY)
        // Add custom class for reliable mobile styling
        card.classList.add('touch-active')
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        updatePosition(touch.clientX, touch.clientY)
      }
    }

    const handleTouchEnd = () => {
      // Reset to center when touch ends
      card.style.setProperty('--mouse-x', '50%')
      card.style.setProperty('--mouse-y', '50%')
      // Remove custom class
      card.classList.remove('touch-active')
    }

    const handleTouchCancel = () => {
      // Handle touch cancel (when touch is interrupted)
      card.style.setProperty('--mouse-x', '50%')
      card.style.setProperty('--mouse-y', '50%')
      card.classList.remove('touch-active')
    }

    // Desktop mouse events
    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    // Mobile touch events
    card.addEventListener('touchstart', handleTouchStart, { passive: true })
    card.addEventListener('touchmove', handleTouchMove, { passive: true })
    card.addEventListener('touchend', handleTouchEnd, { passive: true })
    card.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
      card.removeEventListener('touchstart', handleTouchStart)
      card.removeEventListener('touchmove', handleTouchMove)
      card.removeEventListener('touchend', handleTouchEnd)
      card.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [])

  const revealClassName = cn("reveal-card", className)

  if (Component === "a") {
    return (
      <a ref={setCardRef} className={revealClassName} href={href} target={target} rel={rel}>
        {children}
      </a>
    )
  }

  return (
    <div ref={setCardRef} className={revealClassName}>
      {children}
    </div>
  )
}

// Specialized components for different use cases
export function RevealContactCard({ children, className = "", ...props }: Omit<RevealCardProps, 'as'>) {
  return (
    <RevealCard 
      as="div"
      className={cn(
        "bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500 group",
        className
      )}
      {...props}
    >
      {children}
    </RevealCard>
  )
}

export function RevealSocialCard({ children, className = "", ...props }: Omit<RevealCardProps, 'as'>) {
  return (
    <RevealCard 
      as="div"
      className={cn(
        "bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 hover:bg-background/90 transition-all duration-300 group",
        className
      )}
      {...props}
    >
      {children}
    </RevealCard>
  )
}

export function RevealInfoCard({ children, className = "", ...props }: Omit<RevealCardProps, 'as'>) {
  return (
    <RevealCard 
      as="div"
      className={cn(
        "bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </RevealCard>
  )
}

export function RevealLinkCard({
  children,
  className = "",
  href,
  target,
  rel,
  ...props
}: Omit<RevealCardProps, 'as'> & {
  href?: string
  target?: string
  rel?: string
}) {
  return (
    <RevealCard
      as="a"
      className={cn(
        "block bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500 group cursor-pointer",
        className
      )}
      {...props}
      {...(href && { href })}
      {...(target && { target })}
      {...(rel && { rel })}
    >
      {children}
    </RevealCard>
  )
}
