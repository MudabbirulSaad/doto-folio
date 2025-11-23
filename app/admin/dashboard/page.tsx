import { requireAdminAuth } from '@/lib/auth/server'

// Force dynamic rendering for admin pages that use authentication
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import {
  MessageSquare,
  Clock,
  User,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardStats } from './components/dashboard-stats'
import { ActivityChart } from './components/activity-chart'
import { formatDistanceToNow } from 'date-fns'

import { createAdminClient } from '@/lib/supabase/admin'

async function getDashboardData() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Get Counts
  const { count: totalComments } = await supabase.from('blog_comments').select('*', { count: 'exact', head: true })
  const { count: totalSubmissions } = await supabase.from('contact_submissions').select('*', { count: 'exact', head: true })
  const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true })

  // Get total views from blog_posts sum
  const { data: posts } = await supabase.from('blog_posts').select('view_count')
  const totalViews = posts?.reduce((acc, post) => acc + (post.view_count || 0), 0) || 0

  // 2. Get Recent Activity
  const { data: recentComments } = await supabase
    .from('blog_comments')
    .select('*, post:blog_posts(title, slug)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentSubmissions } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // 3. Get User Details for Enrichment (Recent Comments & Top Commenters)
  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({
    perPage: 1000
  })

  const userMap = new Map()
  if (users) {
    users.forEach(u => {
      userMap.set(u.id, {
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Anonymous',
        email: u.email,
        avatar: u.user_metadata?.avatar_url
      })
    })
  }

  // Enrich Recent Comments
  const enrichedRecentComments = (recentComments || []).map(comment => ({
    ...comment,
    author_name: userMap.get(comment.user_id)?.name || 'Anonymous',
    author_email: userMap.get(comment.user_id)?.email || 'No Email',
    author_avatar: userMap.get(comment.user_id)?.avatar
  }))

  // Calculate Top Commenters from ALL comments
  const { data: allComments } = await supabase
    .from('blog_comments')
    .select('user_id')

  const commenterMap = new Map()
  allComments?.forEach(c => {
    const userId = c.user_id
    if (!commenterMap.has(userId)) {
      const user = userMap.get(userId)
      commenterMap.set(userId, {
        name: user?.name || 'Anonymous',
        email: user?.email || 'No Email',
        count: 0
      })
    }
    commenterMap.get(userId).count++
  })

  const topCommenters = Array.from(commenterMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 4. Get Activity Data (Last 30 Days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: viewsData } = await supabase
    .from('blog_views')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { data: commentsData } = await supabase
    .from('blog_comments')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Aggregate by date
  const activityMap = new Map()

  // Initialize last 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    activityMap.set(dateStr, { date: dateStr, views: 0, comments: 0, rawDate: d })
  }

  viewsData?.forEach(v => {
    const d = new Date(v.created_at)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (activityMap.has(dateStr)) {
      activityMap.get(dateStr).views++
    }
  })

  commentsData?.forEach(c => {
    const d = new Date(c.created_at)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (activityMap.has(dateStr)) {
      activityMap.get(dateStr).comments++
    }
  })

  const activityChartData = Array.from(activityMap.values())
    .sort((a, b) => a.rawDate - b.rawDate)
    .map(({ date, views, comments }) => ({ date, views, comments }))

  return {
    stats: {
      totalViews,
      totalComments: totalComments || 0,
      totalSubmissions: totalSubmissions || 0,
      totalProjects: totalProjects || 0,
      viewsGrowth: 12, // Placeholder for now
      commentsGrowth: 5 // Placeholder for now
    },
    recentComments: enrichedRecentComments,
    recentSubmissions: recentSubmissions || [],
    topCommenters,
    activityChartData
  }
}

export default async function AdminDashboardPage() {
  await requireAdminAuth()
  const data = await getDashboardData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your portfolio today.
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats stats={data.stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Chart & Activity) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Activity Chart */}
          <ActivityChart data={data.activityChartData} />

          {/* Recent Comments */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Recent Comments
              </h3>
              <Link href="/admin/comments">
                <Button variant="ghost" size="sm" className="hover:bg-white/5">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {data.recentComments.length > 0 ? (
                data.recentComments.map((comment) => (
                  <div key={comment.id} className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {(comment.author_name?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-foreground">{comment.author_name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">• {formatDistanceToNow(new Date(comment.created_at))} ago</span>
                      </div>
                      <Link href={`/admin/comments`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-6 text-xs hover:bg-primary/20 hover:text-primary">
                          Reply
                        </Button>
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{comment.content}</p>
                    <div className="flex items-center gap-1 text-xs text-primary/80">
                      <span>on</span>
                      <span className="font-medium">{comment.post?.title}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No recent comments</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Submissions & Top Users) */}
        <div className="space-y-8">
          {/* Recent Submissions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Recent Inquiries
              </h3>
              <Link href="/admin/contacts">
                <Button variant="ghost" size="sm" className="hover:bg-white/5">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {data.recentSubmissions.length > 0 ? (
                data.recentSubmissions.map((sub) => (
                  <Link key={sub.id} href="/admin/contacts">
                    <div className="p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{sub.name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{sub.subject}</p>
                      <p className="text-xs text-muted-foreground/60 line-clamp-2">{sub.message}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No recent inquiries</div>
              )}
            </div>
          </div>

          {/* Top Commenters */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-green-400" />
              Top Commenters
            </h3>
            <div className="space-y-4">
              {data.topCommenters.length > 0 ? (
                data.topCommenters.map((user, index) => (
                  <div key={user.email} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-foreground border border-white/10">
                        {(user.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{user.count} comments</p>
                      </div>
                    </div>
                    {index < 3 && (
                      <div className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                        #{index + 1}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No active commenters</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
