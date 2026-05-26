// import { NextRequest } from 'next/server' // Not needed with middleware approach
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { UpdateBlogPostData } from '@/lib/types/blog'
import {
  BlogPostWorkflowError,
  createSupabaseBlogPostWorkflowRepository,
  deleteBlogPost,
  updateBlogPost
} from '@/lib/data/blog-post-workflow'

function getPostIdFromRequestUrl(requestUrl: string) {
  const url = new URL(requestUrl)
  const pathSegments = url.pathname.split('/')
  return pathSegments[pathSegments.length - 1]
}

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

// GET - Get single post for editing
async function getPostHandler(context: any) {
  try {
    const id = getPostIdFromRequestUrl(context.request.url)

    const supabase = await createClient()
    
    const { data: post, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      return createErrorResponse('NOT_FOUND', 'Post not found', 404)
    }

    return createSuccessResponse(post)

  } catch (error) {
    console.error('Error in getPostHandler:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

// PUT - Update post
async function updatePostHandler(context: any) {
  try {
    const id = getPostIdFromRequestUrl(context.request.url)

    const body = await context.request.json()
    const supabase = await createClient()
    const post = await updateBlogPost(
      createSupabaseBlogPostWorkflowRepository(supabase),
      id,
      body as UpdateBlogPostData
    )

    return createSuccessResponse(post)

  } catch (error) {
    console.error('Error in updatePostHandler:', error)
    return createWorkflowErrorResponse(error)
  }
}

// DELETE - Delete post
async function deletePostHandler(context: any) {
  try {
    const id = getPostIdFromRequestUrl(context.request.url)

    const supabase = await createClient()
    const result = await deleteBlogPost(createSupabaseBlogPostWorkflowRepository(supabase), id)

    return createSuccessResponse(result)

  } catch (error) {
    console.error('Error in deletePostHandler:', error)
    return createWorkflowErrorResponse(error)
  }
}

export const GET = withAuth(getPostHandler)
export const PUT = withAuth(updatePostHandler)
export const DELETE = withAuth(deletePostHandler)
