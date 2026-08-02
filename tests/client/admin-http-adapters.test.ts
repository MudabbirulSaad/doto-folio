import { describe, expect, it, vi } from 'vitest'
import { createAdminProjectApiGateway } from '@/lib/client/adapters/http/admin-projects-api'
import { createAdminSkillCapabilityApiGateway } from '@/lib/client/adapters/http/admin-skill-capabilities-api'
import { createAdminContactSubmissionApiGateway } from '@/lib/client/adapters/http/admin-contact-submissions-api'
import { createAdminContactContentApiGateway } from '@/lib/client/adapters/http/admin-contact-content-api'
import { createNewsletterSubscriptionApiGateway } from '@/lib/client/adapters/http/subscription-api'
import type { JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminProject, AdminSkillCapability } from '@/lib/client/domain/admin-content'
import type { AdminContactSubmission } from '@/lib/client/domain/contact-submissions'

const project: AdminProject = {
  id: 'project-1',
  title: 'Portfolio',
  description: 'Personal site',
  status: 'Completed',
  display_order: 1,
  is_featured: true,
  is_published: true,
  project_technologies: []
}

const capability: AdminSkillCapability = {
  id: 'capability-1',
  title: 'Product Frontend',
  summary: 'Polished UI',
  icon_name: 'LayoutDashboard',
  display_order: 1,
  is_published: true,
  evidence: []
}

const submission: AdminContactSubmission = {
  id: 'submission-1',
  name: 'Ada',
  email: 'ada@example.com',
  subject: 'Hello',
  message: 'Checking in',
  is_read: false,
  read_at: null,
  read_by: null,
  created_at: '2026-06-09T00:00:00.000Z',
  updated_at: '2026-06-09T00:00:00.000Z'
}

function jsonClient(response: unknown): JsonClient {
  return {
    get: vi.fn(async () => response),
    post: vi.fn(async () => response),
    put: vi.fn(async () => response),
    delete: vi.fn(async () => response)
  }
}

describe('admin HTTP adapters', () => {
  it('reads project data from the shared success envelope', async () => {
    const gateway = createAdminProjectApiGateway(jsonClient({ success: true, data: [project] }))

    await expect(gateway.list()).resolves.toEqual([project])
  })

  it('reads skill capability data from the shared success envelope', async () => {
    const gateway = createAdminSkillCapabilityApiGateway(jsonClient({ success: true, data: [capability] }))

    await expect(gateway.list()).resolves.toEqual([capability])
  })

  it('reads contact submissions and update results from the shared success envelope', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({
        success: true,
        data: { submissions: [submission] }
      }))
      .mockResolvedValueOnce(Response.json({
        success: true,
        data: { updated: 1, submissions: [{ id: 'submission-1' }] }
      }))

    const gateway = createAdminContactSubmissionApiGateway(fetcher)

    await expect(gateway.list({ search: '', readStatus: 'all', timeFilter: 'all' })).resolves.toEqual([submission])
    await expect(gateway.updateReadStatus(['submission-1'], true, 'Admin')).resolves.toEqual({
      updated: 1,
      submissions: [{ id: 'submission-1' }]
    })
  })

  it('creates a published social link through the existing contact-content endpoint', async () => {
    const socialLink = {
      id: 'social-1',
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/in/example/',
      username: 'example',
      icon_name: 'Linkedin',
      display_order: 1,
      is_published: true
    }
    const client = jsonClient({
      success: true,
      data: { data: socialLink, message: 'Social link created successfully' }
    })
    const gateway = createAdminContactContentApiGateway(client)

    await expect(gateway.createSocialLink({
      platform: 'LinkedIn',
      url: socialLink.url,
      username: '  example  ',
      icon_name: 'Linkedin'
    })).resolves.toEqual(socialLink)
    expect(client.post).toHaveBeenCalledWith('/api/admin/content/contact', {
      type: 'social_link',
      platform: 'LinkedIn',
      url: socialLink.url,
      username: 'example',
      icon_name: 'Linkedin',
      is_published: true
    })
  })

  it('reads newsletter subscription messages from the shared success envelope', async () => {
    const gateway = createNewsletterSubscriptionApiGateway(jsonClient({
      success: true,
      data: { message: 'Successfully subscribed to newsletter!' }
    }))

    await expect(gateway.subscribe({ name: 'Ada', email: 'ada@example.com' })).resolves.toEqual({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    })
  })
})
