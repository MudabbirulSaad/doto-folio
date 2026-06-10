import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'projects:read')

    const projects = await (await createProjectUseCases(principal)).list()
    return createSuccessResponse(projects)
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'projects:create')

    const body = await request.json()
    const projects = await createProjectUseCases(principal)
    const project = await projects.create(body)
    const completeProject = await projects.get(project.id)

    return createSuccessResponse(completeProject, 'Project created successfully')
  } catch (error) {
    console.error('Error in POST /api/admin/content/projects:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
