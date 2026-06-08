export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export interface ContactEmailResult {
  success: boolean
  error?: string
  adminEmailSent?: boolean
  userEmailSent?: boolean
}

export interface ContactSubmissionRepository {
  saveSubmission(data: ContactFormData): Promise<Record<string, unknown>>
}

export interface ContactEmailNotifier {
  sendContactNotifications(formData: ContactFormData): Promise<ContactEmailResult>
}

export interface ContactSubmissionResult {
  submission: Record<string, unknown>
  emailStatus: string
}

function emailStatusFromResult(result: ContactEmailResult) {
  if (!result.success) {
    return `Email notifications failed: ${result.error}`
  }

  const emailParts = []
  if (result.adminEmailSent) emailParts.push('admin notification sent')
  if (result.userEmailSent) emailParts.push('confirmation email sent')
  return `Email notifications: ${emailParts.join(', ')}`
}

export async function submitContactMessage(
  repository: ContactSubmissionRepository,
  notifier: ContactEmailNotifier | null,
  formData: ContactFormData
): Promise<ContactSubmissionResult> {
  const normalizedFormData = {
    ...formData,
    email: formData.email.toLowerCase()
  }

  const submission = await repository.saveSubmission(normalizedFormData)

  if (!notifier) {
    return {
      submission,
      emailStatus: 'Email notifications disabled'
    }
  }

  try {
    const emailResult = await notifier.sendContactNotifications(normalizedFormData)
    return {
      submission,
      emailStatus: emailStatusFromResult(emailResult)
    }
  } catch {
    return {
      submission,
      emailStatus: 'Email notifications failed: service error'
    }
  }
}
