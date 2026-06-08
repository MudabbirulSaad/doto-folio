'use client'

import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { subscribeToNewsletterForm } from '@/lib/client/application/subscriptions/newsletter-form'
import { createNewsletterSubscriptionApiGateway } from '@/lib/client/adapters/http/subscription-api'

interface SubscribeFormData {
  name: string
  email: string
}

export function SubscribeForm() {
  const [formData, setFormData] = useState<SubscribeFormData>({
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const form = formRef.current
    if (!form) return

    gsap.fromTo(form,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.3
      }
    )
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear message when user starts typing
    if (message) setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await subscribeToNewsletterForm(createNewsletterSubscriptionApiGateway(), formData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to subscribe')
      }

      // Success
      setIsSubscribed(true)
      setMessage({
        type: 'success',
        text: 'Successfully subscribed! You\'ll receive notifications for new articles.'
      })

      // Animate success state
      if (successRef.current) {
        gsap.fromTo(successRef.current,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.7)'
          }
        )
      }

    } catch (error) {
      console.error('Subscription error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to subscribe. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <div ref={successRef} className="text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Welcome to the Newsletter!</h2>
          <p className="text-muted-foreground">
            Thank you for subscribing. You&apos;ll receive notifications whenever I publish new articles.
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/blog'}
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          Browse Articles
        </Button>
      </div>
    )
  }

  return (
    <Card ref={formRef} className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground">Subscribe to Newsletter</CardTitle>
        <CardDescription className="text-muted-foreground">
          Join the community and never miss an update
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Name (Optional)
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Message */}
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading || !formData.email}
            className="w-full gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {isLoading ? 'Subscribing...' : 'Subscribe to Newsletter'}
          </Button>

          {/* Privacy Note */}
          <p className="text-xs text-muted-foreground text-center">
            By subscribing, you agree to receive email notifications about new articles. 
            You can unsubscribe at any time. We respect your privacy and won&apos;t share your email.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
