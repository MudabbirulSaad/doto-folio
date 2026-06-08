'use client'

import { useState, useEffect } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { Send, Mail, Loader2, LogOut, User, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
    getCurrentSession,
    onCurrentSessionChange,
    setCurrentSession,
    signOutCurrentBrowserSession
} from '@/lib/auth/admin'

interface CommentFormProps {
    postId: string
    onCommentPosted: () => void
    parentId?: string
    onCancelReply?: () => void
}

type AuthState = 'idle' | 'awaiting_code' | 'authenticated'

export function CommentForm({ postId, onCommentPosted, parentId, onCancelReply }: CommentFormProps) {
    const [authState, setAuthState] = useState<AuthState>('idle')
    const [user, setUser] = useState<any>(null)

    // Form States
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [otp, setOtp] = useState('')
    const [content, setContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { executeRecaptcha } = useGoogleReCaptcha()

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            const session = await getCurrentSession()
            if (session?.user) {
                setUser(session.user)
                setAuthState('authenticated')
            }
        }

        checkSession()

        const unsubscribe = onCurrentSessionChange((session) => {
            if (session?.user) {
                setUser(session.user)
                setAuthState('authenticated')
            } else {
                setUser(null)
                setAuthState('idle')
            }
        })

        return unsubscribe
    }, [])

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!executeRecaptcha) {
            toast.error('ReCAPTCHA not ready')
            return
        }

        setIsLoading(true)
        try {
            const token = await executeRecaptcha('otp_request')

            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, captchaToken: token })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to send code')

            toast.success('Verification code sent to your email')
            setAuthState('awaiting_code')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!executeRecaptcha) return

        setIsLoading(true)
        try {
            const token = await executeRecaptcha('otp_verify')

            const res = await fetch('/api/auth/otp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: otp, captchaToken: token })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Invalid code')

            toast.success('Verified successfully!')
            // Session is handled by onAuthStateChange, but we can force update
            await setCurrentSession(data.data.session)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Verification failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)
        try {
            const session = await getCurrentSession()
            if (!session) throw new Error('No active session')

            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    postId,
                    content,
                    userId: user.id,
                    parentId
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to post comment')

            toast.success('Comment posted!')
            setContent('')
            onCommentPosted()
            if (onCancelReply) onCancelReply()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to post comment')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOutCurrentBrowserSession()
        toast.success('Logged out')
        setAuthState('idle')
        setEmail('')
        setName('')
        setOtp('')
    }

    return (
        <div className={cn(
            "bg-background/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg transition-all duration-300",
            parentId && "mt-4 border-primary/20 bg-primary/5"
        )}>
            <AnimatePresence mode="wait">
                {authState === 'idle' && (
                    <motion.form
                        key="idle"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSendCode}
                        className="space-y-4"
                    >
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold mb-2">
                                {parentId ? 'Reply to Comment' : 'Join the Conversation'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Enter your details to verify and comment.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Your Name (Optional)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary/50"
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 focus:border-primary/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            {onCancelReply && (
                                <Button type="button" variant="ghost" onClick={onCancelReply}>
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" disabled={isLoading} className="bg-primary/80 hover:bg-primary w-full sm:w-auto">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                <span className="ml-2">Get Code</span>
                            </Button>
                        </div>
                    </motion.form>
                )}

                {authState === 'awaiting_code' && (
                    <motion.form
                        key="awaiting_code"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleVerifyCode}
                        className="space-y-4"
                    >
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">Check your email</h3>
                            <p className="text-sm text-muted-foreground">
                                We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
                            </p>
                        </div>

                        <div className="max-w-xs mx-auto relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="pl-10 text-center tracking-widest text-lg bg-white/5 border-white/10 focus:border-primary/50"
                                required
                                maxLength={6}
                            />
                        </div>

                        <div className="flex justify-center gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAuthState('idle')}
                                className="text-muted-foreground"
                            >
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading || otp.length !== 6} className="bg-primary/80 hover:bg-primary">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                <span className="ml-2">Verify Code</span>
                            </Button>
                        </div>
                    </motion.form>
                )}

                {authState === 'authenticated' && (
                    <motion.form
                        key="authenticated"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handlePostComment}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                    {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </div>
                                <span>Posting as <span className="text-foreground font-medium">{user.user_metadata?.full_name || user.email}</span></span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs h-8 hover:bg-white/5">
                                <LogOut className="w-3 h-3 mr-2" />
                                Sign Out
                            </Button>
                        </div>

                        <Textarea
                            placeholder={parentId ? "Write a reply..." : "Share your thoughts..."}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[120px] bg-white/5 border-white/10 focus:border-primary/50 resize-none"
                            required
                            autoFocus={!!parentId}
                        />

                        <div className="flex justify-end gap-3">
                            {onCancelReply && (
                                <Button type="button" variant="ghost" onClick={onCancelReply}>
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" disabled={isLoading || !content.trim()} className="bg-primary/80 hover:bg-primary">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                <span className="ml-2">{parentId ? 'Post Reply' : 'Post Comment'}</span>
                            </Button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    )
}
