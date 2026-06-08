export interface OtpGateway {
  request(input: { email: string; name?: string; captchaToken: string }): Promise<void>
  verify(input: { email: string; token: string; captchaToken: string }): Promise<{ session?: unknown }>
}

export async function requestCommentOtp(
  gateway: OtpGateway,
  input: { email: string; name?: string; captchaToken: string }
) {
  try {
    await gateway.request({
      ...input,
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim()
    })
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to send code'
    }
  }
}

export async function verifyCommentOtp(
  gateway: OtpGateway,
  input: { email: string; token: string; captchaToken: string }
) {
  try {
    const data = await gateway.verify({
      email: input.email.trim().toLowerCase(),
      token: input.token.trim(),
      captchaToken: input.captchaToken
    })
    return { success: true as const, session: data.session }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Invalid code'
    }
  }
}
