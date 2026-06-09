import { ApplicationError } from '@/lib/server/domain/errors'

export interface AdminCommentAuthor {
  name: string
  email?: string
  avatar?: string
}

export interface AdminCommentRepository {
  listCommentsWithPosts(): Promise<any[]>
  listUsers(): Promise<Map<string, AdminCommentAuthor>>
  deleteComment(id: string): Promise<void>
}

export async function listAdminComments(repository: AdminCommentRepository) {
  const comments = await repository.listCommentsWithPosts()
  const userMap = await repository.listUsers()

  return comments.map(comment => ({
    ...comment,
    author_name: userMap.get(comment.user_id)?.name || 'Anonymous',
    author_email: userMap.get(comment.user_id)?.email || 'No Email',
    author_avatar: userMap.get(comment.user_id)?.avatar
  }))
}

export async function deleteAdminComment(repository: AdminCommentRepository, id: string) {
  if (!id) {
    throw new ApplicationError('VALIDATION_ERROR', 'Comment id is required')
  }

  await repository.deleteComment(id)
  return { success: true }
}
