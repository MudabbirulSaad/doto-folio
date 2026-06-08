export interface NewsletterSubscriptionFormData {
  name: string
  email: string
}

export interface NewsletterSubscriptionResult {
  success: boolean
  error?: string
  message?: string
}
