import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type {
  SkillCapability,
  SkillCapabilityRepository,
  SkillEvidence
} from '@/lib/server/application/content/skill-capabilities'
import { ApplicationError } from '@/lib/server/domain/errors'

type DisplayOrderRow = { display_order?: number | null }
type IdRow = { id: string }

type SkillCapabilityRow = Omit<SkillCapability, 'evidence'> & {
  skill_evidence?: SkillEvidence[] | null
}

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

function sortEvidence(evidence: SkillEvidence[] = []) {
  return [...evidence].sort((left, right) => left.display_order - right.display_order)
}

function mapCapability(row: SkillCapabilityRow): SkillCapability {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    icon_name: row.icon_name,
    display_order: row.display_order,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    evidence: sortEvidence(row.skill_evidence || [])
  }
}

export function createSupabaseSkillCapabilityRepository(
  supabase: SupabaseDataClient
): SkillCapabilityRepository {
  return {
    async listCapabilities(options = {}) {
      let query = supabase
        .from('skill_capabilities')
        .select(`
          id,
          title,
          summary,
          icon_name,
          display_order,
          is_published,
          created_at,
          updated_at,
          skill_evidence (
            id,
            capability_id,
            label,
            description,
            technologies,
            proof_label,
            proof_url,
            display_order,
            is_published,
            created_at,
            updated_at
          )
        `)
        .order('display_order', { ascending: true })

      if (options.publishedOnly) query = query.eq('is_published', true)

      const { data, error } = await query as {
        data: SkillCapabilityRow[] | null
        error: { message?: string } | null
      }

      if (error) databaseError('Failed to fetch skill capabilities', error)

      return (data || []).map(mapCapability).map(capability => ({
        ...capability,
        evidence: options.publishedOnly
          ? capability.evidence.filter(evidence => evidence.is_published !== false)
          : capability.evidence
      }))
    },

    async getLastCapabilityDisplayOrder() {
      const { data } = await supabase
        .from('skill_capabilities')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle<DisplayOrderRow>()

      return data?.display_order || 0
    },

    async createCapability(data) {
      const { data: capability, error } = await supabase
        .from('skill_capabilities')
        .insert(data)
        .select()
        .single<Omit<SkillCapability, 'evidence'>>()

      if (error) databaseError('Failed to create skill capability', error)
      if (!capability) databaseError('Failed to create skill capability', { message: 'No capability returned' })

      return { ...capability, evidence: [] }
    },

    async updateCapability(id, data) {
      const { data: capability, error } = await supabase
        .from('skill_capabilities')
        .update(data)
        .eq('id', id)
        .select()
        .single<Omit<SkillCapability, 'evidence'>>()

      if (error) databaseError('Failed to update skill capability', error)
      if (!capability) databaseError('Failed to update skill capability', { message: 'No capability returned' })

      return { ...capability, evidence: [] }
    },

    async deleteCapability(id) {
      const { error } = await supabase
        .from('skill_capabilities')
        .delete()
        .eq('id', id)

      if (error) databaseError('Failed to delete skill capability', error)
    },

    async capabilityExists(id) {
      const { data, error } = await supabase
        .from('skill_capabilities')
        .select('id')
        .eq('id', id)
        .maybeSingle<IdRow>()

      return Boolean(data?.id && !error)
    },

    async getLastEvidenceDisplayOrder(capabilityId) {
      const { data } = await supabase
        .from('skill_evidence')
        .select('display_order')
        .eq('capability_id', capabilityId)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle<DisplayOrderRow>()

      return data?.display_order || 0
    },

    async createEvidence(data) {
      const { data: evidence, error } = await supabase
        .from('skill_evidence')
        .insert(data)
        .select()
        .single<SkillEvidence>()

      if (error) databaseError('Failed to create skill evidence', error)
      if (!evidence) databaseError('Failed to create skill evidence', { message: 'No evidence returned' })
      return evidence
    },

    async updateEvidence(id, data) {
      const { data: evidence, error } = await supabase
        .from('skill_evidence')
        .update(data)
        .eq('id', id)
        .select()
        .single<SkillEvidence>()

      if (error) databaseError('Failed to update skill evidence', error)
      if (!evidence) databaseError('Failed to update skill evidence', { message: 'No evidence returned' })
      return evidence
    },

    async deleteEvidence(id) {
      const { error } = await supabase
        .from('skill_evidence')
        .delete()
        .eq('id', id)

      if (error) databaseError('Failed to delete skill evidence', error)
    }
  }
}
