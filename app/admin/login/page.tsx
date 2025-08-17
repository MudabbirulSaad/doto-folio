'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAdmin, isAuthenticated } from '@/lib/auth/admin'
import { useReCaptcha, ReCaptchaProvider } from 'next-recaptcha-v3'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield } from 'lucide-react'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // reCAPTCHA v3 hook
  const { executeRecaptcha, loaded } = useReCaptcha()

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        router.push('/admin/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Generate reCAPTCHA v3 token
      if (!executeRecaptcha) {
        setError('reCAPTCHA not loaded. Please refresh the page.')
        setIsLoading(false)
        return
      }

      const recaptchaToken = await executeRecaptcha('admin_login')

      // Verify reCAPTCHA server-side
      const recaptchaResponse = await fetch('/api/admin/auth/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaToken }),
      })

      const recaptchaResult = await recaptchaResponse.json()

      if (!recaptchaResult.success) {
        setError('Security verification failed. Please try again.')
        setIsLoading(false)
        return
      }

      const result = await loginAdmin({ email, password })

      if (result.success) {
        router.push('/admin/dashboard')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Access the SAAD Portfolio admin dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 h-12"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* reCAPTCHA v3 Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">
                    {loaded ? (
                      <span className="text-green-600">🔒 Security verification ready</span>
                    ) : (
                      <span>Loading security verification...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isLoading || !email || !password || !loaded}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying & Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Secure admin access for SAAD Portfolio
            </p>
          </div>
        </div>

        {/* Back to Portfolio */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Portfolio
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <ReCaptchaProvider>
      <AdminLoginForm />
    </ReCaptchaProvider>
  )
}
