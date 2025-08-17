'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import type { BlogCategory, BlogTag } from '@/lib/types/blog'
import type { OutputData } from '@editorjs/editorjs'

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [selectedTags, setSelectedTags] = useState<BlogTag[]>([])
  const [tagSearchOpen, setTagSearchOpen] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [editorData, setEditorData] = useState<OutputData | null>(null)

  // Collapsible states
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)

  // New category/tag creation
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  const [newTagName, setNewTagName] = useState('')
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [showNewTagDialog, setShowNewTagDialog] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)
    }
  }, [title, slug])

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

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      // Generate slug from name
      const slug = newCategoryName.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const response = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: slug,
          color: newCategoryColor
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(prev => [...prev, data.data])
        setCategoryId(data.data.id)
        setNewCategoryName('')
        setShowNewCategoryDialog(false)
      }
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const createNewTag = async () => {
    if (!newTagName.trim()) return

    try {
      // Generate slug from name
      const slug = newTagName.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const response = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          slug: slug
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newTag = data.data
        setTags(prev => [...prev, newTag])
        setSelectedTags(prev => [...prev, newTag])
        setNewTagName('')
        setShowNewTagDialog(false)
      }
    } catch (error) {
      console.error('Error creating tag:', error)
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

    setLoading(true)

    try {
      const postData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: JSON.stringify(editorData),
        category_id: categoryId && categoryId !== 'none' ? categoryId : null,
        tag_ids: selectedTags.map(tag => tag.id),
        status: publishNow ? 'published' : status,
        featured: isFeatured,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      }

      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (response.ok) {
        await response.json()
        router.push('/admin/blog/posts')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to save post')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Failed to save post')
    } finally {
      setLoading(false)
    }
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
                New Blog Post
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Draft
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
                disabled={loading}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-1" />
                Publish
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
                <Select value={status} onValueChange={(value: 'draft' | 'published') => setStatus(value)}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
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
                <Select value={categoryId} onValueChange={setCategoryId}>
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
                <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-muted-foreground">
                      <Plus className="w-3 h-3 mr-2" />
                      New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category-name">Name</Label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Category name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category-color">Color</Label>
                        <Input
                          id="category-color"
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createNewCategory}>
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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
                              <Check
                                className={`mr-2 h-4 w-4 opacity-0`}
                              />
                              {tag.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Dialog open={showNewTagDialog} onOpenChange={setShowNewTagDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-muted-foreground">
                      <Plus className="w-3 h-3 mr-2" />
                      New Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Tag</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tag-name">Name</Label>
                        <Input
                          id="tag-name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="Tag name"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowNewTagDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createNewTag}>
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs h-6">
                        {tag.name}
                        <button
                          onClick={() => handleTagRemove(tag.id)}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="w-2 h-2" />
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
                  <Calendar className="w-4 h-4" />
                  SEO Settings
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
                    rows={2}
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
