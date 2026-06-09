import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  for (const path of ['.env.example', '.env.sample']) {
    assert.ok(readEnvTemplate(path).has('NEXT_PUBLIC_APP_URL'), `${path} should document NEXT_PUBLIC_APP_URL`)
  }
})
