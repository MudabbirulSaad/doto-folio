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

export interface AdminBlogPostListItem extends Pick<BlogPost, 'id' | 'title' | 'slug' | 'status' | 'view_count' | 'published_at'> {
  excerpt: string | null
  category: Pick<BlogCategory, 'id' | 'name' | 'slug' | 'color'> | null
  tags: { tag: Pick<BlogTag, 'id' | 'name' | 'slug'> }[]
}

export interface AdminBlogPostList {
  posts: AdminBlogPostListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminBlogPostListQuery {
  page: number
  search: string
  status: string
  category: string
}
