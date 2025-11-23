'use client'

import { useState } from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { CommentForm } from './comment-form'
import { CommentList } from './comment-list'

interface CommentSectionProps {
    postId: string
    allowComments: boolean
}

export function CommentSection({ postId, allowComments }: CommentSectionProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    if (!allowComments) return null

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
            scriptProps={{
                async: false,
                defer: false,
                appendTo: 'head',
                nonce: undefined,
            }}
        >
            <section className="mt-16 pt-16 border-t border-white/10">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold tracking-tight">Discussion</h2>
                        <p className="text-muted-foreground">
                            Join the conversation and share your perspective.
                        </p>
                    </div>

                    <CommentForm
                        postId={postId}
                        onCommentPosted={() => setRefreshTrigger(prev => prev + 1)}
                    />

                    <CommentList
                        postId={postId}
                        refreshTrigger={refreshTrigger}
                    />
                </div>
            </section>
        </GoogleReCaptchaProvider>
    )
}
