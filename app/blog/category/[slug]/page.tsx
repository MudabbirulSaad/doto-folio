import { Metadata } from 'next'

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlogGrid } from '@/components/blog/blog-grid'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogSkeleton } from '@/components/blog/blog-skeleton'
import type { BlogCategoryResponse } from '@/lib/types/blog'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    page?: string
    limit?: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/categories/${resolvedParams.slug}`, {
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      return {
        title: 'Category Not Found | SAAD Portfolio',
        description: 'The requested blog category could not be found.'
      }
    }

    const data = await response.json()
    const categoryData: BlogCategoryResponse = data.data
    const category = categoryData.category

    return {
      title: `${category.name} Articles | SAAD Portfolio`,
      description: category.description || `Browse all articles in the ${category.name} category. Insights on AI, technology, and development.`,
      openGraph: {
        title: `${category.name} Articles`,
        description: category.description || `Browse all articles in the ${category.name} category.`,
        type: 'website',
        url: `/blog/category/${category.slug}`
      },
      twitter: {
        card: 'summary',
        title: `${category.name} Articles`,
        description: category.description || `Browse all articles in the ${category.name} category.`
      },
      alternates: {
        canonical: `/blog/category/${category.slug}`
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Blog Category | SAAD Portfolio',
      description: 'Browse articles by category on AI, technology, and development.'
    }
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  try {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const page = parseInt(resolvedSearchParams.page || '1')
    const limit = Math.min(parseInt(resolvedSearchParams.limit || '12'), 50)

    const queryParams = new URLSearchParams()
    queryParams.set('page', page.toString())
    queryParams.set('limit', limit.toString())

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/categories/${resolvedParams.slug}?${queryParams.toString()}`, {
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      notFound()
    }

    const data = await response.json()
    const categoryData: BlogCategoryResponse = data.data
    const { category, posts, total, hasMore } = categoryData

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="space-y-6 mb-12">
              {/* Back Button */}
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Button>
              </Link>

              {/* Category Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Folder className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-lg px-4 py-2"
                    style={{ 
                      backgroundColor: `${category.color}20`, 
                      color: category.color,
                      borderColor: `${category.color}30`
                    }}
                  >
                    {category.name}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    {category.name} Articles
                  </h1>
                  {category.description && (
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {total} {total === 1 ? 'article' : 'articles'} in this category
                  </p>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <Suspense fallback={<BlogSkeleton variant="grid" count={12} />}>
              <div className="space-y-8">
                {posts.length > 0 ? (
                  <>
                    <BlogGrid posts={posts} />
                    
                    {total > limit && (
                      <BlogPagination
                        currentPage={page}
                        totalPages={Math.ceil(total / limit)}
                        hasMore={hasMore}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                        <Folder className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">No articles yet</h3>
                      <p className="text-muted-foreground">
                        There are no published articles in the {category.name} category yet. Check back soon!
                      </p>
                      <Link href="/blog">
                        <Button>Browse All Articles</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading category page:', error)
    notFound()
  }
}

// Generate static params for categories (optional optimization)
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/categories`)
    
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const categories = data.data || []

    return categories.map((category: any) => ({
      slug: category.slug
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}
