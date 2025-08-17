'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface BlogSkeletonProps {
  variant: 'hero' | 'filters' | 'grid' | 'post' | 'card'
  count?: number
}

export function BlogSkeleton({ variant, count = 6 }: BlogSkeletonProps) {
  if (variant === 'hero') {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Skeleton className="h-16 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
            <Skeleton className="h-12 w-96 mx-auto" />
            <div className="flex justify-center gap-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <div className="mt-16">
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {Array.from({ length: 3 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'filters') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (variant === 'post') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <Skeleton className="h-64 md:h-96 w-full rounded-lg" />

        {/* Content */}
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        {/* Related Posts */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return <BlogCardSkeleton />
  }

  return null
}

function BlogCardSkeleton() {
  return (
    <Card className="h-full">
      <div className="aspect-[16/10] relative overflow-hidden rounded-t-lg">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-6 w-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
