import { ExternalLink, Mail, Share2 } from 'lucide-react'
import { createContactContentUseCases } from '@/lib/server/composition/content'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ContactContentPage() {
  const contactContent = await (await createContactContentUseCases()).get()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Contact & Social
          </h1>
          <p className="text-muted-foreground mt-1">
            Review the published contact methods and social links used on the public portfolio.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactContent.contactMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published contact methods yet.</p>
            ) : (
              contactContent.contactMethods.map((method) => (
                <div key={method.id} className="rounded-lg border border-white/10 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{method.title}</h2>
                      <p className="text-sm text-muted-foreground break-words">{method.value}</p>
                      <p className="text-sm text-muted-foreground mt-2">{method.description}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={method.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${method.title}`}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactContent.socialLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published social links yet.</p>
            ) : (
              contactContent.socialLinks.map((link) => (
                <div key={link.id} className="rounded-lg border border-white/10 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{link.platform}</h2>
                      <p className="text-sm text-muted-foreground break-words">{link.username || link.url}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${link.platform}`}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
