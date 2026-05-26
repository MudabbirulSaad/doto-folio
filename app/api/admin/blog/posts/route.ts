import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { CreateBlogPostData } from '@/lib/types/blog'
import {
  BlogPostWorkflowError,
  createBlogPost,
  createSupabaseBlogPostWorkflowRepository
} from '@/lib/data/blog-post-workflow'

function createWorkflowErrorResponse(error: unknown) {
  if (error instanceof BlogPostWorkflowError) {
    if (error.code === 'VALIDATION_ERROR') {
      return createValidationErrorResponse(error.details)
    }
    if (error.code === 'NOT_FOUND') {
      return createErrorResponse('NOT_FOUND', error.message, 404, error.details)
    }
    return createErrorResponse('INTERNAL_ERROR', error.message, 500, error.details)
  }

  return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
}

// GET - Get all blog posts for admin
async function getPostsHandler({ request }: { request: NextRequest }) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(
          id,
          name,
          slug,
          color
        ),
        tags:blog_post_tags(
          tag:blog_tags(
            id,
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    // Get total count
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    // Get paginated results
    const { data: posts, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch posts', 500)
    }

    return createSuccessResponse({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error in getPostsHandler:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

// POST - Create new blog post
async function createPostHandler({ request }: { request: NextRequest }) {
  try {
    const body: CreateBlogPostData = await request.json()
    const supabase = await createClient()
    const post = await createBlogPost(createSupabaseBlogPostWorkflowRepository(supabase), body)

    return createSuccessResponse(post, 'Post created successfully')

  } catch (error) {
    console.error('Error in createPostHandler:', error)
    return createWorkflowErrorResponse(error)
  }
}

export const GET = withAuth(getPostsHandler)
export const POST = withAuth(createPostHandler)
