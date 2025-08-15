import { AnimatedSection, AnimatedCard } from "./animations"
import { RevealCard } from "./reveal-card"

export function SkillsSection() {
  const skillCategories = [
    {
      title: "Programming Languages",
      skills: [
        { name: "Python", level: "Advanced", description: "AI/ML development, data analysis" },
        { name: "JavaScript", level: "Advanced", description: "Full-stack web development" },
        { name: "Java", level: "Intermediate", description: "Object-oriented programming" },
        { name: "C++", level: "Intermediate", description: "System programming, algorithms" },
        { name: "C", level: "Intermediate", description: "Low-level programming" }
      ]
    },
    {
      title: "Web Technologies",
      skills: [
        { name: "HTML", level: "Advanced", description: "Semantic markup, accessibility" },
        { name: "CSS", level: "Advanced", description: "Modern styling, responsive design" },
        { name: "Node.js", level: "Intermediate", description: "Server-side JavaScript" }
      ]
    },
    {
      title: "Artificial Intelligence",
      skills: [
        { name: "Machine Learning", level: "Intermediate", description: "Algorithm implementation" },
        { name: "Data Analysis", level: "Intermediate", description: "Pattern recognition, insights" },
        { name: "Neural Networks", level: "Learning", description: "Deep learning fundamentals" }
      ]
    }
  ]

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
    <section id="skills" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-serif">
              Skills & Expertise
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              A comprehensive overview of my technical skills and areas of expertise,
              continuously expanding through academic study and hands-on project development.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {skillCategories.map((category, categoryIndex) => (
              <AnimatedCard key={categoryIndex} delay={categoryIndex * 0.1}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                <h3 className="text-xl font-bold text-foreground mb-6 text-center">
                  {category.title}
                </h3>

                <div className="space-y-4">
                  {category.skills.map((skill, skillIndex) => (
                    <RevealCard key={skillIndex} className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 hover:bg-background/90 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{skill.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(skill.level)}`}>
                          {skill.level}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                    </RevealCard>
                  ))}
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
