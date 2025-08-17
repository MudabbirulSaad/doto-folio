import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BlogPostHeader } from '@/components/blog/blog-post-header'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import { BlogPostSidebar } from '@/components/blog/blog-post-sidebar'
import { BlogRelatedPosts } from '@/components/blog/blog-related-posts'
import { BlogSkeleton } from '@/components/blog/blog-skeleton'
import { TableOfContents } from '@/components/blog/table-of-contents'

import type { BlogPostWithRelations } from '@/lib/types/blog'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts/${resolvedParams.slug}`, {
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      return {
        title: 'Post Not Found | SAAD Portfolio',
        description: 'The requested blog post could not be found.'
      }
    }

    const data = await response.json()
    const post: BlogPostWithRelations = data.data.post

    const title = post.meta_title || post.title
    const description = post.meta_description || post.excerpt
    const publishedTime = post.published_at || post.created_at
    const modifiedTime = post.updated_at

    return {
      title: `${title} | SAAD Portfolio`,
      description,
      authors: [{ name: post.author_name }],
      openGraph: {
        title,
        description,
        type: 'article',
        url: `/blog/${post.slug}`,
        publishedTime,
        modifiedTime,
        authors: [post.author_name],
        section: post.category?.name,
        tags: post.tags?.map(tag => tag.name),
        images: post.featured_image ? [
          {
            url: post.featured_image,
            alt: post.featured_image_alt || post.title,
            width: 1200,
            height: 630
          }
        ] : undefined
      },
      twitter: {
        card: post.featured_image ? 'summary_large_image' : 'summary',
        title,
        description,
        images: post.featured_image ? [post.featured_image] : undefined
      },
      alternates: {
        canonical: `/blog/${post.slug}`
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Blog Post | SAAD Portfolio',
      description: 'Read the latest insights on AI, technology, and development.'
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const resolvedParams = await params
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts/${resolvedParams.slug}`, {
      next: { revalidate: 60 } // Revalidate every minute for view counts
    })

    if (!response.ok) {
      notFound()
    }

    const data = await response.json()
    const { post } = data.data

    // Fetch AI-powered recommendations
    let relatedPosts = []
    try {
      const recResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts/${resolvedParams.slug}/recommendations`, {
        next: { revalidate: 300 } // Cache for 5 minutes
      })

      if (recResponse.ok) {
        const recData = await recResponse.json()
        relatedPosts = recData.data?.recommendations || []
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      // Fallback to empty array - component will handle gracefully
    }

    return (
      <div className="min-h-screen bg-background">
        <article className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Post Header */}
            <Suspense fallback={<BlogSkeleton variant="post" />}>
              <BlogPostHeader post={post} />
            </Suspense>

            {/* Mobile TOC - Show only on mobile */}
            <div className="lg:hidden my-8">
              <Suspense fallback={<div className="h-64 bg-muted rounded-lg animate-pulse" />}>
                <TableOfContents content={post.content} />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Suspense fallback={<BlogSkeleton variant="post" />}>
                  <BlogPostContent post={post} />
                </Suspense>
              </div>

              {/* Desktop Sidebar - Show only on desktop */}
              <div className="hidden lg:block lg:col-span-1">
                <Suspense fallback={<div className="space-y-4">
                  <div className="h-64 bg-muted rounded-lg animate-pulse" />
                  <div className="h-32 bg-muted rounded-lg animate-pulse" />
                </div>}>
                  <BlogPostSidebar post={post} />
                </Suspense>
              </div>
            </div>



            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
              <div className="mt-16">
                <Suspense fallback={<BlogSkeleton variant="grid" count={3} />}>
                  <BlogRelatedPosts posts={relatedPosts} />
                </Suspense>
              </div>
            )}
          </div>
        </article>
      </div>
    )
  } catch (error) {
    console.error('Error loading blog post:', error)
    notFound()
  }
}

// Generate static params for popular posts (optional optimization)
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts?limit=10&sortBy=view_count&sortOrder=desc`)
    
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const posts = data.data?.posts || []

    return posts.map((post: any) => ({
      slug: post.slug
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}
