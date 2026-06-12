import { ApplicationError } from '@/lib/server/domain/errors'

export interface SkillEvidence {
  id: string
  capability_id: string
  label: string
  description: string
  technologies: string[]
  proof_label?: string | null
  proof_url?: string | null
  display_order: number
  is_published?: boolean
  created_at?: string
  updated_at?: string
}

export interface SkillCapability {
  id: string
  title: string
  summary: string
  icon_name: string
  display_order: number
  is_published?: boolean
  evidence: SkillEvidence[]
  created_at?: string
  updated_at?: string
}

export type SkillCapabilityCreateData = Omit<SkillCapability, 'id' | 'evidence' | 'created_at' | 'updated_at'>
export type SkillCapabilityUpdateData = SkillCapabilityCreateData
export type SkillEvidenceCreateData = Omit<SkillEvidence, 'id' | 'created_at' | 'updated_at'>
export type SkillEvidenceUpdateData = Omit<SkillEvidence, 'id' | 'capability_id' | 'created_at' | 'updated_at'>

export interface SkillCapabilityRepository {
  listCapabilities(options?: { publishedOnly?: boolean }): Promise<SkillCapability[]>
  getLastCapabilityDisplayOrder(): Promise<number>
  createCapability(data: SkillCapabilityCreateData): Promise<SkillCapability>
  updateCapability(id: string, data: SkillCapabilityUpdateData): Promise<SkillCapability>
  deleteCapability(id: string): Promise<void>
  capabilityExists(id: string): Promise<boolean>
  getLastEvidenceDisplayOrder(capabilityId: string): Promise<number>
  createEvidence(data: SkillEvidenceCreateData): Promise<SkillEvidence>
  updateEvidence(id: string, data: SkillEvidenceUpdateData): Promise<SkillEvidence>
  deleteEvidence(id: string): Promise<void>
}

export interface SkillCapabilityInput {
  title?: string
  summary?: string
  icon_name?: string
  display_order?: number
  is_published?: boolean
}

export interface SkillEvidenceInput {
  label?: string
  description?: string
  technologies?: string[]
  proof_label?: string | null
  proof_url?: string | null
  display_order?: number
  is_published?: boolean
}

type ValidSkillCapabilityInput = SkillCapabilityInput & {
  title: string
  summary: string
  icon_name: string
}

type ValidSkillEvidenceInput = SkillEvidenceInput & {
  label: string
  description: string
}

function trimRequired(value: string | undefined, message: string) {
  const trimmed = value?.trim()
  if (!trimmed) throw new ApplicationError('VALIDATION_ERROR', message)
  return trimmed
}

function assertValidProofUrl(url: string | null | undefined) {
  const trimmed = url?.trim()
  if (!trimmed) return

  if (trimmed.startsWith('/')) return

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return
  } catch {
    // Fall through to the validation error below.
  }

  throw new ApplicationError('VALIDATION_ERROR', 'Proof URL must be a relative path or http(s) URL')
}

function normalizeTechnologies(technologies: string[] | undefined) {
  return [...new Set((technologies || []).map(technology => technology.trim()).filter(Boolean))]
}

function validateCapability(input: SkillCapabilityInput): asserts input is ValidSkillCapabilityInput {
  trimRequired(input.title, 'Capability title is required')
  trimRequired(input.summary, 'Capability summary is required')
  trimRequired(input.icon_name, 'Capability icon is required')
}

function validateEvidence(input: SkillEvidenceInput): asserts input is ValidSkillEvidenceInput {
  trimRequired(input.label, 'Evidence label is required')
  trimRequired(input.description, 'Evidence description is required')
  assertValidProofUrl(input.proof_url)
}

export async function listSkillCapabilities(
  repository: SkillCapabilityRepository,
  options: { publishedOnly?: boolean } = {}
) {
  const capabilities = await repository.listCapabilities(options)
  return capabilities.map(capability => ({
    ...capability,
    evidence: [...capability.evidence].sort((left, right) => left.display_order - right.display_order)
  }))
}

export async function createSkillCapability(repository: SkillCapabilityRepository, input: SkillCapabilityInput) {
  validateCapability(input)
  const nextDisplayOrder = await repository.getLastCapabilityDisplayOrder() + 1

  return repository.createCapability({
    title: input.title.trim(),
    summary: input.summary.trim(),
    icon_name: input.icon_name.trim(),
    display_order: input.display_order || nextDisplayOrder,
    is_published: input.is_published !== undefined ? input.is_published : true
  })
}

export function updateSkillCapability(
  repository: SkillCapabilityRepository,
  id: string,
  input: SkillCapabilityInput
) {
  validateCapability(input)

  return repository.updateCapability(id, {
    title: input.title.trim(),
    summary: input.summary.trim(),
    icon_name: input.icon_name.trim(),
    display_order: input.display_order || 0,
    is_published: input.is_published !== undefined ? input.is_published : true
  })
}

export function deleteSkillCapability(repository: SkillCapabilityRepository, id: string) {
  return repository.deleteCapability(id)
}

export async function createSkillEvidence(
  repository: SkillCapabilityRepository,
  capabilityId: string,
  input: SkillEvidenceInput
) {
  validateEvidence(input)
  if (!await repository.capabilityExists(capabilityId)) {
    throw new ApplicationError('NOT_FOUND', 'Skill capability not found')
  }
  const nextDisplayOrder = await repository.getLastEvidenceDisplayOrder(capabilityId) + 1

  return repository.createEvidence({
    capability_id: capabilityId,
    label: input.label.trim(),
    description: input.description.trim(),
    technologies: normalizeTechnologies(input.technologies),
    proof_label: input.proof_label?.trim() || null,
    proof_url: input.proof_url?.trim() || null,
    display_order: input.display_order || nextDisplayOrder,
    is_published: input.is_published !== undefined ? input.is_published : true
  })
}

export function updateSkillEvidence(
  repository: SkillCapabilityRepository,
  id: string,
  input: SkillEvidenceInput
) {
  validateEvidence(input)

  return repository.updateEvidence(id, {
    label: input.label.trim(),
    description: input.description.trim(),
    technologies: normalizeTechnologies(input.technologies),
    proof_label: input.proof_label?.trim() || null,
    proof_url: input.proof_url?.trim() || null,
    display_order: input.display_order || 0,
    is_published: input.is_published !== undefined ? input.is_published : true
  })
}

export function deleteSkillEvidence(repository: SkillCapabilityRepository, id: string) {
  return repository.deleteEvidence(id)
}
