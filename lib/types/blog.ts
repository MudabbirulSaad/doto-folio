// Blog System Types
// Comprehensive type definitions for the blog system

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
  post_count?: number // Computed field for category pages
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  description?: string
  usage_count: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image?: string
  featured_image_alt?: string
  
  // SEO Fields
  meta_title?: string
  meta_description?: string
  
  // Author Information
  author_name: string
  author_bio: string
  author_avatar?: string
  
  // Status & Visibility
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  
  // Engagement Metrics
  view_count: number
  reading_time: number
  
  // Timestamps
  published_at?: string
  created_at: string
  updated_at: string
  
  // Relationships
  category_id?: string
  category?: BlogCategory
  tags?: BlogTag[]
}

export interface BlogPostWithRelations extends BlogPost {
  category: BlogCategory | null
  tags: BlogTag[]
}

export interface BlogView {
  id: string
  post_id: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  viewed_at: string
}

// API Response Types
export interface BlogPostsResponse {
  posts: BlogPost[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  categories: BlogCategory[]
  tags: BlogTag[]
}

export interface BlogPostResponse {
  post: BlogPostWithRelations
  relatedPosts: BlogPost[]
}

export interface BlogCategoryResponse {
  category: BlogCategory
  posts: BlogPost[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface BlogTagResponse {
  tag: BlogTag
  posts: BlogPost[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Search and Filter Types
export interface BlogSearchParams {
  query?: string
  category?: string
  tag?: string
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
  page?: number
  limit?: number
  sortBy?: 'published_at' | 'created_at' | 'updated_at' | 'view_count' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface BlogFilters {
  categories: BlogCategory[]
  tags: BlogTag[]
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  featuredPosts: number
}

// Form Types for Admin
export interface CreateBlogPostData {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image?: string
  featured_image_alt?: string
  meta_title?: string
  meta_description?: string
  category_id?: string
  tag_ids: string[]
  status: 'draft' | 'published'
  featured: boolean
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string
}

export interface CreateBlogCategoryData {
  name: string
  slug: string
  description?: string
  color: string
  display_order: number
}

export interface UpdateBlogCategoryData extends Partial<CreateBlogCategoryData> {
  id: string
}

export interface CreateBlogTagData {
  name: string
  slug: string
  description?: string
}

export interface UpdateBlogTagData extends Partial<CreateBlogTagData> {
  id: string
}

// Utility Types
export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  totalCategories: number
  totalTags: number
  averageReadingTime: number
  mostViewedPost?: BlogPost
  mostRecentPost?: BlogPost
  topCategories: Array<BlogCategory & { post_count: number }>
  topTags: Array<BlogTag & { post_count: number }>
}

export interface BlogSEOData {
  title: string
  description: string
  canonical: string
  openGraph: {
    title: string
    description: string
    image?: string
    type: 'article' | 'website'
    publishedTime?: string
    modifiedTime?: string
    author?: string
    section?: string
    tags?: string[]
  }
  twitter: {
    card: 'summary' | 'summary_large_image'
    title: string
    description: string
    image?: string
  }
  jsonLd: Record<string, unknown>
}

// Component Props Types
export interface BlogCardProps {
  post: BlogPost
  variant?: 'default' | 'featured' | 'compact'
  showCategory?: boolean
  showTags?: boolean
  showAuthor?: boolean
  showReadingTime?: boolean
  className?: string
}

export interface BlogHeroProps {
  title: string
  description: string
  featuredPosts?: BlogPost[]
  className?: string
}

export interface BlogFilterProps {
  categories: BlogCategory[]
  tags: BlogTag[]
  selectedCategory?: string
  selectedTag?: string
  onCategoryChange: (category: string | undefined) => void
  onTagChange: (tag: string | undefined) => void
  onSearch: (query: string) => void
  className?: string
}

export interface BlogPaginationProps {
  currentPage: number
  totalPages: number
  hasMore: boolean
  onPageChange: (page: number) => void
  className?: string
}

// Animation and UI Types
export interface BlogAnimationConfig {
  stagger: number
  duration: number
  ease: string
  delay: number
}

export interface BlogTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
}

// Reading Progress Types
export interface ReadingProgress {
  progress: number
  timeRemaining: number
  wordsRead: number
  totalWords: number
}

// Table of Contents Types
export interface TOCItem {
  id: string
  title: string
  level: number
  children?: TOCItem[]
}

export interface TableOfContents {
  items: TOCItem[]
  activeId?: string
}
