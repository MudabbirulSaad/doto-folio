import { requireEmail, requireNonEmpty, validationResult, type ValidationResult } from '@/lib/client/application/forms'
import type { ContactFormData, ContactSubmissionResult } from '@/lib/client/domain/contact'

export interface ContactSubmissionGateway {
  submit(formData: ContactFormData): Promise<ContactSubmissionResult>
}

export type ContactFormField = keyof ContactFormData

export function validateContactForm(formData: ContactFormData): ValidationResult<ContactFormField> {
  const errors: Partial<Record<ContactFormField, string>> = {}

  const name = requireNonEmpty(formData.name, 'Name is required')
  if (!name.ok) errors.name = name.error
  else if (name.value.length < 2) errors.name = 'Name must be at least 2 characters long'

  const email = requireEmail(formData.email)
  if (!email.ok) errors.email = email.error

  const subject = requireNonEmpty(formData.subject, 'Subject is required')
  if (!subject.ok) errors.subject = subject.error
  else if (subject.value.length < 5) errors.subject = 'Subject must be at least 5 characters long'

  const message = requireNonEmpty(formData.message, 'Message is required')
  if (!message.ok) errors.message = message.error
  else if (message.value.length < 10) errors.message = 'Message must be at least 10 characters long'

  return validationResult(errors)
}

export async function submitContactForm(
  gateway: ContactSubmissionGateway,
  formData: ContactFormData
): Promise<ContactSubmissionResult> {
  const validation = validateContactForm(formData)

  if (!validation.isValid) {
    return {
      success: false,
      error: Object.values(validation.errors)[0] || 'Please check the form and try again.'
    }
  }

  try {
    return await gateway.submit({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      subject: formData.subject.trim(),
      message: formData.message.trim()
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.'
    }
  }
}
