export interface AdminRecaptchaGateway {
  verify(token: string): Promise<boolean>
}

export async function verifyAdminRecaptcha(gateway: AdminRecaptchaGateway, token: string) {
  if (!token) {
    return {
      success: false as const,
      error: 'Security verification failed. Please try again.'
    }
  }

  try {
    if (await gateway.verify(token)) {
      return { success: true as const }
    }

    return {
      success: false as const,
      error: 'Security verification failed. Please try again.'
    }
  } catch {
    return {
      success: false as const,
      error: 'Security verification failed. Please try again.'
    }
  }
}
