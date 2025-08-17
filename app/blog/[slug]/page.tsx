import { Metadata } from 'next'

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BlogPostHeader } from '@/components/blog/blog-post-header'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import { BlogPostSidebar } from '@/components/blog/blog-post-sidebar'
import { BlogRelatedPosts } from '@/components/blog/blog-related-posts'
import { BlogSkeleton } from '@/components/blog/blog-skeleton'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { BlogServerData } from '@/lib/data/blog-server'

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
    const post = await BlogServerData.getBlogPost(resolvedParams.slug)

    if (!post) {
      return {
        title: 'Post Not Found | SAAD Portfolio',
        description: 'The requested blog post could not be found.'
      }
    }

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
    const post = await BlogServerData.getBlogPost(resolvedParams.slug)

    if (!post) {
      notFound()
    }

    // For now, get related posts by category (we can implement AI recommendations later)
    let relatedPosts = []
    try {
      const categoryPosts = await BlogServerData.getBlogPosts({
        category: post.blog_categories?.slug,
        limit: 4
      })
      relatedPosts = categoryPosts.posts.filter(p => p.id !== post.id).slice(0, 3)
    } catch (error) {
      console.error('Failed to fetch related posts:', error)
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

// Removed generateStaticParams to ensure dynamic rendering
// This allows real-time view counts, new posts, and dynamic content
