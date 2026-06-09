import type { AdminSiteContent } from '@/lib/client/domain/admin-content'

export interface AdminSiteContentGateway {
  get(): Promise<AdminSiteContent>
  save(content: AdminSiteContent): Promise<AdminSiteContent>
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export async function loadAdminSiteContent(gateway: AdminSiteContentGateway) {
  try {
    return {
      success: true as const,
      content: await gateway.get()
    }
  } catch (error) {
    return workflowError(error, 'Failed to load content')
  }
}

export async function saveAdminSiteContent(
  gateway: AdminSiteContentGateway,
  content: AdminSiteContent
) {
  try {
    return {
      success: true as const,
      content: await gateway.save(content)
    }
  } catch (error) {
    return workflowError(error, 'Failed to save content')
  }
}
