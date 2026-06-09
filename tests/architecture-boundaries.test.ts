import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

function tsFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) return tsFiles(filePath)
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [filePath] : []
  })
}

test('server application modules do not import legacy services', () => {
  const applicationFiles = tsFiles(join(process.cwd(), 'lib/server/application'))
  const offenders = applicationFiles.filter(file => readFileSync(file, 'utf8').includes('@/lib/services'))

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})

test('supabase adapters do not declare local any-based clients', () => {
  const adapterFiles = tsFiles(join(process.cwd(), 'lib/server/adapters/supabase'))
  const offenders = adapterFiles.filter(file => {
    const source = readFileSync(file, 'utf8')
    return source.includes('from(table: string): any') || source.includes('adminClient: any')
  })

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})

test('app routes do not import legacy data pass-throughs', () => {
  const appFiles = tsFiles(join(process.cwd(), 'app'))
  const offenders = appFiles.filter(file => readFileSync(file, 'utf8').includes('@/lib/data'))

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})

test('blog app pages do not fetch this app through internal HTTP APIs', () => {
  const blogFiles = tsFiles(join(process.cwd(), 'app/blog'))
  const offenders = blogFiles.filter(file => {
    const source = readFileSync(file, 'utf8')
    return source.includes('NEXT_PUBLIC_SITE_URL') && source.includes('/api/blog/')
  })

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})
