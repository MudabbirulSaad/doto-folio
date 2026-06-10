import { AnimatedSection, AnimatedCard } from "./animations"
import { RevealCard } from "./reveal-card"
import { SectionNebula } from "./section-nebula"
import type { PublicSkill } from "@/lib/server/application/content/public-portfolio"

interface SkillsSectionProps {
  skills?: PublicSkill[]
}

function proficiencyLevel(proficiency: number) {
  if (proficiency >= 85) return 'Advanced'
  if (proficiency >= 60) return 'Intermediate'
  return 'Learning'
}

export function SkillsSection({ skills = [] }: SkillsSectionProps) {
  const skillCategories = Object.entries(
    skills.reduce<Record<string, PublicSkill[]>>((groups, skill) => {
      groups[skill.category] = [...(groups[skill.category] || []), skill]
      return groups
    }, {})
  )

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'Intermediate':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20'
      case 'Learning':
        return 'bg-accent/10 text-accent-foreground border-accent/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <section id="skills" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden z-0">
      <SectionNebula />
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-display">
              Skills & Expertise
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              A comprehensive overview of my technical skills and areas of expertise,
              continuously expanding through academic study and hands-on project development.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {skillCategories.map(([category, categorySkills], categoryIndex) => (
              <AnimatedCard key={category} delay={categoryIndex * 0.1}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-6 text-center">
                    {category}
                  </h3>

                  <div className="space-y-4">
                    {categorySkills.map((skill) => {
                      const level = proficiencyLevel(skill.proficiency)
                      return (
                      <RevealCard key={skill.id} className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 hover:bg-background/90 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{skill.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(level)}`}>
                            {level}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.proficiency}% proficiency</p>
                      </RevealCard>
                      )
                    })}
                  </div>
                </RevealCard>
              </AnimatedCard>
            ))}
          </div>

          <div className="mt-16 text-center">
            <AnimatedSection animation="fadeUp" delay={0.6}>
              <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-foreground mb-4">Continuous Learning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  As an AI student, I&apos;m constantly expanding my skill set through coursework, personal projects,
                  and staying current with the latest technology trends. My focus is on building a strong foundation
                  in both theoretical knowledge and practical application.
                </p>
              </RevealCard>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
}
