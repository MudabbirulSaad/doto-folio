import { AnimatedCard } from "./animations"
import { RevealCard } from "./reveal-card"
import { SectionNebula } from "./section-nebula"

interface AboutSectionProps {
  content: Record<string, unknown>
}

function text(content: Record<string, unknown>, key: string) {
  return String(content[key] || '')
}

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <section id="about" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden z-0">
      <SectionNebula />
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-12 font-display text-center">
            {text(content, 'about_title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {text(content, 'about_intro')}
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {text(content, 'about_description')}
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {text(content, 'about_personal')}
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-6">
              <AnimatedCard delay={0.2}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-4">{text(content, 'education_title')}</h3>
                  <p className="text-muted-foreground">
                    <span className="font-medium">{text(content, 'education_degree')}</span><br />
                    {text(content, 'education_field')}<br />
                    {text(content, 'education_institution')}
                  </p>
                </RevealCard>
              </AnimatedCard>

              <AnimatedCard delay={0.4}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-4">{text(content, 'approach_title')}</h3>
                  <p className="text-muted-foreground">
                    {text(content, 'approach_description')}
                  </p>
                </RevealCard>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
