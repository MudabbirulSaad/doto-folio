import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse, createLegacyUnauthorizedResponse } from '@/lib/server/adapters/http/legacy-json-response'

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
    return createLegacyJsonErrorResponse(error)
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
      return createLegacyUnauthorizedResponse()
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
    return createLegacyJsonErrorResponse(error)
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
      return createLegacyUnauthorizedResponse()
    }

    await (await createProjectUseCases()).delete(id)

    return NextResponse.json({
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/projects/[id]:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
