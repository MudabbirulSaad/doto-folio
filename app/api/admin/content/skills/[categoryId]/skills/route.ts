import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    await authorizeAdminRequest(request, 'skills:create')

    const skill = await (await createSkillContentUseCases()).createInCategory(categoryId, await request.json())
    return NextResponse.json({ data: skill, message: 'Skill created successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/content/skills/[categoryId]/skills:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
