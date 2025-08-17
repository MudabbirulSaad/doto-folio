import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlogGrid } from '@/components/blog/blog-grid'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogSkeleton } from '@/components/blog/blog-skeleton'
import type { BlogTagResponse } from '@/lib/types/blog'

interface TagPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    page?: string
    limit?: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/tags/${resolvedParams.slug}`, {
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      return {
        title: 'Tag Not Found | SAAD Portfolio',
        description: 'The requested blog tag could not be found.'
      }
    }

    const data = await response.json()
    const tagData: BlogTagResponse = data.data
    const tag = tagData.tag

    return {
      title: `#${tag.name} Articles | SAAD Portfolio`,
      description: tag.description || `Browse all articles tagged with #${tag.name}. Insights on AI, technology, and development.`,
      openGraph: {
        title: `#${tag.name} Articles`,
        description: tag.description || `Browse all articles tagged with #${tag.name}.`,
        type: 'website',
        url: `/blog/tag/${tag.slug}`
      },
      twitter: {
        card: 'summary',
        title: `#${tag.name} Articles`,
        description: tag.description || `Browse all articles tagged with #${tag.name}.`
      },
      alternates: {
        canonical: `/blog/tag/${tag.slug}`
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Blog Tag | SAAD Portfolio',
      description: 'Browse articles by tag on AI, technology, and development.'
    }
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  try {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const page = parseInt(resolvedSearchParams.page || '1')
    const limit = Math.min(parseInt(resolvedSearchParams.limit || '12'), 50)

    const queryParams = new URLSearchParams()
    queryParams.set('page', page.toString())
    queryParams.set('limit', limit.toString())

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/tags/${resolvedParams.slug}?${queryParams.toString()}`, {
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      notFound()
    }

    const data = await response.json()
    const tagData: BlogTagResponse = data.data
    const { tag, posts, total, hasMore } = tagData

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

              {/* Tag Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Tag className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    #{tag.name}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Articles tagged with #{tag.name}
                  </h1>
                  {tag.description && (
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      {tag.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {total} {total === 1 ? 'article' : 'articles'} with this tag
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
                        <Tag className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">No articles yet</h3>
                      <p className="text-muted-foreground">
                        There are no published articles tagged with #{tag.name} yet. Check back soon!
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
    console.error('Error loading tag page:', error)
    notFound()
  }
}
