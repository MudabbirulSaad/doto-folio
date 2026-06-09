import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

function tsFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) return tsFiles(filePath)
    return entry.name.endsWith('.ts') ? [filePath] : []
  })
}

test('server application modules do not import legacy services', () => {
  const applicationFiles = tsFiles(join(process.cwd(), 'lib/server/application'))
  const offenders = applicationFiles.filter(file => readFileSync(file, 'utf8').includes('@/lib/services'))

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})
