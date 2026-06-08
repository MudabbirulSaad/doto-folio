import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPublishedSiteContent,
  saveSiteContent,
  type SiteContentRepository
} from '../lib/server/application/content/site-content'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(existing: Record<string, unknown> | null = null): SiteContentRepository & { saved: Record<string, unknown> | null } {
  return {
    saved: null,
    async getPublishedSiteContent() { return existing },
    async getSiteContent() { return existing },
    async hasSiteContent() { return Boolean(existing) },
    async updateSiteContent(data) { this.saved = data; return { id: 'site-1', ...data } },
    async insertSiteContent(data) { this.saved = data; return { id: 'site-1', ...data } }
  }
}

test('getPublishedSiteContent returns defaults when no published content exists', async () => {
  const result = await getPublishedSiteContent(repository())

  assert.equal(result.content.hero_title, 'I build beautiful and intelligent digital experiences.')
  assert.match(result.message, /Default site content/)
})

test('saveSiteContent validates required fields and applies defaults before saving', async () => {
  await assert.rejects(
    () => saveSiteContent(repository(), { hero_title: '' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const repo = repository({ id: 'site-1' })
  const content = await saveSiteContent(repo, {
    hero_title: 'Hero',
    hero_cta_text: 'Explore',
    about_intro: 'Intro',
    about_description: 'About',
    about_personal: 'Personal',
    education_degree: 'Degree',
    education_field: 'AI',
    education_institution: 'Swinburne',
    approach_description: 'Approach'
  })

  assert.equal(content.hero_cta_link, '#projects')
  assert.equal(content.about_title, 'About Me')
  assert.equal(repo.saved?.is_published, true)
})
