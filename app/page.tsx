import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { ProjectsSection } from "@/components/projects-section"
import { SkillsSection } from "@/components/skills-section"
import { ContactSection } from "@/components/contact-section"
import { ContactFormSection } from "@/components/contact-form-section"
import { FooterSection } from "@/components/footer-section"
import { PageLoadingOverlay } from "@/components/animations"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoadingOverlay />
      <Navigation />
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
        <ContactFormSection />
      </main>
      <FooterSection />
    </div>
  );
}
