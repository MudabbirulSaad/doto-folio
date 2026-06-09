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
import type { BlogSearchParams } from '@/lib/types/blog'

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
  try {
    const featuredPosts = await getFeaturedPosts(3)

    return (
      <BlogHero
        title="Blog & Insights"
        description="Exploring AI, technology trends, and development insights through detailed articles and tutorials."
        featuredPosts={featuredPosts}
      />
    )
  } catch (error) {
    console.error('Error fetching featured posts:', error)
    return (
      <BlogHero
        title="Blog & Insights"
        description="Exploring AI, technology trends, and development insights through detailed articles and tutorials."
        featuredPosts={[]}
      />
    )
  }
}

// Filters Section Component
async function BlogFiltersSection({ searchParams }: { searchParams: BlogPageProps['searchParams'] }) {
  const resolvedSearchParams = await searchParams
  try {
    const categories = await getCategories()
    const tags = await getPopularTags(10)

    return (
      <BlogFilters
        categories={categories}
        tags={tags}
        selectedCategory={resolvedSearchParams.category}
        selectedTag={resolvedSearchParams.tag}
      />
    )
  } catch (error) {
    console.error('Error fetching filters data:', error)
    return (
      <BlogFilters
        categories={[]}
        tags={[]}
        selectedCategory={undefined}
        selectedTag={undefined}
      />
    )
  }
}

// Blog Grid Section Component
async function BlogGridSection({ searchParams }: { searchParams: BlogPageProps['searchParams'] }) {
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
    const { posts, pagination } = result

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
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Unable to load blog posts at the moment. Please try again later.
        </p>
      </div>
    )
  }
}
