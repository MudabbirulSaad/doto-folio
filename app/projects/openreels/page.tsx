import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Boxes, CloudCog, LockKeyhole, Network, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'OpenReels Engineering Case Study',
  description: 'A sanitized engineering case study covering protected media delivery, service boundaries, reliability, and release engineering in OpenReels.'
}

const architecture = [
  {
    title: 'Product surface',
    description: 'A Next.js and React interface backed by explicit server-side application boundaries.',
    icon: Boxes
  },
  {
    title: 'Services and data',
    description: 'Bun services coordinate PostgreSQL-owned state, Redis-backed runtime concerns, and typed contracts.',
    icon: Network
  },
  {
    title: 'Asynchronous workflows',
    description: 'RabbitMQ messaging supports durable background work with validation, retries, and failure visibility.',
    icon: CloudCog
  },
  {
    title: 'Protected media',
    description: 'Private object storage and a guarded CDN path keep media access scoped to authorised product flows.',
    icon: ShieldCheck
  }
]

const outcomes = [
  'Separated product meaning from transport details through typed contracts and application-owned boundaries.',
  'Created deterministic local development paths that do not require production credentials or cloud services.',
  'Added explicit health, recovery, and observability behavior around service and messaging failure modes.',
  'Preserved protected media delivery while improving authorization and range-playback reliability.',
  'Kept releases reviewable through immutable artifacts, blocking validation, and health-aware rollout checks.'
]

export default function OpenReelsCaseStudyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16 lg:py-24">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to selected projects
        </Link>

        <header className="mt-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4" />
            Private repository · sanitized public case study
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-display">
            OpenReels
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Evolving a production-oriented video platform into a more independently developable,
            contract-driven system without making delivery unsafe for a solo operator.
          </p>
        </header>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border/60 bg-muted/20 p-7 sm:p-9">
            <h2 className="text-2xl font-bold font-display">The engineering challenge</h2>
            <div className="mt-5 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                OpenReels combines interactive social features, private media, asynchronous work,
                and production delivery. Early service separation existed at the process level, but
                development workflows, data ownership, and failure behavior still carried hidden coupling.
              </p>
              <p>
                My objective was to deepen those boundaries while preserving working production behavior:
                protected media access, controlled database evolution, and an immutable release path could
                not be treated as disposable implementation details.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-7 sm:p-9">
            <h2 className="text-2xl font-bold font-display">My role</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              I own the product architecture, implementation, validation strategy, protected delivery
              model, operational documentation, and release workflow. The work spans frontend product
              behavior, backend services, data and messaging boundaries, CDN authorization, and CI/CD.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-bold font-display">Architecture at a safe level</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
            This overview deliberately omits credentials, internal addresses, deployment topology,
            and security-sensitive operating procedures.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {architecture.map(item => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-border/60 bg-background p-6">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{item.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-border/60 bg-muted/20 p-7 sm:p-10">
          <h2 className="text-3xl font-bold font-display">Selected outcomes</h2>
          <ul className="mt-7 space-y-4">
            {outcomes.map(outcome => (
              <li key={outcome} className="flex gap-3 text-muted-foreground leading-relaxed">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 max-w-4xl">
          <h2 className="text-3xl font-bold font-display">Honest constraints</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            OpenReels remains a private monorepo operated by one developer. It intentionally balances
            modular boundaries against operational simplicity rather than claiming database-per-service
            independence. Some shared infrastructure and larger service entry points remain documented
            engineering debt. Those constraints are part of the design discussion, not hidden from it.
          </p>
        </section>

        <div className="mt-20 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            Interested in the engineering decisions behind this work? Connect through the{' '}
            <Link href="/#contact" className="font-medium text-primary hover:text-primary/80">
              portfolio contact form
            </Link>{' '}
            or{' '}
            <a
              href="https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:text-primary/80"
            >
              LinkedIn
            </a>.
          </p>
        </div>
      </div>
    </main>
  )
}
