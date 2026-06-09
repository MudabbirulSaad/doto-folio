'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Plus, 
  Tags, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Hash,
  TrendingUp
} from 'lucide-react'
import type { BlogTag } from '@/lib/types/blog'
import { createAdminBlogTaxonomyApiGateway } from '@/lib/client/adapters/http/admin-blog-api'
import {
  deleteAdminBlogTag,
  loadAdminBlogTags,
  saveAdminBlogTag
} from '@/lib/client/application/admin/blog-taxonomy'

export default function TagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [saving, setSaving] = useState(false)
  const gateway = useMemo(() => createAdminBlogTaxonomyApiGateway(), [])

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const fetchTags = useCallback(async () => {
    try {
      const result = await loadAdminBlogTags(gateway)
      if (result.success) {
        setTags(result.tags)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }, [gateway])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !editingTag) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)
    }
  }, [name, editingTag])

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setEditingTag(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (tag: BlogTag) => {
    setName(tag.name)
    setSlug(tag.slug)
    setDescription(tag.description || '')
    setEditingTag(tag)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const result = await saveAdminBlogTag(gateway, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim()
      }, editingTag?.id)

      if (result.success) {
        await fetchTags()
        setDialogOpen(false)
        resetForm()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error saving tag:', error)
      alert('Failed to save tag')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteAdminBlogTag(gateway, tagId)

      if (result.success) {
        setTags(tags.filter(tag => tag.id !== result.id))
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tags</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const mostUsedTag = tags.length > 0 
    ? tags.reduce((max, tag) => tag.usage_count > max.usage_count ? tag : max)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground">Label and categorize your blog posts with tags</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </DialogTitle>
              <DialogDescription>
                {editingTag 
                  ? 'Update the tag details below.'
                  : 'Add a new tag to label your blog posts.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Tag name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="tag-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tag description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingTag ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {mostUsedTag ? mostUsedTag.name : 'None'}
            </div>
            {mostUsedTag && (
              <div className="text-sm text-muted-foreground">
                {mostUsedTag.usage_count} posts
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.reduce((sum, tag) => sum + tag.usage_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        {tag.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {tag.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {tag.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {tag.usage_count} posts
                      </Badge>
                      {tag.usage_count > 0 && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(tag.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(tag.id)}
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
          
          {tags.length === 0 && (
            <div className="text-center py-12">
              <Tags className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tags yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first tag to label and organize your blog posts
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Tag
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
