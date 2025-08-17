import { Metadata } from 'next'
import { SubscribeForm } from '@/components/subscribe/subscribe-form'
import { SubscribeHero } from '@/components/subscribe/subscribe-hero'

export const metadata: Metadata = {
  title: 'Subscribe | SAAD - Mudabbirul Saad',
  description: 'Stay updated with the latest insights on AI, technology, and development. Subscribe to get notified when new articles are published.',
  keywords: ['newsletter', 'subscribe', 'AI', 'technology', 'development', 'blog updates'],
  openGraph: {
    title: 'Subscribe to SAAD Newsletter',
    description: 'Stay updated with the latest insights on AI, technology, and development.',
    type: 'website',
  },
}

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-background">
      <SubscribeHero />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <SubscribeForm />
        </div>
      </div>
    </div>
  )
}
