import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createFlatSkill,
  createSkillInCategory,
  updateFlatSkill,
  type CategorySkillContent,
  type FlatSkillContent,
  type SkillContentRepository
} from '../lib/server/application/content/skills'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(): SkillContentRepository & { skills: Record<string, FlatSkillContent | CategorySkillContent>; categories: Set<string> } {
  return {
    skills: {},
    categories: new Set(['cat-1']),
    async listFlatSkills() { return Object.values(this.skills) },
    async getLastFlatSkillDisplayOrder() { return 2 },
    async createFlatSkill(data) { this.skills.skill1 = { id: 'skill1', ...data }; return this.skills.skill1 },
    async updateFlatSkill(id, data) { this.skills[id] = { id, ...data }; return this.skills[id] },
    async deleteSkill(id) { delete this.skills[id] },
    async categoryExists(id) { return this.categories.has(id) },
    async getLastCategorySkillDisplayOrder() { return 3 },
    async createCategorySkill(data) { this.skills.skill2 = { id: 'skill2', ...data }; return this.skills.skill2 }
  }
}

test('createFlatSkill validates and assigns next display order', async () => {
  await assert.rejects(
    () => createFlatSkill(repository(), { name: '', category: 'Frontend', proficiency: 50, icon_name: 'Code' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const skill = await createFlatSkill(repository(), {
    name: ' TypeScript ',
    category: 'Frontend',
    proficiency: 80,
    icon_name: ' Code '
  })

  assert.equal(skill.name, 'TypeScript')
  assert.equal(skill.icon_name, 'Code')
  assert.equal(skill.display_order, 3)
})

test('updateFlatSkill validates proficiency and trims values', async () => {
  await assert.rejects(
    () => updateFlatSkill(repository(), 'skill1', { name: 'TS', category: 'Frontend', proficiency: 101, icon_name: 'Code' }),
    /Proficiency/
  )

  const skill = await updateFlatSkill(repository(), 'skill1', {
    name: ' TS ',
    category: 'Frontend',
    proficiency: 90,
    icon_name: ' Code '
  })

  assert.equal(skill.name, 'TS')
})

test('createSkillInCategory validates category and level', async () => {
  await assert.rejects(
    () => createSkillInCategory(repository(), 'missing', { name: 'TS', level: 'Expert', description: 'Typed JS' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND'
  )

  const skill = await createSkillInCategory(repository(), 'cat-1', {
    name: 'TS',
    level: 'Expert',
    description: 'Typed JS'
  })

  assert.equal(skill.category_id, 'cat-1')
  assert.equal(skill.display_order, 4)
})
