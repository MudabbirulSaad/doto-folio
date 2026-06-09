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

test('api routes do not catch errors as explicit any', () => {
  const apiFiles = tsFiles(join(process.cwd(), 'app/api'))
  const offenders = apiFiles.filter(file => readFileSync(file, 'utf8').includes('catch (error: any)'))

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})

test('contact content application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/content/contact-content.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('project content application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/content/projects.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('skill content application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/content/skills.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('site content application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/content/site-content.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('content composition use case wiring does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/composition/content.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('agent access tests avoid loose casts', () => {
  const source = readFileSync(join(process.cwd(), 'tests/agent-access.test.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('admin dashboard application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/admin/dashboard.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('current admin user application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/auth/current-admin-user.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('contact submissions application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/contact/admin-submissions.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('contact submissions tests avoid loose casts', () => {
  const source = readFileSync(join(process.cwd(), 'tests/admin-submissions.test.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('admin comments application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/comments/admin-comments.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('admin comments tests avoid loose casts', () => {
  const source = readFileSync(join(process.cwd(), 'tests/admin-comments-auth.test.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('admin blog taxonomy application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/blog/admin-blog-taxonomy.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('admin blog taxonomy tests avoid loose casts', () => {
  const source = readFileSync(join(process.cwd(), 'tests/admin-blog-taxonomy.test.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('admin blog posts application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/blog/admin-blog-posts.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('blog post workflow application contract does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/application/blog/blog-post-workflow.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('blog post workflow tests avoid loose casts', () => {
  const source = readFileSync(join(process.cwd(), 'tests/blog-post-workflow.test.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('shared Supabase adapter types do not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/server/adapters/supabase/types.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('markdown converter does not use explicit any', () => {
  const source = readFileSync(join(process.cwd(), 'lib/markdown-converter.ts'), 'utf8')

  assert.equal(source.includes('any'), false)
})

test('blog app pages do not fetch this app through internal HTTP APIs', () => {
  const blogFiles = tsFiles(join(process.cwd(), 'app/blog'))
  const offenders = blogFiles.filter(file => {
    const source = readFileSync(file, 'utf8')
    return source.includes('NEXT_PUBLIC_SITE_URL') && source.includes('/api/blog/')
  })

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})

test('blog app pages render JSX outside try blocks', () => {
  const blogFiles = tsFiles(join(process.cwd(), 'app/blog'))
  const offenders = blogFiles.filter(file => {
    const source = readFileSync(file, 'utf8')
    return /try\s*{(?:(?!}\s*catch)[\s\S])*return\s*\(/.test(source)
  })

  assert.deepEqual(offenders.map(file => file.replace(process.cwd(), '')), [])
})
