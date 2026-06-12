import type {
  AdminSkillCapability,
  AdminSkillCapabilityFormData,
  AdminSkillEvidence,
  AdminSkillEvidenceFormData
} from '@/lib/client/domain/admin-content'

export interface AdminSkillCapabilityGateway {
  list(): Promise<AdminSkillCapability[]>
  createCapability(input: AdminSkillCapabilityFormData): Promise<AdminSkillCapability>
  updateCapability(id: string, input: AdminSkillCapabilityFormData): Promise<AdminSkillCapability>
  deleteCapability(id: string): Promise<void>
  createEvidence(capabilityId: string, input: AdminSkillEvidenceFormData): Promise<AdminSkillEvidence>
  updateEvidence(id: string, input: AdminSkillEvidenceFormData): Promise<AdminSkillEvidence>
  deleteEvidence(id: string): Promise<void>
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export function emptyCapabilityForm(displayOrder = 1): AdminSkillCapabilityFormData {
  return {
    title: '',
    summary: '',
    icon_name: 'Sparkles',
    display_order: displayOrder,
    is_published: true
  }
}

export function capabilityToForm(capability: AdminSkillCapability): AdminSkillCapabilityFormData {
  return {
    title: capability.title,
    summary: capability.summary,
    icon_name: capability.icon_name,
    display_order: capability.display_order,
    is_published: capability.is_published !== false
  }
}

export function emptyEvidenceForm(displayOrder = 1): AdminSkillEvidenceFormData {
  return {
    label: '',
    description: '',
    technologies: [],
    proof_label: '',
    proof_url: '',
    display_order: displayOrder,
    is_published: true
  }
}

export function evidenceToForm(evidence: AdminSkillEvidence): AdminSkillEvidenceFormData {
  return {
    label: evidence.label,
    description: evidence.description,
    technologies: evidence.technologies || [],
    proof_label: evidence.proof_label || '',
    proof_url: evidence.proof_url || '',
    display_order: evidence.display_order,
    is_published: evidence.is_published !== false
  }
}

export function addEvidenceTechnology(form: AdminSkillEvidenceFormData, technology: string): AdminSkillEvidenceFormData {
  const trimmed = technology.trim()
  if (!trimmed || form.technologies.includes(trimmed)) return form
  return { ...form, technologies: [...form.technologies, trimmed] }
}

export function removeEvidenceTechnology(form: AdminSkillEvidenceFormData, technology: string): AdminSkillEvidenceFormData {
  return { ...form, technologies: form.technologies.filter(item => item !== technology) }
}

export async function loadAdminSkillCapabilities(gateway: AdminSkillCapabilityGateway) {
  try {
    return {
      success: true as const,
      capabilities: await gateway.list()
    }
  } catch (error) {
    return workflowError(error, 'Failed to load skill capabilities')
  }
}

export async function saveAdminSkillCapability(
  gateway: AdminSkillCapabilityGateway,
  input: AdminSkillCapabilityFormData,
  id?: string
) {
  if (!input.title.trim()) return { success: false as const, error: 'Capability title is required' }
  if (!input.summary.trim()) return { success: false as const, error: 'Capability summary is required' }
  if (!input.icon_name.trim()) return { success: false as const, error: 'Capability icon is required' }

  try {
    const capability = id
      ? await gateway.updateCapability(id, input)
      : await gateway.createCapability(input)

    return {
      success: true as const,
      capability
    }
  } catch (error) {
    return workflowError(error, 'Failed to save skill capability')
  }
}

export async function deleteAdminSkillCapability(gateway: AdminSkillCapabilityGateway, id: string) {
  try {
    await gateway.deleteCapability(id)
    return { success: true as const, id }
  } catch (error) {
    return workflowError(error, 'Failed to delete skill capability')
  }
}

export async function saveAdminSkillEvidence(
  gateway: AdminSkillCapabilityGateway,
  capabilityId: string,
  input: AdminSkillEvidenceFormData,
  id?: string
) {
  if (!input.label.trim()) return { success: false as const, error: 'Evidence label is required' }
  if (!input.description.trim()) return { success: false as const, error: 'Evidence description is required' }

  try {
    const evidence = id
      ? await gateway.updateEvidence(id, input)
      : await gateway.createEvidence(capabilityId, input)

    return {
      success: true as const,
      evidence
    }
  } catch (error) {
    return workflowError(error, 'Failed to save skill evidence')
  }
}

export async function deleteAdminSkillEvidence(gateway: AdminSkillCapabilityGateway, id: string) {
  try {
    await gateway.deleteEvidence(id)
    return { success: true as const, id }
  } catch (error) {
    return workflowError(error, 'Failed to delete skill evidence')
  }
}
