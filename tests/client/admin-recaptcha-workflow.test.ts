import { describe, expect, it, vi } from 'vitest'
import {
  verifyAdminRecaptcha,
  type AdminRecaptchaGateway
} from '@/lib/client/application/admin/recaptcha'

describe('admin reCAPTCHA workflow', () => {
  it('verifies a token through the gateway', async () => {
    const gateway: AdminRecaptchaGateway = {
      verify: vi.fn(async () => true)
    }

    await expect(verifyAdminRecaptcha(gateway, 'token')).resolves.toEqual({ success: true })
    expect(gateway.verify).toHaveBeenCalledWith('token')
  })

  it('rejects empty tokens and failed gateway verification', async () => {
    const gateway: AdminRecaptchaGateway = {
      verify: vi.fn(async () => false)
    }

    await expect(verifyAdminRecaptcha(gateway, '')).resolves.toEqual({
      success: false,
      error: 'Security verification failed. Please try again.'
    })
    await expect(verifyAdminRecaptcha(gateway, 'bad-token')).resolves.toEqual({
      success: false,
      error: 'Security verification failed. Please try again.'
    })
  })
})
