import type {
  AdminBlogPostFilters,
  AdminBlogPostList,
  AdminBlogPostWithRelations
} from '@/lib/client/domain/admin-blog'
import type { BlogCategory, CreateBlogPostData, UpdateBlogPostData } from '@/lib/types/blog'

export interface AdminBlogPostGateway {
  getPost(id: string): Promise<AdminBlogPostWithRelations>
  listPosts(): Promise<AdminBlogPostList>
  listCategories(): Promise<BlogCategory[]>
  createPost(input: CreateBlogPostData): Promise<unknown>
  updatePost(id: string, input: UpdateBlogPostData): Promise<unknown>
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

function validatePostInput(input: Pick<UpdateBlogPostData, 'title' | 'content'>, mode: 'create' | 'update') {
  if ((mode === 'create' || input.title !== undefined) && !input.title?.trim()) return 'Please enter a title'
  if (mode === 'update' && input.content === undefined) return null
  if (!input.content?.trim()) return 'Please add some content'

  try {
    const content = JSON.parse(input.content)
    if (Array.isArray(content?.blocks)) {
      return content.blocks.length ? null : 'Please add some content'
    }
  } catch {
    // Legacy posts may have a plain Markdown body.
  }

  return mode === 'update' ? null : 'Please add some content'
}

export async function saveNewAdminBlogPost(gateway: AdminBlogPostGateway, input: CreateBlogPostData) {
  const error = validatePostInput(input, 'create')
  if (error) return { success: false as const, error }

  try {
    const post = await gateway.createPost(input)
    return { success: true as const, post }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to save post'
    }
  }
}

export async function updateAdminBlogPost(
  gateway: AdminBlogPostGateway,
  id: string,
  input: UpdateBlogPostData
) {
  const error = validatePostInput(input, 'update')
  if (error) return { success: false as const, error }

  try {
    const post = await gateway.updatePost(id, input)
    return { success: true as const, post }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to update post'
    }
  }
}
