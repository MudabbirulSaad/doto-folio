export interface SessionAuthPort {
  signOut(): Promise<void>
}

export async function signOutCurrentSession(auth: SessionAuthPort) {
  await auth.signOut()
  return { success: true }
}
