import { describe, expect, it, vi } from 'vitest'
import {
  deleteAdminBlogPost,
  saveNewAdminBlogPost,
  updateAdminBlogPost,
  type AdminBlogPostGateway
} from '@/lib/client/application/admin/blog-posts'
import { createAdminBlogPostApiGateway } from '@/lib/client/adapters/http/admin-blog-api'
import { createFetchJsonClient } from '@/lib/client/adapters/http/json-client'

describe('admin blog post workflow', () => {
  it('requests the filtered page and reads collection totals independently', async () => {
    const urls: URL[] = []
    const gateway = createAdminBlogPostApiGateway(createFetchJsonClient(async input => {
      urls.push(new URL(String(input), 'http://localhost'))
      return Response.json({ data: {} })
    }))
    await gateway.listPosts({ page: 2, search: ' Q&A, 100% ', status: 'draft', category: 'cat-1' })
    await gateway.getSummary()
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ view: 'list', page: '2', search: 'Q&A, 100%', status: 'draft', category: 'cat-1' })
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ view: 'summary' })
  })

  it('delegates deletion through the gateway', async () => {
    const gateway: AdminBlogPostGateway = {
      getPost: vi.fn(),
      listPosts: vi.fn(),
      getSummary: vi.fn(),
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
      getSummary: vi.fn(),
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
      tag_ids: [],
      status: 'draft' as const,
      featured: false
    }

    await expect(saveNewAdminBlogPost(gateway, { ...input, title: '' })).resolves.toEqual({
      success: false,
      error: 'Please enter a title'
    })
    await expect(saveNewAdminBlogPost(gateway, input)).resolves.toMatchObject({
      success: true,
      post: { id: 'post-1' }
    })
    await expect(updateAdminBlogPost(gateway, 'post-1', { id: 'post-1', ...input })).resolves.toMatchObject({
      success: true,
      post: { id: 'post-1' }
    })
    const markdownEdit = { id: 'post-1', content: '| A | B |\n| - | - |\n| 1 | 2 |' }
    await expect(updateAdminBlogPost(gateway, 'post-1', markdownEdit)).resolves.toMatchObject({ success: true })
    expect(gateway.updatePost).toHaveBeenCalledWith('post-1', markdownEdit)
    await expect(updateAdminBlogPost(gateway, 'post-1', { id: 'post-1', content: '{"blocks":[]}' }))
      .resolves.toMatchObject({ success: false })
  })
})
