export function escapeInlineHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

// Resolve article-relative paths the same way on /blog/[slug] and in the admin editor.
export function articleImageSrc(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim() || /^[?#]/.test(value.trim())) return null
  try {
    const base = 'https://article.invalid'
    const url = new URL(value, base + '/blog/')
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    if (url.origin !== base || /^(?:https?:|\/\/)/i.test(value.trim())) return url.href
    return url.pathname.startsWith('//') ? null : url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

export function inlineImageHtml(url: string, alt?: string | null, title?: string | null) {
  const src = articleImageSrc(url)
  if (!src) return null
  const titleAttribute = title == null ? '' : ` title="${escapeInlineHtml(title)}"`
  return `<img src="${escapeInlineHtml(src)}" alt="${escapeInlineHtml(alt ?? '')}"${titleAttribute}>`
}
