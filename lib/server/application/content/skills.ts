import { ApplicationError } from '@/lib/server/domain/errors'

const VALID_FLAT_SKILL_CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Other']
const VALID_CATEGORY_SKILL_LEVELS = ['Learning', 'Intermediate', 'Advanced', 'Expert']

export interface SkillContentRepository {
  listFlatSkills(): Promise<any[]>
  getLastFlatSkillDisplayOrder(): Promise<number>
  createFlatSkill(data: Record<string, unknown>): Promise<any>
  updateFlatSkill(id: string, data: Record<string, unknown>): Promise<any>
  deleteSkill(id: string): Promise<void>
  categoryExists(id: string): Promise<boolean>
  getLastCategorySkillDisplayOrder(categoryId: string): Promise<number>
  createCategorySkill(data: Record<string, unknown>): Promise<any>
}

export interface FlatSkillInput {
  name?: string
  category?: string
  proficiency?: unknown
  icon_name?: string
  display_order?: number
}

export interface CategorySkillInput {
  name?: string
  level?: string
  description?: string
  display_order?: number
  is_published?: boolean
}

function validateFlatSkill(input: FlatSkillInput) {
  if (!input.name?.trim()) throw new ApplicationError('VALIDATION_ERROR', 'Skill name is required')
  if (!VALID_FLAT_SKILL_CATEGORIES.includes(String(input.category))) throw new ApplicationError('VALIDATION_ERROR', 'Invalid skill category')
  const proficiency = Number(input.proficiency)
  if (!Number.isInteger(proficiency) || proficiency < 0 || proficiency > 100) {
    throw new ApplicationError('VALIDATION_ERROR', 'Proficiency must be between 0 and 100')
  }
  if (!input.icon_name?.trim()) throw new ApplicationError('VALIDATION_ERROR', 'Icon name is required')
  return proficiency
}

function validateCategorySkill(input: CategorySkillInput) {
  if (!input.name || !input.level || !input.description) {
    throw new ApplicationError('VALIDATION_ERROR', 'Name, level, and description are required')
  }
  if (!VALID_CATEGORY_SKILL_LEVELS.includes(input.level)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid skill level')
  }
}

export function listFlatSkills(repository: SkillContentRepository) {
  return repository.listFlatSkills()
}

export async function createFlatSkill(repository: SkillContentRepository, input: FlatSkillInput) {
  const proficiency = validateFlatSkill(input)
  const nextDisplayOrder = await repository.getLastFlatSkillDisplayOrder() + 1
  return repository.createFlatSkill({
    name: input.name!.trim(),
    category: input.category,
    proficiency,
    icon_name: input.icon_name!.trim(),
    display_order: input.display_order || nextDisplayOrder
  })
}

export async function updateFlatSkill(repository: SkillContentRepository, id: string, input: FlatSkillInput) {
  const proficiency = validateFlatSkill(input)
  return repository.updateFlatSkill(id, {
    name: input.name!.trim(),
    category: input.category,
    proficiency,
    icon_name: input.icon_name!.trim()
  })
}

export function deleteSkill(repository: SkillContentRepository, id: string) {
  return repository.deleteSkill(id)
}

export async function createSkillInCategory(repository: SkillContentRepository, categoryId: string, input: CategorySkillInput) {
  validateCategorySkill(input)
  if (!await repository.categoryExists(categoryId)) {
    throw new ApplicationError('NOT_FOUND', 'Skill category not found')
  }
  const nextDisplayOrder = await repository.getLastCategorySkillDisplayOrder(categoryId) + 1
  return repository.createCategorySkill({
    category_id: categoryId,
    name: input.name,
    level: input.level,
    description: input.description,
    display_order: input.display_order || nextDisplayOrder,
    is_published: input.is_published !== undefined ? input.is_published : true
  })
}
