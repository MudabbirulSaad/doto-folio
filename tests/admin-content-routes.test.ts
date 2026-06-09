import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

test('admin content dashboard destinations have implemented pages', () => {
  const root = process.cwd()

  assert.equal(
    existsSync(join(root, 'app/admin/content/contact/page.tsx')),
    true,
    '/admin/content/contact should have a page implementation'
  )
  assert.equal(
    existsSync(join(root, 'app/admin/content/settings/page.tsx')),
    false,
    '/admin/content/settings should not be linked unless implemented'
  )
})

test('admin content read APIs require an admin user before loading data', () => {
  const root = process.cwd()
  const protectedRoutes = [
    'app/api/admin/content/contact/route.ts',
    'app/api/admin/content/projects/route.ts',
    'app/api/admin/content/projects/[id]/route.ts',
    'app/api/admin/content/skills/route.ts'
  ]

  for (const route of protectedRoutes) {
    const source = readFileSync(join(root, route), 'utf8')
    const authIndex = source.indexOf('await getCurrentAdminUser()')
    const unauthorizedIndex = source.indexOf('createLegacyUnauthorizedResponse()', authIndex)
    const dataAccessIndex = Math.min(
      ...[
        source.indexOf('await (await createContactContentUseCases())'),
        source.indexOf('await (await createProjectUseCases())'),
        source.indexOf('await (await createSkillContentUseCases())')
      ].filter(index => index >= 0)
    )

    assert.notEqual(authIndex, -1, `${route} should check the current admin user`)
    assert.notEqual(unauthorizedIndex, -1, `${route} should reject missing admin users`)
    assert.ok(authIndex < dataAccessIndex, `${route} should authenticate before data access`)
  }
})
