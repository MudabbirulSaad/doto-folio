// import { NextRequest } from 'next/server' // Not needed with middleware approach
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { UpdateBlogPostData } from '@/lib/types/blog'

// GET - Get single post for editing
async function getPostHandler(context: any) {
  try {
    // Extract params from the URL
    const url = new URL(context.request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1] // Get the last segment as ID

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
    // Extract params from the URL
    const url = new URL(context.request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1] // Get the last segment as ID

    const body = await context.request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      tag_ids = [],
      status,
      featured,
      meta_title,
      meta_description
    }: UpdateBlogPostData = body

    // Validation
    if (title !== undefined && !title?.trim()) {
      return createValidationErrorResponse(['Title is required'])
    }

    if (slug !== undefined && !slug?.trim()) {
      return createValidationErrorResponse(['Slug is required'])
    }

    if (content !== undefined && !content?.trim()) {
      return createValidationErrorResponse(['Content is required'])
    }

    const supabase = await createClient()

    // Check if post exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id, slug, category_id, published_at')
      .eq('id', id)
      .single()

    if (!existingPost) {
      return createErrorResponse('NOT_FOUND', 'Post not found', 404)
    }

    // Check if slug already exists (excluding current post)
    if (slug && slug.trim() !== existingPost.slug) {
      const { data: duplicatePost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug.trim())
        .neq('id', id)
        .single()

      if (duplicatePost) {
        return createValidationErrorResponse(['A post with this slug already exists'])
      }
    }

    // Calculate reading time if content is provided
    let readingTime: number | undefined
    if (content) {
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
        // Keep existing reading time if content parsing fails
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (slug !== undefined) updateData.slug = slug.trim()
    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || ''
    if (content !== undefined) updateData.content = content.trim()
    if (category_id !== undefined) updateData.category_id = category_id || null
    if (status !== undefined) {
      updateData.status = status
      // Set published_at when publishing for the first time
      if (status === 'published' && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (featured !== undefined) updateData.featured = featured
    if (meta_title !== undefined) updateData.meta_title = meta_title?.trim() || null
    if (meta_description !== undefined) updateData.meta_description = meta_description?.trim() || null
    if (readingTime !== undefined) updateData.reading_time = readingTime

    // Update the post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (postError) {
      console.error('Error updating post:', postError)
      return createErrorResponse('INTERNAL_ERROR', 'Failed to update post', 500)
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Get current tags to update usage counts
      const { data: currentTags } = await supabase
        .from('blog_post_tags')
        .select('tag_id')
        .eq('post_id', id)

      const currentTagIds = currentTags?.map(t => t.tag_id) || []

      // Remove all current tags
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', id)

      // Add new tags
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tag_id => ({
          post_id: id,
          tag_id
        }))

        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagRelations)

        if (tagError) {
          console.error('Error updating tags:', tagError)
          // Don't fail the entire operation, just log the error
        }
      }

      // Update tag usage counts
      // Decrement for removed tags
      for (const tagId of currentTagIds) {
        if (!tag_ids.includes(tagId)) {
          await supabase.rpc('decrement_tag_usage', { tag_id: tagId })
        }
      }

      // Increment for new tags
      for (const tagId of tag_ids) {
        if (!currentTagIds.includes(tagId)) {
          await supabase.rpc('increment_tag_usage', { tag_id: tagId })
        }
      }
    }

    // Update category post counts if category changed
    if (category_id !== undefined && category_id !== existingPost.category_id) {
      // Decrement old category
      if (existingPost.category_id) {
        await supabase.rpc('update_category_post_count', { category_id: existingPost.category_id })
      }
      // Increment new category
      if (category_id) {
        await supabase.rpc('update_category_post_count', { category_id })
      }
    }

    return createSuccessResponse(post)

  } catch (error) {
    console.error('Error in updatePostHandler:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

// DELETE - Delete post
async function deletePostHandler(context: any) {
  try {
    // Extract params from the URL
    const url = new URL(context.request.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1] // Get the last segment as ID

    const supabase = await createClient()

    // Get post details before deletion for cleanup
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        category_id,
        tags:blog_post_tags(tag_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return createErrorResponse('NOT_FOUND', 'Post not found', 404)
    }

    // Delete the post (cascade will handle blog_post_tags and blog_views)
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return createErrorResponse('INTERNAL_ERROR', 'Failed to delete post', 500)
    }

    // Update tag usage counts
    if (post.tags && post.tags.length > 0) {
      for (const tagRelation of post.tags) {
        await supabase.rpc('decrement_tag_usage', { tag_id: tagRelation.tag_id })
      }
    }

    // Update category post count
    if (post.category_id) {
      await supabase.rpc('update_category_post_count', { category_id: post.category_id })
    }

    return createSuccessResponse({ 
      message: 'Post deleted successfully',
      title: post.title 
    })

  } catch (error) {
    console.error('Error in deletePostHandler:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export const GET = withAuth(getPostHandler)
export const PUT = withAuth(updatePostHandler)
export const DELETE = withAuth(deletePostHandler)
