import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Braces,
  Check,
  CloudCog,
  Database,
  ExternalLink,
  GitBranch,
  LockKeyhole,
  Network,
  Radio,
  ServerCog,
  ShieldCheck,
  TestTube2,
  TriangleAlert,
  Waypoints,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'OpenReels Engineering Case Study',
  description:
    'How I evolved a production-oriented video and social platform into a contract-driven, independently developable system with protected media, durable workflows, and evidence-led delivery.',
  alternates: {
    canonical: 'https://mudabbirulsaad.com/projects/openreels',
  },
  openGraph: {
    title: 'OpenReels Engineering Case Study',
    description:
      'A private platform, documented publicly: product boundaries, protected media, reliable messaging, AI integration, and release engineering.',
    type: 'article',
    url: 'https://mudabbirulsaad.com/projects/openreels',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenReels Engineering Case Study',
    description:
      'How a working video platform became safer to change, test, and operate without hiding its tradeoffs.',
  },
}

const navigation = [
  ['01', 'Context', '#context'],
  ['02', 'Architecture', '#architecture'],
  ['03', 'Decisions', '#decisions'],
  ['04', 'Delivery', '#delivery'],
  ['05', 'Evidence', '#evidence'],
  ['06', 'Outcome', '#outcome'],
] as const

const headlineEvidence = [
  {
    value: '16',
    label: 'independent component images',
    note: 'plus three Worker bundles and a recovery artifact',
  },
  {
    value: '1,019',
    label: 'listed passing tests',
    note: 'across contracts, services, infrastructure, routes and policy',
  },
  {
    value: '82',
    label: 'governed database relations',
    note: '63 owner tables and 19 consumer Read Models',
  },
  {
    value: '20',
    label: 'release-manifest subjects',
    note: 'all bound to one exact source revision',
  },
] as const

const beforeAfter = [
  {
    before: 'Service boundaries were visible in the process diagram.',
    after: 'Product boundaries became executable through shared runtime contracts and owner interfaces.',
  },
  {
    before: 'A dependency outage could look like an empty product state.',
    after: 'Empty and Unavailable became different results, with different UI and recovery behaviour.',
  },
  {
    before: 'Frontend work could require the database, queue, mail, storage and cloud configuration.',
    after: 'Real routes run against deterministic, authenticated scenarios without Docker or cloud credentials.',
  },
  {
    before: 'Processes shared schema knowledge and convenient cross-domain access.',
    after: 'Owners write their own state; other modules use contracts, Read Models, events or commands.',
  },
] as const

const architectureLanes = [
  {
    label: 'Product request',
    icon: Waypoints,
    nodes: ['Browser', 'Nginx', 'Next.js', 'Product interface', 'Bun owner service'],
    caption: 'The UI does not reach into Product tables. It crosses an application boundary with a validated result.',
  },
  {
    label: 'State and effects',
    icon: Database,
    nodes: ['Owner transaction', 'PostgreSQL', 'Owner outbox', 'RabbitMQ', 'Consumer receipt'],
    caption: 'A state change and its message are committed together; consumers remain safe under at-least-once delivery.',
  },
  {
    label: 'Protected bytes',
    icon: ShieldCheck,
    nodes: ['Upload session', 'Private ingest', 'Owner verification', 'Exact media grant', 'Cloudflare Worker'],
    caption: 'Authentication and authorization happen before cache or object access, including HEAD and byte-range requests.',
  },
] as const

