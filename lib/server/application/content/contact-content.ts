import { ApplicationError } from '@/lib/server/domain/errors'

export interface ContactContentRepository {
  listContactMethods(): Promise<any[]>
  listSocialLinks(): Promise<any[]>
  getLastContactMethodDisplayOrder(): Promise<number>
  getLastSocialLinkDisplayOrder(): Promise<number>
  createContactMethod(data: Record<string, unknown>): Promise<any>
  createSocialLink(data: Record<string, unknown>): Promise<any>
}

function requireFields(input: Record<string, any>, fields: string[], message: string) {
  const missing = fields.some(field => !input[field])
  if (missing) {
    throw new ApplicationError('VALIDATION_ERROR', message)
  }
}

export async function getContactContent(repository: ContactContentRepository) {
  const [contactMethods, socialLinks] = await Promise.all([
    repository.listContactMethods(),
    repository.listSocialLinks()
  ])

  return { contactMethods, socialLinks }
}

export async function createContactContentItem(repository: ContactContentRepository, input: Record<string, any>) {
  if (input.type === 'contact_method') {
    requireFields(
      input,
      ['title', 'value', 'description', 'link', 'icon_name'],
      'Title, value, description, link, and icon_name are required for contact methods'
    )
    const nextDisplayOrder = await repository.getLastContactMethodDisplayOrder() + 1
    const data = await repository.createContactMethod({
      title: input.title,
      value: input.value,
      description: input.description,
      link: input.link,
      icon_name: input.icon_name,
      display_order: input.display_order || nextDisplayOrder,
      is_published: input.is_published !== undefined ? input.is_published : true
    })
    return { data, message: 'Contact method created successfully' }
  }

  if (input.type === 'social_link') {
    requireFields(
      input,
      ['platform', 'url', 'icon_name'],
      'Platform, url, and icon_name are required for social links'
    )
    const nextDisplayOrder = await repository.getLastSocialLinkDisplayOrder() + 1
    const data = await repository.createSocialLink({
      platform: input.platform,
      url: input.url,
      username: input.username || null,
      icon_name: input.icon_name,
      display_order: input.display_order || nextDisplayOrder,
      is_published: input.is_published !== undefined ? input.is_published : true
    })
    return { data, message: 'Social link created successfully' }
  }

  throw new ApplicationError('VALIDATION_ERROR', 'Invalid type. Must be "contact_method" or "social_link"')
}
