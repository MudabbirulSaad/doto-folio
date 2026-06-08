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
import {
  createAdminBlogCategory,
  createAdminBlogTag,
  deleteAdminBlogCategory,
  deleteAdminBlogTag,
  getAdminBlogCategory,
  getAdminBlogTag,
  listAdminBlogCategories,
  listAdminBlogTags,
  updateAdminBlogCategory,
  updateAdminBlogTag
} from '@/lib/server/application/blog/admin-blog-taxonomy'
import {
  getAdminBlogPost,
  listAdminBlogPosts
} from '@/lib/server/application/blog/admin-blog-posts'
import { createSupabasePublicBlogListingRepository } from '@/lib/server/adapters/supabase/blog/public-blog-listing-repository'
import { createSupabaseBlogTaxonomyRepository } from '@/lib/server/adapters/supabase/blog/public-blog-taxonomy-repository'
import { createSupabaseBlogPostDetailRepository } from '@/lib/server/adapters/supabase/blog/blog-post-detail-repository'
import { createSupabaseBlogPostWorkflowRepository } from '@/lib/server/adapters/supabase/blog/blog-post-workflow-repository'
import { createSupabaseAdminBlogTaxonomyRepository } from '@/lib/server/adapters/supabase/blog/admin-blog-taxonomy-repository'
import { createSupabaseAdminBlogPostRepository } from '@/lib/server/adapters/supabase/blog/admin-blog-posts-repository'
import type { BlogSearchParams, CreateBlogPostData, UpdateBlogPostData } from '@/lib/types/blog'
import type {
  CreateBlogCategoryData,
  CreateBlogTagData,
  UpdateBlogCategoryData,
  UpdateBlogTagData
} from '@/lib/types/blog'

function createServiceRoleSupabaseClient() {
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

export async function createAdminBlogPostReadUseCases() {
  const supabase = await createClient()
  const repository = createSupabaseAdminBlogPostRepository(supabase)

  return {
    listPosts: (params: { page?: number; limit?: number; status?: string | null; category?: string | null; search?: string | null }) =>
      listAdminBlogPosts(repository, params),
    getPost: (id: string) => getAdminBlogPost(repository, id)
  }
}

export async function createAdminBlogTaxonomyUseCases() {
  const supabase = await createClient()
  const repository = createSupabaseAdminBlogTaxonomyRepository(supabase)

  return {
    listCategories: () => listAdminBlogCategories(repository),
    getCategory: (id: string) => getAdminBlogCategory(repository, id),
    createCategory: (input: CreateBlogCategoryData) => createAdminBlogCategory(repository, input),
    updateCategory: (id: string, input: UpdateBlogCategoryData) => updateAdminBlogCategory(repository, id, input),
    deleteCategory: (id: string) => deleteAdminBlogCategory(repository, id),
    listTags: () => listAdminBlogTags(repository),
    getTag: (id: string) => getAdminBlogTag(repository, id),
    createTag: (input: CreateBlogTagData) => createAdminBlogTag(repository, input),
    updateTag: (id: string, input: UpdateBlogTagData) => updateAdminBlogTag(repository, id, input),
    deleteTag: (id: string) => deleteAdminBlogTag(repository, id)
  }
}

export function createServiceRoleBlogDetailUseCase() {
  const supabase = createServiceRoleSupabaseClient()

  return createBlogPostDetailService(createSupabaseBlogPostDetailRepository(supabase))
}

export function createServiceRolePublicBlogListingUseCase() {
  const supabase = createServiceRoleSupabaseClient()
  const repository = createSupabasePublicBlogListingRepository(supabase)

  return (params: BlogSearchParams, options?: { defaultLimit?: number; maxLimit?: number; tagLimit?: number }) =>
    getPublicBlogListing(repository, params, options)
}

export function createServiceRolePublicBlogTaxonomyUseCases() {
  const repository = createSupabaseBlogTaxonomyRepository(createServiceRoleSupabaseClient())

  return {
    categoriesWithCounts: () => getBlogCategoriesWithCounts(repository),
    postsByCategory: (slug: string, params?: { page?: number; limit?: number }) =>
      getBlogPostsByCategory(repository, slug, params),
    postsByTag: (slug: string, params?: { page?: number; limit?: number }) =>
      getBlogPostsByTag(repository, slug, params)
  }
}