const decisions = [
  {
    number: '01',
    title: 'Make product meaning executable',
    icon: Braces,
    summary:
      'TypeScript types alone cannot protect a process boundary. I introduced Zod contracts for requests, results, failures, events and adapter parity.',
    detail:
      'Live HTTP and Socket adapters satisfy the same interfaces as deterministic scenario adapters. This catches drift at the seam and lets the frontend represent dependency failure honestly instead of silently turning it into “no data”.',
    proof: '223 contract and adapter-parity tests',
  },
  {
    number: '02',
    title: 'Enforce ownership before splitting databases',
    icon: Network,
    summary:
      'A database-per-service rewrite would have increased operational risk without solving the immediate design problem.',
    detail:
      'I kept one PostgreSQL cluster, then made ownership real through eleven checksummed owner migration streams, distinct runtime roles, owner commands, consumer Read Models and a blocking source scan. The app has connectivity for health checks but no Product-table privilege.',
    proof: '63 owner tables · 19 Read Models · 11 owner ledgers',
  },
  {
    number: '03',
    title: 'Design asynchronous work for duplicates and failure',
    icon: Radio,
    summary:
      'Publishing after a database commit leaves a crash window. Publishing before it risks announcing state that never existed.',
    detail:
      'Transactional owner outboxes, independently credentialed relays, RabbitMQ confirms and consumer-owned receipts make at-least-once delivery explicit. Invalid messages are quarantined, transient work retries within bounds, and redrive is preview-first and allowlisted.',
    proof: '4 owner relays · 9 broker identities · bounded DLQ redrive',
  },
  {
    number: '04',
    title: 'Treat protected media as an authorization system',
    icon: ShieldCheck,
    summary:
      'A private bucket is not enough once media is cached, streamed, renewed and removed across product surfaces.',
    detail:
      'OpenReels separates ingest, product, chat and moderation storage. Product records keep opaque asset identities, while short-lived viewer-and-asset-bound grants protect delivery. Long-lived pages renew exact visible assets without reloading the feed or weakening grant lifetime.',
    proof: '3 Worker programs · auth before cache · range-safe playback',
  },
  {
    number: '05',
    title: 'Keep AI useful—and absent when it is unsafe',
    icon: Bot,
    summary:
      'The Knowledge Assistant is a Product Module, not a chat box pasted onto the interface.',
    detail:
      'Availability requires the deployment switch, provider readiness, published knowledge and administrator enablement. If any gate fails, the user boundary returns a generic 404 and Social removes the Assistant from conversation, search and unread surfaces. The current capability is retrieval-only; no agentic tool can execute.',
    proof: 'immutable knowledge revisions · cited answers · no executable tools',
  },
] as const

const releaseSteps = [
  {
    label: 'Qualify the change',
    text: 'A ready pull request produces a deterministic validation plan and evidence bound to the exact tested Git tree.',
  },
  {
    label: 'Build exact artifacts',
    text: 'Sixteen minimal non-root component images and three Worker bundles are built from one full source SHA.',
  },
  {
    label: 'Assemble the manifest',
    text: 'Digests, compatibility fingerprints, provenance subjects and the bounded recovery image become one attested release identity.',
  },
  {
    label: 'Select production manually',
    text: 'Production accepts only a complete beta SHA. Database changes move forward; application rollback is allowed only when compatibility is proven.',
  },
  {
    label: 'Prove the serving system',
    text: 'Health, workload trust, Workers, storage, TLS and external smoke checks must pass before finalization.',
  },
] as const

const testEvidence = [
  { label: 'Architecture & ownership', value: 256, width: '88%' },
  { label: 'Backend behaviour', value: 290, width: '100%' },
  { label: 'Contracts & adapters', value: 223, width: '77%' },
  { label: 'Infrastructure integration', value: 73, width: '25%' },
  { label: 'Development runtime', value: 70, width: '24%' },
  { label: 'Frontend routes', value: 62, width: '21%' },
  { label: 'Workers & media', value: 38, width: '13%' },
  { label: 'Messaging integration', value: 7, width: '3%' },
] as const

const outcomes = [
  'Frontend work can use the real Next.js routes, layouts, authentication semantics and deterministic failure states without Product infrastructure.',
  'A backend change can start one watched process with only the dependencies it actually needs.',
  'Architecture violations, contract drift and unsafe release assumptions fail before publication instead of becoming production surprises.',
  'Protected media, messaging and AI capability changes now include recovery behaviour as part of the feature—not as a later operations task.',
] as const

const constraints = [
  'OpenReels is still one private monorepo operated by one developer.',
  'Compact production retains one PostgreSQL failure domain and 21 documented cross-owner foreign keys.',
  'Some legacy Server Actions still map transport details outside deeper Product interfaces.',
  'The provider-neutral Scale package is executable design evidence, not proof that multi-region production is active.',
  'Repository-wide lint still has a visible historical backlog; touched code must not make it worse.',
] as const

