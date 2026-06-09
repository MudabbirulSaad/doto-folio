'use client'

import { useState, useEffect, useMemo } from 'react'
// import { useRouter } from 'next/navigation' // Removed unused import
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { createAdminSiteContentApiGateway } from '@/lib/client/adapters/http/admin-site-content-api'
import { loadAdminSiteContent, saveAdminSiteContent } from '@/lib/client/application/admin/site-content'
import type { AdminSiteContent } from '@/lib/client/domain/admin-content'

export default function HeroAboutContentPage() {
  // const router = useRouter() // Removed unused variable
  const [content, setContent] = useState<AdminSiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const gateway = useMemo(() => createAdminSiteContentApiGateway(), [])

  // Fetch current content
  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const result = await loadAdminSiteContent(gateway)
      if (result.success) {
        setContent(result.content)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      setMessage({ type: 'error', text: 'Failed to load content' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content) return

    setSaving(true)
    setMessage(null)

    try {
      const result = await saveAdminSiteContent(gateway, content)

      if (result.success) {
        setMessage({ type: 'success', text: 'Content saved successfully!' })
        setContent(result.content)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      console.error('Error saving content:', error)
      setMessage({ type: 'error', text: 'Failed to save content' })
    } finally {
      setSaving(false)
    }
  }

  const updateContent = (field: keyof AdminSiteContent, value: string | boolean) => {
    if (!content) return
    setContent({ ...content, [field]: value })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Content Not Found</h2>
          <p className="text-muted-foreground">Unable to load site content.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/content">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Content</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hero & About Content</h1>
            <p className="text-muted-foreground">Edit hero section, about text, and education details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hero_title">Main Title</Label>
              <Textarea
                id="hero_title"
                value={content.hero_title}
                onChange={(e) => updateContent('hero_title', e.target.value)}
                placeholder="Enter hero title..."
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="hero_subtitle">Subtitle (Optional)</Label>
              <Input
                id="hero_subtitle"
                value={content.hero_subtitle || ''}
                onChange={(e) => updateContent('hero_subtitle', e.target.value)}
                placeholder="Enter hero subtitle..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hero_cta_text">Call-to-Action Text</Label>
                <Input
                  id="hero_cta_text"
                  value={content.hero_cta_text}
                  onChange={(e) => updateContent('hero_cta_text', e.target.value)}
                  placeholder="e.g., Explore My Work"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="hero_cta_link">Call-to-Action Link</Label>
                <Input
                  id="hero_cta_link"
                  value={content.hero_cta_link}
                  onChange={(e) => updateContent('hero_cta_link', e.target.value)}
                  placeholder="e.g., #projects"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">About Section</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="about_title">Section Title</Label>
              <Input
                id="about_title"
                value={content.about_title}
                onChange={(e) => updateContent('about_title', e.target.value)}
                placeholder="e.g., About Me"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="about_intro">Introduction Paragraph</Label>
              <Textarea
                id="about_intro"
                value={content.about_intro}
                onChange={(e) => updateContent('about_intro', e.target.value)}
                placeholder="Enter introduction paragraph..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="about_description">Main Description</Label>
              <Textarea
                id="about_description"
                value={content.about_description}
                onChange={(e) => updateContent('about_description', e.target.value)}
                placeholder="Enter main description..."
                className="mt-1"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="about_personal">Personal Details</Label>
              <Textarea
                id="about_personal"
                value={content.about_personal}
                onChange={(e) => updateContent('about_personal', e.target.value)}
                placeholder="Enter personal details..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Education Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Education Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="education_title">Card Title</Label>
              <Input
                id="education_title"
                value={content.education_title}
                onChange={(e) => updateContent('education_title', e.target.value)}
                placeholder="e.g., Education"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="education_degree">Degree</Label>
              <Input
                id="education_degree"
                value={content.education_degree}
                onChange={(e) => updateContent('education_degree', e.target.value)}
                placeholder="e.g., Bachelor's Degree"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="education_field">Field of Study</Label>
              <Input
                id="education_field"
                value={content.education_field}
                onChange={(e) => updateContent('education_field', e.target.value)}
                placeholder="e.g., Artificial Intelligence"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="education_institution">Institution</Label>
              <Input
                id="education_institution"
                value={content.education_institution}
                onChange={(e) => updateContent('education_institution', e.target.value)}
                placeholder="e.g., Swinburne University of Technology"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Approach Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Approach Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approach_title">Card Title</Label>
              <Input
                id="approach_title"
                value={content.approach_title}
                onChange={(e) => updateContent('approach_title', e.target.value)}
                placeholder="e.g., Approach"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="approach_description">Description</Label>
              <Textarea
                id="approach_description"
                value={content.approach_description}
                onChange={(e) => updateContent('approach_description', e.target.value)}
                placeholder="Enter approach description..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
