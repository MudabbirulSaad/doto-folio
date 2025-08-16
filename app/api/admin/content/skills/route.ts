import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

// GET - Fetch all skill categories with skills
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('skill_categories')
      .select(`
        *,
        skills (
          id,
          name,
          level,
          description,
          display_order,
          is_published
        )
      `)
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching skill categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch skill categories' },
        { status: 500 }
      )
    }

    // Sort skills by display_order and filter published skills
    const categoriesWithSortedSkills = categories?.map(category => ({
      ...category,
      skills: category.skills
        ?.filter((skill: { is_published: boolean }) => skill.is_published)
        ?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) || []
    })) || []

    return NextResponse.json({ data: categoriesWithSortedSkills })
  } catch (error) {
    console.error('Error in GET /api/admin/content/skills:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new skill category
export async function POST(request: NextRequest) {
  try {
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
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get next display order
    const { data: lastCategory } = await supabase
      .from('skill_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextDisplayOrder = (lastCategory?.display_order || 0) + 1

    // Create skill category
    const { data: category, error: categoryError } = await supabase
      .from('skill_categories')
      .insert({
        title: body.title,
        description: body.description || null,
        display_order: body.display_order || nextDisplayOrder,
        is_published: body.is_published !== undefined ? body.is_published : true
      })
      .select()
      .single()

    if (categoryError) {
      console.error('Error creating skill category:', categoryError)
      return NextResponse.json(
        { error: 'Failed to create skill category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: { ...category, skills: [] },
      message: 'Skill category created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/content/skills:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
