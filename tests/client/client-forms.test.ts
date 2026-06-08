import { describe, expect, it } from 'vitest'
import { requireEmail, requireNonEmpty, validationResult } from '@/lib/client/application/forms'

describe('client form application helpers', () => {
  it('normalizes successful required fields', () => {
    expect(requireNonEmpty(' Ada ', 'Name is required')).toEqual({ ok: true, value: 'Ada' })
  })

  it('reports invalid email as a client result', () => {
    expect(requireEmail('not-an-email')).toEqual({
      ok: false,
      error: 'Please enter a valid email address'
    })
  })

  it('converts field errors into a form validation result', () => {
    expect(validationResult({ email: 'Email is required' })).toEqual({
      isValid: false,
      errors: { email: 'Email is required' }
    })
  })
})
