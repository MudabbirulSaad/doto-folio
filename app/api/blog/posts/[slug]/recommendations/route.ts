import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createNotFoundResponse, createInternalErrorResponse } from '@/lib/api/response'
import { getHybridRecommendations } from '@/lib/services/recommendation'
import type { BlogPost } from '@/lib/types/blog'

interface RouteContext {
  params: Promise<{
    slug: string
  }>
}

// GET - Get recommendations for a specific blog post
async function getRecommendationsHandler(request: NextRequest, context: RouteContext) {
  try {
    const { params } = context
    const resolvedParams = await params

    if (!resolvedParams || !resolvedParams.slug) {
      return createNotFoundResponse('Blog post slug not provided')
    }

    const { slug } = resolvedParams

    const supabase = await createClient()

    // First, get the current post
    const { data: currentPost, error: currentPostError } = await supabase
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
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (currentPostError || !currentPost) {
      return createNotFoundResponse('Blog post not found')
    }

    // Get all published posts for recommendation calculation
    const { data: allPosts, error: allPostsError } = await supabase
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
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (allPostsError) {
      console.error('Error fetching all posts for recommendations:', allPostsError)
      return createInternalErrorResponse('Failed to fetch posts for recommendations')
    }

    // Transform the data to match our BlogPost type
    const transformPost = (post: any): BlogPost => ({
      ...post,
      tags: post.tags?.map((tagRelation: any) => ({
        tag: tagRelation.tag
      })) || []
    })

    const currentPostTransformed = transformPost(currentPost)
    const allPostsTransformed = (allPosts || []).map(transformPost)

    // Get recommendations using our AI algorithm
    const recommendations = getHybridRecommendations(
      currentPostTransformed,
      allPostsTransformed,
      3
    )

    return createSuccessResponse({
      recommendations,
      total: recommendations.length,
      algorithm: 'hybrid_content_category'
    })

  } catch (error) {
    console.error('Error getting recommendations:', error)
    return createInternalErrorResponse('Failed to get recommendations')
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return getRecommendationsHandler(request, context)
}
