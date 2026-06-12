import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createSkillCapability,
  createSkillEvidence,
  listSkillCapabilities,
  updateSkillEvidence,
  type SkillCapability,
  type SkillCapabilityRepository,
  type SkillEvidence
} from '../lib/server/application/content/skill-capabilities'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(): SkillCapabilityRepository & {
  capabilities: Record<string, SkillCapability>
  evidence: Record<string, SkillEvidence>
} {
  return {
    capabilities: {},
    evidence: {},
    async listCapabilities(options = {}) {
      return Object.values(this.capabilities)
        .filter(capability => !options.publishedOnly || capability.is_published !== false)
        .map(capability => ({
          ...capability,
          evidence: Object.values(this.evidence).filter(evidence => {
            return evidence.capability_id === capability.id && (!options.publishedOnly || evidence.is_published !== false)
          })
        }))
    },
    async getLastCapabilityDisplayOrder() { return 2 },
    async createCapability(data) {
      this.capabilities.capability1 = { id: 'capability1', ...data, evidence: [] }
      return this.capabilities.capability1
    },
    async updateCapability(id, data) {
      this.capabilities[id] = { id, ...data, evidence: [] }
      return this.capabilities[id]
    },
    async deleteCapability(id) { delete this.capabilities[id] },
    async capabilityExists(id) { return Boolean(this.capabilities[id]) },
    async getLastEvidenceDisplayOrder() { return 3 },
    async createEvidence(data) {
      this.evidence.evidence1 = { id: 'evidence1', ...data }
      return this.evidence.evidence1
    },
    async updateEvidence(id, data) {
      this.evidence[id] = { ...this.evidence[id], ...data }
      return this.evidence[id]
    },
    async deleteEvidence(id) { delete this.evidence[id] }
  }
}

test('skill capability validates required fields and assigns display order', async () => {
  await assert.rejects(
    () => createSkillCapability(repository(), { title: '', summary: 'Proof', icon_name: 'Sparkles' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const capability = await createSkillCapability(repository(), {
    title: ' Backend & API Design ',
    summary: ' Scoped APIs ',
    icon_name: ' Route '
  })

  assert.equal(capability.title, 'Backend & API Design')
  assert.equal(capability.summary, 'Scoped APIs')
  assert.equal(capability.icon_name, 'Route')
  assert.equal(capability.display_order, 3)
})

test('skill evidence validates proof URLs and normalizes technologies', async () => {
  const repo = repository()
  repo.capabilities.capability1 = {
    id: 'capability1',
    title: 'AI-Native Product Thinking',
    summary: 'Agent workflows',
    icon_name: 'Bot',
    display_order: 1,
    is_published: true,
    evidence: []
  }

  await assert.rejects(
    () => createSkillEvidence(repo, 'capability1', {
      label: 'Agent access',
      description: 'Scoped context',
      proof_url: 'ftp://example.com'
    }),
    /Proof URL/
  )

  const evidence = await createSkillEvidence(repo, 'capability1', {
    label: ' Agent access ',
    description: ' Scoped context ',
    technologies: ['Next.js', ' Next.js ', 'Supabase', ''],
    proof_label: ' Read skill.md ',
    proof_url: ' /skill.md '
  })

  assert.equal(evidence.label, 'Agent access')
  assert.deepEqual(evidence.technologies, ['Next.js', 'Supabase'])
  assert.equal(evidence.proof_label, 'Read skill.md')
  assert.equal(evidence.proof_url, '/skill.md')
  assert.equal(evidence.display_order, 4)
})

test('published capability listing filters unpublished evidence', async () => {
  const repo = repository()
  repo.capabilities.visible = {
    id: 'visible',
    title: 'Product Frontend',
    summary: 'Polished UI',
    icon_name: 'LayoutDashboard',
    display_order: 1,
    is_published: true,
    evidence: []
  }
  repo.capabilities.hidden = {
    id: 'hidden',
    title: 'Hidden',
    summary: 'Hidden',
    icon_name: 'Sparkles',
    display_order: 2,
    is_published: false,
    evidence: []
  }
  repo.evidence.live = {
    id: 'live',
    capability_id: 'visible',
    label: 'Live proof',
    description: 'Visible',
    technologies: [],
    display_order: 2,
    is_published: true
  }
  repo.evidence.draft = {
    id: 'draft',
    capability_id: 'visible',
    label: 'Draft proof',
    description: 'Hidden',
    technologies: [],
    display_order: 1,
    is_published: false
  }

  const capabilities = await listSkillCapabilities(repo, { publishedOnly: true })

  assert.deepEqual(capabilities.map(capability => capability.title), ['Product Frontend'])
  assert.deepEqual(capabilities[0].evidence.map(evidence => evidence.label), ['Live proof'])
})

test('updating evidence accepts relative and https proof URLs', async () => {
  const repo = repository()
  repo.evidence.evidence1 = {
    id: 'evidence1',
    capability_id: 'capability1',
    label: 'Old',
    description: 'Old',
    technologies: [],
    display_order: 1,
    is_published: true
  }

  const evidence = await updateSkillEvidence(repo, 'evidence1', {
    label: 'Docs',
    description: 'Architecture notes',
    proof_url: 'https://example.com/docs'
  })

  assert.equal(evidence.proof_url, 'https://example.com/docs')
})
