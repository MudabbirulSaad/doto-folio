export function sanitizeAuthRedirectPath(rawNext: string | null): string {
  if (!rawNext) return '/'

  let decodedNext: string
  try {
    decodedNext = decodeURIComponent(rawNext)
  } catch {
    return '/'
  }

  const next = decodedNext.trim()
  if (!next.startsWith('/')) return '/'
  if (next.startsWith('//')) return '/'
  if (next.includes('\\')) return '/'
  if (/[\u0000-\u001f\u007f]/.test(next)) return '/'

  return next
}
