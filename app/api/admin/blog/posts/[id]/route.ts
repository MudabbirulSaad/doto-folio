// import { NextRequest } from 'next/server' // Not needed with middleware approach
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse } from '@/lib/api/response'
import type { UpdateBlogPostData } from '@/lib/types/blog'
import { createAdminBlogPostReadUseCases, createAdminBlogWorkflowUseCases } from '@/lib/server/composition/blog'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

function getPostIdFromRequestUrl(requestUrl: string) {
  const url = new URL(requestUrl)
  const pathSegments = url.pathname.split('/')
  return pathSegments[pathSegments.length - 1]
}

// GET - Get single post for editing
async function getPostHandler(context: any) {
  try {
    const id = getPostIdFromRequestUrl(context.request.url)

    const post = await (await createAdminBlogPostReadUseCases()).getPost(id)

    return createSuccessResponse(post)

  } catch (error) {
    console.error('Error in getPostHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
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
    return createApplicationOrInternalErrorResponse(error)
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
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withAuth(getPostHandler)
export const PUT = withAuth(updatePostHandler)
export const DELETE = withAuth(deletePostHandler)
