import type { BlogCategory, BlogPost, BlogTag } from '@/lib/types/blog'

export interface AdminBlogPostWithRelations extends BlogPost {
  category: BlogCategory | null
  tags: { tag: BlogTag }[]
}

export interface AdminBlogPostList {
  posts: AdminBlogPostWithRelations[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminBlogPostFilters {
  searchQuery: string
  statusFilter: string
  categoryFilter: string
}
