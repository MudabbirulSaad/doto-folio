import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const principal = await authorizeAdminRequest(request, 'projects:read')

    const { id } = await params
    const project = await (await createProjectUseCases(principal)).get(id)
    return createSuccessResponse(project)
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const principal = await authorizeAdminRequest(request, 'projects:update')

    const body = await request.json()
    const projects = await createProjectUseCases(principal)
    await projects.update(id, body)
    const completeProject = await projects.get(id)

    return createSuccessResponse(completeProject, 'Project updated successfully')
  } catch (error) {
    console.error('Error in PUT /api/admin/content/projects/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const principal = await authorizeAdminRequest(request, 'projects:delete')

    await (await createProjectUseCases(principal)).delete(id)

    return createSuccessResponse({ id }, 'Project deleted successfully')
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/projects/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
