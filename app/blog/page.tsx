import { Metadata } from 'next'

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { SectionNebula } from '@/components/section-nebula'
import { BlogHero } from '@/components/blog/blog-hero'
import { BlogFilters } from '@/components/blog/blog-filters'
import { BlogGrid } from '@/components/blog/blog-grid'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { createServiceRolePublicBlogListingUseCase, createServiceRolePublicBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import type { BlogCategory, BlogPost, BlogSearchParams, BlogTag } from '@/lib/types/blog'

export const metadata: Metadata = {
  title: 'Blog & Insights | SAAD Portfolio',
  description: 'Exploring AI, technology trends, and development insights through detailed articles and tutorials by Mudabbirul Saad.',
  openGraph: {
    title: 'Blog & Insights | SAAD Portfolio',
    description: 'Exploring AI, technology trends, and development insights through detailed articles and tutorials.',
    type: 'website',
    url: '/blog'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Insights | SAAD Portfolio',
    description: 'Exploring AI, technology trends, and development insights through detailed articles and tutorials.'
  }
}

async function getFeaturedPosts(limit: number) {
  const getBlogListing = createServiceRolePublicBlogListingUseCase()
  const result = await getBlogListing({
    featured: true,
    page: 1,
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc'
  }, { defaultLimit: limit, maxLimit: limit })
  return result.posts
}

async function getCategories() {
  return createServiceRolePublicBlogTaxonomyUseCases().categoriesWithCounts()
}

async function getPopularTags(limit: number) {
  const getBlogListing = createServiceRolePublicBlogListingUseCase()
  const result = await getBlogListing({}, { tagLimit: limit })
  return result.tags
}

async function getBlogPosts(options: {
  search?: string
  category?: string
  tag?: string
  page?: number
  limit?: number
  featured?: boolean
  sortBy?: BlogSearchParams['sortBy']
  sortOrder?: BlogSearchParams['sortOrder']
}) {
  const getBlogListing = createServiceRolePublicBlogListingUseCase()
  const result = await getBlogListing({
    query: options.search,
    category: options.category,
    tag: options.tag,
    featured: options.featured,
    page: options.page || 1,
    limit: options.limit || 12,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder
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
}

interface BlogPageProps {
  searchParams: Promise<{
    query?: string
    category?: string
    tag?: string
    featured?: string
    page?: string
    limit?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden z-0">
      <SectionNebula />
      {/* Hero Section */}
      <BlogHeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Filters */}
          <div id="featured">
            <BlogFiltersSection searchParams={searchParams} />
          </div>

          {/* Blog Grid */}
          <div id="latest">
            <BlogGridSection searchParams={searchParams} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Hero Section Component
async function BlogHeroSection() {
  let featuredPosts: BlogPost[] = []

  try {
    featuredPosts = await getFeaturedPosts(3)
  } catch (error) {
    console.error('Error fetching featured posts:', error)
  }

  return (
    <BlogHero
      title="Blog & Insights"
      description="Exploring AI, technology trends, and development insights through detailed articles and tutorials."
      featuredPosts={featuredPosts}
    />
  )
}

// Filters Section Component
async function BlogFiltersSection({ searchParams }: { searchParams: BlogPageProps['searchParams'] }) {
  const resolvedSearchParams = await searchParams
  let categories: BlogCategory[] = []
  let tags: BlogTag[] = []

  try {
    categories = await getCategories()
    tags = await getPopularTags(10)
  } catch (error) {
    console.error('Error fetching filters data:', error)
  }

  return (
    <BlogFilters
      categories={categories}
      tags={tags}
      selectedCategory={resolvedSearchParams.category}
      selectedTag={resolvedSearchParams.tag}
    />
  )
}

// Blog Grid Section Component
async function BlogGridSection({ searchParams }: { searchParams: BlogPageProps['searchParams'] }) {
  let posts: BlogPost[] = []
  let pagination = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  }
  let loadError = false

  try {
    const resolvedSearchParams = await searchParams

    const options = {
      search: resolvedSearchParams.query,
      category: resolvedSearchParams.category,
      tag: resolvedSearchParams.tag,
      featured: resolvedSearchParams.featured === 'true' ? true : undefined,
      page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
      limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 12,
      sortBy: resolvedSearchParams.sortBy as BlogSearchParams['sortBy'] | undefined,
      sortOrder: resolvedSearchParams.sortOrder as BlogSearchParams['sortOrder'] | undefined
    }

    const result = await getBlogPosts(options)
    posts = result.posts
    pagination = result.pagination
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    loadError = true
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Unable to load blog posts at the moment. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <BlogGrid posts={posts} />

      {pagination.total > pagination.limit && (
        <BlogPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasMore={pagination.page < pagination.totalPages}
        />
      )}
    </div>
  )
}
