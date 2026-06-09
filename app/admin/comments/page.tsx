'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    MessageSquare,
    Trash2,
    Reply,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentSession } from '@/lib/auth/admin'
import { createAdminCommentApiGateway } from '@/lib/client/adapters/http/admin-comments-api'
import {
    deleteAdminComment,
    loadAdminComments,
    replyToAdminComment
} from '@/lib/client/application/admin/comments'
import type { AdminComment } from '@/lib/client/domain/admin-comments'

export default function CommentsManagementPage() {
    const [comments, setComments] = useState<AdminComment[]>([])
    const [loading, setLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const gateway = useMemo(() => createAdminCommentApiGateway(), [])

    const fetchComments = useCallback(async () => {
        try {
            const result = await loadAdminComments(gateway)
            if (result.success) {
                setComments(result.comments)
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } finally {
            setLoading(false)
        }
    }, [gateway])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const handleDelete = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return

        setActionLoading(commentId)
        try {
            const result = await deleteAdminComment(gateway, commentId)

            if (result.success) {
                setMessage({ type: 'success', text: 'Comment deleted successfully' })
                setComments(comments.filter(c => c.id !== result.id))
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            console.error('Error deleting comment:', error)
            setMessage({ type: 'error', text: 'Failed to delete comment' })
        } finally {
            setActionLoading(null)
        }
    }

    const handleReply = async (comment: AdminComment) => {
        if (!replyContent.trim()) return

        setActionLoading(comment.id)
        try {
            const session = await getCurrentSession()
            const result = await replyToAdminComment(gateway, comment, replyContent, session ? {
                accessToken: session.access_token,
                userId: session.user.id
            } : null)

            if (result.success) {
                setMessage({ type: 'success', text: 'Reply posted successfully' })
                setReplyContent('')
                setReplyingTo(null)
                await fetchComments()
            } else {
                setMessage({ type: 'error', text: result.error })
            }
        } catch (error) {
            console.error('Error posting reply:', error)
            setMessage({ type: 'error', text: 'Failed to post reply' })
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-primary" />
                        Comments Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage and moderate blog comments</p>
                </div>
            </div>

            {/* Status Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-xl border backdrop-blur-md ${message.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                    >
                        <div className="flex items-center space-x-2">
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <span>{message.text}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No Comments Yet</h3>
                        <p className="text-muted-foreground">Comments will appear here when users engage with your posts.</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                            {(comment.author_name?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-foreground">{comment.author_name || 'Anonymous'}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{comment.author_email}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-auto md:ml-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-foreground/90 text-sm leading-relaxed">{comment.content}</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 p-2 rounded-lg w-fit">
                                        <span>On:</span>
                                        <Link href={`/blog/${comment.post?.slug}`} target="_blank" className="flex items-center gap-1 hover:text-primary transition-colors">
                                            {comment.post?.title}
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:self-start pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                        className="flex items-center space-x-1 hover:bg-white/10 hover:text-primary"
                                    >
                                        <Reply className="w-4 h-4" />
                                        <span className="hidden sm:inline">Reply</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(comment.id)}
                                        disabled={actionLoading === comment.id}
                                        className="flex items-center space-x-1 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                                    >
                                        {actionLoading === comment.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Reply Form */}
                            <AnimatePresence>
                                {replyingTo === comment.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 pl-4 md:pl-10 border-l-2 border-primary/20"
                                    >
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <Textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder={`Reply to ${comment.author_name || 'Anonymous'}...`}
                                                className="bg-black/20 border-white/10 focus:border-primary/50 mb-3 min-h-[100px]"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setReplyingTo(null)
                                                        setReplyContent('')
                                                    }}
                                                    className="hover:bg-white/5"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReply(comment)}
                                                    disabled={!replyContent.trim() || actionLoading === comment.id}
                                                    className="shadow-lg shadow-primary/20"
                                                >
                                                    {actionLoading === comment.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Reply className="w-4 h-4 mr-2" />
                                                    )}
                                                    Post Reply
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
