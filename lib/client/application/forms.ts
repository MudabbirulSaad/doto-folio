import { err, ok, type ClientResult } from '@/lib/client/domain/result'

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export interface ValidationResult<T extends string> {
  isValid: boolean
  errors: FieldErrors<T>
}

export function validationResult<T extends string>(errors: FieldErrors<T>): ValidationResult<T> {
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function requireNonEmpty(value: string | undefined | null, message: string): ClientResult<string> {
  const trimmed = value?.trim() ?? ''

  if (!trimmed) {
    return err(message)
  }

  return ok(trimmed)
}

export function requireEmail(value: string | undefined | null, emptyMessage = 'Email is required'): ClientResult<string> {
  const required = requireNonEmpty(value, emptyMessage)

  if (!required.ok) {
    return required
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(required.value)) {
    return err('Please enter a valid email address')
  }

  return ok(required.value.toLowerCase())
}
