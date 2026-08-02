import { ApplicationError } from '@/lib/server/domain/errors'

export interface SiteContentRepository {
  getPublishedSiteContent(): Promise<Record<string, unknown> | null>
  getSiteContent(): Promise<Record<string, unknown> | null>
  hasSiteContent(): Promise<boolean>
  updateSiteContent(data: Record<string, unknown>): Promise<Record<string, unknown>>
  insertSiteContent(data: Record<string, unknown>): Promise<Record<string, unknown>>
}

const PUBLIC_SITE_CONTENT_FIELDS = [
  'hero_title',
  'hero_subtitle',
  'hero_cta_text',
  'hero_cta_link',
  'about_title',
  'about_intro',
  'about_description',
  'about_personal',
  'education_title',
  'education_degree',
  'education_field',
  'education_institution',
  'approach_title',
  'approach_description',
  'contact_title',
  'contact_description',
  'contact_opportunities_title',
  'contact_opportunities_description',
  'footer_brand_name',
  'footer_brand_description',
  'footer_location',
  'footer_university',
  'footer_field',
  'footer_copyright'
] as const

type SiteContentField = typeof PUBLIC_SITE_CONTENT_FIELDS[number]
export type SiteContentInput = Partial<Record<SiteContentField, unknown>> & {
  is_published?: unknown
}

export const PUBLIC_SITE_CONTENT_SELECT = PUBLIC_SITE_CONTENT_FIELDS.join(',\n')

export const DEFAULT_SITE_CONTENT = {
  hero_title: 'I build secure, reliable platforms and intelligent developer tools.',
  hero_subtitle: 'Bachelor of Computer Science student at Swinburne University, majoring in Software Development, with additional applied-AI coursework and project experience.',
  hero_cta_text: 'Explore My Work',
  hero_cta_link: '#projects',
  about_title: 'About Me',
  about_intro: 'I am Mudabbirul Saad, a Bachelor of Computer Science student at Swinburne University of Technology, majoring in Software Development.',
  about_description: 'I build product and platform systems with typed boundaries, reliable delivery paths, and evidence-backed engineering decisions.',
  about_personal: 'Additional applied-AI coursework and projects support my work in developer tooling, local AI workflows, and evaluated machine-learning systems.',
  education_title: 'Education',
  education_degree: 'Bachelor of Computer Science',
  education_field: 'Software Development',
  education_institution: 'Swinburne University of Technology',
  approach_title: 'My Approach',
  approach_description: 'I prefer clear contracts, observable failure modes, focused tests, and deployment processes that remain understandable under pressure.',
  contact_title: "Let's Connect",
  contact_description: 'Use the contact form or LinkedIn to discuss software and platform engineering opportunities.',
  contact_opportunities_title: 'Open to Opportunities',
  contact_opportunities_description: 'Seeking graduate, internship, and junior software or platform engineering roles in Melbourne or remote-friendly teams.',
  footer_brand_name: 'SAAD',
  footer_brand_description: 'Building secure platforms, developer tools, and reliable product systems.',
  footer_location: 'Melbourne, Australia',
  footer_university: 'Swinburne University',
  footer_field: 'Software Development',
  footer_copyright: '© 2024 Mudabbirul Saad. All rights reserved.'
}

const REQUIRED_SITE_CONTENT_FIELDS = [
  'hero_title',
  'hero_cta_text',
  'about_intro',
  'about_description',
  'about_personal',
  'education_degree',
  'education_field',
  'education_institution',
  'approach_description'
] as const

export async function getPublishedSiteContent(repository: SiteContentRepository) {
  const content = await repository.getPublishedSiteContent()
  if (!content) {
    return {
      content: DEFAULT_SITE_CONTENT,
      message: 'Default site content returned (no published content found)'
    }
  }

  return {
    content,
    message: 'Site content retrieved successfully'
  }
}

export async function getAdminSiteContent(repository: SiteContentRepository) {
  return repository.getSiteContent()
}

function normalizeSiteContentInput(input: SiteContentInput): Record<string, unknown> {
  for (const field of REQUIRED_SITE_CONTENT_FIELDS) {
    if (!input[field] || String(input[field]).trim() === '') {
      throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', [`${field} is required`])
    }
  }

  return {
    hero_title: input.hero_title,
    hero_subtitle: input.hero_subtitle || null,
    hero_cta_text: input.hero_cta_text,
    hero_cta_link: input.hero_cta_link || '#projects',
    about_title: input.about_title || 'About Me',
    about_intro: input.about_intro,
    about_description: input.about_description,
    about_personal: input.about_personal,
    education_title: input.education_title || 'Education',
    education_degree: input.education_degree,
    education_field: input.education_field,
    education_institution: input.education_institution,
    approach_title: input.approach_title || 'Approach',
    approach_description: input.approach_description,
    contact_title: input.contact_title || 'Let\'s Connect',
    contact_description: input.contact_description || '',
    contact_opportunities_title: input.contact_opportunities_title || 'Open to Opportunities',
    contact_opportunities_description: input.contact_opportunities_description || '',
    footer_brand_name: input.footer_brand_name || 'SAAD',
    footer_brand_description: input.footer_brand_description || '',
    footer_location: input.footer_location || '',
    footer_university: input.footer_university || '',
    footer_field: input.footer_field || '',
    footer_copyright: input.footer_copyright || '',
    is_published: input.is_published !== undefined ? input.is_published : true
  }
}

export async function saveSiteContent(repository: SiteContentRepository, input: SiteContentInput) {
  const data = normalizeSiteContentInput(input)
  if (await repository.hasSiteContent()) {
    return repository.updateSiteContent({
      ...data,
      updated_at: new Date().toISOString()
    })
  }

  return repository.insertSiteContent(data)
}
