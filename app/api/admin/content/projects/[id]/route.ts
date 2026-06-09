import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createProjectUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeAdminRequest(request, 'projects:read')

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
    await authorizeAdminRequest(request, 'projects:update')

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
    await authorizeAdminRequest(request, 'projects:delete')

    await (await createProjectUseCases()).delete(id)

    return NextResponse.json({
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/projects/[id]:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
