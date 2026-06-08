import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import {
  BlogPostWorkflowError,
  uniqueValues,
  type BlogPostWorkflowRepository
} from '@/lib/server/application/blog/blog-post-workflow'

function throwDatabaseError(action: string, error: { message?: string } | null | undefined): never {
  throw new BlogPostWorkflowError(
    'INTERNAL_ERROR',
    action,
    error?.message ? [error.message] : [action]
  )
}

export function createSupabaseBlogPostWorkflowRepository(supabase: SupabaseDataClient): BlogPostWorkflowRepository {
  return {
    async findPostBySlug(slug, excludeId) {
      let query = supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.maybeSingle()
      if (error) throwDatabaseError('Failed to check slug uniqueness', error)
      return data || null
    },

    async findPostForUpdate(id) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, category_id, status, published_at')
        .eq('id', id)
        .maybeSingle()

      if (error) throwDatabaseError('Failed to fetch post', error)
      return data || null
    },

    async findPostForDelete(id) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          category_id,
          tags:blog_post_tags(tag_id)
        `)
        .eq('id', id)
        .maybeSingle()

      if (error) throwDatabaseError('Failed to fetch post', error)
      if (!data) return null

      return {
        id: data.id,
        title: data.title,
        category_id: data.category_id,
        tag_ids: data.tags?.map((tag: { tag_id: string }) => tag.tag_id) || []
      }
    },

    async createPost(data) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert(data)
        .select()
        .single()

      if (error) throwDatabaseError('Failed to create post', error)
      return post
    },

    async updatePost(id, data) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throwDatabaseError('Failed to update post', error)
      return post
    },

    async deletePost(id) {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throwDatabaseError('Failed to delete post', error)
    },

    async getPostTagIds(id) {
      const { data, error } = await supabase
        .from('blog_post_tags')
        .select('tag_id')
        .eq('post_id', id)

      if (error) throwDatabaseError('Failed to fetch post tags', error)
      return data?.map((tag: { tag_id: string }) => tag.tag_id) || []
    },

    async replacePostTags(id, tagIds) {
      const { error: deleteError } = await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', id)

      if (deleteError) throwDatabaseError('Failed to replace post tags', deleteError)

      if (tagIds.length === 0) return

      const { error: insertError } = await supabase
        .from('blog_post_tags')
        .insert(tagIds.map(tagId => ({ post_id: id, tag_id: tagId })))

      if (insertError) throwDatabaseError('Failed to replace post tags', insertError)
    },

    async refreshCategoryPostCounts(categoryIds) {
      await Promise.all(uniqueValues(categoryIds).map(async categoryId => {
        const { error } = await supabase.rpc('update_category_post_count', { category_id: categoryId })
        if (error) throwDatabaseError('Failed to refresh category post counts', error)
      }))
    },

    async refreshTagUsageCounts() {
      const { error } = await supabase.rpc('recalculate_tag_usage')
      if (error) throwDatabaseError('Failed to refresh tag usage counts', error)
    }
  }
}
