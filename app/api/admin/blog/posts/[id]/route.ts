// import { NextRequest } from 'next/server' // Not needed with middleware approach
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import type { UpdateBlogPostData } from '@/lib/types/blog'
import { createAdminBlogWorkflowUseCases } from '@/lib/server/composition/blog'
import { isApplicationError } from '@/lib/server/domain/errors'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'

function getPostIdFromRequestUrl(requestUrl: string) {
  const url = new URL(requestUrl)
  const pathSegments = url.pathname.split('/')
  return pathSegments[pathSegments.length - 1]
}

function createWorkflowErrorResponse(error: unknown) {
  if (isApplicationError(error)) {
    return createApplicationErrorResponse(error)
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
    const workflow = await createAdminBlogWorkflowUseCases()
    const post = await workflow.updatePost(id, body as UpdateBlogPostData)

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

    const workflow = await createAdminBlogWorkflowUseCases()
    const result = await workflow.deletePost(id)

    return createSuccessResponse(result)

  } catch (error) {
    console.error('Error in deletePostHandler:', error)
    return createWorkflowErrorResponse(error)
  }
}

export const GET = withAuth(getPostHandler)
export const PUT = withAuth(updatePostHandler)
export const DELETE = withAuth(deletePostHandler)
