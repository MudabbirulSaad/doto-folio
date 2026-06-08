import { ApplicationError } from '@/lib/server/domain/errors'
import type { AdminBlogTaxonomyRepository } from '@/lib/server/application/blog/admin-blog-taxonomy'

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

export function createSupabaseAdminBlogTaxonomyRepository(supabase: any): AdminBlogTaxonomyRepository {
  return {
    async listCategories() {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) databaseError('Failed to fetch categories', error)
      return data || []
    },

    async listTags() {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('usage_count', { ascending: false })
      if (error) databaseError('Failed to fetch tags', error)
      return data || []
    },

    async findCategoryById(id) {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return null
      return data
    },

    async findTagById(id) {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return null
      return data
    },

    async findCategoryDuplicate(name, slug, excludeId) {
      let query = supabase
        .from('blog_categories')
        .select('id, name, slug')
        .or(`name.eq.${name},slug.eq.${slug}`)

      if (excludeId) query = query.neq('id', excludeId)
      const { data } = await query.single()
      return data || null
    },

    async findTagDuplicate(name, slug, excludeId) {
      let query = supabase
        .from('blog_tags')
        .select('id, name, slug')
        .or(`name.eq.${name},slug.eq.${slug}`)

      if (excludeId) query = query.neq('id', excludeId)
      const { data } = await query.single()
      return data || null
    },

    async createCategory(data) {
      const { data: category, error } = await supabase
        .from('blog_categories')
        .insert(data)
        .select()
        .single()
      if (error) databaseError('Failed to create category', error)
      return category
    },

    async updateCategory(id, data) {
      const { data: category, error } = await supabase
        .from('blog_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) databaseError('Failed to update category', error)
      return category
    },

    async deleteCategory(id) {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id)
      if (error) databaseError('Failed to delete category', error)
    },

    async clearCategoryFromPosts(id) {
      const { error } = await supabase
        .from('blog_posts')
        .update({ category_id: null })
        .eq('category_id', id)
      if (error) databaseError('Failed to update posts', error)
    },

    async createTag(data) {
      const { data: tag, error } = await supabase
        .from('blog_tags')
        .insert(data)
        .select()
        .single()
      if (error) databaseError('Failed to create tag', error)
      return tag
    },

    async updateTag(id, data) {
      const { data: tag, error } = await supabase
        .from('blog_tags')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) databaseError('Failed to update tag', error)
      return tag
    },

    async deleteTag(id) {
      const { error } = await supabase
        .from('blog_tags')
        .delete()
        .eq('id', id)
      if (error) databaseError('Failed to delete tag', error)
    }
  }
}
