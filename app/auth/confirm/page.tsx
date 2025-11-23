'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthConfirmPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // The client automatically parses the hash and sets the session
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                // Redirect to the blog or the 'next' param if present
                const params = new URLSearchParams(window.location.search)
                const next = params.get('next') || '/blog'
                router.push(next)
            }
        })

        // Check initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                setError(error.message)
            } else if (session) {
                const params = new URLSearchParams(window.location.search)
                const next = params.get('next') || '/blog'
                router.push(next)
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
                <div className="text-destructive mb-4 font-medium">Authentication Error</div>
                <p className="text-muted-foreground mb-6">{error}</p>
                <button
                    onClick={() => router.push('/blog')}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                    Go back to blog
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying your login...</p>
        </div>
    )
}
