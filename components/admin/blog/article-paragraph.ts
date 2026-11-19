import Paragraph from '@editorjs/paragraph'
import type { SanitizerConfig } from '@editorjs/editorjs'
import { articleImageSrc } from '@/lib/blog/inline-image'

const inlineRules: SanitizerConfig = {
  br: {}, b: {}, strong: {}, i: {}, em: {}, s: {}, del: {}, strike: {}, code: {}, kbd: {}, mark: {}, u: {}, sub: {}, sup: {},
  a: element => {
    const href = element.getAttribute('href')
    if (!href) return false
    try {
      const { protocol } = new URL(href, 'https://article.invalid')
      return ['http:', 'https:', 'mailto:'].includes(protocol)
        ? { href: true, title: true, target: '_blank', rel: 'nofollow' }
        : false
    } catch {
      return false
    }
  },
  img: element => {
    const src = articleImageSrc(element.getAttribute('src'))
    if (!src) return false
    element.setAttribute('src', src)
    return { src: true, alt: true, title: true }
  }
}

export class ArticleParagraph extends Paragraph {
  constructor(options: ConstructorParameters<typeof Paragraph>[0]) {
    // The paragraph tool inserts initial HTML into its editable element before the first save.
    const text = options.api.sanitizer.clean(options.data?.text ?? '', inlineRules)
    super({ ...options, data: { ...options.data, text } })
  }

  static get sanitize() {
    // Editor.js accepts a per-field rule map here. Its type describes a single map.
    return { text: inlineRules } as unknown as SanitizerConfig
  }

  onKeyUp(event: KeyboardEvent) {
    // Paragraph treats an image-only line as empty when the last character is deleted.
    if (event.currentTarget instanceof HTMLElement && event.currentTarget.querySelector('img')) return
    super.onKeyUp(event)
  }
}
