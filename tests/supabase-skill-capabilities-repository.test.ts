import assert from 'node:assert/strict'
import test from 'node:test'
import { createSupabaseSkillCapabilityRepository } from '../lib/server/adapters/supabase/content/skill-capabilities-repository'
import type { SupabaseDataClient } from '../lib/server/adapters/supabase/types'

type QueryResult = {
  data: unknown
  error: { message: string } | null
}

function createSupabaseClient(results: QueryResult[]) {
  const calls: Array<{ table: string; columns?: string; filters: Array<[string, unknown]> }> = []
  let current = { table: '', columns: undefined as string | undefined, filters: [] as Array<[string, unknown]> }

  const query = {
    select(columns?: string) {
      current.columns = columns
      return this
    },
    order() { return this },
    eq(column: string, value: unknown) {
      current.filters.push([column, value])
      return this
    },
    then(resolve: (result: QueryResult) => unknown, reject: (error: unknown) => unknown) {
      calls.push(current)
      current = { table: '', columns: undefined, filters: [] }
      return Promise.resolve(results.shift() || { data: null, error: null }).then(resolve, reject)
    }
  }

  return {
    calls,
    client: {
      from(table: string) {
        current = { table, columns: undefined, filters: [] }
        return query
      }
    }
  }
}

test('skill capability repository maps nested evidence and published filters', async () => {
  const { client, calls } = createSupabaseClient([
    {
      data: [
        {
          id: 'capability-1',
          title: 'Backend & API Design',
          summary: 'Scoped APIs',
          icon_name: 'Route',
          display_order: 1,
          is_published: true,
          skill_evidence: [
            {
              id: 'evidence-hidden',
              capability_id: 'capability-1',
              label: 'Hidden',
              description: 'Draft',
              technologies: [],
              display_order: 1,
              is_published: false
            },
            {
              id: 'evidence-live',
              capability_id: 'capability-1',
              label: 'Live',
              description: 'Proof',
              technologies: ['Next.js'],
              display_order: 2,
              is_published: true
            }
          ]
        }
      ],
      error: null
    }
  ])

  const repository = createSupabaseSkillCapabilityRepository(client as unknown as SupabaseDataClient)
  const capabilities = await repository.listCapabilities({ publishedOnly: true })

  assert.equal(calls[0].table, 'skill_capabilities')
  assert.deepEqual(calls[0].filters, [['is_published', true]])
  assert.deepEqual(capabilities.map(capability => capability.title), ['Backend & API Design'])
  assert.deepEqual(capabilities[0].evidence.map(evidence => evidence.label), ['Live'])
})
