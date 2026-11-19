'use client'

import React, { useCallback, useState, useEffect, useMemo } from 'react'
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
  Save,
  Eye,
  ArrowLeft,
  Tag,
  FolderOpen,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Send,
  Trash2
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { NotionEditorHandle } from '@/components/admin/blog/notion-editor'
import { PostPreview } from '@/components/admin/blog/post-preview'
import { convertDraftMarkdown, markdownToBlocks } from '@/lib/markdown-converter'
import { createAdminBlogPostApiGateway, createAdminBlogTaxonomyApiGateway } from '@/lib/client/adapters/http/admin-blog-api'
import {
  deleteAdminBlogPost,
  updateAdminBlogPost
} from '@/lib/client/application/admin/blog-posts'
import {
  loadAdminBlogCategories,
  loadAdminBlogTags
} from '@/lib/client/application/admin/blog-taxonomy'

const NotionEditor = dynamic(() => import('@/components/admin/blog/notion-editor'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">Loading editor...</div>
})
import type { AdminBlogPostWithRelations } from '@/lib/client/domain/admin-blog'
import type { BlogCategory, BlogTag } from '@/lib/types/blog'
import type { OutputData } from '@editorjs/editorjs'

type ConversionReview = { draft: OutputData } | { message: string }

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editorVersion, setEditorVersion] = useState(0)
  const blockEditor = React.useRef<NotionEditorHandle>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [review, setReview] = useState<ConversionReview | null>(null)
  const [post, setPost] = useState<AdminBlogPostWithRelations | null>(null)
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
  const [markdownSource, setMarkdownSource] = useState<string | null>(null)
  const markdownInput = React.useRef<HTMLTextAreaElement>(null)

  // Collapsible state
  const [categoryOpen, setCategoryOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [seoOpen, setSeoOpen] = useState(false)

  const postGateway = useMemo(() => createAdminBlogPostApiGateway(), [])
  const taxonomyGateway = useMemo(() => createAdminBlogTaxonomyApiGateway(), [])

  const fetchPost = useCallback(async () => {
    try {
      const postData = await postGateway.getPost(resolvedParams.id)
        setPost(postData)

        // Populate form fields
        setTitle(postData.title)
        setSlug(postData.slug)
        setExcerpt(postData.excerpt || '')
        setCategoryId(postData.category_id || '')
        setStatus(postData.status)
        setIsFeatured(postData.featured)
        setMetaTitle(postData.meta_title || '')
        setMetaDescription(postData.meta_description || '')

        // Parse editor content
        setMarkdownSource(null)
        try {
          const contentData = JSON.parse(postData.content)

          // Check if it's a valid EditorJS object (has blocks array)
          if (contentData && Array.isArray(contentData.blocks)) {
            setEditorData(contentData)
          } else {
            throw new Error('Invalid EditorJS data')
          }
        } catch {
          setEditorData(null)
          setMarkdownSource(postData.content)
        }

        // Set selected tags
        if (postData.tags) {
          setSelectedTags(postData.tags.map((tagRel) => tagRel.tag))
        }
    } catch (error) {
      console.error('Error fetching post:', error)
      router.push('/admin/blog/posts')
    } finally {
      setLoading(false)
    }
  }, [postGateway, resolvedParams.id, router])

  const fetchCategories = useCallback(async () => {
    try {
      const result = await loadAdminBlogCategories(taxonomyGateway)
      if (result.success) {
        setCategories(result.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [taxonomyGateway])

  const fetchTags = useCallback(async () => {
    try {
      const result = await loadAdminBlogTags(taxonomyGateway)
      if (result.success) {
        setTags(result.tags)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }, [taxonomyGateway])

  useEffect(() => {
    fetchPost()
    fetchCategories()
    fetchTags()
  }, [fetchPost, fetchCategories, fetchTags])

  useEffect(() => {
    if (!reviewOpen) return
    let active = true
    async function prepareReview(): Promise<ConversionReview> {
      if (markdownSource !== null) return { draft: markdownToBlocks(markdownSource) }
      if (!blockEditor.current) throw new Error('The editor is still loading. Try again in a moment.')
      const snapshot = await blockEditor.current.readDraft()
      const draft = convertDraftMarkdown(snapshot)
      if (JSON.stringify(snapshot.blocks) === JSON.stringify(draft.blocks)) {
        return { message: 'There are no plain Markdown paragraphs to convert.' }
      }
      return { draft }
    }
    prepareReview().then(result => {
      if (active) setReview(result)
    }).catch((error: unknown) => {
      if (active) setReview({ message: error instanceof Error ? error.message : 'Could not read the current draft.' })
    })
    return () => { active = false }
  }, [reviewOpen, markdownSource])

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

    setSaving(true)

    try {
      let content = markdownSource
      if (content === null) {
        if (!blockEditor.current) throw new Error('The editor is still loading. Try again in a moment.')
        const draft = await blockEditor.current.readDraft()
        if (!draft.blocks.length) throw new Error('Please add some content')
        content = JSON.stringify(draft)
      }
      if (!content.trim()) throw new Error('Please add some content')
      const postData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt === (post?.excerpt ?? '') ? undefined : excerpt.trim(),
        content: content === post?.content ? undefined : content,
        category_id: categoryId || undefined,
        tag_ids: selectedTags.map(tag => tag.id),
        status: publishNow ? 'published' : status,
        featured: isFeatured,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
      }

      const result = await updateAdminBlogPost(postGateway, resolvedParams.id, {
        id: resolvedParams.id,
        ...postData
      })

      if (result.success) {
        router.push('/admin/blog/posts')
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert(error instanceof Error ? error.message : 'Failed to update post')
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const result = await deleteAdminBlogPost(postGateway, resolvedParams.id)

      if (result.success) {
        router.push('/admin/blog/posts')
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setSaving(false)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (markdownInput.current) {
        const details = markdownInput.current.closest('details')
        if (details) details.open = true
        markdownInput.current.focus()
        return
      }
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
                onClick={handleDelete}
                disabled={saving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Delete
              </Button>
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
              <PostPreview title={title} excerpt={excerpt} editor={blockEditor} markdownSource={markdownSource} disabled={saving} />
              {status !== 'published' && (
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Input */}
            <div className="space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="Post Title"
                className="text-4xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto py-2"
              />
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="mr-2">URL:</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="h-6 py-0 px-1 w-full max-w-[300px] text-sm"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex justify-end mb-2">
              <Dialog open={reviewOpen} onOpenChange={open => {
                setReview(null)
                setReviewOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={saving}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Convert Markdown
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convert Markdown</DialogTitle>
                    <DialogDescription aria-live="polite">
                      {review === null ? 'Checking the current draft…' : 'message' in review
                        ? review.message
                        : 'Apply the conversion to your current draft? Choose Save Changes when you are ready to save it.'}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    {review && 'draft' in review && (
                      <Button onClick={() => {
                        setEditorData(review.draft)
                        setMarkdownSource(null)
                        setEditorVersion(version => version + 1)
                        setReviewOpen(false)
                      }}>
                        Apply conversion
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="min-h-[600px]">
              {markdownSource !== null ? (
                <div className="space-y-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">Edit Markdown source</summary>
                    <Textarea
                      ref={markdownInput}
                      aria-label="Markdown source"
                      value={markdownSource}
                      onChange={event => setMarkdownSource(event.target.value)}
                      className="mt-2 min-h-64 font-mono"
                    />
                  </details>
                  <MarkdownRenderer source={markdownSource} policy="trustedBlog" />
                </div>
              ) : (
                <NotionEditor
                  ref={blockEditor}
                  key={`editor-${resolvedParams.id}-${editorVersion}`}
                  data={editorData || undefined}
                  placeholder="Press '/' for commands, or start writing..."
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Featured</span>
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
              <Card>
                <CardHeader className="py-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Category
                    </CardTitle>
                    {categoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center">
                              <div
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Tags */}
            <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
              <Card>
                <CardHeader className="py-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </CardTitle>
                    {tagsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="pl-2 pr-1 py-1">
                          {tag.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 ml-1 p-0 hover:bg-transparent"
                            onClick={() => handleTagRemove(tag.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tags
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
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
                                    className={`mr-2 h-4 w-4 ${selectedTags.find(t => t.id === tag.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                      }`}
                                  />
                                  {tag.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* SEO Settings */}
            <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
              <Card>
                <CardHeader className="py-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      SEO Settings
                    </CardTitle>
                    {seoOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label>Meta Title</Label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="SEO Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="SEO Description"
                        className="h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Excerpt</Label>
                      <Textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Post excerpt..."
                        className="h-24 resize-none"
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  )
}
