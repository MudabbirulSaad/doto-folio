export interface ClientComment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  author: {
    name: string
    email?: string
    avatar?: string
  }
  replies?: ClientComment[]
}

export interface CreateCommentInput {
  postId: string
  content: string
  userId: string
  parentId?: string
}
