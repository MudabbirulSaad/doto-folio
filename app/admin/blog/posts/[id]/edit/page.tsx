'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  FolderOpen,
  Check,
  ChevronsUpDown,
  X,
  Loader2
} from 'lucide-react'
import NotionEditor from '@/components/admin/blog/notion-editor'
import type { BlogCategory, BlogTag, BlogPostWithRelations } from '@/lib/types/blog'
import type { OutputData } from '@editorjs/editorjs'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState<BlogPostWithRelations | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [selectedTags, setSelectedTags] = useState<BlogTag[]>([])
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [editorData, setEditorData] = useState<OutputData | null>(null)

  useEffect(() => {
    fetchPost()
    fetchCategories()
    fetchTags()
  }, [resolvedParams.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        const postData = data.data
        setPost(postData)
        
        // Populate form fields
        setTitle(postData.title)
        setSlug(postData.slug)
        setExcerpt(postData.excerpt || '')
        setCategoryId(postData.category_id || '')
        setStatus(postData.status)
        setIsFeatured(postData.is_featured)
        setMetaTitle(postData.meta_title || '')
        setMetaDescription(postData.meta_description || '')
        
        // Parse editor content
        try {
          const contentData = JSON.parse(postData.content)
          setEditorData(contentData)
        } catch (e) {
          console.error('Error parsing content:', e)
        }
        
        // Set selected tags
        if (postData.tags) {
          setSelectedTags(postData.tags.map((tagRel: any) => tagRel.tag))
        }
      } else {
        router.push('/admin/blog/posts')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      router.push('/admin/blog/posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/blog/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleTagSelect = (tag: BlogTag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag])
    }
    setTagSearchOpen(false)
  }

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId))
  }

  const handleSave = async (publishNow = false) => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!editorData || !editorData.blocks || editorData.blocks.length === 0) {
      alert('Please add some content')
      return
    }

    setSaving(true)

    try {
      const postData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: JSON.stringify(editorData),
        category_id: categoryId || null,
        tag_ids: selectedTags.map(tag => tag.id),
        status: publishNow ? 'published' : status,
        is_featured: isFeatured,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      }

      const response = await fetch(`/api/admin/blog/posts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (response.ok) {
        router.push('/admin/blog/posts')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-4">The post you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/blog/posts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Post</h1>
            <p className="text-muted-foreground">Update your blog post</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Eye className="w-4 h-4 mr-2" />
            {status === 'published' ? 'Update & Publish' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-3xl font-bold border-none px-0 py-2 h-auto resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    style={{ fontSize: '2rem', lineHeight: '1.2' }}
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-sm text-muted-foreground">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardContent className="pt-6">
              <NotionEditor
                data={editorData || undefined}
                onChange={setEditorData}
                placeholder="Start writing your post..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: 'draft' | 'published' | 'archived') => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Post</Label>
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>

              {post.published_at && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Published: {new Date(post.published_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tagSearchOpen}
                    className="w-full justify-between"
                  >
                    Add tags...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup>
                      {tags
                        .filter(tag => !selectedTags.find(t => t.id === tag.id))
                        .map((tag) => (
                          <CommandItem
                            key={tag.id}
                            onSelect={() => handleTagSelect(tag)}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            {tag.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                      {tag.name}
                      <button
                        onClick={() => handleTagRemove(tag.id)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="SEO title (optional)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  placeholder="SEO description (optional)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
