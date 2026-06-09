import test from 'node:test'
import assert from 'node:assert/strict'
import { convertMarkdownHandler } from '../app/api/admin/blog/convert-markdown/route'

test('admin markdown converter returns shared validation envelopes', async () => {
  const response = await convertMarkdownHandler({
    request: new Request('http://localhost:3000/api/admin/blog/convert-markdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
  })
  const payload = await response.json()

  assert.equal(response.status, 400)
  assert.equal(payload.success, false)
  assert.equal(payload.error.code, 'VALIDATION_ERROR')
  assert.deepEqual(payload.error.details, ['Content is required'])
})

test('admin markdown converter returns shared success envelopes', async () => {
  const response = await convertMarkdownHandler({
    request: new Request('http://localhost:3000/api/admin/blog/convert-markdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '# Hello' })
    })
  })
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(payload.data.blocks[0].type, 'header')
  assert.equal(payload.data.blocks[0].data.text, 'Hello')
})
