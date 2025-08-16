"use client"

import { useState, useEffect } from "react"

interface ProtectedEmailProps {
  user: string
  domain: string
  className?: string
  children?: React.ReactNode
}

export function ProtectedEmail({ user, domain, className, children }: ProtectedEmailProps) {
  const [email, setEmail] = useState<string>("")
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    // Only reveal email on client-side to prevent scraping
    if (typeof window !== 'undefined') {
      setEmail(`${user}@${domain}`)
    }
  }, [user, domain])

  const handleClick = () => {
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }

  const handleReveal = () => {
    setIsRevealed(true)
  }

  if (!email) {
    return <span className={className}>Loading...</span>
  }

  return (
    <span 
      className={`cursor-pointer ${className}`}
      onClick={isRevealed ? handleClick : handleReveal}
      title={isRevealed ? `Send email to ${email}` : "Click to reveal email"}
    >
      {isRevealed ? (
        children || email
      ) : (
        children || `${user}[at]${domain.replace('.', '[dot]')}`
      )}
    </span>
  )
}

// Helper function to encode email for anti-spam
export function encodeEmail(email: string): string {
  return email
    .split('')
    .map(char => `&#${char.charCodeAt(0)};`)
    .join('')
}

// Component for displaying encoded email
export function EncodedEmail({ email, className }: { email: string; className?: string }) {
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: encodeEmail(email) }}
    />
  )
}
