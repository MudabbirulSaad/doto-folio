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

test('admin content APIs authorize before loading scoped data', () => {
  const root = process.cwd()
  const protectedRoutes = [
    {
      route: 'app/api/admin/content/contact/route.ts',
      factories: ['createContactContentUseCases(principal)']
    },
    {
      route: 'app/api/admin/content/overview/route.ts',
      factories: ['createAdminContentOverviewUseCase(principal)']
    },
    {
      route: 'app/api/admin/content/projects/route.ts',
      factories: ['createProjectUseCases(principal)']
    },
    {
      route: 'app/api/admin/content/projects/[id]/route.ts',
      factories: ['createProjectUseCases(principal)']
    },
    {
      route: 'app/api/admin/content/skills/route.ts',
      factories: ['createSkillContentUseCases(principal)']
    },
    {
      route: 'app/api/admin/content/skills/[categoryId]/route.ts',
      factories: ['createSkillContentUseCases(principal)']
    },
    {
      route: 'app/api/admin/content/skills/[categoryId]/skills/route.ts',
      factories: ['createSkillContentUseCases(principal)']
    }
  ]

  for (const { route, factories } of protectedRoutes) {
    const source = readFileSync(join(root, route), 'utf8')
    const authIndex = source.indexOf('const principal = await authorizeAdminRequest(')
    const dataAccessIndices = factories.map(factory => source.indexOf(factory))

    assert.notEqual(authIndex, -1, `${route} should use the shared admin/agent authorization guard`)
    assert.ok(dataAccessIndices.every(index => index >= 0), `${route} should pass the authorized principal to content use cases`)
    assert.ok(
      dataAccessIndices.every(index => authIndex < index),
      `${route} should authenticate before data access`
    )
  }
})

test('site content API passes middleware principal into content use cases', () => {
  const root = process.cwd()
  const source = readFileSync(join(root, 'app/api/admin/content/site/route.ts'), 'utf8')

  assert.match(source, /withScopedAuth\(getSiteContentHandler, 'site-content:read'\)/)
  assert.match(source, /withScopedAuth\(updateSiteContentHandler, 'site-content:update'\)/)
  assert.match(source, /createSiteContentUseCases\(context\.principal\)/)
})
