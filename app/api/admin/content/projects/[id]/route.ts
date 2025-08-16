import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

// GET - Fetch single project with technologies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_technologies (
          id,
          technology_name,
          display_order
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Sort technologies by display_order
    const projectWithSortedTech = {
      ...project,
      project_technologies: project.project_technologies?.sort(
        (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
      ) || []
    }

    return NextResponse.json({ data: projectWithSortedTech })
  } catch (error) {
    console.error('Error in GET /api/admin/content/projects/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Update project
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        title: body.title,
        description: body.description,
        status: body.status,
        display_order: body.display_order,
        is_featured: body.is_featured || false,
        is_published: body.is_published !== undefined ? body.is_published : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (projectError) {
      console.error('Error updating project:', projectError)
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    // Update technologies if provided
    if (body.technologies && Array.isArray(body.technologies)) {
      // Delete existing technologies
      await supabase
        .from('project_technologies')
        .delete()
        .eq('project_id', id)

      // Add new technologies
      if (body.technologies.length > 0) {
        const technologies = body.technologies.map((tech: string, index: number) => ({
          project_id: id,
          technology_name: tech,
          display_order: index + 1
        }))

        const { error: techError } = await supabase
          .from('project_technologies')
          .insert(technologies)

        if (techError) {
          console.error('Error updating project technologies:', techError)
          // Don't fail the request, just log the error
        }
      }
    }

    // Fetch the complete updated project with technologies
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
      .eq('id', id)
      .single()

    return NextResponse.json({ 
      data: completeProject,
      message: 'Project updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/content/projects/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check authentication
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Delete project (technologies will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/content/projects/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
