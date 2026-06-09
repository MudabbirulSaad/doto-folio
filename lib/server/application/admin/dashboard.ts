export interface DashboardCounts {
  totalComments: number
  totalSubmissions: number
  totalProjects: number
}

export interface DashboardAuthor {
  id: string
  name: string
  email?: string | null
  avatar?: string | null
}

export interface DashboardActivityRecord {
  created_at: string
}

export interface DashboardRecentComment {
  id: string
  user_id?: string | null
  content: string
  created_at: string
  post?: {
    title?: string | null
    slug?: string | null
  } | null
}

export interface DashboardRecentSubmission {
  id: string
  name: string
  subject: string
  message: string
  created_at: string
}

export interface AdminDashboardRepository {
  getCounts(): Promise<DashboardCounts>
  getPostViewCounts(): Promise<Array<number | null | undefined>>
  listRecentComments(): Promise<DashboardRecentComment[]>
  listRecentSubmissions(): Promise<DashboardRecentSubmission[]>
  listCommentAuthors(): Promise<DashboardAuthor[]>
  listAllCommentUserIds(): Promise<Array<string | null | undefined>>
  listActivitySince(since: Date): Promise<{
    views: DashboardActivityRecord[]
    comments: DashboardActivityRecord[]
  }>
}

function dateLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export async function getAdminDashboard(
  repository: AdminDashboardRepository,
  options: { now?: () => Date } = {}
) {
  const now = (options.now || (() => new Date()))()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    counts,
    postViewCounts,
    recentComments,
    recentSubmissions,
    authors,
    allCommentUserIds,
    activity
  ] = await Promise.all([
    repository.getCounts(),
    repository.getPostViewCounts(),
    repository.listRecentComments(),
    repository.listRecentSubmissions(),
    repository.listCommentAuthors(),
    repository.listAllCommentUserIds(),
    repository.listActivitySince(thirtyDaysAgo)
  ])

  const authorMap = new Map(authors.map(author => [author.id, author]))
  const enrichedRecentComments = recentComments.map(comment => {
    const author = comment.user_id ? authorMap.get(comment.user_id) : undefined

    return {
      ...comment,
      author_name: author?.name || 'Anonymous',
      author_email: author?.email || 'No Email',
      author_avatar: author?.avatar
    }
  })

  const commenterMap = new Map<string, { name: string; email: string; count: number }>()
  for (const userId of allCommentUserIds) {
    if (!userId) {
      continue
    }

    if (!commenterMap.has(userId)) {
      const author = authorMap.get(userId)
      commenterMap.set(userId, {
        name: author?.name || 'Anonymous',
        email: author?.email || 'No Email',
        count: 0
      })
    }

    const commenter = commenterMap.get(userId)
    if (commenter) {
      commenter.count += 1
    }
  }

  const activityMap = new Map<string, { date: string; views: number; comments: number; rawDate: Date }>()
  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const label = dateLabel(date)
    activityMap.set(label, { date: label, views: 0, comments: 0, rawDate: date })
  }

  for (const view of activity.views) {
    const label = dateLabel(new Date(view.created_at))
    const bucket = activityMap.get(label)
    if (bucket) {
      bucket.views += 1
    }
  }

  for (const comment of activity.comments) {
    const label = dateLabel(new Date(comment.created_at))
    const bucket = activityMap.get(label)
    if (bucket) {
      bucket.comments += 1
    }
  }

  const activityChartData = Array.from(activityMap.values())
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
    .map(({ date, views, comments }) => ({ date, views, comments }))

  return {
    stats: {
      totalViews: postViewCounts.reduce<number>((total, count) => total + (count || 0), 0),
      totalComments: counts.totalComments,
      totalSubmissions: counts.totalSubmissions,
      totalProjects: counts.totalProjects,
      viewsGrowth: 12,
      commentsGrowth: 5
    },
    recentComments: enrichedRecentComments,
    recentSubmissions,
    topCommenters: Array.from(commenterMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    activityChartData
  }
}
