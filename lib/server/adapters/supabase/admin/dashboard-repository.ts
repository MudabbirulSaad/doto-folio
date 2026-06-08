import type {
  AdminDashboardRepository,
  DashboardAuthor
} from '@/lib/server/application/admin/dashboard'

async function countTable(supabase: any, table: string) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count || 0
}

export function createSupabaseAdminDashboardRepository(
  supabase: any,
  adminClient: any
): AdminDashboardRepository {
  return {
    async getCounts() {
      const [totalComments, totalSubmissions, totalProjects] = await Promise.all([
        countTable(supabase, 'blog_comments'),
        countTable(supabase, 'contact_submissions'),
        countTable(supabase, 'projects')
      ])

      return {
        totalComments,
        totalSubmissions,
        totalProjects
      }
    },

    async getPostViewCounts() {
      const { data } = await supabase.from('blog_posts').select('view_count')
      return (data || []).map((post: any) => post.view_count)
    },

    async listRecentComments() {
      const { data } = await supabase
        .from('blog_comments')
        .select('*, post:blog_posts(title, slug)')
        .order('created_at', { ascending: false })
        .limit(5)

      return data || []
    },

    async listRecentSubmissions() {
      const { data } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      return data || []
    },

    async listCommentAuthors() {
      const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })

      return (users || []).map((user: any): DashboardAuthor => ({
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        avatar: user.user_metadata?.avatar_url
      }))
    },

    async listAllCommentUserIds() {
      const { data } = await supabase.from('blog_comments').select('user_id')
      return (data || []).map((comment: any) => comment.user_id)
    },

    async listActivitySince(since) {
      const [viewsResult, commentsResult] = await Promise.all([
        supabase
          .from('blog_views')
          .select('created_at')
          .gte('created_at', since.toISOString()),
        supabase
          .from('blog_comments')
          .select('created_at')
          .gte('created_at', since.toISOString())
      ])

      return {
        views: viewsResult.data || [],
        comments: commentsResult.data || []
      }
    }
  }
}
