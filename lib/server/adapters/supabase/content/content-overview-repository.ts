import type {
  AdminContentOverviewRepository
} from '@/lib/server/application/content/content-overview'

async function countTable(
  supabase: any,
  table: string,
  options: { publishedOnly?: boolean } = {}
) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })

  if (options.publishedOnly) {
    query = query.eq('is_published', true)
  }

  const { count } = await query
  return count || 0
}

export function createSupabaseAdminContentOverviewRepository(supabase: any): AdminContentOverviewRepository {
  return {
    async getPublishedCounts() {
      const [
        projectsCount,
        skillsCount,
        contactMethodsCount,
        socialLinksCount,
        commentsCount
      ] = await Promise.all([
        countTable(supabase, 'projects', { publishedOnly: true }),
        countTable(supabase, 'skills', { publishedOnly: true }),
        countTable(supabase, 'contact_methods', { publishedOnly: true }),
        countTable(supabase, 'social_links', { publishedOnly: true }),
        countTable(supabase, 'blog_comments')
      ])

      return {
        projectsCount,
        skillsCount,
        contactMethodsCount,
        socialLinksCount,
        commentsCount
      }
    },

    async isSiteContentPublished() {
      const { data } = await supabase
        .from('site_content')
        .select('is_published')
        .single()

      return data?.is_published || false
    }
  }
}
