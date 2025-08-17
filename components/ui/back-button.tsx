'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackButtonProps {
  className?: string
  children?: React.ReactNode
}

export function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <Button 
      variant="outline" 
      size="lg" 
      className={`w-full sm:w-auto ${className}`}
      onClick={handleBack}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {children || 'Go Back'}
    </Button>
  )
}
