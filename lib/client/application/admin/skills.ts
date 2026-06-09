import type { AdminSkill, AdminSkillFormData } from '@/lib/client/domain/admin-content'

export interface AdminSkillGateway {
  list(): Promise<AdminSkill[]>
  create(input: AdminSkillFormData): Promise<AdminSkill>
  update(id: string, input: AdminSkillFormData): Promise<AdminSkill>
  delete(id: string): Promise<void>
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export function emptySkillForm(): AdminSkillFormData {
  return {
    name: '',
    category: 'Frontend',
    proficiency: 50,
    icon_name: 'Code2'
  }
}

export function skillToForm(skill: AdminSkill): AdminSkillFormData {
  return {
    name: skill.name,
    category: skill.category,
    proficiency: skill.proficiency,
    icon_name: skill.icon_name
  }
}

export async function loadAdminSkills(gateway: AdminSkillGateway) {
  try {
    return {
      success: true as const,
      skills: await gateway.list()
    }
  } catch (error) {
    return workflowError(error, 'Failed to load skills')
  }
}

export async function saveAdminSkill(
  gateway: AdminSkillGateway,
  input: AdminSkillFormData,
  id?: string
) {
  if (!input.name.trim()) {
    return { success: false as const, error: 'Skill name is required' }
  }

  try {
    const skill = id
      ? await gateway.update(id, input)
      : await gateway.create(input)

    return {
      success: true as const,
      skill
    }
  } catch (error) {
    return workflowError(error, 'Failed to save skill')
  }
}

export async function deleteAdminSkill(gateway: AdminSkillGateway, id: string) {
  try {
    await gateway.delete(id)
    return {
      success: true as const,
      id
    }
  } catch (error) {
    return workflowError(error, 'Failed to delete skill')
  }
}
