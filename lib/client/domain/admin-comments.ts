export interface AdminComment {
  id: string
  content: string
  created_at: string
  author_name: string
  author_email: string
  post_id: string
  parent_id: string | null
  post: {
    title: string
    slug: string
  }
}

export interface AdminCommentReplySession {
  accessToken: string
  userId: string
}
