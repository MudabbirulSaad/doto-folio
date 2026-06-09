import { ApplicationError } from '@/lib/server/domain/errors'
import type { PublicSkill } from '@/lib/server/application/content/public-portfolio'

const VALID_FLAT_SKILL_CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Other'] as const
const VALID_CATEGORY_SKILL_LEVELS = ['Learning', 'Intermediate', 'Advanced', 'Expert'] as const

export type FlatSkillCategory = typeof VALID_FLAT_SKILL_CATEGORIES[number]
export type CategorySkillLevel = typeof VALID_CATEGORY_SKILL_LEVELS[number]
export type FlatSkillContent = PublicSkill
type FlatSkillFallbackFields = {
  description?: string
  is_published?: boolean
}
export type FlatSkillCreateData = Omit<FlatSkillContent, 'id'> & FlatSkillFallbackFields
export type FlatSkillUpdateData = Omit<FlatSkillContent, 'id' | 'display_order' | 'is_published'> & FlatSkillFallbackFields
export interface CategorySkillContent {
  id: string
  category_id: string
  name: string
  level: CategorySkillLevel
  description: string
  display_order: number
  is_published?: boolean
}
export type CategorySkillCreateData = Omit<CategorySkillContent, 'id'>

export interface SkillContentRepository {
  listFlatSkills(): Promise<FlatSkillContent[]>
  getLastFlatSkillDisplayOrder(): Promise<number>
  createFlatSkill(data: FlatSkillCreateData): Promise<FlatSkillContent>
  updateFlatSkill(id: string, data: FlatSkillUpdateData): Promise<FlatSkillContent>
  deleteSkill(id: string): Promise<void>
  categoryExists(id: string): Promise<boolean>
  getLastCategorySkillDisplayOrder(categoryId: string): Promise<number>
  createCategorySkill(data: CategorySkillCreateData): Promise<CategorySkillContent>
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

type ValidFlatSkillInput = FlatSkillInput & {
  name: string
  category: FlatSkillCategory
  icon_name: string
}

type ValidCategorySkillInput = CategorySkillInput & {
  name: string
  level: CategorySkillLevel
  description: string
}

function isFlatSkillCategory(category: string): category is FlatSkillCategory {
  return VALID_FLAT_SKILL_CATEGORIES.includes(category as FlatSkillCategory)
}

function isCategorySkillLevel(level: string): level is CategorySkillLevel {
  return VALID_CATEGORY_SKILL_LEVELS.includes(level as CategorySkillLevel)
}

function validateFlatSkill(input: FlatSkillInput): asserts input is ValidFlatSkillInput {
  if (!input.name?.trim()) throw new ApplicationError('VALIDATION_ERROR', 'Skill name is required')
  if (!isFlatSkillCategory(String(input.category))) throw new ApplicationError('VALIDATION_ERROR', 'Invalid skill category')
  const proficiency = Number(input.proficiency)
  if (!Number.isInteger(proficiency) || proficiency < 0 || proficiency > 100) {
    throw new ApplicationError('VALIDATION_ERROR', 'Proficiency must be between 0 and 100')
  }
  if (!input.icon_name?.trim()) throw new ApplicationError('VALIDATION_ERROR', 'Icon name is required')
}

function validProficiency(input: FlatSkillInput) {
  return Number(input.proficiency)
}

function validateCategorySkill(input: CategorySkillInput): asserts input is ValidCategorySkillInput {
  if (!input.name || !input.level || !input.description) {
    throw new ApplicationError('VALIDATION_ERROR', 'Name, level, and description are required')
  }
  if (!isCategorySkillLevel(input.level)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid skill level')
  }
}

export function listFlatSkills(repository: SkillContentRepository) {
  return repository.listFlatSkills()
}

export async function createFlatSkill(repository: SkillContentRepository, input: FlatSkillInput) {
  validateFlatSkill(input)
  const nextDisplayOrder = await repository.getLastFlatSkillDisplayOrder() + 1
  return repository.createFlatSkill({
    name: input.name.trim(),
    category: input.category,
    proficiency: validProficiency(input),
    icon_name: input.icon_name.trim(),
    display_order: input.display_order || nextDisplayOrder
  })
}

export async function updateFlatSkill(repository: SkillContentRepository, id: string, input: FlatSkillInput) {
  validateFlatSkill(input)
  return repository.updateFlatSkill(id, {
    name: input.name.trim(),
    category: input.category,
    proficiency: validProficiency(input),
    icon_name: input.icon_name.trim()
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
