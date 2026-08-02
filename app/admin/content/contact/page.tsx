import { Mail } from 'lucide-react'
import { createContactContentUseCases } from '@/lib/server/composition/content'
import { ContactContentManager } from '@/components/admin/contact-content-manager'

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

      <ContactContentManager
        initialContactMethods={contactContent.contactMethods}
        initialSocialLinks={contactContent.socialLinks}
      />
    </div>
  )
}
