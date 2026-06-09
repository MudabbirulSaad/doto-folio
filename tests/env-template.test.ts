import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

function readEnvTemplate(path: string) {
  return new Set(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0])
  )
}

test('env templates document public app url fallback', () => {
  assert.ok(readEnvTemplate('.env.example').has('NEXT_PUBLIC_APP_URL'), '.env.example should document NEXT_PUBLIC_APP_URL')
})

test('.env.example is the canonical tracked env template', () => {
  assert.equal(existsSync('.env.sample'), false)
})
