'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function AuthCodeErrorPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                There was a problem signing you in. The link may have expired, is invalid, or was already used.
            </p>
            <button
                onClick={() => router.push('/blog')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
            >
                Return to Blog
            </button>
        </div>
    )
}
