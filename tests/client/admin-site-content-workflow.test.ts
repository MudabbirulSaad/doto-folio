import { describe, expect, it, vi } from 'vitest'
import {
  loadAdminSiteContent,
  saveAdminSiteContent,
  type AdminSiteContentGateway
} from '@/lib/client/application/admin/site-content'

const content = {
  id: 'site-content-1',
  hero_title: 'Hello',
  hero_subtitle: null,
  hero_cta_text: 'Explore',
  hero_cta_link: '#projects',
  about_title: 'About',
  about_intro: 'Intro',
  about_description: 'Description',
  about_personal: 'Personal',
  education_title: 'Education',
  education_degree: 'Degree',
  education_field: 'AI',
  education_institution: 'Uni',
  approach_title: 'Approach',
  approach_description: 'Build well',
  contact_title: 'Contact',
  contact_description: 'Reach out',
  contact_opportunities_title: 'Opportunities',
  contact_opportunities_description: 'Work together',
  footer_brand_name: 'SAAD',
  footer_brand_description: 'Portfolio',
  footer_location: 'Sydney',
  footer_university: 'Swinburne',
  footer_field: 'AI',
  footer_copyright: '2026',
  is_published: true
}

describe('admin site content workflow', () => {
  it('loads and saves site content through the gateway', async () => {
    const gateway: AdminSiteContentGateway = {
      get: vi.fn(async () => content),
      save: vi.fn(async input => ({ ...input, hero_title: 'Saved' }))
    }

    await expect(loadAdminSiteContent(gateway)).resolves.toEqual({
      success: true,
      content
    })

    await expect(saveAdminSiteContent(gateway, content)).resolves.toEqual({
      success: true,
      content: { ...content, hero_title: 'Saved' }
    })
  })

  it('returns workflow errors when the gateway fails', async () => {
    const gateway: AdminSiteContentGateway = {
      get: vi.fn(async () => {
        throw new Error('No access')
      }),
      save: vi.fn()
    }

    await expect(loadAdminSiteContent(gateway)).resolves.toEqual({
      success: false,
      error: 'No access'
    })
  })
})
