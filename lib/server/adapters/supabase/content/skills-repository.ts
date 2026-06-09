import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type {
  CategorySkillContent,
  FlatSkillContent,
  SkillContentRepository
} from '@/lib/server/application/content/skills'

type SkillRow = Record<string, unknown>
type IdRow = { id: string }
type DisplayOrderRow = { display_order?: number | null }

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

function isMissingColumnError(error: { message?: string; code?: string }) {
  const message = error.message || ''
  return message.includes('does not exist')
}

function proficiencyFromLevel(level: unknown) {
  switch (level) {
    case 'Expert':
      return 95
    case 'Advanced':
      return 88
    case 'Intermediate':
      return 72
    case 'Learning':
      return 45
    default:
      return 60
  }
}

function levelFromProficiency(proficiency: unknown) {
  const value = Number(proficiency)
  if (value >= 92) return 'Expert'
  if (value >= 80) return 'Advanced'
  if (value >= 60) return 'Intermediate'
  return 'Learning'
}

function iconForSkill(skill: SkillRow) {
  const name = String(skill.name || '').toLowerCase()
  const category = String(skill.category || '').toLowerCase()

  if (name.includes('react')) return 'Component'
  if (name.includes('next')) return 'Layers'
  if (name.includes('type')) return 'Code2'
  if (name.includes('tailwind') || name.includes('css')) return 'Palette'
  if (name.includes('supabase') || name.includes('postgres')) return 'Database'
  if (name.includes('auth') || name.includes('security')) return 'ShieldCheck'
  if (name.includes('test') || name.includes('vitest')) return 'TestTube2'
  if (name.includes('git')) return 'GitBranch'
  if (category.includes('database')) return 'Database'
  if (category.includes('devops')) return 'Cloud'
  if (category.includes('tools')) return 'Wrench'
  if (category.includes('backend')) return 'Terminal'
  return 'Code2'
}

function categoryTitleFromSkill(skill: SkillRow) {
  const category = skill.skill_categories
  if (Array.isArray(category)) return String(category[0]?.title || 'Other')
  if (category && typeof category === 'object' && 'title' in category) {
    return String((category as { title?: unknown }).title || 'Other')
  }
  return String(skill.category || 'Other')
}

function skillFromRow(skill: SkillRow, overrides: Partial<FlatSkillContent> = {}): FlatSkillContent {
  return {
    ...skill,
    id: String(skill.id),
    name: String(skill.name),
    category: String(skill.category || 'Other'),
    proficiency: Number(skill.proficiency || 60),
    icon_name: String(skill.icon_name || iconForSkill(skill)),
    display_order: Number(skill.display_order || 0),
    is_published: skill.is_published !== false,
    ...overrides
  }
}

function mapCategorySkill(skill: SkillRow): FlatSkillContent {
  const category = categoryTitleFromSkill(skill)
  return skillFromRow(skill, {
    category,
    proficiency: proficiencyFromLevel(skill.level),
    icon_name: iconForSkill({ ...skill, category }),
    is_published: skill.is_published !== false
  })
}

function defaultDescription(data: Record<string, unknown>) {
  const name = String(data.name || 'This skill')
  const category = String(data.category || 'software development')
  return `${name} used in ${category.toLowerCase()} work across portfolio and content management projects.`
}

async function findOrCreateCategoryId(supabase: SupabaseDataClient, title: unknown) {
  const categoryTitle = String(title || 'Other')
  const { data: existing, error: existingError } = await supabase
    .from('skill_categories')
    .select('id')
    .eq('title', categoryTitle)
    .maybeSingle<IdRow>()

  if (existing?.id && !existingError) return existing.id

  const { data: lastCategory } = await supabase
    .from('skill_categories')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle<DisplayOrderRow>()

  const { data: created, error: createError } = await supabase
    .from('skill_categories')
    .insert({
      title: categoryTitle,
      display_order: (lastCategory?.display_order || 0) + 1,
      is_published: true
    })
    .select('id')
    .single<IdRow>()

  if (createError) databaseError('Failed to create skill category', createError)
  if (!created) databaseError('Failed to create skill category', { message: 'No category returned' })
  return created.id
}

