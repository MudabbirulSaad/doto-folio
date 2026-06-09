import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const AUDIT_DOCS = [
  'docs/security-publication-audit.md',
  'docs/implementation-gap-audit.md',
]

test('audit verification docs avoid stale server test totals', () => {
  for (const path of AUDIT_DOCS) {
    const content = readFileSync(path, 'utf8')

    assert.doesNotMatch(
      content,
      /`npm test`:[^\n]*\b\d+\s+(?:tests?|passing)\b/i,
      `${path} should not hard-code npm test totals that drift when tests are added`
    )
  }
})

test('architecture docs include lint in full verification', () => {
  const content = readFileSync('docs/hexagonal-architecture.md', 'utf8')
  const fullVerificationLine = content
    .split(/\r?\n/)
    .find(line => line.includes('Full verification is'))

  assert.ok(fullVerificationLine, 'docs/hexagonal-architecture.md should describe full verification')
  assert.match(fullVerificationLine, /`npm run lint`/)
})
