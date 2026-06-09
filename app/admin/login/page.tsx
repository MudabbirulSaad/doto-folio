'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAdmin, isAuthenticated } from '@/lib/auth/admin'
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, ArrowLeft } from 'lucide-react'
import { SectionNebula } from '@/components/section-nebula'
import { motion } from 'framer-motion'
import { createAdminRecaptchaApiGateway } from '@/lib/client/adapters/http/admin-recaptcha-api'
import { verifyAdminRecaptcha } from '@/lib/client/application/admin/recaptcha'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const recaptchaGateway = useMemo(() => createAdminRecaptchaApiGateway(), [])

  // reCAPTCHA v3 hook
  const { executeRecaptcha } = useGoogleReCaptcha()

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

      const recaptchaResult = await verifyAdminRecaptcha(recaptchaGateway, recaptchaToken)

      if (!recaptchaResult.success) {
        setError(recaptchaResult.error)
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Cosmic Background */}
      <SectionNebula className="fixed inset-0 z-0 opacity-80 h-full w-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6 border border-primary/20 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
          >
            <Lock className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2 tracking-tight"
          >
            Admin Access
          </motion.h1>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/60"
          >
            Authenticate to manage your portfolio
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-black/40 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/80">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:bg-white/10 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/80">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:bg-white/10 transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* reCAPTCHA v3 Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-white/60">
                    <span className="text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Security verification active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </motion.div>

        {/* Back to Portfolio */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-white/40 hover:text-white hover:bg-white/5 gap-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Portfolio
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
      <AdminLoginForm />
    </GoogleReCaptchaProvider>
  )
}
