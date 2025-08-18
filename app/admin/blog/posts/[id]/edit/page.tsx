'use client'

import React, { useState, useEffect } from 'react'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Send
} from 'lucide-react'
import dynamic from 'next/dynamic'

const NotionEditor = dynamic(() => import('@/components/admin/blog/notion-editor'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">Loading editor...</div>
})
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

  // Collapsible state
  const [categoryOpen, setCategoryOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [seoOpen, setSeoOpen] = useState(false)

  // New category dialog state
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')

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
          // If content is not JSON (e.g., Markdown), create a basic EditorJS structure
          const markdownContent = postData.content || ''
          setEditorData({
            time: Date.now(),
            blocks: [
              {
                id: "fallback-block",
                type: "paragraph",
                data: {
                  text: markdownContent.substring(0, 1000) + (markdownContent.length > 1000 ? '...' : '')
                }
              }
            ],
            version: "2.28.2"
          })
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

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Focus the editor
      const editorElement = document.querySelector('.notion-editor .codex-editor')
      if (editorElement) {
        (editorElement as HTMLElement).focus()
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/blog/posts')}
                className="text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="text-sm text-muted-foreground">
                Edit Blog Post
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="text-muted-foreground hover:text-foreground"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                {status === 'published' ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor Area */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Title Section */}
              <div className="space-y-4">
                <Input
                  placeholder="Untitled"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-4xl font-bold border-none px-0 py-0 h-auto bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  style={{ fontSize: '2.5rem', lineHeight: '1.1' }}
                />
                {slug && (
                  <div className="text-sm text-muted-foreground">
                    URL: <span className="font-mono">{slug}</span>
                  </div>
                )}
              </div>

              {/* Content Editor */}
              <div className="min-h-[600px] mt-8">
                <NotionEditor
                  data={editorData || undefined}
                  onChange={setEditorData}
                  placeholder="Press '/' for commands, or start writing..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={status} onValueChange={(value: 'draft' | 'published' | 'archived') => setStatus(value)}>
                  <SelectTrigger className="w-32 h-8">
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
                <Label className="text-sm font-medium">Featured Post</Label>
                <Switch
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
              {post?.published_at && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Published: {new Date(post.published_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Category Section */}
            <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-foreground">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Category
                </div>
                {categoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <Select value={categoryId || "none"} onValueChange={(value) => setCategoryId(value === "none" ? "" : value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CollapsibleContent>
            </Collapsible>

            {/* Tags Section */}
            <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </div>
                {tagsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tagSearchOpen}
                      className="w-full justify-between h-8"
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
              </CollapsibleContent>
            </Collapsible>

            {/* SEO Section */}
            <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  SEO & Excerpt
                </div>
                {seoOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="excerpt" className="text-xs text-muted-foreground">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the post..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="meta-title" className="text-xs text-muted-foreground">Meta Title</Label>
                  <Input
                    id="meta-title"
                    placeholder="SEO title (optional)"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="meta-description" className="text-xs text-muted-foreground">Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    placeholder="SEO description (optional)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  )
}
