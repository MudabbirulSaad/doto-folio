'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MessageCircle, Reply } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CommentForm } from './comment-form'
import { cn } from '@/lib/utils'

interface Comment {
    id: string
    content: string
    created_at: string
    parent_id: string | null
    author: {
        name: string
        email?: string
        avatar?: string
    }
    replies?: Comment[]
}

interface CommentListProps {
    postId: string
    refreshTrigger: number
}

export function CommentList({ postId, refreshTrigger }: CommentListProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)

    const fetchComments = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/comments?postId=${postId}`)
            if (!res.ok) throw new Error('Failed to load comments')

            const data = await res.json()
            const flatComments: Comment[] = data.data || []
            const tree = buildCommentTree(flatComments)
            setComments(tree)
        } catch (err) {
            setError('Failed to load comments')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [postId, refreshTrigger])

    const handleReplySuccess = () => {
        setReplyingTo(null)
        fetchComments() // Refresh to show new reply
    }

    if (isLoading && comments.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-400 text-sm">
                {error}
            </div>
        )
    }

    if (comments.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                Comments <span className="text-sm font-normal text-muted-foreground">({countComments(comments)})</span>
            </h3>

            <div className="space-y-6">
                {comments.map((comment, index) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        replyingTo={replyingTo}
                        onReply={(id) => setReplyingTo(id)}
                        onCancelReply={() => setReplyingTo(null)}
                        onReplySuccess={handleReplySuccess}
                        depth={0}
                    />
                ))}
            </div>
        </div>
    )
}

function CommentItem({
    comment,
    postId,
    replyingTo,
    onReply,
    onCancelReply,
    onReplySuccess,
    depth
}: {
    comment: Comment
    postId: string
    replyingTo: string | null
    onReply: (id: string) => void
    onCancelReply: () => void
    onReplySuccess: () => void
    depth: number
}) {
    const isReplying = replyingTo === comment.id

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("group relative", depth > 0 && "ml-6 sm:ml-12 mt-4")}
        >
            {depth > 0 && (
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-white/10 sm:-left-6" />
            )}

            <div className="bg-background/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/5 transition-colors">
                <div className="flex gap-4">
                    <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {comment.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground/90">
                                    {comment.author.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReply(comment.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                            >
                                <Reply className="w-3 h-3 mr-1" />
                                Reply
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isReplying && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pl-14">
                                <CommentForm
                                    postId={postId}
                                    parentId={comment.id}
                                    onCommentPosted={onReplySuccess}
                                    onCancelReply={onCancelReply}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recursive Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            replyingTo={replyingTo}
                            onReply={onReply}
                            onCancelReply={onCancelReply}
                            onReplySuccess={onReplySuccess}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}

// Helper to build tree from flat list
function buildCommentTree(comments: Comment[]): Comment[] {
    const map = new Map<string, Comment>()
    const roots: Comment[] = []

    // Initialize map
    comments.forEach(c => {
        map.set(c.id, { ...c, replies: [] })
    })

    // Build tree
    comments.forEach(c => {
        const node = map.get(c.id)!
        if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.replies!.push(node)
        } else {
            roots.push(node)
        }
    })

    return roots
}

function countComments(comments: Comment[]): number {
    let count = comments.length
    comments.forEach(c => {
        if (c.replies) {
            count += countComments(c.replies)
        }
    })
    return count
}
