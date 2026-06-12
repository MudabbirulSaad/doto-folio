import Link from "next/link"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react"
import { AnimatedCard, AnimatedSection } from "./animations"
import { RevealCard } from "./reveal-card"
import { SectionNebula } from "./section-nebula"
import type {
  PublicSkill,
  PublicSkillCapability
} from "@/lib/server/application/content/public-portfolio"

interface SkillsSectionProps {
  skills?: PublicSkill[]
  capabilities?: PublicSkillCapability[]
}

function iconFor(name: string) {
  const iconMap = LucideIcons as unknown as Record<string, LucideIcon>
  return iconMap[name] || Sparkles
}

function fallbackCapabilities(skills: PublicSkill[]): PublicSkillCapability[] {
  const grouped = skills.reduce<Record<string, PublicSkill[]>>((groups, skill) => {
    groups[skill.category] = [...(groups[skill.category] || []), skill]
    return groups
  }, {})

  return Object.entries(grouped).map(([category, categorySkills], index) => ({
    id: `legacy-${category}`,
    title: category,
    summary: "A focused toolset used across portfolio, content, and product development work.",
    icon_name: categorySkills[0]?.icon_name || "Sparkles",
    display_order: index + 1,
    is_published: true,
    evidence: categorySkills.map((skill, skillIndex) => ({
      id: skill.id,
      capability_id: `legacy-${category}`,
      label: skill.name,
      description: `${skill.name} is part of the delivery stack behind this portfolio and its admin CMS.`,
      technologies: [skill.name],
      proof_label: null,
      proof_url: null,
      display_order: skillIndex + 1,
      is_published: true
    }))
  }))
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

export function SkillsSection({ skills = [], capabilities = [] }: SkillsSectionProps) {
  const capabilityMatrix = capabilities.length > 0 ? capabilities : fallbackCapabilities(skills)

  if (capabilityMatrix.length === 0) return null

  return (
    <section id="skills" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden z-0">
      <SectionNebula />
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fadeUp">
            <div className="mb-14 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-5">
                <Sparkles className="w-4 h-4" />
                Skills as evidence
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 font-display">
                Proof-backed capabilities
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                I do not want you to guess what I can do from tool names. These are the product capabilities I can bring to a team, backed by real systems in this portfolio.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {capabilityMatrix.map((capability, index) => {
              const Icon = iconFor(capability.icon_name)

              return (
                <AnimatedCard key={capability.id} delay={index * 0.08}>
                  <RevealCard className="h-full bg-background/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                          {capability.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {capability.summary}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {capability.evidence.map((evidence) => (
                        <div key={evidence.id} className="rounded-xl border border-border/50 bg-background/70 p-4">
                          <div className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-semibold text-foreground mb-1">{evidence.label}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{evidence.description}</p>
                            </div>
                          </div>

                          {evidence.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {evidence.technologies.map((technology) => (
                                <span key={technology} className="px-2.5 py-1 rounded-full border border-border/70 bg-muted/30 text-xs text-muted-foreground">
                                  {technology}
                                </span>
                              ))}
                            </div>
                          )}

                          {evidence.proof_url && evidence.proof_label && (
                            <Link
                              href={evidence.proof_url}
                              target={isExternalUrl(evidence.proof_url) ? "_blank" : undefined}
                              rel={isExternalUrl(evidence.proof_url) ? "noreferrer" : undefined}
                              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              {evidence.proof_label}
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </RevealCard>
                </AnimatedCard>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
