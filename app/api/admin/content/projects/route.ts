import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'projects:read')

    const projects = await (await createProjectUseCases()).list()
    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'projects:create')

    const body = await request.json()
    const projects = await createProjectUseCases()
    const project = await projects.create(body)
    const completeProject = await projects.get(project.id)

    return NextResponse.json({
      data: completeProject,
      message: 'Project created successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/admin/content/projects:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
