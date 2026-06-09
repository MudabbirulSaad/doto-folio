import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync('package.json', 'utf8')) as PackageJson
}

function minorVersion(range: string): string {
  const match = range.match(/\d+\.\d+/)
  assert.ok(match, `Expected ${range} to include a major.minor version`)
  return match[0]
}

test('Next lint tooling tracks the installed Next.js minor version', () => {
  const manifest = readPackageJson()
  const nextVersion = manifest.dependencies?.next
  const eslintConfigNextVersion = manifest.devDependencies?.['eslint-config-next']

  assert.ok(nextVersion, 'next should be listed as an application dependency')
  assert.ok(eslintConfigNextVersion, 'eslint-config-next should be listed as a dev dependency')
  assert.equal(minorVersion(eslintConfigNextVersion), minorVersion(nextVersion))
})

test('lint script uses the ESLint CLI for Next 16', () => {
  const manifest = readPackageJson()

  assert.equal(manifest.scripts?.lint, 'eslint .')
})
