import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCurrentAdminUser,
  parseAdminEmailAllowlist,
  resolveAdminEmailAllowlist,
  type CurrentAdminUserPort
} from '../lib/server/application/auth/current-admin-user'

test('getCurrentAdminUser only returns users on the admin email allowlist', async () => {
  const withUser: CurrentAdminUserPort = {
    async getUser() {
      return { user: { id: 'user-1', email: 'admin@example.com' }, error: null }
    }
  }

  const withoutUser: CurrentAdminUserPort = {
    async getUser() {
      return { user: null, error: null }
    }
  }

  const withError: CurrentAdminUserPort = {
    async getUser() {
      return { user: { id: 'user-1' }, error: new Error('expired') }
    }
  }

  const nonAdmin: CurrentAdminUserPort = {
    async getUser() {
      return { user: { id: 'user-2', email: 'user@example.com' }, error: null }
    }
  }

  assert.deepEqual(
    await getCurrentAdminUser(withUser, ['admin@example.com']),
    { id: 'user-1', email: 'admin@example.com' }
  )
  assert.deepEqual(
    await getCurrentAdminUser(withUser, ['ADMIN@EXAMPLE.COM'.toLowerCase()]),
    { id: 'user-1', email: 'admin@example.com' }
  )
  assert.equal(await getCurrentAdminUser(nonAdmin, ['admin@example.com']), null)
  assert.equal(await getCurrentAdminUser(withUser), null)
  assert.equal(await getCurrentAdminUser(withoutUser), null)
  assert.equal(await getCurrentAdminUser(withError), null)
})

test('admin email allowlist resolves ADMIN_EMAILS before ADMIN_EMAIL', () => {
  assert.deepEqual(parseAdminEmailAllowlist(' Ada@Example.com, grace@example.com ,, '), [
    'ada@example.com',
    'grace@example.com'
  ])
  assert.deepEqual(resolveAdminEmailAllowlist({ ADMIN_EMAIL: 'owner@example.com' }), [
    'owner@example.com'
  ])
  assert.deepEqual(
    resolveAdminEmailAllowlist({
      ADMIN_EMAILS: 'first@example.com,second@example.com',
      ADMIN_EMAIL: 'owner@example.com'
    }),
    ['first@example.com', 'second@example.com']
  )
})
