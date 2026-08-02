import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_SITE_CONTENT,
  getPublicPortfolioContent,
  type PublicPortfolioRepository
} from '../lib/server/application/content/public-portfolio'

function repository(overrides: Partial<PublicPortfolioRepository> = {}): PublicPortfolioRepository {
  return {
    getPublishedSiteContent: async () => ({
      ...DEFAULT_SITE_CONTENT,
      about_title: 'Backend About',
      contact_title: 'Backend Contact',
      footer_brand_name: 'Backend Brand'
    }),
    listPublishedProjects: async () => [
      {
        id: 'project-1',
        title: 'Published Project',
        description: 'Visible project',
        status: 'Completed',
        display_order: 2,
        is_published: true,
        project_technologies: [
          { id: 'tech-2', technology_name: 'B', display_order: 2 },
          { id: 'tech-1', technology_name: 'A', display_order: 1 }
        ]
      },
      {
        id: 'project-hidden',
        title: 'Hidden Project',
        description: 'Hidden',
        status: 'Planning',
        display_order: 1,
        is_published: false,
        project_technologies: []
      }
    ],
    listPublishedSkillCapabilities: async () => [
      {
        id: 'capability-hidden',
        title: 'Hidden Capability',
        summary: 'Hidden',
        icon_name: 'Sparkles',
        display_order: 1,
        is_published: false,
        evidence: []
      },
      {
        id: 'capability-1',
        title: 'Backend & API Design',
        summary: 'Scoped APIs',
        icon_name: 'Route',
        display_order: 2,
        is_published: true,
        evidence: [
          {
            id: 'evidence-hidden',
            capability_id: 'capability-1',
            label: 'Hidden proof',
            description: 'Hidden',
            technologies: [],
            display_order: 1,
            is_published: false
          },
          {
            id: 'evidence-1',
            capability_id: 'capability-1',
            label: 'Scoped routes',
            description: 'Thin routes call use cases',
            technologies: ['Next.js'],
            display_order: 2,
            is_published: true
          }
        ]
      }
    ],
    listPublishedContactMethods: async () => [
      { id: 'contact-1', title: 'Email', value: 'hello@example.com', description: 'Write me', link: 'mailto:hello@example.com', icon_name: 'Mail', display_order: 1, is_published: true }
    ],
    listPublishedSocialLinks: async () => [
      { id: 'social-1', platform: 'GitHub', username: 'saad', url: 'https://github.com/saad', icon_name: 'Github', display_order: 1, is_published: true }
    ],
    ...overrides
  }
}

test('public portfolio content uses published backend content and omits unpublished rows', async () => {
  const result = await getPublicPortfolioContent(repository())

  assert.equal(result.siteContent.about_title, 'Backend About')
  assert.equal(result.siteContent.contact_title, 'Backend Contact')
  assert.equal(result.siteContent.footer_brand_name, 'Backend Brand')

  assert.deepEqual(result.projects.map(project => project.title), ['Published Project'])
  assert.deepEqual(result.projects[0].project_technologies.map(technology => technology.technology_name), ['A', 'B'])
  assert.deepEqual(result.skillCapabilities.map(capability => capability.title), ['Backend & API Design'])
  assert.deepEqual(result.skillCapabilities[0].evidence.map(evidence => evidence.label), ['Scoped routes'])
  assert.deepEqual(result.contactMethods.map(method => method.value), ['hello@example.com'])
  assert.deepEqual(result.socialLinks.map(link => link.platform), ['GitHub'])
})

test('public portfolio content falls back to default site content when backend content is absent', async () => {
  const result = await getPublicPortfolioContent(repository({
    getPublishedSiteContent: async () => null
  }))

  assert.equal(result.siteContent.hero_title, DEFAULT_SITE_CONTENT.hero_title)
  assert.equal(result.siteContent.about_title, DEFAULT_SITE_CONTENT.about_title)
})

test('public portfolio content keeps LinkedIn reachable when the CMS has no social links', async () => {
  const result = await getPublicPortfolioContent(repository({
    listPublishedSocialLinks: async () => []
  }))

  assert.deepEqual(result.socialLinks, DEFAULT_SOCIAL_LINKS)
})
