'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { Search, Filter, X, Tag, Folder, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BlogFilterProps } from '@/lib/types/blog'

export function BlogFilters({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  className = ''
}: Omit<BlogFilterProps, 'onCategoryChange' | 'onTagChange' | 'onSearch'>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const filtersRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const filters = filtersRef.current
    const search = searchRef.current

    if (!filters || !search) return

    // Initial animation
    gsap.fromTo([search, filters], 
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.6, 
        ease: 'power2.out',
        stagger: 0.1,
        delay: 0.3
      }
    )
  }, [])

  useEffect(() => {
    // Sync with URL params
    const query = searchParams.get('query') || ''
    setSearchQuery(query)
  }, [searchParams])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateURL({ query: searchQuery })
  }

  const handleCategorySelect = (categorySlug: string) => {
    const newCategory = categorySlug === 'all' ? undefined : categorySlug
    updateURL({ category: newCategory })
  }

  const handleTagSelect = (tagSlug: string) => {
    const newTag = tagSlug === selectedTag ? undefined : tagSlug
    updateURL({ tag: newTag })
  }

  const updateURL = (params: { query?: string; category?: string; tag?: string }) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        current.set(key, value)
      } else {
        current.delete(key)
      }
    })

    // Reset page when filters change
    current.delete('page')

    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`/blog${query}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    router.push('/blog')
  }

  const hasActiveFilters = selectedCategory || selectedTag || searchQuery

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Search Bar */}
      <div ref={searchRef} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Search & Filter Articles</h3>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-36 py-4 text-base bg-background/90 border-border/60 focus:border-primary/60 focus:bg-background transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
              <Button type="submit" size="sm" className="h-9 px-4 rounded-lg">
                Search
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 px-4 rounded-lg"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {categories.length} Categories
          </span>
          <span className="flex items-center gap-1">
            <Tag className="w-4 h-4" />
            {tags.length} Tags
          </span>
        </div>
      </div>

      {/* Filters Panel */}
      <div ref={filtersRef}>
        {(showFilters || hasActiveFilters) && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 space-y-4">
              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                  
                  {selectedCategory && (
                    <Badge variant="secondary" className="gap-1">
                      <Folder className="w-3 h-3" />
                      {categories.find(c => c.slug === selectedCategory)?.name}
                      <button
                        onClick={() => handleCategorySelect('all')}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {selectedTag && (
                    <Badge variant="secondary" className="gap-1">
                      <Tag className="w-3 h-3" />
                      {tags.find(t => t.slug === selectedTag)?.name}
                      <button
                        onClick={() => handleTagSelect(selectedTag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="w-3 h-3" />
                      &quot;{searchQuery}&quot;
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          updateURL({ query: undefined })
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Category
                  </label>
                  <Select value={selectedCategory || 'all'} onValueChange={handleCategorySelect}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Popular Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 8).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTag === tag.slug ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => handleTagSelect(tag.slug)}
                      >
                        {tag.name}
                        <span className="ml-1 text-xs opacity-70">
                          {tag.usage_count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
