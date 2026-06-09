import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type {
  AdminDashboardRepository,
  DashboardActivityRecord,
  DashboardAuthor,
  DashboardRecentComment,
  DashboardRecentSubmission
} from '@/lib/server/application/admin/dashboard'

interface DashboardAdminUser {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface DashboardPostViewRow {
  view_count: number | null
}

interface DashboardCommentUserRow {
  user_id: string | null
}

type DashboardAdminClient = SupabaseDataClient & {
  auth: SupabaseAuthClient & {
    admin: NonNullable<SupabaseAuthClient['admin']>
  }
}

async function countTable(supabase: SupabaseDataClient, table: string) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count || 0
}

export function createSupabaseAdminDashboardRepository(
  supabase: SupabaseDataClient,
  adminClient: DashboardAdminClient
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
      const { data } = await supabase.from('blog_posts').select('view_count') as {
        data: DashboardPostViewRow[] | null
      }
      return (data || []).map(post => post.view_count)
    },

    async listRecentComments() {
      const { data } = await supabase
        .from('blog_comments')
        .select('*, post:blog_posts(title, slug)')
        .order('created_at', { ascending: false })
        .limit(5) as { data: DashboardRecentComment[] | null }

      return data || []
    },

    async listRecentSubmissions() {
      const { data } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5) as { data: DashboardRecentSubmission[] | null }

      return data || []
    },

    async listCommentAuthors() {
      const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const users = (data?.users || []) as DashboardAdminUser[]

      return (users || []).map((user): DashboardAuthor => ({
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        avatar: user.user_metadata?.avatar_url
      }))
    },

    async listAllCommentUserIds() {
      const { data } = await supabase.from('blog_comments').select('user_id') as {
        data: DashboardCommentUserRow[] | null
      }
      return (data || []).map(comment => comment.user_id)
    },

    async listActivitySince(since) {
      const viewsResult = await supabase
        .from('blog_views')
        .select('created_at')
        .gte('created_at', since.toISOString()) as { data: DashboardActivityRecord[] | null }
      const commentsResult = await supabase
        .from('blog_comments')
        .select('created_at')
        .gte('created_at', since.toISOString()) as { data: DashboardActivityRecord[] | null }

      return {
        views: viewsResult.data || [],
        comments: commentsResult.data || []
      }
    }
  }
}
