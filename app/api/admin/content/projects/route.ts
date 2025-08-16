import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

// GET - Fetch all projects with technologies
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_technologies (
          id,
          technology_name,
          display_order
        )
      `)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    // Sort technologies by display_order
    const projectsWithSortedTech = projects?.map(project => ({
      ...project,
      project_technologies: project.project_technologies?.sort(
        (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
      ) || []
    })) || []

    return NextResponse.json({ data: projectsWithSortedTech })
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new project
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
    if (!body.title || !body.description || !body.status) {
      return NextResponse.json(
        { error: 'Title, description, and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['Planning', 'In Development', 'Completed', 'On Hold']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get next display order
    const { data: lastProject } = await supabase
      .from('projects')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextDisplayOrder = (lastProject?.display_order || 0) + 1

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: body.title,
        description: body.description,
        status: body.status,
        display_order: body.display_order || nextDisplayOrder,
        is_featured: body.is_featured || false,
        is_published: body.is_published !== undefined ? body.is_published : true
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // Add technologies if provided
    if (body.technologies && Array.isArray(body.technologies) && body.technologies.length > 0) {
      const technologies = body.technologies.map((tech: string, index: number) => ({
        project_id: project.id,
        technology_name: tech,
        display_order: index + 1
      }))

      const { error: techError } = await supabase
        .from('project_technologies')
        .insert(technologies)

      if (techError) {
        console.error('Error adding project technologies:', techError)
        // Don't fail the request, just log the error
      }
    }

    // Fetch the complete project with technologies
    const { data: completeProject } = await supabase
      .from('projects')
      .select(`
        *,
        project_technologies (
          id,
          technology_name,
          display_order
        )
      `)
      .eq('id', project.id)
      .single()

    return NextResponse.json({ 
      data: completeProject,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/content/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
