export interface CurrentAdminUserPort {
  getUser(): Promise<{
    user: any | null
    error?: unknown
  }>
}

export function parseAdminEmailAllowlist(input: string | undefined): string[] {
  return (input || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function resolveAdminEmailAllowlist(env: {
  ADMIN_EMAILS?: string
  ADMIN_EMAIL?: string
}) {
  const emailList = parseAdminEmailAllowlist(env.ADMIN_EMAILS)
  if (emailList.length > 0) return emailList

  return parseAdminEmailAllowlist(env.ADMIN_EMAIL)
}

export async function getCurrentAdminUser(
  auth: CurrentAdminUserPort,
  allowedAdminEmails: string[] = []
) {
  const { user, error } = await auth.getUser()

  if (error || !user) {
    return null
  }

  const email = typeof user.email === 'string' ? user.email.toLowerCase() : ''
  if (!email || !allowedAdminEmails.includes(email)) {
    return null
  }

  return user
}
