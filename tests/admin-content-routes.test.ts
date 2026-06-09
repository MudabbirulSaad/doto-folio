import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
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
