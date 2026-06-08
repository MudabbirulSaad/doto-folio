import { createContactApiGateway } from '@/lib/client/adapters/http/contact-api'
import {
  submitContactForm as submitContactFormWorkflow,
  validateContactForm as validateContactFormWorkflow
} from '@/lib/client/application/contact/contact-form'
import type { ContactFormData, ContactSubmissionResult } from '@/lib/client/domain/contact'

export type { ContactFormData, ContactSubmissionResult } from '@/lib/client/domain/contact'

export async function submitContactForm(formData: ContactFormData): Promise<ContactSubmissionResult> {
  return submitContactFormWorkflow(createContactApiGateway(), formData)
}

export async function validateContactForm(formData: ContactFormData): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  return validateContactFormWorkflow(formData)
}
