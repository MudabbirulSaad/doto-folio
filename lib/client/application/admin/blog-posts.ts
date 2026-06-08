import type {
  AdminBlogPostFilters,
  AdminBlogPostList,
  AdminBlogPostWithRelations
} from '@/lib/client/domain/admin-blog'
import type { BlogCategory } from '@/lib/types/blog'

export interface AdminBlogPostGateway {
  listPosts(): Promise<AdminBlogPostList>
  listCategories(): Promise<BlogCategory[]>
  deletePost(id: string): Promise<void>
}

export function filterAdminBlogPosts(
  posts: AdminBlogPostWithRelations[],
  filters: AdminBlogPostFilters
): AdminBlogPostWithRelations[] {
  const searchQuery = filters.searchQuery.trim().toLowerCase()

  return posts.filter(post => {
    const matchesSearch = !searchQuery
      || post.title.toLowerCase().includes(searchQuery)
      || post.excerpt.toLowerCase().includes(searchQuery)
    const matchesStatus = filters.statusFilter === 'all' || post.status === filters.statusFilter
    const matchesCategory = filters.categoryFilter === 'all' || post.category?.id === filters.categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })
}

export function summarizeAdminBlogPosts(posts: AdminBlogPostWithRelations[]) {
  return {
    total: posts.length,
    published: posts.filter(post => post.status === 'published').length,
    drafts: posts.filter(post => post.status === 'draft').length,
    views: posts.reduce((sum, post) => sum + post.view_count, 0)
  }
}

export async function deleteAdminBlogPost(gateway: AdminBlogPostGateway, id: string) {
  try {
    await gateway.deletePost(id)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to delete post'
    }
  }
}
