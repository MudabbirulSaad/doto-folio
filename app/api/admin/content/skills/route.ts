import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse, createLegacyUnauthorizedResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function GET() {
  try {
    const user = await getCurrentAdminUser()
    if (!user) return createLegacyUnauthorizedResponse()

    const skills = await (await createSkillContentUseCases()).listFlat()
    return NextResponse.json({ data: skills })
  } catch (error) {
    console.error('Error in GET /api/admin/content/skills:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) return createLegacyUnauthorizedResponse()

    const skill = await (await createSkillContentUseCases()).createFlat(await request.json())
    return NextResponse.json({ data: skill, message: 'Skill created successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/content/skills:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
