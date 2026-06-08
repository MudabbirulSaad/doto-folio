import test from 'node:test'
import assert from 'node:assert/strict'
import { BlogPostDetailService } from '../lib/server/application/blog/blog-post-detail'
import type { BlogPostDetailRepository, BlogPostViewContext } from '../lib/server/application/blog/blog-post-detail'
import type { BlogCategory, BlogTag } from '../lib/types/blog'

function category(id: string, name: string): BlogCategory {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    color: '#000000',
    display_order: 0,
    is_published: true,
    created_at: '2026-05-26T00:00:00.000Z',
    updated_at: '2026-05-26T00:00:00.000Z'
  }
}

function tag(id: string, name: string): BlogTag {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: '',
    usage_count: 1,
    is_published: true,
    created_at: '2026-05-26T00:00:00.000Z',
    updated_at: '2026-05-26T00:00:00.000Z'
  }
}

function createRepository(): {
  repository: BlogPostDetailRepository,
  calls: {
    publishedReads: number,
    relatedReads: number,
    viewLookupCalls: number,
    viewIncrements: Array<{ postId: string; nextViewCount: number }>,
    viewInserts: Array<{ postId: string; context: BlogPostViewContext }>,
    recommendationReads: number,
    recommendationPosts: string[]
  }
} {
  const calls = {
    publishedReads: 0,
    relatedReads: 0,
    viewLookupCalls: 0,
    viewIncrements: [] as Array<{ postId: string; nextViewCount: number }>,
    viewInserts: [] as Array<{ postId: string; context: BlogPostViewContext }>,
    recommendationReads: 0,
    recommendationPosts: [] as string[]
  }

  const repository: BlogPostDetailRepository = {
    async findPublishedPostBySlug(slug: string) {
      calls.publishedReads += 1
      if (slug !== 'current-post') {
        return null
      }

      return {
        id: 'post-1',
        title: 'Current Post',
        slug: 'current-post',
        excerpt: 'Current excerpt',
        content: 'Current content',
        featured_image: '/cover.png',
        featured_image_alt: 'Current cover',
        meta_title: 'Current SEO',
        meta_description: 'Current SEO description',
        author_name: 'Author',
        author_bio: 'Bio',
        status: 'published',
        featured: false,
        view_count: 7,
        reading_time: 4,
        category_id: 'cat-1',
        published_at: '2026-05-20T00:00:00.000Z',
        created_at: '2026-05-19T00:00:00.000Z',
        updated_at: '2026-05-26T00:00:00.000Z',
        category: category('cat-1', 'AI'),
        tags: [{ tag: tag('tag-1', 'Machine Learning') }, { tag: tag('tag-2', 'TypeScript') }]
      }
    },

    async findPublishedPostsForRecommendations(currentPostId: string) {
      calls.recommendationReads += 1
      calls.recommendationPosts.push(currentPostId)
      return [
        {
          id: 'post-2',
          title: 'Related AI',
          slug: 'related-ai',
          excerpt: 'Related article',
          content: 'Related content',
          author_name: 'Author',
          author_bio: 'Bio',
          status: 'published',
          featured: false,
          view_count: 3,
          reading_time: 2,
          category_id: 'cat-1',
          published_at: '2026-05-10T00:00:00.000Z',
          created_at: '2026-05-09T00:00:00.000Z',
          updated_at: '2026-05-10T00:00:00.000Z',
          category: { id: 'cat-1', name: 'AI', slug: 'ai', color: '#000000', display_order: 0, is_published: true, created_at: '2026-05-01T00:00:00.000Z', updated_at: '2026-05-01T00:00:00.000Z' }
        }
      ]
    },

    async findRelatedPosts() {
      calls.relatedReads += 1
      return []
    },

    async findPostForViewTracking(slug: string) {
      calls.viewLookupCalls += 1
      if (slug !== 'current-post') {
        return null
      }
      return { id: 'post-1', view_count: 7 }
    },

    async incrementViewCount(postId: string, nextViewCount: number) {
      calls.viewIncrements.push({ postId, nextViewCount })
    },

    async insertBlogView(postId: string, context) {
      calls.viewInserts.push({ postId, context })
    }
  }

  return { repository, calls }
}

test('readMetadata does not perform implicit view tracking', async () => {
  const { repository, calls } = createRepository()
  const service = new BlogPostDetailService(repository)

  const post = await service.readMetadata('current-post')

  assert.equal(calls.publishedReads, 1)
  assert.equal(calls.viewLookupCalls, 0)
  assert.equal(calls.viewIncrements.length, 0)
  assert.equal(calls.viewInserts.length, 0)
  assert.equal(calls.relatedReads, 0)
  assert.equal(post?.id, 'post-1')
  assert.equal(post?.category?.slug, 'ai')
  assert.deepEqual(post?.tags?.map(tag => tag.slug), ['machine-learning', 'typescript'])
})

test('readDetail returns related posts while keeping metadata reads side-effect free', async () => {
  const { repository, calls } = createRepository()
  const service = new BlogPostDetailService(repository)

  const { post, relatedPosts } = await service.readDetail('current-post', 2)

  assert.equal(calls.publishedReads, 1)
  assert.equal(calls.relatedReads, 1)
  assert.equal(post?.slug, 'current-post')
  assert.deepEqual(relatedPosts, [])
})

test('trackView increments and records explicit view context', async () => {
  const { repository, calls } = createRepository()
  const service = new BlogPostDetailService(repository)

  await service.trackView('current-post', {
    ipAddress: '10.0.0.1',
    userAgent: 'test-agent',
    referrer: 'https://example.com/source'
  })

  assert.equal(calls.viewLookupCalls, 1)
  assert.equal(calls.viewIncrements.length, 1)
  assert.equal(calls.viewIncrements[0].postId, 'post-1')
  assert.equal(calls.viewIncrements[0].nextViewCount, 8)
  assert.equal(calls.viewInserts.length, 1)
  assert.equal(calls.viewInserts[0].postId, 'post-1')
  assert.equal(calls.viewInserts[0].context.ipAddress, '10.0.0.1')
})
