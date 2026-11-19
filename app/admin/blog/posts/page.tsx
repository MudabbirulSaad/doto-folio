'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PenTool,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import type { AdminPostSummary, BlogCategory } from '@/lib/types/blog'
import { deleteAdminBlogPost } from '@/lib/client/application/admin/blog-posts'
import { createAdminBlogPostApiGateway } from '@/lib/client/adapters/http/admin-blog-api'
import type { AdminBlogPostList, AdminBlogPostListQuery } from '@/lib/client/domain/admin-blog'

export default function BlogPostsPage() {
  const gateway = useMemo(() => createAdminBlogPostApiGateway(), [])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [query, setQuery] = useState<AdminBlogPostListQuery>({ page: 1, search: '', status: 'all', category: 'all' })
  const [list, setList] = useState<AdminBlogPostList | null>(null)
  const [listFailed, setListFailed] = useState(false)
  const [summary, setSummary] = useState<AdminPostSummary | null>(null)
  const [summaryFailed, setSummaryFailed] = useState(false)
  const [summaryRevision, setSummaryRevision] = useState(0)

  useEffect(() => {
    gateway.listCategories().then(setCategories).catch(error => console.error('Error fetching categories:', error))
  }, [gateway])

  useEffect(() => {
    const controller = new AbortController()
    gateway.getSummary(controller.signal).then(data => {
      if (!controller.signal.aborted) setSummary(data)
    }).catch(() => {
      if (!controller.signal.aborted) setSummaryFailed(true)
    })
    return () => controller.abort()
  }, [gateway, summaryRevision])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await gateway.listPosts(query, controller.signal)
        if (controller.signal.aborted) return
        if (query.page > Math.max(1, data.pagination.totalPages)) {
          setQuery({ ...query, page: Math.max(1, data.pagination.totalPages) })
        } else {
          setList(data)
        }
      } catch {
        if (!controller.signal.aborted) setListFailed(true)
      }
    }, query.search.trim() ? 200 : 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [gateway, query])

  function changeQuery(change: Partial<AdminBlogPostListQuery>) {
    setList(null)
    setListFailed(false)
    setQuery(current => ({ ...current, page: 1, ...change }))
  }

  function refreshSummary() {
    setSummary(null)
    setSummaryFailed(false)
    setSummaryRevision(current => current + 1)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    const result = await deleteAdminBlogPost(gateway, postId)
    if (result.success) {
      setList(null)
      setListFailed(false)
      setQuery(current => {
        const page = current === query && list?.posts.length === 1 ? Math.max(1, current.page - 1) : current.page
        return { ...current, page }
      })
      refreshSummary()
    }
  }

  const filtered = Boolean(query.search.trim()) || query.status !== 'all' || query.category !== 'all'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts and content</p>
        </div>
        <Link href="/admin/blog/posts/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPosts ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.publishedPosts ?? '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary?.draftPosts ?? '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalViews ?? '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {summaryFailed && <p role="alert">Could not load post totals. <Button variant="link" onClick={refreshSummary}>Retry totals</Button></p>}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  aria-label="Search posts"
                  value={query.search}
                  onChange={e => changeQuery({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={query.status} onValueChange={status => changeQuery({ status })}>
              <SelectTrigger aria-label="Filter by status" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={query.category} onValueChange={category => changeQuery({ category })}>
              <SelectTrigger aria-label="Filter by category" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list?.posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {post.excerpt}
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {post.tags.slice(0, 3).map((tagRelation) => (
                            <Badge key={tagRelation.tag.id} variant="outline" className="text-xs">
                              {tagRelation.tag.name}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    {post.category ? (
                      <Badge variant="outline" style={{ borderColor: post.category.color }}>
                        {post.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      {post.view_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.published_at ? (
                      <div className="text-sm">
                        <div>{new Date(post.published_at).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {new Date(post.published_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not published</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label={`Actions for ${post.title}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {post.status === 'published' ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <Eye className="w-4 h-4 mr-2" />
                            Draft not public
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blog/posts/${post.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!list && !listFailed && <p role="status" className="p-6 text-center text-muted-foreground">Loading posts…</p>}
          {listFailed && (
            <div role="alert" className="p-6 text-center">
              Could not load posts. <Button variant="link" onClick={() => changeQuery({ page: query.page })}>Retry</Button>
            </div>
          )}
          {list?.posts.length === 0 && (
            <div className="text-center py-12">
              <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {filtered
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first blog post'
                }
              </p>
              {!filtered && (
                <Link href="/admin/blog/posts/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                </Link>
              )}
            </div>
          )}
          {list && list.pagination.total > 0 && (
            <nav aria-label="Post list pagination" className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {list.pagination.total} {list.pagination.total === 1 ? 'post' : 'posts'} · Page {query.page} of {list.pagination.totalPages}
              </span>
              {list.pagination.totalPages > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={query.page <= 1} onClick={() => changeQuery({ page: query.page - 1 })}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={query.page >= list.pagination.totalPages} onClick={() => changeQuery({ page: query.page + 1 })}>Next</Button>
                </div>
              )}
            </nav>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
