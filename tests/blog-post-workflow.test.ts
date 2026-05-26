import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  type BlogPostWorkflowRepository
} from '../lib/data/blog-post-workflow'

function editorContent(words: number) {
  return JSON.stringify({
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: Array.from({ length: words }, (_, index) => `word${index}`).join(' ')
        }
      }
    ]
  })
}

function createRepository(): BlogPostWorkflowRepository & {
  posts: Record<string, any>
  postTags: Record<string, string[]>
  calls: string[]
} {
  let nextId = 1
  const repository = {
    posts: {} as Record<string, any>,
    postTags: {} as Record<string, string[]>,
    calls: [] as string[],
    async findPostBySlug(slug: string, excludeId?: string) {
      return Object.values(this.posts).find(post => post.slug === slug && post.id !== excludeId) || null
    },
    async findPostForUpdate(id: string) {
      return this.posts[id] || null
    },
    async findPostForDelete(id: string) {
      const post = this.posts[id]
      if (!post) return null
      return {
        id: post.id,
        title: post.title,
        category_id: post.category_id,
        tag_ids: this.postTags[id] || []
      }
    },
    async createPost(data: Record<string, unknown>) {
      const id = `post-${nextId++}`
      const post = { id, ...data }
      this.posts[id] = post
      return post
    },
    async updatePost(id: string, data: Record<string, unknown>) {
      this.posts[id] = { ...this.posts[id], ...data }
      return this.posts[id]
    },
    async deletePost(id: string) {
      delete this.posts[id]
      delete this.postTags[id]
    },
    async getPostTagIds(id: string) {
      return this.postTags[id] || []
    },
    async replacePostTags(id: string, tagIds: string[]) {
      this.postTags[id] = tagIds
    },
    async refreshCategoryPostCounts(categoryIds: string[]) {
      this.calls.push(`refreshCategories:${categoryIds.join(',')}`)
    },
    async refreshTagUsageCounts() {
      this.calls.push('refreshTags')
    }
  }

  return repository
}

test('createBlogPost validates, enforces slug uniqueness, publishes once, creates tags, and refreshes counts', async () => {
  const repository = createRepository()
  repository.posts.existing = { id: 'existing', slug: 'taken' }

  await assert.rejects(
    () => createBlogPost(repository, { title: '', slug: 'new', excerpt: 'x', content: editorContent(10), tag_ids: [], status: 'draft', featured: false }),
    /Title is required/
  )

  await assert.rejects(
    () => createBlogPost(repository, { title: 'New', slug: 'taken', excerpt: 'x', content: editorContent(10), tag_ids: [], status: 'draft', featured: false }),
    /A post with this slug already exists/
  )

  const post = await createBlogPost(
    repository,
    {
      title: ' Published Post ',
      slug: ' published-post ',
      excerpt: ' Excerpt ',
      content: editorContent(401),
      category_id: 'cat-1',
      tag_ids: ['tag-1', 'tag-2'],
      status: 'published',
      featured: true,
      meta_title: ' Meta ',
      meta_description: ' Description '
    },
    { now: () => new Date('2026-05-26T01:02:03.000Z') }
  )

  assert.equal(post.title, 'Published Post')
  assert.equal(post.slug, 'published-post')
  assert.equal(post.excerpt, 'Excerpt')
  assert.equal(post.reading_time, 3)
  assert.equal(post.published_at, '2026-05-26T01:02:03.000Z')
  assert.deepEqual(repository.postTags[post.id], ['tag-1', 'tag-2'])
  assert.deepEqual(repository.calls, ['refreshTags', 'refreshCategories:cat-1'])
})

test('createBlogPost derives an excerpt from editor content when one is not provided', async () => {
  const repository = createRepository()

  const post = await createBlogPost(repository, {
    title: 'Draft Post',
    slug: 'draft-post',
    excerpt: ' ',
    content: JSON.stringify({
      blocks: [
        {
          type: 'paragraph',
          data: {
            text: 'What is my name? This first paragraph becomes the generated excerpt.'
          }
        }
      ]
    }),
    tag_ids: [],
    status: 'draft',
    featured: false
  })

  assert.equal(post.excerpt, 'What is my name? This first paragraph becomes the generated excerpt.')
})

test('updateBlogPost handles slug/category/tag replacement, reading time, and first publish timestamp', async () => {
  const repository = createRepository()
  repository.posts['post-1'] = {
    id: 'post-1',
    title: 'Draft',
    slug: 'old-slug',
    category_id: 'cat-old',
    status: 'draft',
    published_at: null
  }
  repository.postTags['post-1'] = ['tag-old']

  const post = await updateBlogPost(
    repository,
    'post-1',
    {
      slug: 'new-slug',
      content: editorContent(200),
      category_id: 'cat-new',
      tag_ids: ['tag-new'],
      status: 'published'
    },
    { now: () => new Date('2026-05-26T02:00:00.000Z') }
  )

  assert.equal(post.slug, 'new-slug')
  assert.equal(post.reading_time, 1)
  assert.equal(post.published_at, '2026-05-26T02:00:00.000Z')
  assert.deepEqual(repository.postTags['post-1'], ['tag-new'])
  assert.deepEqual(repository.calls, ['refreshTags', 'refreshCategories:cat-old,cat-new'])

  await updateBlogPost(
    repository,
    'post-1',
    { status: 'published' },
    { now: () => new Date('2026-05-27T00:00:00.000Z') }
  )

  assert.equal(repository.posts['post-1'].published_at, '2026-05-26T02:00:00.000Z')
})

test('deleteBlogPost removes the post and refreshes affected category and tag counts', async () => {
  const repository = createRepository()
  repository.posts['post-1'] = {
    id: 'post-1',
    title: 'Delete Me',
    slug: 'delete-me',
    category_id: 'cat-1'
  }
  repository.postTags['post-1'] = ['tag-1', 'tag-2']

  const result = await deleteBlogPost(repository, 'post-1')

  assert.deepEqual(result, { message: 'Post deleted successfully', title: 'Delete Me' })
  assert.equal(repository.posts['post-1'], undefined)
  assert.deepEqual(repository.calls, ['refreshTags', 'refreshCategories:cat-1'])
})
