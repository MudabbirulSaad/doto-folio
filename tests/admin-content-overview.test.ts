import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAdminContentOverview,
  type AdminContentOverviewRepository
} from '../lib/server/application/content/content-overview'

test('getAdminContentOverview returns published counts and site status', async () => {
  const repository: AdminContentOverviewRepository = {
    async getPublishedCounts() {
      return {
        projectsCount: 3,
        skillsCount: 8,
        contactMethodsCount: 2,
        socialLinksCount: 4,
        commentsCount: 12
      }
    },
    async isSiteContentPublished() {
      return true
    }
  }

  assert.deepEqual(await getAdminContentOverview(repository), {
    projectsCount: 3,
    skillsCount: 8,
    contactMethodsCount: 2,
    socialLinksCount: 4,
    isContentPublished: true,
    commentsCount: 12
  })
})
