import type { AdminComment, AdminCommentReplySession } from '@/lib/client/domain/admin-comments'
import type { CreateCommentInput } from '@/lib/client/domain/comments'

export interface AdminCommentGateway {
  list(): Promise<AdminComment[]>
  delete(id: string): Promise<void>
  reply(accessToken: string, input: CreateCommentInput): Promise<unknown>
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export async function loadAdminComments(gateway: AdminCommentGateway) {
  try {
    return {
      success: true as const,
      comments: await gateway.list()
    }
  } catch (error) {
    return workflowError(error, 'Failed to load comments')
  }
}

export async function deleteAdminComment(gateway: AdminCommentGateway, id: string) {
  try {
    await gateway.delete(id)
    return {
      success: true as const,
      id
    }
  } catch (error) {
    return workflowError(error, 'Failed to delete comment')
  }
}

export async function replyToAdminComment(
  gateway: AdminCommentGateway,
  comment: Pick<AdminComment, 'id' | 'post_id'>,
  content: string,
  session: AdminCommentReplySession | null
) {
  const trimmed = content.trim()

  if (!trimmed) {
    return { success: false as const, error: 'Reply is required' }
  }

  if (!session) {
    return { success: false as const, error: 'Please log in to reply' }
  }

  try {
    await gateway.reply(session.accessToken, {
      postId: comment.post_id,
      parentId: comment.id,
      content: trimmed,
      userId: session.userId
    })

    return { success: true as const }
  } catch (error) {
    return workflowError(error, 'Failed to post reply')
  }
}
