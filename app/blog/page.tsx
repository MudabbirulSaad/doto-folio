import { Suspense } from 'react'
import { Metadata } from 'next'

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { BlogHero } from '@/components/blog/blog-hero'
import { BlogFilters } from '@/components/blog/blog-filters'
import { BlogGrid } from '@/components/blog/blog-grid'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogSkeleton } from '@/components/blog/blog-skeleton'
import { BlogServerData } from '@/lib/data/blog-server'
import type { BlogPost, BlogCategory, BlogTag } from '@/lib/types/blog'

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

interface BlogPageProps {
  searchParams: Promise<{
    query?: string
    category?: string
    tag?: string
    page?: string
    limit?: string
  }>
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Suspense fallback={<BlogSkeleton variant="hero" />}>
        <BlogHeroSection />
      </Suspense>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Filters */}
          <div id="featured">
            <Suspense fallback={<BlogSkeleton variant="filters" />}>
              <BlogFiltersSection searchParams={searchParams} />
            </Suspense>
          </div>

          {/* Blog Grid */}
          <div id="latest">
            <Suspense fallback={<BlogSkeleton variant="grid" />}>
              <BlogGridSection searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hero Section Component
async function BlogHeroSection() {
  try {
    const featuredPosts = await BlogServerData.getFeaturedPosts(3)

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
    const categories = await BlogServerData.getCategories()
    const tags = await BlogServerData.getPopularTags(10)

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
      page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
      limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 10
    }

    const result = await BlogServerData.getBlogPosts(options)
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
