import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCurrentAdminUser,
  type CurrentAdminUserPort
} from '../lib/server/application/auth/current-admin-user'

test('getCurrentAdminUser returns null when the auth port has no user or reports an error', async () => {
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

  assert.deepEqual(await getCurrentAdminUser(withUser), { id: 'user-1', email: 'admin@example.com' })
  assert.equal(await getCurrentAdminUser(withoutUser), null)
  assert.equal(await getCurrentAdminUser(withError), null)
})
