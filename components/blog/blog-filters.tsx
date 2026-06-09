'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { Search, Filter, X, Tag, Folder, BookOpen, ChevronDown } from 'lucide-react'
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
// import { useDebounce } from '@/lib/hooks/use-debounce' // Assuming this hook exists or I'll implement a simple one inside

export function BlogFilters({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  className = ''
}: Omit<BlogFilterProps, 'onCategoryChange' | 'onTagChange' | 'onSearch'>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('query') || ''
  const searchParamsSnapshot = searchParams.toString()
  const containerRef = useRef<HTMLDivElement>(null)
  const filtersContentRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function updateURL(params: { query?: string; category?: string; tag?: string }) {
    startTransition(() => {
      const current = new URLSearchParams(searchParamsSnapshot)

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

      // Keep query changes shareable without triggering navigation-style page transitions.
      router.replace(`/blog${query}`, { scroll: false })
    })
  }

  useEffect(() => {
    // Sync with URL params only when the query value changes.
    setSearchQuery((value) => value === currentQuery ? value : currentQuery)
    setDebouncedQuery((value) => value === currentQuery ? value : currentQuery)
  }, [currentQuery])

  useEffect(() => {
    // Effect for debounced search update
    if (debouncedQuery !== currentQuery) {
      updateURL({ query: debouncedQuery })
    }
  }, [debouncedQuery, currentQuery])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    gsap.fromTo(container,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.3
      }
    )
  }, [])

  // Animate filters expansion
  useEffect(() => {
    const content = filtersContentRef.current
    if (!content) return

    if (showFilters) {
      gsap.to(content, {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
      })
    } else {
      gsap.to(content, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      })
    }
  }, [showFilters])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Trigger immediate update on enter
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

  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedQuery('')
    startTransition(() => {
      router.replace('/blog', { scroll: false })
    })
  }

  const hasActiveFilters = selectedCategory || selectedTag || searchQuery

  return (
    <div ref={containerRef} className={`relative z-20 ${className}`}>
      {/* Unified Glass Container */}
      <div className="bg-background/5 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300 rounded-2xl overflow-hidden shadow-[0_0_20px_-10px_rgba(var(--primary),0.1)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.2)]">

        {/* Top Section: Search & Toggle */}
        <div className="p-2">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-32 py-6 text-lg bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />

            <div className="absolute right-2 flex items-center gap-2">
              {isPending && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              )}
              <Button
                type="button"
                variant={showFilters ? "secondary" : "ghost"}
                size="sm"
                className={`h-9 px-4 rounded-xl transition-all ${showFilters ? 'bg-primary/10 text-primary' : 'hover:bg-white/5'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-3 h-3 ml-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </form>
        </div>

        {/* Expandable Filters Section */}
        <div ref={filtersContentRef} className="h-0 opacity-0 overflow-hidden">
          <div className="p-6 pt-0 border-t border-white/5 space-y-6">

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap pt-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active:</span>

                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                    <Folder className="w-3 h-3" />
                    {categories.find(c => c.slug === selectedCategory)?.name}
                    <button onClick={() => handleCategorySelect('all')} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {selectedTag && (
                  <Badge variant="secondary" className="gap-1 bg-secondary/10 text-secondary-foreground border-secondary/20">
                    <Tag className="w-3 h-3" />
                    {tags.find(t => t.slug === selectedTag)?.name}
                    <button onClick={() => handleTagSelect(selectedTag)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Categories */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  Browse by Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className={`text-sm text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.slug)}
                      className={`text-sm text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${selectedCategory === category.slug
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-secondary" />
                  Popular Topics
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 12).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTag === tag.slug ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${selectedTag === tag.slug
                          ? 'bg-primary hover:bg-primary/90'
                          : 'border-white/10 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      onClick={() => handleTagSelect(tag.slug)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
