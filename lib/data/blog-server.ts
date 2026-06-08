import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  createServiceRoleBlogDetailUseCase,
  createServiceRolePublicBlogListingUseCase
} from '@/lib/server/composition/blog'
import type { BlogPostWithRelations, BlogSearchParams } from '@/lib/types/blog'

interface BlogPostListingResponse {
  posts: BlogPostWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Create a server-side Supabase client with service role key
function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Server-side data fetching for blog (no HTTP calls needed)
export class BlogServerData {
  
  // Get featured posts
  static async getFeaturedPosts(limit: number = 3) {
    try {
      const getBlogListing = createServiceRolePublicBlogListingUseCase()
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug, color),
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('status', 'published')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching featured posts:', error)
        return []
      }

      return posts || []
    } catch (error) {
      console.error('Error in getFeaturedPosts:', error)
      return []
    }
  }

  // Get all categories
  static async getCategories() {
    try {
      const supabase = createServerClient()
      
      const { data: categories, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      return categories || []
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  // Get popular tags
  static async getPopularTags(limit: number = 10) {
    try {
      const supabase = createServerClient()
      
      const { data: tags, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching tags:', error)
        return []
      }

      return tags || []
    } catch (error) {
      console.error('Error in getPopularTags:', error)
      return []
    }
  }

  // Get blog posts with filters
  static async getBlogPosts(options: {
    search?: string
    category?: string
    tag?: string
    page?: number
    limit?: number
    featured?: boolean
    sortBy?: BlogSearchParams['sortBy']
    sortOrder?: BlogSearchParams['sortOrder']
  } = {}): Promise<BlogPostListingResponse> {
    try {
      const supabase = createServerClient()
      const {
        search,
        category,
        tag,
        page = 1,
        limit = 12,
        featured,
        sortBy,
        sortOrder
      } = options

      const result = await getBlogListing({
        query: search,
        category,
        tag,
        featured,
        page,
        limit,
        sortBy,
        sortOrder
      }, { defaultLimit: 12, maxLimit: 50 })

      return {
        posts: result.posts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      }
    } catch (error) {
      console.error('Error in getBlogPosts:', error)
      return {
        posts: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  // Get single blog post by slug
  static async getBlogPost(slug: string) {
    try {
      const service = createServiceRoleBlogDetailUseCase()
      return await service.readMetadata(slug)
    } catch (error) {
      console.error('Error in getBlogPost:', error)
      return null
    }
  }

  // Get posts by category
  static async getPostsByCategory(categorySlug: string, page: number = 1, limit: number = 10) {
    try {
      const supabase = createServerClient()
      
      // Get category info
      const { data: category, error: categoryError } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('slug', categorySlug)
        .single()

      if (categoryError || !category) {
        return null
      }

      // Get posts in this category
      const result = await this.getBlogPosts({
        category: categorySlug,
        page,
        limit
      })

      return {
        category,
        ...result
      }
    } catch (error) {
      console.error('Error in getPostsByCategory:', error)
      return null
    }
  }
}
