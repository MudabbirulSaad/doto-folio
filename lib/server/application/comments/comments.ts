import { ApplicationError } from '@/lib/server/domain/errors'

export interface CommentRecord {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id?: string | null
}

export interface CommentAuthor {
  name: string
  email: string
  avatar?: string
}

export interface CommentRepository {
  findCommentsByPost(postId: string): Promise<CommentRecord[]>
  findUsersByIds(userIds: string[]): Promise<Map<string, CommentAuthor>>
  findPostCommentSettings(postId: string): Promise<{ allow_comments?: boolean | null } | null>
  insertComment(data: { post_id: string; user_id: string; content: string; parent_id: string | null }): Promise<Record<string, unknown>>
}

export type CommentPrincipal = {
  type: 'user' | 'agent'
  id: string
}

export interface CommenterAuthenticator {
  authenticate(token: string): Promise<CommentPrincipal | null>
}

export interface CreateCommentInput {
  postId: string
  content: string
  userId?: string
  parentId?: string
}

export async function listComments(repository: CommentRepository, postId: string) {
  if (!postId) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['postId is required'])
  }

  const comments = await repository.findCommentsByPost(postId)
  const userIds = [...new Set(comments.map(comment => comment.user_id))]
  const users = await repository.findUsersByIds(userIds)

  return comments.map(comment => ({
    ...comment,
    author: users.get(comment.user_id) || { name: 'Anonymous', email: '' }
  }))
}

export async function createComment(
  repository: CommentRepository,
  authenticator: CommenterAuthenticator,
  token: string,
  input: CreateCommentInput
) {
  const user = await authenticator.authenticate(token)
  if (!user || (user.type === 'user' && user.id !== input.userId)) {
    throw new ApplicationError('UNAUTHORIZED', 'Invalid or expired session')
  }

  const post = await repository.findPostCommentSettings(input.postId)
  if (!post) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['Post not found'])
  }

  if (post.allow_comments === false) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['Comments are disabled for this post'])
  }

  return repository.insertComment({
    post_id: input.postId,
    user_id: user.id,
    content: input.content,
    parent_id: input.parentId || null
  })
}
