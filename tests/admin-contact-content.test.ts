import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createContactContentItem,
  getContactContent,
  type ContactContentRepository,
  type ContactMethodContent,
  type SocialLinkContent
} from '../lib/server/application/content/contact-content'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(): ContactContentRepository & { contactMethods: ContactMethodContent[]; socialLinks: SocialLinkContent[] } {
  return {
    contactMethods: [{
      id: 'contact-1',
      title: 'Email',
      value: 'hello@example.com',
      description: 'Email me',
      link: 'mailto:hello@example.com',
      icon_name: 'Mail',
      display_order: 1
    }],
    socialLinks: [{
      id: 'social-1',
      platform: 'GitHub',
      url: 'https://github.com/example',
      username: 'example',
      icon_name: 'Github',
      display_order: 1
    }],
    async listContactMethods() { return this.contactMethods },
    async listSocialLinks() { return this.socialLinks },
    async getLastContactMethodDisplayOrder() { return 2 },
    async getLastSocialLinkDisplayOrder() { return 4 },
    async createContactMethod(data) {
      const item = { id: 'contact-2', ...data }
      this.contactMethods.push(item)
      return item
    },
    async createSocialLink(data) {
      const item = { id: 'social-2', ...data }
      this.socialLinks.push(item)
      return item
    }
  }
}

test('getContactContent returns published contact methods and social links', async () => {
  const result = await getContactContent(repository())

  assert.deepEqual(result, {
    contactMethods: [{
      id: 'contact-1',
      title: 'Email',
      value: 'hello@example.com',
      description: 'Email me',
      link: 'mailto:hello@example.com',
      icon_name: 'Mail',
      display_order: 1
    }],
    socialLinks: [{
      id: 'social-1',
      platform: 'GitHub',
      url: 'https://github.com/example',
      username: 'example',
      icon_name: 'Github',
      display_order: 1
    }]
  })
})

test('createContactContentItem validates and creates contact methods with next display order', async () => {
  await assert.rejects(
    () => createContactContentItem(repository(), { type: 'contact_method', title: 'Email' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const item = await createContactContentItem(repository(), {
    type: 'contact_method',
    title: 'Email',
    value: 'hello@example.com',
    description: 'Email me',
    link: 'mailto:hello@example.com',
    icon_name: 'Mail'
  })

  assert.equal(item.data.display_order, 3)
  assert.equal(item.message, 'Contact method created successfully')
})

test('createContactContentItem validates and creates social links with next display order', async () => {
  const item = await createContactContentItem(repository(), {
    type: 'social_link',
    platform: 'GitHub',
    url: 'https://github.com/example',
    icon_name: 'Github'
  })

  assert.equal(item.data.display_order, 5)
  assert.equal(item.message, 'Social link created successfully')
})
