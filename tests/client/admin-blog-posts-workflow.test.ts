import { describe, expect, it, vi } from 'vitest'
import {
  deleteAdminBlogPost,
  filterAdminBlogPosts,
  saveNewAdminBlogPost,
  summarizeAdminBlogPosts,
  updateAdminBlogPost,
  type AdminBlogPostGateway
} from '@/lib/client/application/admin/blog-posts'
import type { AdminBlogPostWithRelations } from '@/lib/client/domain/admin-blog'

function post(overrides: Partial<AdminBlogPostWithRelations>): AdminBlogPostWithRelations {
  return {
    id: 'post-1',
    title: 'AI Notes',
    slug: 'ai-notes',
    excerpt: 'Thoughts about AI',
    content: '',
    featured_image: null,
    category_id: null,
    status: 'published',
    featured: false,
    reading_time: 1,
    view_count: 7,
    created_at: '',
    updated_at: '',
    published_at: '',
    meta_title: null,
    meta_description: null,
    comments_enabled: true,
    category: null,
    tags: [],
    ...overrides
  }
}

describe('admin blog post workflow', () => {
  it('filters posts by search, status, and category', () => {
    const posts = [
      post({ id: 'post-1', title: 'AI Notes', status: 'published', category: { id: 'cat-1', name: 'AI', slug: 'ai', description: null, color: '#fff', post_count: 1, is_published: true, display_order: 1, created_at: '', updated_at: '' } }),
      post({ id: 'post-2', title: 'Draft', excerpt: 'Frontend work', status: 'draft', category: null })
    ]

    expect(filterAdminBlogPosts(posts, {
      searchQuery: 'ai',
      statusFilter: 'published',
      categoryFilter: 'cat-1'
    }).map(item => item.id)).toEqual(['post-1'])
  })

  it('summarizes post counts for dashboard cards', () => {
    expect(summarizeAdminBlogPosts([
      post({ status: 'published', view_count: 2 }),
      post({ status: 'draft', view_count: 3 })
    ])).toEqual({ total: 2, published: 1, drafts: 1, views: 5 })
  })

  it('delegates deletion through the gateway', async () => {
    const gateway: AdminBlogPostGateway = {
      getPost: vi.fn(),
      listPosts: vi.fn(),
      listCategories: vi.fn(),
      createPost: vi.fn(),
      updatePost: vi.fn(),
      deletePost: vi.fn()
    }

    expect(await deleteAdminBlogPost(gateway, 'post-1')).toEqual({ success: true })
    expect(gateway.deletePost).toHaveBeenCalledWith('post-1')
  })

  it('validates and saves new or existing posts through the gateway', async () => {
    const gateway: AdminBlogPostGateway = {
      getPost: vi.fn(),
      listPosts: vi.fn(),
      listCategories: vi.fn(),
      createPost: vi.fn(async input => ({ id: 'post-1', ...input })),
      updatePost: vi.fn(async (_id, input) => ({ id: 'post-1', ...input })),
      deletePost: vi.fn()
    }
    const input = {
      title: 'Post',
      slug: 'post',
      excerpt: 'Excerpt',
      content: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: 'Hello' } }] }),
      category_id: null,
      tag_ids: [],
      status: 'draft' as const,
      featured: false,
      meta_title: null,
      meta_description: null
    }

    await expect(saveNewAdminBlogPost(gateway, { ...input, title: '' })).resolves.toEqual({
      success: false,
      error: 'Please enter a title'
    })
    await expect(saveNewAdminBlogPost(gateway, input)).resolves.toMatchObject({
      success: true,
      post: { id: 'post-1' }
    })
    await expect(updateAdminBlogPost(gateway, 'post-1', input)).resolves.toMatchObject({
      success: true,
      post: { id: 'post-1' }
    })
  })
})
