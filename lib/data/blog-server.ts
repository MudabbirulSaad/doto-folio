import {
  createServiceRoleBlogDetailUseCase,
  createServiceRolePublicBlogListingUseCase,
  createServiceRolePublicBlogTaxonomyUseCases
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

// Server-side data fetching for blog (no HTTP calls needed)
export class BlogServerData {
  
  // Get featured posts
  static async getFeaturedPosts(limit: number = 3) {
    try {
      const getBlogListing = createServiceRolePublicBlogListingUseCase()

      const result = await getBlogListing({
        featured: true,
        page: 1,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, { defaultLimit: limit, maxLimit: limit })

      return result.posts
    } catch (error) {
      console.error('Error in getFeaturedPosts:', error)
      return []
    }
  }

  // Get all categories
  static async getCategories() {
    try {
      const taxonomy = createServiceRolePublicBlogTaxonomyUseCases()
      return await taxonomy.categoriesWithCounts()
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  // Get popular tags
  static async getPopularTags(limit: number = 10) {
    try {
      const getBlogListing = createServiceRolePublicBlogListingUseCase()
      const result = await getBlogListing({}, { tagLimit: limit })
      return result.tags
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
      const getBlogListing = createServiceRolePublicBlogListingUseCase()
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
      const taxonomy = createServiceRolePublicBlogTaxonomyUseCases()
      const result = await taxonomy.postsByCategory(categorySlug, { page, limit })

      return {
        category: result.category,
        posts: result.posts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.total === 0 ? 0 : Math.ceil(result.total / result.limit)
        }
      }
    } catch (error) {
      console.error('Error in getPostsByCategory:', error)
      return null
    }
  }
}
