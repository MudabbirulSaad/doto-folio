import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'

// =============================================
// DATABASE CLIENT FACTORY
// =============================================

export async function getServerClient() {
  return await createClient()
}

export function getAdminClient() {
  return createAdminClient()
}

// =============================================
// QUERY OPTIMIZATION UTILITIES
// =============================================

interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Record<string, any>
}

interface PaginationResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

// =============================================
// OPTIMIZED QUERY BUILDERS
// =============================================

export class OptimizedQueries {
  private supabase: ReturnType<typeof getAdminClient> | null = null

  constructor(useAdmin = false) {
    this.supabase = useAdmin ? getAdminClient() : null
  }

  async init(useAdmin = false) {
    if (!this.supabase) {
      if (useAdmin) {
        this.supabase = getAdminClient()
      } else {
        this.supabase = await getServerClient() as ReturnType<typeof getAdminClient>
      }
    }
  }

  // =============================================
  // SITE CONTENT QUERIES (CACHED)
  // =============================================

  private siteContentCache: Database['public']['Tables']['site_content']['Row'] | null = null
  private siteContentCacheTime = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async getSiteContent(): Promise<Database['public']['Tables']['site_content']['Row'] | null> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.siteContentCache && (now - this.siteContentCacheTime) < this.CACHE_TTL) {
      return this.siteContentCache
    }

    try {
      const { data, error } = await this.supabase
        .from('site_content')
        .select('*')
        .eq('is_published', true)
        .single()

      if (error) throw error

      // Update cache
      this.siteContentCache = data
      this.siteContentCacheTime = now

      return data
    } catch (error) {
      console.error('Error fetching site content:', error)
      return null
    }
  }

  // =============================================
  // PROJECTS QUERIES (OPTIMIZED)
  // =============================================

  async getProjects(options: QueryOptions = {}): Promise<PaginationResult<any>> {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'display_order',
      orderDirection = 'asc',
      filters = {}
    } = options

    try {
      // Build base query with optimized select
      let query = this.supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          status,
          display_order,
          is_featured,
          is_published,
          created_at,
          project_technologies!inner (
            technology_name,
            display_order
          )
        `, { count: 'exact' })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Sort technologies by display_order for each project
      const projectsWithSortedTech = data?.map((project: any) => ({
        ...project,
        project_technologies: project.project_technologies?.sort(
          (a: any, b: any) => a.display_order - b.display_order
        ) || []
      })) || []

      return {
        data: projectsWithSortedTech,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  async getProjectById(id: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          project_technologies (
            id,
            technology_name,
            display_order
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Sort technologies by display_order
      const projectWithSortedTech = {
        ...data,
        project_technologies: data.project_technologies?.sort(
          (a: any, b: any) => a.display_order - b.display_order
        ) || []
      }

      return projectWithSortedTech
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  }

  // =============================================
  // SKILLS QUERIES (OPTIMIZED)
  // =============================================

  private skillsCache: any[] | null = null
  private skillsCacheTime = 0

  async getSkillsWithCategories(): Promise<any[]> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.skillsCache && (now - this.skillsCacheTime) < this.CACHE_TTL) {
      return this.skillsCache
    }

    try {
      const { data, error } = await this.supabase
        .from('skill_categories')
        .select(`
          *,
          skills!inner (
            id,
            name,
            level,
            description,
            display_order,
            is_published
          )
        `)
        .eq('is_published', true)
        .eq('skills.is_published', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Sort skills within each category
      const categoriesWithSortedSkills = data?.map((category: any) => ({
        ...category,
        skills: category.skills?.sort(
          (a: any, b: any) => a.display_order - b.display_order
        ) || []
      })) || []

      // Update cache
      this.skillsCache = categoriesWithSortedSkills
      this.skillsCacheTime = now

      return categoriesWithSortedSkills
    } catch (error) {
      console.error('Error fetching skills:', error)
      throw error
    }
  }

  // =============================================
  // CONTACT SUBMISSIONS QUERIES (OPTIMIZED)
  // =============================================

  async getContactSubmissions(options: QueryOptions = {}): Promise<PaginationResult<any>> {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc',
      filters = {}
    } = options

    try {
      let query = this.supabase
        .from('contact_submissions')
        .select('*', { count: 'exact' })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'search') {
            // Full-text search across multiple fields
            query = query.or(`name.ilike.%${value}%,email.ilike.%${value}%,subject.ilike.%${value}%`)
          } else if (key === 'dateRange') {
            const { start, end } = value
            if (start) query = query.gte('created_at', start)
            if (end) query = query.lte('created_at', end)
          } else {
            query = query.eq(key, value)
          }
        }
      })

      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      console.error('Error fetching contact submissions:', error)
      throw error
    }
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  async batchUpdateProjects(updates: Array<{ id: string; data: any }>): Promise<void> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.supabase
          .from('projects')
          .update(data)
          .eq('id', id)
      )

      await Promise.all(promises)
    } catch (error) {
      console.error('Error in batch update projects:', error)
      throw error
    }
  }

  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  clearCache(): void {
    this.siteContentCache = null
    this.siteContentCacheTime = 0
    this.skillsCache = null
    this.skillsCacheTime = 0
  }

  // =============================================
  // HEALTH CHECK
  // =============================================

  async healthCheck(): Promise<boolean> {
    try {
      // Ensure we have a client
      if (!this.supabase) {
        await this.init(true)
      }

      const { error } = await this.supabase
        .from('site_content')
        .select('id')
        .limit(1)

      return !error
    } catch (err) {
      console.error('Database health check failed:', err)
      return false
    }
  }
}

// =============================================
// SINGLETON INSTANCE
// =============================================

export const optimizedQueries = new OptimizedQueries()
