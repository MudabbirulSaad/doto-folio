import { AnimatedCard } from "./animations"
import { RevealCard } from "./reveal-card"

export function AboutSection() {
  return (
    <section id="about" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-12 font-serif text-center">
            About Me
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                I&apos;m <span className="text-foreground font-semibold">Mudabbirul Saad</span>, a passionate Bachelor&apos;s degree student at
                <span className="text-foreground font-semibold"> Swinburne University of Technology</span>, majoring in
                <span className="text-foreground font-semibold"> Artificial Intelligence</span>.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                My journey in technology is driven by a deep fascination with how intelligent systems can transform
                the way we interact with digital experiences. I thrive in quiet, focused environments where I can
                dive deep into complex problems and emerge with elegant solutions.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                When I&apos;m not immersed in coursework, you&apos;ll find me coding personal projects, watching the latest
                tech content, and staying current with emerging technology trends. I believe that continuous learning
                and hands-on experimentation are the keys to mastering the rapidly evolving field of AI.
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-6">
              <AnimatedCard delay={0.2}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-4">Education</h3>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Bachelor&apos;s Degree</span><br />
                    Artificial Intelligence<br />
                    Swinburne University of Technology
                  </p>
                </RevealCard>
              </AnimatedCard>

              <AnimatedCard delay={0.4}>
                <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500">
                  <h3 className="text-xl font-bold text-foreground mb-4">Approach</h3>
                  <p className="text-muted-foreground">
                    I believe in building beautiful, intelligent digital experiences through focused work,
                    continuous learning, and staying at the forefront of technological innovation.
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
