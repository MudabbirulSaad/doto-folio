import { Suspense } from 'react'
import { Metadata } from 'next'

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic'
import { BlogHero } from '@/components/blog/blog-hero'
import { BlogFilters } from '@/components/blog/blog-filters'
import { BlogGrid } from '@/components/blog/blog-grid'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogSkeleton } from '@/components/blog/blog-skeleton'

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts?featured=true&limit=3`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    })

    if (!response.ok) {
      throw new Error('Failed to fetch featured posts')
    }

    const data = await response.json()
    const featuredPosts = data.data?.posts || []

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/categories`, {
      next: { revalidate: 600 } // Revalidate every 10 minutes
    })

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const categoriesData = await response.json()
    const categories = categoriesData.data || []

    // Get popular tags
    const tagsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts?limit=1`, {
      next: { revalidate: 600 }
    })

    const tagsData = await tagsResponse.json()
    const tags = tagsData.data?.tags || []

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
    const params = new URLSearchParams()

    if (resolvedSearchParams.query) params.set('query', resolvedSearchParams.query)
    if (resolvedSearchParams.category) params.set('category', resolvedSearchParams.category)
    if (resolvedSearchParams.tag) params.set('tag', resolvedSearchParams.tag)
    if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page)
    if (resolvedSearchParams.limit) params.set('limit', resolvedSearchParams.limit)

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts?${params.toString()}`, {
      next: { revalidate: 60 } // Revalidate every minute for fresh content
    })

    if (!response.ok) {
      throw new Error('Failed to fetch blog posts')
    }

    const data = await response.json()
    const { posts, total, page, limit, hasMore } = data.data

    return (
      <div className="space-y-8">
        <BlogGrid posts={posts} />
        
        {total > limit && (
          <BlogPagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            hasMore={hasMore}
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
