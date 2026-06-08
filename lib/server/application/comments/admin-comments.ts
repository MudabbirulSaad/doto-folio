export interface AdminCommentAuthor {
  name: string
  email?: string
  avatar?: string
}

export interface AdminCommentRepository {
  listCommentsWithPosts(): Promise<any[]>
  listUsers(): Promise<Map<string, AdminCommentAuthor>>
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
