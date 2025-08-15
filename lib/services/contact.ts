export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export interface ContactSubmissionResult {
  success: boolean
  error?: string
  message?: string
  data?: Record<string, unknown>
}

export async function submitContactForm(formData: ContactFormData): Promise<ContactSubmissionResult> {
  try {
    // Validate form data client-side first
    if (!formData.name?.trim()) {
      return { success: false, error: 'Name is required' }
    }
    if (!formData.email?.trim()) {
      return { success: false, error: 'Email is required' }
    }
    if (!formData.subject?.trim()) {
      return { success: false, error: 'Subject is required' }
    }
    if (!formData.message?.trim()) {
      return { success: false, error: 'Message is required' }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return { success: false, error: 'Please enter a valid email address' }
    }

    // Submit to API route
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('API error:', result)
      return {
        success: false,
        error: result.error || 'Failed to submit your message. Please try again later.'
      }
    }

    return {
      success: true,
      message: result.message,
      data: result.data
    }

  } catch (error) {
    console.error('Contact form submission error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    }
  }
}

export async function validateContactForm(formData: ContactFormData): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {}

  if (!formData.name?.trim()) {
    errors.name = 'Name is required'
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long'
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
  }

  if (!formData.subject?.trim()) {
    errors.subject = 'Subject is required'
  } else if (formData.subject.trim().length < 5) {
    errors.subject = 'Subject must be at least 5 characters long'
  }

  if (!formData.message?.trim()) {
    errors.message = 'Message is required'
  } else if (formData.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
