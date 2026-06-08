import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { isApplicationError } from '@/lib/server/domain/errors'

function errorResponse(error: unknown) {
  if (isApplicationError(error)) {
    const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'VALIDATION_ERROR' ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await (await createProjectUseCases()).get(id)
    return NextResponse.json({ data: project })
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects/[id]:', error)
    return errorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projects = await createProjectUseCases()
    await projects.update(id, body)
    const completeProject = await projects.get(id)

    return NextResponse.json({
      data: completeProject,
      message: 'Project updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/content/projects/[id]:', error)
    return errorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await (await createProjectUseCases()).delete(id)

    return NextResponse.json({
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/projects/[id]:', error)
    return errorResponse(error)
  }
}
