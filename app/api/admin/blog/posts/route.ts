import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { CreateBlogPostData } from '@/lib/types/blog'

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
      return createErrorResponse('Failed to fetch posts', 500)
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
    return createErrorResponse('Internal server error', 500)
  }
}

// POST - Create new blog post
async function createPostHandler({ request }: { request: NextRequest }) {
  try {
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      tag_ids = [],
      status = 'draft',
      featured = false,
      meta_title,
      meta_description
    }: CreateBlogPostData = body

    // Validation
    if (!title?.trim()) {
      return createValidationErrorResponse('Title is required')
    }

    if (!slug?.trim()) {
      return createValidationErrorResponse('Slug is required')
    }

    if (!content?.trim()) {
      return createValidationErrorResponse('Content is required')
    }

    const supabase = await createClient()

    // Check if slug already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug.trim())
      .single()

    if (existingPost) {
      return createValidationErrorResponse('A post with this slug already exists')
    }

    // Calculate reading time (rough estimate: 200 words per minute)
    let readingTime = 5 // default
    try {
      const contentData = JSON.parse(content)
      if (contentData.blocks) {
        const wordCount = contentData.blocks
          .filter((block: any) => block.type === 'paragraph' || block.type === 'header')
          .reduce((count: number, block: any) => {
            const text = block.data?.text || ''
            return count + text.split(/\s+/).length
          }, 0)
        readingTime = Math.max(1, Math.ceil(wordCount / 200))
      }
    } catch (e) {
      // Use default reading time if content parsing fails
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt?.trim() || '',
        content: content.trim(),
        category_id: category_id || null,
        status,
        featured,
        meta_title: meta_title?.trim() || null,
        meta_description: meta_description?.trim() || null,
        reading_time: readingTime,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return createErrorResponse('Failed to create post', 500)
    }

    // Add tags if provided
    if (tag_ids.length > 0 && post) {
      const tagRelations = tag_ids.map(tag_id => ({
        post_id: post.id,
        tag_id
      }))

      const { error: tagError } = await supabase
        .from('blog_post_tags')
        .insert(tagRelations)

      if (tagError) {
        console.error('Error adding tags:', tagError)
        // Don't fail the entire operation, just log the error
      }

      // Update tag usage counts
      for (const tag_id of tag_ids) {
        await supabase.rpc('increment_tag_usage', { tag_id })
      }
    }

    // Update category post count if category is assigned
    if (category_id) {
      await supabase.rpc('update_category_post_count', { category_id })
    }

    return createSuccessResponse(post, 201)

  } catch (error) {
    console.error('Error in createPostHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export const GET = withAuth(getPostsHandler)
export const POST = withAuth(createPostHandler)
