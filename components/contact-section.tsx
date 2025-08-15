import { Mail, Linkedin, Github, MessageCircle, Facebook, Instagram, GraduationCap } from "lucide-react"
import { AnimatedSection, AnimatedCard } from "./animations"
import { RevealLinkCard, RevealSocialCard, RevealInfoCard, RevealCard } from "./reveal-card"

export function ContactSection() {
  const contactMethods = [
    {
      title: "Email",
      value: "mudabbirulsaad@gmail.com",
      description: "Best for professional inquiries and collaboration opportunities",
      icon: Mail,
      link: "mailto:mudabbirulsaad@gmail.com"
    },
    {
      title: "LinkedIn",
      value: "linkedin.com/in/mudabbirul-saad-b71a0a211",
      description: "Connect with me for professional networking and updates",
      icon: Linkedin,
      link: "https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/"
    },
    {
      title: "GitHub",
      value: "github.com/mudabbirulsaad",
      description: "Explore my code repositories and open-source contributions",
      icon: Github,
      link: "https://github.com/mudabbirulsaad"
    },
    {
      title: "Telegram",
      value: "t.me/mudabbirulsaad",
      description: "Quick messaging and tech discussions",
      icon: MessageCircle,
      link: "https://t.me/mudabbirulsaad"
    }
  ]

  const socialLinks = [
    {
      title: "Facebook",
      value: "facebook.com/MudabbirulSaad",
      icon: Facebook,
      link: "https://www.facebook.com/MudabbirulSaad"
    },
    {
      title: "Instagram",
      value: "instagram.com/mudabbirulsaad",
      icon: Instagram,
      link: "https://www.instagram.com/mudabbirulsaad"
    }
  ]

  return (
    <section id="contact" className="py-20 sm:py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeUp" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-serif">
              Let&apos;s Connect
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              I&apos;m always interested in discussing AI, technology trends, and potential collaboration opportunities.
              Feel free to reach out through any of the channels below.
            </p>
          </AnimatedSection>

          {/* Primary Contact Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mb-16 max-w-5xl mx-auto">
            {contactMethods.map((method, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <RevealLinkCard
                  href={method.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-full"
                >
                <div className="flex items-start space-x-5 p-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/8 group-hover:scale-110 group-hover:from-primary/25 group-hover:to-primary/15 transition-all duration-300 text-primary flex-shrink-0">
                    <method.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {method.title}
                    </h3>
                    <p className="text-foreground font-semibold mb-4 text-base sm:text-lg break-words">
                      {method.value}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {method.description}
                    </p>
                  </div>
                </div>
              </RevealLinkCard>
              </AnimatedCard>
            ))}
          </div>

          {/* Social Media Links */}
          <AnimatedSection animation="fadeUp" delay={0.2} className="mb-16">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-8 text-center">
              Follow Me
            </h3>
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-6 sm:gap-8 max-w-md sm:max-w-none mx-auto">
              {socialLinks.map((social, index) => (
                <AnimatedCard key={index} delay={0.3 + index * 0.1}>
                  <RevealSocialCard className="h-full">
                    <a
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                  <div className="text-center p-2">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/8 group-hover:scale-110 group-hover:from-primary/25 group-hover:to-primary/15 transition-all duration-300 inline-flex items-center justify-center mb-4 text-primary">
                      <social.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {social.title}
                    </p>
                  </div>
                    </a>
                  </RevealSocialCard>
                </AnimatedCard>
              ))}
            </div>
          </AnimatedSection>

          {/* University Information */}
          <AnimatedSection animation="fadeUp" delay={0.4}>
            <RevealInfoCard className="mb-16">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-amber-600 dark:text-amber-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  University
                </h3>
                <p className="text-foreground font-semibold mb-3 text-base">
                  Swinburne University of Technology
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Currently pursuing Bachelor&apos;s in Artificial Intelligence
                </p>
              </div>
            </div>
            </RevealInfoCard>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={0.6}>
            <RevealCard className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 hover:bg-background/90 transition-all duration-500 text-center">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Open to Opportunities
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                As a dedicated AI student, I&apos;m actively seeking internships, research opportunities,
                and collaborative projects that align with my passion for artificial intelligence and software development.
                I&apos;m particularly interested in roles that combine technical challenges with innovative problem-solving.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                    <span className="font-semibold text-primary">Internships</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Available for internships</p>
                </div>
                <div className="bg-secondary/10 rounded-2xl p-4 border border-secondary/20">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-secondary rounded-full mr-2"></div>
                    <span className="font-semibold text-secondary-foreground">Collaboration</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Open to collaboration</p>
                </div>
                <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-accent rounded-full mr-2"></div>
                    <span className="font-semibold text-accent-foreground">Research</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Research opportunities</p>
                </div>
              </div>
            </RevealCard>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
