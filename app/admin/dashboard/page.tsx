import { requireAdminAuth } from '@/lib/auth/server'

// Force dynamic rendering for admin pages that use authentication
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { 
  Mail, 
  Users, 
  Calendar, 
  TrendingUp,
  MessageSquare,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalSubmissions: number
  todaySubmissions: number
  thisWeekSubmissions: number
  thisMonthSubmissions: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient()
    
    // Get total submissions
    const { count: totalSubmissions } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })

    // Get today's submissions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todaySubmissions } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get this week's submissions
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const { count: thisWeekSubmissions } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())

    // Get this month's submissions
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { count: thisMonthSubmissions } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString())

    return {
      totalSubmissions: totalSubmissions || 0,
      todaySubmissions: todaySubmissions || 0,
      thisWeekSubmissions: thisWeekSubmissions || 0,
      thisMonthSubmissions: thisMonthSubmissions || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalSubmissions: 0,
      todaySubmissions: 0,
      thisWeekSubmissions: 0,
      thisMonthSubmissions: 0
    }
  }
}

async function getRecentSubmissions() {
  try {
    const supabase = await createClient()
    
    const { data: submissions, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching recent submissions:', error)
      return []
    }

    return submissions || []
  } catch (error) {
    console.error('Error fetching recent submissions:', error)
    return []
  }
}

export default async function AdminDashboardPage() {
  // Require authentication
  await requireAdminAuth()

  // Get dashboard data
  const stats = await getDashboardStats()
  const recentSubmissions = await getRecentSubmissions()

  const statCards = [
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All time contact submissions'
    },
    {
      title: 'Today',
      value: stats.todaySubmissions,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Submissions today'
    },
    {
      title: 'This Week',
      value: stats.thisWeekSubmissions,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Submissions this week'
    },
    {
      title: 'This Month',
      value: stats.thisMonthSubmissions,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Submissions this month'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome back! Here&apos;s an overview of your portfolio activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-mobile-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="admin-card-mobile bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor} dark:bg-secondary flex-shrink-0 ml-3`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color} dark:text-foreground`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Submissions */}
      <div className="admin-card-mobile bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Recent Contact Submissions</h2>
          </div>
          <Link href="/admin/contacts">
            <Button variant="outline" size="sm" className="admin-touch-target self-start sm:self-auto">
              View All
            </Button>
          </Link>
        </div>

        {recentSubmissions.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="border border-border rounded-lg p-3 md:p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                      <h3 className="font-medium text-foreground truncate">{submission.name}</h3>
                      <span className="hidden sm:inline text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground truncate">{submission.email}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1 line-clamp-1">{submission.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                      {submission.message}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="whitespace-nowrap">
                      {new Date(submission.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">
              Contact form submissions will appear here when visitors reach out.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
