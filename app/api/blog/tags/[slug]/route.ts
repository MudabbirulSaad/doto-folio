import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/api/response'
import type { BlogTagResponse } from '@/lib/types/blog'

// GET - Fetch blog posts by tag
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // First, get the tag
    const { data: tag, error: tagError } = await supabase
      .from('blog_tags')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (tagError || !tag) {
      return createNotFoundErrorResponse('Blog tag not found')
    }

    // Get post IDs with this tag
    const { data: postTagRelations, error: postTagsError } = await supabase
      .from('blog_post_tags')
      .select('post_id')
      .eq('tag_id', tag.id)

    if (postTagsError) {
      throw new Error(`Failed to fetch tag relations: ${postTagsError.message}`)
    }

    const postIds = postTagRelations?.map(pt => pt.post_id) || []

    if (postIds.length === 0) {
      return createSuccessResponse({
        tag,
        posts: [],
        total: 0,
        page,
        limit,
        hasMore: false
      })
    }

    // Get posts with full details
    const { data: posts, error: postsError } = await supabase
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
      .in('id', postIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`)
    }

    // Get total count
    const { count: total, error: countError } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .in('id', postIds)
      .eq('status', 'published')

    if (countError) {
      throw new Error(`Failed to count posts: ${countError.message}`)
    }

    // Transform posts data
    const transformedPosts = posts?.map(post => ({
      ...post,
      category: post.category || null,
      tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
    })) || []

    const hasMore = offset + limit < (total || 0)

    const response: BlogTagResponse = {
      tag,
      posts: transformedPosts,
      total: total || 0,
      page,
      limit,
      hasMore
    }

    return createSuccessResponse(response, `Posts tagged with "${tag.name}" retrieved successfully`)

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch tag posts',
      [(error as Error).message]
    )
  }
}


