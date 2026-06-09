import { NextRequest } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import type { CreateBlogPostData } from '@/lib/types/blog'
import { createAdminBlogPostReadUseCases, createAdminBlogWorkflowUseCases } from '@/lib/server/composition/blog'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

// GET - Get all blog posts for admin
async function getPostsHandler({ request }: { request: NextRequest }) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const result = await (await createAdminBlogPostReadUseCases()).listPosts({
      page,
      limit,
      status,
      category,
      search
    })

    return createSuccessResponse(result)

  } catch (error) {
    console.error('Error in getPostsHandler:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

// POST - Create new blog post
async function createPostHandler({ request }: { request: NextRequest }) {
  try {
    const body: CreateBlogPostData = await request.json()
    const workflow = await createAdminBlogWorkflowUseCases()
    const post = await workflow.createPost(body)

    return createSuccessResponse(post, 'Post created successfully')

  } catch (error) {
    console.error('Error in createPostHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withScopedAuth(getPostsHandler, 'blog-posts:read')
export const POST = withScopedAuth(createPostHandler, 'blog-posts:create')
