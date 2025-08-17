import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import type { BlogCategory } from '@/lib/types/blog'

// GET - Fetch all blog categories with post counts
async function getBlogCategoriesHandler() {
  try {
    const supabase = await createClient()

    // Fetch categories with post counts
    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select(`
        *,
        posts:blog_posts(count)
      `)
      .eq('blog_posts.status', 'published')
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch blog categories: ${error.message}`)
    }

    // Transform the data to include post counts
    const categoriesWithCounts: (BlogCategory & { post_count: number })[] = categories?.map(category => ({
      ...category,
      post_count: category.posts?.[0]?.count || 0
    })) || []

    return createSuccessResponse(categoriesWithCounts, 'Blog categories retrieved successfully')

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch blog categories',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(getBlogCategoriesHandler)
