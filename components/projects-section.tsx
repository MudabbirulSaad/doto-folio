import { AnimatedSection, AnimatedCard } from "./animations"
import { RevealCard } from "./reveal-card"

export function ProjectsSection() {
  const projectPlaceholders = [
    {
      title: "AI-Powered Application",
      description: "Intelligent system leveraging machine learning algorithms to solve complex problems.",
      technologies: ["Python", "Pytorch", "Node.js"],
      status: "In Development"
    },
    {
      title: "Web Development Project",
      description: "Full-stack web application with modern design and responsive functionality.",
      technologies: ["JavaScript", "HTML", "CSS", "Node.js"],
      status: "Completed"
    },
    {
      title: "Data Analysis Tool",
      description: "Comprehensive data processing and visualization tool for insights generation.",
      technologies: ["Python", "C++", "JavaScript"],
      status: "Planning"
    }
  ]

  return (
    <section id="projects" className="py-20 sm:py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-serif">
              Projects
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              A showcase of my work in artificial intelligence, web development, and software engineering.
              Each project represents my commitment to building intelligent, user-focused solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectPlaceholders.map((project, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    project.status === 'Completed' ? 'bg-primary/10 text-primary border-primary/20' :
                    project.status === 'In Development' ? 'bg-secondary/10 text-secondary-foreground border-secondary/20' :
                    'bg-accent/10 text-accent-foreground border-accent/20'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {project.title}
                </h3>

                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className="px-2 py-1 bg-muted/50 text-muted-foreground text-sm rounded-md">
                      {tech}
                    </span>
                  ))}
                </div>
                </RevealCard>
              </AnimatedCard>
            ))}
          </div>

          <div className="mt-12">
            <AnimatedSection animation="fadeUp" delay={0.4}>
              <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500 text-center max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-foreground mb-4">Coming Soon</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  More projects coming soon as I continue my journey in AI and software development.
                </p>
                <div className="inline-flex items-center text-sm text-primary font-medium">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                  Currently working on exciting new projects
                </div>
              </RevealCard>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
}
