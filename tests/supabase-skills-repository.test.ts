import assert from 'node:assert/strict'
import test from 'node:test'
import { createSupabaseSkillContentRepository } from '../lib/server/adapters/supabase/content/skills-repository'

type QueryResult = {
  data: unknown
  error: { message: string; code?: string } | null
}

function createSupabaseClient(results: QueryResult[]) {
  const selects: string[] = []

  const query = {
    select(columns?: string) {
      selects.push(columns || '*')
      return this
    },
    order() {
      return this
    },
    then(resolve: (result: QueryResult) => unknown, reject: (error: unknown) => unknown) {
      return Promise.resolve(results.shift() || { data: null, error: null }).then(resolve, reject)
    }
  }

  return {
    selects,
    client: {
      from(table: string) {
        assert.equal(table, 'skills')
        return query
      }
    }
  }
}

test('skills repository falls back when older skills table has no published column', async () => {
  const { client, selects } = createSupabaseClient([
    {
      data: null,
      error: { message: 'column skills.is_published does not exist' }
    },
    {
      data: [
        {
          id: 'skill-1',
          name: 'React',
          category: 'Frontend',
          proficiency: 90,
          icon_name: 'Atom',
          display_order: 1,
          created_at: '2026-06-09T00:00:00.000Z',
          updated_at: '2026-06-09T00:00:00.000Z'
        }
      ],
      error: null
    }
  ])

  const repository = createSupabaseSkillContentRepository(client as any)
  const skills = await repository.listFlatSkills()

  assert.deepEqual(selects, [
    'id, name, category, proficiency, icon_name, display_order, is_published, created_at, updated_at',
    'id, name, category, proficiency, icon_name, display_order, created_at, updated_at'
  ])
  assert.deepEqual(skills, [
    {
      id: 'skill-1',
      name: 'React',
      category: 'Frontend',
      proficiency: 90,
      icon_name: 'Atom',
      display_order: 1,
      created_at: '2026-06-09T00:00:00.000Z',
      updated_at: '2026-06-09T00:00:00.000Z',
      is_published: true
    }
  ])
})
