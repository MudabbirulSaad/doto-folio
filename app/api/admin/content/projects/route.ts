import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse, createLegacyUnauthorizedResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function GET() {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return createLegacyUnauthorizedResponse()
    }

    const projects = await (await createProjectUseCases()).list()
    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return createLegacyUnauthorizedResponse()
    }

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
