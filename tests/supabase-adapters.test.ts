import test from 'node:test'
import assert from 'node:assert/strict'
import { createSupabasePublicBlogListingRepository } from '../lib/server/adapters/supabase/blog/public-blog-listing-repository'
import { createSupabaseBlogPostWorkflowRepository } from '../lib/server/adapters/supabase/blog/blog-post-workflow-repository'

class QueryRecorder {
  calls: string[]

  constructor(
    private table: string,
    calls: string[]
  ) {
    this.calls = calls
  }

  select(columns: string) {
    this.calls.push(`${this.table}.select:${columns.replace(/\s+/g, ' ').trim()}`)
    return this
  }

  eq(column: string, value: unknown) {
    this.calls.push(`${this.table}.eq:${column}:${value}`)
    return this
  }

  neq(column: string, value: unknown) {
    this.calls.push(`${this.table}.neq:${column}:${value}`)
    return this
  }

  order(column: string) {
    this.calls.push(`${this.table}.order:${column}`)
    return this
  }

  limit(value: number) {
    this.calls.push(`${this.table}.limit:${value}`)
    return this
  }

  insert(value: unknown) {
    this.calls.push(`${this.table}.insert:${JSON.stringify(value)}`)
    return this
  }

  delete() {
    this.calls.push(`${this.table}.delete`)
    return this
  }

  maybeSingle() {
    this.calls.push(`${this.table}.maybeSingle`)
    return { data: null, error: null }
  }

  single() {
    this.calls.push(`${this.table}.single`)
    return { data: { id: 'post-1' }, error: null }
  }

  then(resolve: (value: { data: unknown[]; error: null }) => void) {
    resolve({ data: [], error: null })
  }
}

function supabaseRecorder() {
  const calls: string[] = []
  return {
    calls,
    from(table: string) {
      calls.push(`from:${table}`)
      return new QueryRecorder(table, calls)
    },
    rpc(name: string, args?: unknown) {
      calls.push(`rpc:${name}:${JSON.stringify(args || {})}`)
      return { error: null }
    }
  }
}

test('public blog listing Supabase adapter queries published posts, categories, and popular tags', async () => {
  const supabase = supabaseRecorder()
  const repository = createSupabasePublicBlogListingRepository(supabase)

  await repository.getPublishedPosts()
  await repository.getCategories()
  await repository.getPopularTags(7)

  assert.ok(supabase.calls.includes('from:blog_posts'))
  assert.ok(supabase.calls.includes('blog_posts.eq:status:published'))
  assert.ok(supabase.calls.includes('from:blog_categories'))
  assert.ok(supabase.calls.includes('blog_categories.order:name'))
  assert.ok(supabase.calls.includes('from:blog_tags'))
  assert.ok(supabase.calls.includes('blog_tags.limit:7'))
})

test('blog workflow Supabase adapter replaces tags and refreshes count RPCs', async () => {
  const supabase = supabaseRecorder()
  const repository = createSupabaseBlogPostWorkflowRepository(supabase)

  await repository.replacePostTags('post-1', ['tag-1', 'tag-2'])
  await repository.refreshCategoryPostCounts(['cat-1'])
  await repository.refreshTagUsageCounts()

  assert.ok(supabase.calls.includes('from:blog_post_tags'))
  assert.ok(supabase.calls.includes('blog_post_tags.delete'))
  assert.ok(supabase.calls.some(call => call.startsWith('blog_post_tags.insert:')))
  assert.ok(supabase.calls.includes('rpc:update_category_post_count:{"category_id":"cat-1"}'))
  assert.ok(supabase.calls.includes('rpc:recalculate_tag_usage:{}'))
})
