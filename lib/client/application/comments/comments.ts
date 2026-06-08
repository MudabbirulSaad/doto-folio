import type { ClientComment, CreateCommentInput } from '@/lib/client/domain/comments'

export interface CommentGateway {
  list(postId: string): Promise<ClientComment[]>
  create(accessToken: string, input: CreateCommentInput): Promise<ClientComment>
}

export function buildCommentTree(comments: ClientComment[]): ClientComment[] {
  const map = new Map<string, ClientComment>()
  const roots: ClientComment[] = []

  comments.forEach(comment => {
    map.set(comment.id, { ...comment, replies: [] })
  })

  comments.forEach(comment => {
    const node = map.get(comment.id)!

    if (comment.parent_id && map.has(comment.parent_id)) {
      map.get(comment.parent_id)!.replies!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export function countComments(comments: ClientComment[]): number {
  return comments.reduce((count, comment) => count + 1 + countComments(comment.replies || []), 0)
}

export async function loadCommentTree(gateway: CommentGateway, postId: string) {
  const comments = await gateway.list(postId)
  return buildCommentTree(comments)
}

export async function postComment(gateway: CommentGateway, accessToken: string | null | undefined, input: CreateCommentInput) {
  if (!accessToken) {
    return { success: false as const, error: 'No active session' }
  }

  if (!input.content.trim()) {
    return { success: false as const, error: 'Comment is required' }
  }

  try {
    const comment = await gateway.create(accessToken, {
      ...input,
      content: input.content.trim()
    })
    return { success: true as const, comment }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to post comment'
    }
  }
}
