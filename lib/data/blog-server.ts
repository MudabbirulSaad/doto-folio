import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { BlogPost, BlogCategory, BlogTag } from '@/lib/types/blog'

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
      const supabase = createServerClient()
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories!inner(id, name, slug, color),
          blog_post_tags!inner(
            blog_tags!inner(id, name, slug)
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
  } = {}) {
    try {
      const supabase = createServerClient()
      const {
        search,
        category,
        tag,
        page = 1,
        limit = 10,
        featured
      } = options

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories!inner(id, name, slug, color),
          blog_post_tags!inner(
            blog_tags!inner(id, name, slug)
          )
        `)
        .eq('status', 'published')

      // Apply filters
      if (featured) {
        query = query.eq('featured', true)
      }

      if (category) {
        query = query.eq('blog_categories.slug', category)
      }

      if (tag) {
        query = query.eq('blog_tags.slug', tag)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // Apply pagination and ordering
      const offset = (page - 1) * limit
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: posts, error } = await query

      if (error) {
        console.error('Error fetching blog posts:', error)
        return {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        posts: posts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      }
    } catch (error) {
      console.error('Error in getBlogPosts:', error)
      return {
        posts: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  // Get single blog post by slug
  static async getBlogPost(slug: string) {
    try {
      const supabase = createServerClient()
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories!inner(id, name, slug, color),
          blog_post_tags!inner(
            blog_tags!inner(id, name, slug)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) {
        console.error('Error fetching blog post:', error)
        return null
      }

      // Increment view count
      await supabase
        .from('blog_posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id)

      return post
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
