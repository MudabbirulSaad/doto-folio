export interface CurrentAdminUserPort {
  getUser(): Promise<{
    user: any | null
    error?: unknown
  }>
}

export async function getCurrentAdminUser(auth: CurrentAdminUserPort) {
  const { user, error } = await auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}
