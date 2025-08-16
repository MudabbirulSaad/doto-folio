import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

// POST - Create new skill in category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    // Check authentication
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = await createClient()

    // Validate required fields
    if (!body.name || !body.level || !body.description) {
      return NextResponse.json(
        { error: 'Name, level, and description are required' },
        { status: 400 }
      )
    }

    // Validate level
    const validLevels = ['Learning', 'Intermediate', 'Advanced', 'Expert']
    if (!validLevels.includes(body.level)) {
      return NextResponse.json(
        { error: 'Invalid skill level' },
        { status: 400 }
      )
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('skill_categories')
      .select('id')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Skill category not found' },
        { status: 404 }
      )
    }

    // Get next display order for this category
    const { data: lastSkill } = await supabase
      .from('skills')
      .select('display_order')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextDisplayOrder = (lastSkill?.display_order || 0) + 1

    // Create skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .insert({
        category_id: categoryId,
        name: body.name,
        level: body.level,
        description: body.description,
        display_order: body.display_order || nextDisplayOrder,
        is_published: body.is_published !== undefined ? body.is_published : true
      })
      .select()
      .single()

    if (skillError) {
      console.error('Error creating skill:', skillError)
      return NextResponse.json(
        { error: 'Failed to create skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: skill,
      message: 'Skill created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/content/skills/[categoryId]/skills:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
