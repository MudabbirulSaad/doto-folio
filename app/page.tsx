import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { ProjectsSection } from "@/components/projects-section"
import { SkillsSection } from "@/components/skills-section"
import { ContactSection } from "@/components/contact-section"
import { ContactFormSection } from "@/components/contact-form-section"
import { FooterSection } from "@/components/footer-section"
import { PageLoadingOverlay } from "@/components/animations"
import { DynamicSEO } from "@/components/seo/dynamic-seo"
import { PerformanceSEO } from "@/components/seo/performance-seo"
import { createPublicPortfolioContentUseCase } from "@/lib/server/composition/content"

export default async function Home() {
  const getPublicPortfolioContent = await createPublicPortfolioContentUseCase()
  const portfolio = await getPublicPortfolioContent()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DynamicSEO content={portfolio.siteContent} />
      <PerformanceSEO />
      <PageLoadingOverlay />
      <Navigation />
      <main>
        <HeroSection content={portfolio.siteContent} />
        <AboutSection content={portfolio.siteContent} />
        <ProjectsSection projects={portfolio.projects} />
        <SkillsSection skills={portfolio.skills} />
        <ContactSection
          content={portfolio.siteContent}
          contactMethods={portfolio.contactMethods}
          socialLinks={portfolio.socialLinks}
        />
        <ContactFormSection />
      </main>
      <FooterSection content={portfolio.siteContent} socialLinks={portfolio.socialLinks} />
    </div>
  );
}