const lessons = [
  {
    title: 'Reliability starts with language.',
    text: 'Once Empty, Unavailable, Event, Command and owner boundaries had precise meanings, the code and tests became much easier to reason about.',
  },
  {
    title: 'Security is a complete path.',
    text: 'A media rule is incomplete unless issuance, renewal, cache lookup, range delivery, invalidation and rollback all agree on it.',
  },
  {
    title: 'Architecture must fit its operator.',
    text: 'The goal was not to imitate a large company. It was to gain independent change boundaries while keeping recovery understandable for one person.',
  },
] as const

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-primary">
      <span>{number}</span>
      <span className="h-px w-10 bg-primary/50" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export default function OpenReelsCaseStudyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div
        className="pointer-events-none fixed inset-0 opacity-50"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[92rem] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="flex items-center justify-between border-b border-border/70 pb-5">
          <Link
            href="/#projects"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            Selected projects
          </Link>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
            Engineering case study / 2026
          </span>
        </div>

        <header className="relative pb-20 pt-14 sm:pb-28 sm:pt-20 lg:pb-32">
          <div className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-14 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 border border-border bg-background/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                <LockKeyhole className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Private codebase · Sanitized public record
              </div>
              <p className="mt-9 max-w-3xl font-mono text-xs uppercase tracking-[0.28em] text-primary">
                Product architecture / platform engineering / resilient delivery
              </p>
              <h1 className="mt-5 max-w-5xl text-[clamp(4.5rem,14vw,11rem)] font-bold leading-[0.78] tracking-[-0.075em] font-display">
                Open
                <span className="text-primary">Reels</span>
              </h1>
              <p className="mt-10 max-w-4xl text-xl leading-8 text-muted-foreground sm:text-2xl sm:leading-9 lg:text-3xl lg:leading-[1.35]">
                I took a working video and social platform whose services were separated mostly on paper—and made its boundaries testable, its failures visible, and its releases safer to operate alone.
              </p>
            </div>

            <aside className="border-l border-primary/40 pl-6 sm:pl-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Project brief</p>
              <dl className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-t border-border/60 pt-4">
                  <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Role</dt>
                  <dd>Solo product and platform engineer</dd>
                </div>
                <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-t border-border/60 pt-4">
                  <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Status</dt>
                  <dd>Production-oriented · Active development</dd>
                </div>
                <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-t border-border/60 pt-4">
                  <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Core stack</dt>
                  <dd>Next.js, Bun, PostgreSQL, RabbitMQ, Redis, Cloudflare</dd>
                </div>
                <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-t border-border/60 pt-4">
                  <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Focus</dt>
                  <dd>Boundaries, protected media, messaging, AI and CI/CD</dd>
                </div>
              </dl>
            </aside>
          </div>
        </header>

        <section aria-label="Project evidence at a glance" className="border-y border-border/70 bg-muted/10">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {headlineEvidence.map((item, index) => (
              <div
                key={item.label}
                className={`p-6 sm:p-8 ${
                  index === 0
                    ? ''
                    : index === 1
                      ? 'border-t border-border/70 sm:border-l sm:border-t-0'
                      : index === 2
                        ? 'border-t border-border/70 xl:border-l xl:border-t-0'
                        : 'border-t border-border/70 sm:border-l xl:border-t-0'
                }`}
              >
                <div className="font-mono text-4xl font-semibold tracking-[-0.06em] text-primary sm:text-5xl">{item.value}</div>
                <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-14 py-20 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-20 lg:py-28">
          <nav aria-label="Case study sections" className="hidden lg:block">
            <div className="sticky top-10 border-l border-border pl-5">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">On this page</p>
              <ol className="space-y-3">
                {navigation.map(([number, label, href]) => (
                  <li key={href}>
                    <a href={href} className="group flex items-baseline gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      <span className="font-mono text-[10px] text-primary/70 group-hover:text-primary">{number}</span>
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="min-w-0">
            <section id="context" className="scroll-mt-10">
              <SectionLabel number="01">Context</SectionLabel>
              <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
                <div>
                  <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
                    The difficult part was not adding more services.
                  </h2>
                  <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground">
                    OpenReels already had Next.js, Bun processes, PostgreSQL, Redis, RabbitMQ, private object storage and an authenticated CDN path. It looked service-oriented. In practice, pages still knew transport details, processes shared schema knowledge, local development needed too much infrastructure, and a failed dependency could quietly masquerade as an empty screen.
                  </p>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                    At the same time, production behaviour already mattered. I could not “clean up” the architecture by casually replacing protected media, rewriting the database, or weakening the exact-SHA release path. The migration had to improve changeability while keeping every existing safety boundary explainable and recoverable.
                  </p>
                </div>
                <blockquote className="self-start border-l-2 border-primary bg-primary/[0.04] px-6 py-7">
                  <p className="text-xl font-semibold leading-8 text-foreground">
                    A process boundary is not a product boundary if callers still share its assumptions, tables and failure shortcuts.
                  </p>
                  <footer className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The design thesis</footer>
                </blockquote>
              </div>

              <div className="mt-14 border border-border/70">
                <div className="grid grid-cols-2 border-b border-border/70 bg-muted/20 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <div className="p-4">Before</div>
                  <div className="border-l border-border/70 p-4">After</div>
                </div>
                {beforeAfter.map((item, index) => (
                  <div key={item.before} className={`grid md:grid-cols-2 ${index > 0 ? 'border-t border-border/70' : ''}`}>
                    <p className="p-5 leading-7 text-muted-foreground sm:p-6">{item.before}</p>
                    <p className="border-t border-border/70 p-5 leading-7 text-foreground md:border-l md:border-t-0 sm:p-6">
                      {item.after}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="architecture" className="scroll-mt-10 pt-28">
              <SectionLabel number="02">Architecture</SectionLabel>
              <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
                  Three paths, each with a different trust boundary.
                </h2>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  This public map deliberately excludes credentials, internal addresses and operating procedures. It shows responsibility—not exploitable topology.
                </p>
              </div>

              <div className="mt-12 space-y-4">
                {architectureLanes.map((lane) => {
                  const Icon = lane.icon
                  return (
                    <article key={lane.label} className="border border-border/70 bg-background/70 p-5 backdrop-blur sm:p-7">
                      <div className="grid gap-6 xl:grid-cols-[11rem_minmax(0,1fr)]">
                        <div>
                          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                          <h3 className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-foreground">{lane.label}</h3>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {lane.nodes.map((node, index) => (
                              <div key={node} className="contents">
                                <span className="border border-border bg-muted/20 px-3 py-2 font-mono text-[11px] text-foreground">{node}</span>
                                {index < lane.nodes.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />}
                              </div>
                            ))}
                          </div>
                          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{lane.caption}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="mt-8 grid gap-px overflow-hidden border border-border/70 bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Product', 'Next.js 16 · React 19 · Bun'],
                  ['State', 'PostgreSQL 15 · Redis 7'],
                  ['Messaging', 'RabbitMQ 4 · owner relays'],
                  ['Delivery', 'Cloudflare Workers · private R2'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-background p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="decisions" className="scroll-mt-10 pt-28">
              <SectionLabel number="03">Decisions</SectionLabel>
              <h2 className="mt-8 max-w-3xl text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
                The choices that changed how the system behaves.
              </h2>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                These were not technology swaps. Each decision changed who owns a fact, how failure is represented, or what evidence is required before a change becomes real.
              </p>

              <div className="mt-12 border-t border-border/70">
                {decisions.map((decision) => {
                  const Icon = decision.icon
                  return (
                    <article key={decision.number} className="grid gap-6 border-b border-border/70 py-10 md:grid-cols-[6rem_minmax(0,1fr)] md:py-12">
                      <div className="flex items-center gap-4 md:block">
                        <span className="font-mono text-4xl font-semibold tracking-[-0.08em] text-primary/80">{decision.number}</span>
                        <Icon className="h-5 w-5 text-primary md:mt-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight font-display sm:text-3xl">{decision.title}</h3>
                        <p className="mt-4 max-w-3xl text-lg leading-8 text-foreground">{decision.summary}</p>
                        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{decision.detail}</p>
                        <div className="mt-6 inline-flex items-center gap-2 border-l-2 border-primary bg-primary/[0.04] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {decision.proof}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section id="delivery" className="scroll-mt-10 pt-28">
              <SectionLabel number="04">Delivery</SectionLabel>
              <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div>
                  <h2 className="text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
                    Production safety became a compatibility problem.
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    “The previous version was healthy” is not enough if contracts, database shape or trust policy have changed. Releases now carry the evidence needed to decide whether one component can move alone, whether a coordinated rollout is required, and whether application rollback remains legal.
                  </p>
                  <div className="mt-8 border-l border-primary/50 pl-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Non-negotiable</p>
                    <p className="mt-3 leading-7 text-foreground">
                      Database evolution is forward-only. Production is a separate manual action selecting a complete, validated beta SHA.
                    </p>
                  </div>
                </div>

                <ol className="border-t border-border/70">
                  {releaseSteps.map((step, index) => (
                    <li key={step.label} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-border/70 py-6 sm:grid-cols-[4rem_11rem_minmax(0,1fr)]">
                      <span className="font-mono text-xs text-primary">0{index + 1}</span>
                      <strong className="col-start-2 font-semibold text-foreground">{step.label}</strong>
                      <p className="col-start-2 text-sm leading-6 text-muted-foreground sm:col-start-3">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-12 grid gap-px overflow-hidden border border-border/70 bg-border/70 md:grid-cols-3">
                <div className="bg-muted/10 p-6">
                  <GitBranch className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold">Tree-qualified CI</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Validation evidence is bound to the tested tree, policy digest and selected suites—not just a green check with an ambiguous source.</p>
                </div>
                <div className="bg-muted/10 p-6">
                  <ServerCog className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold">Minimal artifacts</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Each runtime carries its declared entry point and dependency closure, runs non-root and is selected by digest.</p>
                </div>
                <div className="bg-muted/10 p-6">
                  <CloudCog className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold">Pre-traffic trust proof</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Candidate services and Workers prove caller identity, audience, route binding and replay rejection before ordinary traffic moves.</p>
                </div>
              </div>
            </section>

            <section id="evidence" className="scroll-mt-10 pt-28">
              <SectionLabel number="05">Evidence</SectionLabel>
              <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                <div>
                  <h2 className="text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
                    Proof, not adjectives.
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    The August 2026 test inventory lists 1,019 passing tests. Typechecks, schema checks, migration replays, Compose rendering, shell analysis, Worker dry runs, image inspection, vulnerability scans and external production smoke checks are additional gates—not padded into that number.
                  </p>
                  <div className="mt-8 flex items-start gap-3 border border-border/70 p-5 text-sm leading-6 text-muted-foreground">
                    <TestTube2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <p>Integration suites use disposable PostgreSQL, RabbitMQ, Mailpit and MinIO. They are explicitly forbidden from targeting shared or production systems.</p>
                  </div>
                </div>

                <div className="border border-border/70 p-5 sm:p-7">
                  <div className="flex items-end justify-between border-b border-border/70 pb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Executable test inventory</p>
                    <p className="font-mono text-3xl font-semibold tracking-[-0.06em] text-primary">1,019</p>
                  </div>
                  <div className="mt-6 space-y-5">
                    {testEvidence.map((item) => (
                      <div key={item.label}>
                        <div className="flex items-baseline justify-between gap-4 text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-mono text-xs text-foreground">{item.value}</span>
                        </div>
                        <div className="mt-2 h-1 bg-muted">
                          <div className="h-full bg-primary" style={{ width: item.width }} aria-hidden="true" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Failure', 'dependency loss, recovery, drain and bounded retry'],
                  ['Security', 'auth, ownership, replay, cache and grant denial'],
                  ['Compatibility', 'twice-applied migrations and old/new contract overlap'],
                  ['Operations', 'health, evidence, rollback and exact artifact identity'],
                ].map(([title, text]) => (
                  <div key={title} className="border-l border-primary/50 bg-muted/10 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{title}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="outcome" className="scroll-mt-10 pt-28">
              <SectionLabel number="06">Outcome</SectionLabel>
              <h2 className="mt-8 max-w-4xl text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
                The system became easier to change without becoming dishonest about its complexity.
              </h2>

              <div className="mt-12 grid gap-12 xl:grid-cols-2">
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-primary">What improved</h3>
                  <ul className="mt-6 space-y-5">
                    {outcomes.map((outcome) => (
                      <li key={outcome} className="flex gap-3 leading-7 text-muted-foreground">
                        <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">
                    <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                    Honest constraints
                  </h3>
                  <ul className="mt-6 space-y-5">
                    {constraints.map((constraint) => (
                      <li key={constraint} className="flex gap-3 leading-7 text-muted-foreground">
                        <span className="mt-3 h-px w-4 shrink-0 bg-border" aria-hidden="true" />
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-20 border-y border-border/70 py-10 sm:py-14">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">What I took from the work</p>
                <div className="mt-8 grid gap-10 lg:grid-cols-3">
                  {lessons.map((lesson, index) => (
                    <article key={lesson.title}>
                      <span className="font-mono text-xs text-primary">0{index + 1}</span>
                      <h3 className="mt-4 text-xl font-semibold leading-7">{lesson.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{lesson.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <footer className="pb-10 pt-20">
              <div className="relative overflow-hidden border border-primary/30 bg-primary/[0.045] p-7 sm:p-10 lg:p-12">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Continue the conversation</p>
                    <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight font-display sm:text-4xl">
                      Want to discuss the decisions behind the diagrams?
                    </h2>
                    <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                      The repository is private, but the reasoning is not. I am happy to talk through the tradeoffs, failure cases and lessons from building it.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                    <Link
                      href="/#contact"
                      className="group inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      Contact me
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                    <a
                      href="https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/60"
                    >
                      LinkedIn
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
              <p className="mt-6 max-w-3xl font-mono text-[10px] leading-5 text-muted-foreground">
                Public disclosure boundary: no credentials, private addresses, secret names, production access instructions, customer data or exploit-ready topology are included in this case study.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  )
}
