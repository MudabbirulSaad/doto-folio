import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/api/response'
import type { BlogPostWithRelations, BlogPost } from '@/lib/types/blog'

// GET - Fetch individual blog post by slug with related posts
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const supabase = await createClient()

    // Fetch the main post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(
          id,
          name,
          slug,
          description,
          color
        ),
        tags:blog_post_tags(
          tag:blog_tags(
            id,
            name,
            slug,
            description
          )
        )
      `)
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return createNotFoundErrorResponse('Blog post not found')
    }

    // Transform the post data
    const blogPost: BlogPostWithRelations = {
      ...post,
      category: post.category || null,
      tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
    }

    // Fetch related posts (same category or shared tags, excluding current post)
    let relatedQuery = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        featured_image_alt,
        author_name,
        reading_time,
        view_count,
        published_at,
        category:blog_categories(
          id,
          name,
          slug,
          color
        )
      `)
      .eq('status', 'published')
      .neq('id', post.id)
      .limit(4)

    // Prioritize posts from the same category
    if (post.category_id) {
      relatedQuery = relatedQuery.eq('category_id', post.category_id)
    }

    const { data: relatedPosts } = await relatedQuery.order('published_at', { ascending: false })

    // If we don't have enough related posts from the same category, get more from other categories
    let finalRelatedPosts = relatedPosts || []
    
    if (finalRelatedPosts.length < 3) {
      const { data: moreRelatedPosts } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          featured_image_alt,
          author_name,
          reading_time,
          view_count,
          published_at,
          category:blog_categories(
            id,
            name,
            slug,
            color
          )
        `)
        .eq('status', 'published')
        .neq('id', post.id)
        .not('id', 'in', `(${finalRelatedPosts.map(p => p.id).join(',')})`)
        .order('view_count', { ascending: false })
        .limit(4 - finalRelatedPosts.length)

      finalRelatedPosts = [...finalRelatedPosts, ...(moreRelatedPosts || [])]
    }

    // Track the view (fire and forget)
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    // Insert view record (don't await to avoid slowing down the response)
    const trackView = async () => {
      try {
        await supabase
          .from('blog_views')
          .insert({
            post_id: post.id,
            ip_address: clientIP,
            user_agent: userAgent,
            referrer: referrer
          })

        // Update view count
        await supabase
          .from('blog_posts')
          .update({ view_count: post.view_count + 1 })
          .eq('id', post.id)
      } catch (error) {
        console.error('Failed to track blog view:', error)
      }
    }

    // Fire and forget
    trackView()

    return createSuccessResponse({
      post: blogPost,
      relatedPosts: finalRelatedPosts
    }, 'Blog post retrieved successfully')

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch blog post',
      [(error as Error).message]
    )
  }
}

// POST - Track blog post view (alternative endpoint for client-side tracking)
export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const supabase = await createClient()

    // Get post ID from slug
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, view_count')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return createNotFoundErrorResponse('Blog post not found')
    }

    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Insert view record
    const { error: viewError } = await supabase
      .from('blog_views')
      .insert({
        post_id: post.id,
        ip_address: clientIP,
        user_agent: userAgent,
        referrer: body.referrer || null
      })

    if (viewError) {
      console.error('Failed to insert blog view:', viewError)
    }

    // Update view count
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', post.id)

    if (updateError) {
      console.error('Failed to update view count:', updateError)
    }

    return createSuccessResponse({ success: true }, 'View tracked successfully')

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to track view',
      [(error as Error).message]
    )
  }
}


