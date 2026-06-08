import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type { SkillContentRepository } from '@/lib/server/application/content/skills'

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

export function createSupabaseSkillContentRepository(supabase: SupabaseDataClient): SkillContentRepository {
  return {
    async listFlatSkills() {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category, proficiency, icon_name, display_order, created_at, updated_at')
        .order('display_order', { ascending: true })
      if (error) databaseError('Failed to fetch skills', error)
      return data || []
    },

    async getLastFlatSkillDisplayOrder() {
      const { data } = await supabase
        .from('skills')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data?.display_order || 0
    },

    async createFlatSkill(data) {
      const { data: skill, error } = await supabase
        .from('skills')
        .insert(data)
        .select()
        .single()
      if (error) databaseError('Failed to create skill', error)
      return skill
    },

    async updateFlatSkill(id, data) {
      const { data: skill, error } = await supabase
        .from('skills')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) databaseError('Failed to update skill', error)
      return skill
    },

    async deleteSkill(id) {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id)
      if (error) databaseError('Failed to delete skill', error)
    },

    async categoryExists(id) {
      const { data, error } = await supabase
        .from('skill_categories')
        .select('id')
        .eq('id', id)
        .single()
      return Boolean(data && !error)
    },

    async getLastCategorySkillDisplayOrder(categoryId) {
      const { data } = await supabase
        .from('skills')
        .select('display_order')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()
      return data?.display_order || 0
    },

    async createCategorySkill(data) {
      const { data: skill, error } = await supabase
        .from('skills')
        .insert(data)
        .select()
        .single()
      if (error) databaseError('Failed to create skill', error)
      return skill
    }
  }
}
