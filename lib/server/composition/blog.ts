import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getPublicBlogListing } from '@/lib/server/application/blog/public-blog-listing'
import {
  getBlogCategoriesWithCounts,
  getBlogPostsByCategory,
  getBlogPostsByTag
} from '@/lib/server/application/blog/public-blog-taxonomy'
import { createBlogPostDetailService } from '@/lib/server/application/blog/blog-post-detail'
import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost
} from '@/lib/server/application/blog/blog-post-workflow'
import { createSupabasePublicBlogListingRepository } from '@/lib/server/adapters/supabase/blog/public-blog-listing-repository'
import { createSupabaseBlogTaxonomyRepository } from '@/lib/server/adapters/supabase/blog/public-blog-taxonomy-repository'
import { createSupabaseBlogPostDetailRepository } from '@/lib/server/adapters/supabase/blog/blog-post-detail-repository'
import { createSupabaseBlogPostWorkflowRepository } from '@/lib/server/adapters/supabase/blog/blog-post-workflow-repository'
import type { BlogSearchParams, CreateBlogPostData, UpdateBlogPostData } from '@/lib/types/blog'

export async function createPublicBlogListingUseCase() {
  const supabase = await createClient()
  const repository = createSupabasePublicBlogListingRepository(supabase)

  return (params: BlogSearchParams, options?: { defaultLimit?: number; maxLimit?: number; tagLimit?: number }) =>
    getPublicBlogListing(repository, params, options)
}

export async function createPublicBlogTaxonomyUseCases() {
  const supabase = await createClient()
  const repository = createSupabaseBlogTaxonomyRepository(supabase)

  return {
    categoriesWithCounts: () => getBlogCategoriesWithCounts(repository),
    postsByCategory: (slug: string, params?: { page?: number; limit?: number }) =>
      getBlogPostsByCategory(repository, slug, params),
    postsByTag: (slug: string, params?: { page?: number; limit?: number }) =>
      getBlogPostsByTag(repository, slug, params)
  }
}

export async function createBlogPostDetailUseCase() {
  const supabase = await createClient()
  return createBlogPostDetailService(createSupabaseBlogPostDetailRepository(supabase))
}

export async function createAdminBlogWorkflowUseCases() {
  const supabase = await createClient()
  const repository = createSupabaseBlogPostWorkflowRepository(supabase)

  return {
    createPost: (input: CreateBlogPostData) => createBlogPost(repository, input),
    updatePost: (id: string, input: UpdateBlogPostData) => updateBlogPost(repository, id, input),
    deletePost: (id: string) => deleteBlogPost(repository, id)
  }
}

export function createServiceRoleBlogDetailUseCase() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return createBlogPostDetailService(createSupabaseBlogPostDetailRepository(supabase))
}

export function createServiceRolePublicBlogListingUseCase() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  const repository = createSupabasePublicBlogListingRepository(supabase)

  return (params: BlogSearchParams, options?: { defaultLimit?: number; maxLimit?: number; tagLimit?: number }) =>
    getPublicBlogListing(repository, params, options)
}
