import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse, createLegacyUnauthorizedResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const user = await getCurrentAdminUser()
    if (!user) return createLegacyUnauthorizedResponse()

    const skill = await (await createSkillContentUseCases()).createInCategory(categoryId, await request.json())
    return NextResponse.json({ data: skill, message: 'Skill created successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/content/skills/[categoryId]/skills:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
