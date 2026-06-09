import test from 'node:test'
import assert from 'node:assert/strict'
import { GET } from '../app/skill.md/route'

test('skill.md exposes agent onboarding instructions', async () => {
  const response = await GET(new Request('https://example.com/skill.md'))
  const body = await response.text()

  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8')
  assert.match(body, /name: saad-portfolio/)
  assert.match(body, /POST https:\/\/example.com\/api\/agent\/invitations\/claim/)
  assert.match(body, /https:\/\/example.com\/api\/agent\/public-context/)
  assert.match(body, /curl https:\/\/example.com\/api\/agent\/me/)
  assert.doesNotMatch(body, /`blog-posts:create`/)
  assert.doesNotMatch(body, /\/api\/admin\/blog\/posts/)
  assert.match(body, /Only send portfolio agent tokens to `https:\/\/example.com`/)
})
