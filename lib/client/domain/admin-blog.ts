import type { BlogCategory, BlogPost, BlogTag } from '@/lib/types/blog'

export interface AdminBlogCategory extends BlogCategory {
  post_count: number
}

export interface AdminBlogCategoryFormData {
  name: string
  slug: string
  description: string
  color: string
  display_order: number
}

export interface AdminBlogTagFormData {
  name: string
  slug: string
  description: string
}

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
