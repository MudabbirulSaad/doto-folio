import { describe, expect, it, vi } from 'vitest'
import {
  deleteAdminSkill,
  emptySkillForm,
  loadAdminSkills,
  saveAdminSkill,
  skillToForm,
  type AdminSkillGateway
} from '@/lib/client/application/admin/skills'

const skill = {
  id: 'skill-1',
  name: 'React',
  category: 'Frontend' as const,
  proficiency: 90,
  icon_name: 'Code2',
  display_order: 1
}

describe('admin skills workflow', () => {
  it('loads skills and maps an existing skill to form data', async () => {
    const gateway: AdminSkillGateway = {
      list: vi.fn(async () => [skill]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    await expect(loadAdminSkills(gateway)).resolves.toEqual({
      success: true,
      skills: [skill]
    })
    expect(skillToForm(skill)).toEqual({
      name: 'React',
      category: 'Frontend',
      proficiency: 90,
      icon_name: 'Code2'
    })
  })

  it('validates and saves new or existing skills through the gateway', async () => {
    const gateway: AdminSkillGateway = {
      list: vi.fn(),
      create: vi.fn(async input => ({ ...skill, ...input })),
      update: vi.fn(async (_id, input) => ({ ...skill, ...input })),
      delete: vi.fn()
    }

    await expect(saveAdminSkill(gateway, emptySkillForm())).resolves.toEqual({
      success: false,
      error: 'Skill name is required'
    })

    await expect(saveAdminSkill(gateway, { ...emptySkillForm(), name: 'React' })).resolves.toMatchObject({
      success: true,
      skill: { name: 'React' }
    })

    await expect(saveAdminSkill(gateway, { ...emptySkillForm(), name: 'Next.js' }, 'skill-1')).resolves.toMatchObject({
      success: true,
      skill: { name: 'Next.js' }
    })
  })

  it('deletes skills through the gateway', async () => {
    const gateway: AdminSkillGateway = {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(async () => undefined)
    }

    await expect(deleteAdminSkill(gateway, 'skill-1')).resolves.toEqual({
      success: true,
      id: 'skill-1'
    })
  })
})
