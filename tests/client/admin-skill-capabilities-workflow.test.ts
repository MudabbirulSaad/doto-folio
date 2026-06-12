import { describe, expect, it, vi } from 'vitest'
import {
  addEvidenceTechnology,
  capabilityToForm,
  deleteAdminSkillCapability,
  deleteAdminSkillEvidence,
  emptyCapabilityForm,
  emptyEvidenceForm,
  evidenceToForm,
  loadAdminSkillCapabilities,
  removeEvidenceTechnology,
  saveAdminSkillCapability,
  saveAdminSkillEvidence,
  type AdminSkillCapabilityGateway
} from '@/lib/client/application/admin/skill-capabilities'
import type { AdminSkillCapability, AdminSkillEvidence } from '@/lib/client/domain/admin-content'

const evidence: AdminSkillEvidence = {
  id: 'evidence-1',
  capability_id: 'capability-1',
  label: 'Scoped API routes',
  description: 'Thin routes backed by use cases.',
  technologies: ['Next.js', 'TypeScript'],
  proof_label: 'View API',
  proof_url: '/api/health',
  display_order: 1,
  is_published: true
}

const capability: AdminSkillCapability = {
  id: 'capability-1',
  title: 'Backend & API Design',
  summary: 'Scoped APIs.',
  icon_name: 'Route',
  display_order: 1,
  is_published: true,
  evidence: [evidence]
}

describe('admin skill capabilities workflow', () => {
  it('loads capabilities and maps existing records to forms', async () => {
    const gateway: AdminSkillCapabilityGateway = {
      list: vi.fn(async () => [capability]),
      createCapability: vi.fn(),
      updateCapability: vi.fn(),
      deleteCapability: vi.fn(),
      createEvidence: vi.fn(),
      updateEvidence: vi.fn(),
      deleteEvidence: vi.fn()
    }

    await expect(loadAdminSkillCapabilities(gateway)).resolves.toEqual({
      success: true,
      capabilities: [capability]
    })
    expect(capabilityToForm(capability)).toEqual({
      title: 'Backend & API Design',
      summary: 'Scoped APIs.',
      icon_name: 'Route',
      display_order: 1,
      is_published: true
    })
    expect(evidenceToForm(evidence)).toMatchObject({
      label: 'Scoped API routes',
      technologies: ['Next.js', 'TypeScript']
    })
  })

  it('validates and saves capabilities and evidence through the gateway', async () => {
    const gateway: AdminSkillCapabilityGateway = {
      list: vi.fn(),
      createCapability: vi.fn(async input => ({ ...capability, ...input, evidence: [] })),
      updateCapability: vi.fn(async (_id, input) => ({ ...capability, ...input })),
      deleteCapability: vi.fn(),
      createEvidence: vi.fn(async (_capabilityId, input) => ({ ...evidence, ...input })),
      updateEvidence: vi.fn(async (_id, input) => ({ ...evidence, ...input })),
      deleteEvidence: vi.fn()
    }

    await expect(saveAdminSkillCapability(gateway, emptyCapabilityForm())).resolves.toEqual({
      success: false,
      error: 'Capability title is required'
    })
    await expect(saveAdminSkillCapability(gateway, { ...emptyCapabilityForm(), title: 'Product Frontend', summary: 'UI' })).resolves.toMatchObject({
      success: true,
      capability: { title: 'Product Frontend' }
    })
    await expect(saveAdminSkillEvidence(gateway, 'capability-1', emptyEvidenceForm())).resolves.toEqual({
      success: false,
      error: 'Evidence label is required'
    })
    await expect(saveAdminSkillEvidence(gateway, 'capability-1', { ...emptyEvidenceForm(), label: 'Proof', description: 'Real thing' })).resolves.toMatchObject({
      success: true,
      evidence: { label: 'Proof' }
    })
  })

  it('edits technology chips and deletes records through the gateway', async () => {
    const form = addEvidenceTechnology(emptyEvidenceForm(), 'Next.js')
    expect(addEvidenceTechnology(form, 'Next.js')).toBe(form)
    expect(removeEvidenceTechnology(form, 'Next.js').technologies).toEqual([])

    const gateway: AdminSkillCapabilityGateway = {
      list: vi.fn(),
      createCapability: vi.fn(),
      updateCapability: vi.fn(),
      deleteCapability: vi.fn(async () => undefined),
      createEvidence: vi.fn(),
      updateEvidence: vi.fn(),
      deleteEvidence: vi.fn(async () => undefined)
    }

    await expect(deleteAdminSkillCapability(gateway, 'capability-1')).resolves.toEqual({ success: true, id: 'capability-1' })
    await expect(deleteAdminSkillEvidence(gateway, 'evidence-1')).resolves.toEqual({ success: true, id: 'evidence-1' })
  })
})