async function listCategoryBackedSkills(supabase: SupabaseDataClient) {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, level, description, display_order, is_published, created_at, updated_at, skill_categories(title)')
    .order('display_order', { ascending: true }) as {
      data: SkillRow[] | null
      error: { message?: string; code?: string } | null
    }

  if (error) databaseError('Failed to fetch skills', error)
  return ((data || []) as SkillRow[]).map(mapCategorySkill)
}

async function createCategoryBackedSkill(supabase: SupabaseDataClient, data: Record<string, unknown>) {
  const categoryId = await findOrCreateCategoryId(supabase, data.category)
  const { data: skill, error } = await supabase
    .from('skills')
    .insert({
      category_id: categoryId,
      name: data.name,
      level: levelFromProficiency(data.proficiency),
      description: data.description || defaultDescription(data),
      display_order: data.display_order,
      is_published: data.is_published !== false
    })
    .select('id, name, level, description, display_order, is_published, created_at, updated_at, skill_categories(title)')
    .single<SkillRow>()

  if (error) databaseError('Failed to create skill', error)
  if (!skill) databaseError('Failed to create skill', { message: 'No skill returned' })
  return mapCategorySkill(skill)
}

export function createSupabaseSkillContentRepository(supabase: SupabaseDataClient): SkillContentRepository {
  return {
    async listFlatSkills() {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category, proficiency, icon_name, display_order, is_published, created_at, updated_at')
        .order('display_order', { ascending: true }) as {
          data: FlatSkillContent[] | null
          error: { message?: string; code?: string } | null
        }
      if (error) {
        if (!isMissingColumnError(error)) {
          databaseError('Failed to fetch skills', error)
        }

        const { data: legacyData, error: legacyError } = await supabase
          .from('skills')
          .select('id, name, category, proficiency, icon_name, display_order, created_at, updated_at')
          .order('display_order', { ascending: true }) as {
            data: SkillRow[] | null
            error: { message?: string; code?: string } | null
          }
        if (legacyError) {
          if (isMissingColumnError(legacyError)) {
            return listCategoryBackedSkills(supabase)
          }
          databaseError('Failed to fetch skills', legacyError)
        }
        return (legacyData || []).map(skill => skillFromRow(skill, { is_published: true }))
      }
      return data || []
    },

    async getLastFlatSkillDisplayOrder() {
      const { data } = await supabase
        .from('skills')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle<DisplayOrderRow>()
      return data?.display_order || 0
    },

    async createFlatSkill(data) {
      const { data: skill, error } = await supabase
        .from('skills')
        .insert(data)
        .select()
        .single<FlatSkillContent>()
      if (error) return createCategoryBackedSkill(supabase, data)
      if (!skill) databaseError('Failed to create skill', { message: 'No skill returned' })
      return skill
    },

    async updateFlatSkill(id, data) {
      const { data: skill, error } = await supabase
        .from('skills')
        .update(data)
        .eq('id', id)
        .select()
        .single<FlatSkillContent>()
      if (error) {
        const categoryId = await findOrCreateCategoryId(supabase, data.category)
        const { data: categorySkill, error: categoryError } = await supabase
          .from('skills')
          .update({
            category_id: categoryId,
            name: data.name,
            level: levelFromProficiency(data.proficiency),
            description: data.description || defaultDescription(data)
          })
          .eq('id', id)
          .select('id, name, level, description, display_order, is_published, created_at, updated_at, skill_categories(title)')
          .single<SkillRow>()

        if (categoryError) databaseError('Failed to update skill', categoryError)
        if (!categorySkill) databaseError('Failed to update skill', { message: 'No skill returned' })
        return mapCategorySkill(categorySkill)
      }
      if (!skill) databaseError('Failed to update skill', { message: 'No skill returned' })
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
        .single<IdRow>()
      return Boolean(data && !error)
    },

    async getLastCategorySkillDisplayOrder(categoryId) {
      const { data } = await supabase
        .from('skills')
        .select('display_order')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single<DisplayOrderRow>()
      return data?.display_order || 0
    },

    async createCategorySkill(data) {
      const { data: skill, error } = await supabase
        .from('skills')
        .insert(data)
        .select()
        .single<CategorySkillContent>()
      if (error) databaseError('Failed to create skill', error)
      if (!skill) databaseError('Failed to create skill', { message: 'No skill returned' })
      return skill
    }
  }
}
