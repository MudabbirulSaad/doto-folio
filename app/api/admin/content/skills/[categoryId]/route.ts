import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

const VALID_CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Other'] as const

function validateSkillPayload(body: any) {
  if (!body.name?.trim()) {
    return 'Skill name is required'
  }

  if (!VALID_CATEGORIES.includes(body.category)) {
    return 'Invalid skill category'
  }

  const proficiency = Number(body.proficiency)
  if (!Number.isInteger(proficiency) || proficiency < 0 || proficiency > 100) {
    return 'Proficiency must be between 0 and 100'
  }

  if (!body.icon_name?.trim()) {
    return 'Icon name is required'
  }

  return null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { categoryId: skillId } = await params
    const body = await request.json()
    const validationError = validateSkillPayload(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: skill, error } = await supabase
      .from('skills')
      .update({
        name: body.name.trim(),
        category: body.category,
        proficiency: Number(body.proficiency),
        icon_name: body.icon_name.trim()
      })
      .eq('id', skillId)
      .select()
      .single()

    if (error) {
      console.error('Error updating skill:', error)
      return NextResponse.json(
        { error: 'Failed to update skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: skill,
      message: 'Skill updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/content/skills/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { categoryId: skillId } = await params
    const supabase = await createClient()
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId)

    if (error) {
      console.error('Error deleting skill:', error)
      return NextResponse.json(
        { error: 'Failed to delete skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Skill deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/skills/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
