import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { isApplicationError } from '@/lib/server/domain/errors'

function errorResponse(error: unknown) {
  if (isApplicationError(error)) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function GET() {
  try {
    const projects = await (await createProjectUseCases()).list()
    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return errorResponse(error)
  }
}
