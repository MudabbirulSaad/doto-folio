'use client'

import { type FormEvent, useState } from 'react'
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Mail, Plus, Share2 } from 'lucide-react'
import { createAdminContactContentApiGateway } from '@/lib/client/adapters/http/admin-contact-content-api'
import type {
  AdminContactMethod,
  AdminSocialLink,
  AdminSocialLinkFormData
} from '@/lib/client/domain/admin-content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContactContentManagerProps {
  initialContactMethods: AdminContactMethod[]
  initialSocialLinks: AdminSocialLink[]
}

const emptySocialLink = (): AdminSocialLinkFormData => ({
  platform: 'LinkedIn',
  url: '',
  username: '',
  icon_name: 'Linkedin'
})

export function ContactContentManager({
  initialContactMethods,
  initialSocialLinks
}: ContactContentManagerProps) {
  const [socialLinks, setSocialLinks] = useState(initialSocialLinks)
  const [formData, setFormData] = useState(emptySocialLink)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const created = await createAdminContactContentApiGateway().createSocialLink(formData)
      setSocialLinks(current => [...current, created].sort((a, b) => a.display_order - b.display_order))
      setFormData(emptySocialLink())
      setMessage({ type: 'success', text: 'Social link published successfully.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to publish social link.'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border p-4 ${
            message.type === 'success'
              ? 'border-green-500/20 bg-green-500/10 text-green-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialContactMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published contact methods. The public contact form remains available.</p>
            ) : (
              initialContactMethods.map(method => (
                <div key={method.id} className="rounded-lg border border-white/10 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{method.title}</h2>
                      <p className="break-words text-sm text-muted-foreground">{method.value}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={method.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${method.title}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published social links yet.</p>
            ) : (
              socialLinks.map(link => (
                <div key={link.id} className="rounded-lg border border-white/10 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{link.platform}</h2>
                      <p className="break-words text-sm text-muted-foreground">{link.username || link.url}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${link.platform}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Social Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="social-platform">Platform</Label>
              <Input
                id="social-platform"
                value={formData.platform}
                onChange={event => setFormData(current => ({ ...current, platform: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social-icon">Icon name</Label>
              <Input
                id="social-icon"
                value={formData.icon_name}
                onChange={event => setFormData(current => ({ ...current, icon_name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="social-url">URL</Label>
              <Input
                id="social-url"
                type="url"
                value={formData.url}
                onChange={event => setFormData(current => ({ ...current, url: event.target.value }))}
                placeholder="https://www.linkedin.com/in/..."
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="social-username">Username (optional)</Label>
              <Input
                id="social-username"
                value={formData.username}
                onChange={event => setFormData(current => ({ ...current, username: event.target.value }))}
                placeholder="Profile handle"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {saving ? 'Publishing...' : 'Publish social link'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
