import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AboutSection } from '@/components/about-section'
import { ContactSection } from '@/components/contact-section'
import { FooterSection } from '@/components/footer-section'
import { ProjectsSection } from '@/components/projects-section'
import { SkillsSection } from '@/components/skills-section'

vi.mock('@/components/animations', () => ({
  AnimatedSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AnimatedCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('@/components/reveal-card', () => ({
  RevealCard: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  RevealLinkCard: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  RevealSocialCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RevealInfoCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('@/components/section-nebula', () => ({
  SectionNebula: () => null
}))

describe('public portfolio sections', () => {
  it('renders public projects from backend-shaped data', () => {
    render(
      <ProjectsSection
        projects={[
          {
            id: 'project-1',
            title: 'Backend Portfolio',
            description: 'Real stored project',
            status: 'Completed',
            display_order: 1,
            project_technologies: [
              { technology_name: 'Next.js', display_order: 1 },
              { technology_name: 'Supabase', display_order: 2 }
            ]
          }
        ]}
      />
    )

    expect(screen.getByText('Backend Portfolio')).toBeInTheDocument()
    expect(screen.queryByText('AI-Powered Application')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument()
  })

  it('renders skills grouped from backend-shaped data', () => {
    render(
      <SkillsSection
        skills={[
          { id: 'skill-1', name: 'TypeScript', category: 'Frontend', proficiency: 95, icon_name: 'Code2', display_order: 1 }
        ]}
      />
    )

    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.queryByText('Programming Languages')).not.toBeInTheDocument()
  })

  it('renders about, contact, and footer from stored site/contact content', () => {
    const siteContent = {
      about_title: 'Stored About',
      about_intro: 'Stored intro',
      about_description: 'Stored description',
      about_personal: 'Stored personal note',
      education_title: 'Stored Education',
      education_degree: 'Stored Degree',
      education_field: 'Stored Field',
      education_institution: 'Stored Institution',
      approach_title: 'Stored Approach',
      approach_description: 'Stored approach copy',
      contact_title: 'Stored Contact',
      contact_description: 'Stored contact copy',
      contact_opportunities_title: 'Stored Opportunities',
      contact_opportunities_description: 'Stored opportunity copy',
      footer_brand_name: 'Stored Brand',
      footer_brand_description: 'Stored brand copy',
      footer_location: 'Stored City',
      footer_university: 'Stored University',
      footer_field: 'Stored Major',
      footer_copyright: 'Stored copyright'
    }

    render(
      <>
        <AboutSection content={siteContent} />
        <ContactSection
          content={siteContent}
          contactMethods={[
            { id: 'contact-1', title: 'Stored Email', value: 'stored@example.com', description: 'Stored mail copy', link: 'mailto:stored@example.com', icon_name: 'Mail', display_order: 1 }
          ]}
          socialLinks={[
            { id: 'social-1', platform: 'Stored GitHub', username: 'stored', url: 'https://github.com/stored', icon_name: 'Github', display_order: 1 }
          ]}
        />
        <FooterSection
          content={siteContent}
          socialLinks={[
            { id: 'social-1', platform: 'Stored GitHub', username: 'stored', url: 'https://github.com/stored', icon_name: 'Github', display_order: 1 }
          ]}
        />
      </>
    )

    expect(screen.getByRole('heading', { name: 'Stored About' })).toBeInTheDocument()
    expect(screen.getByText('Stored contact copy')).toBeInTheDocument()
    expect(screen.getByText('Stored opportunity copy')).toBeInTheDocument()
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText('Stored Brand')).toBeInTheDocument()
    expect(within(footer).getByText('Stored Major')).toBeInTheDocument()
  })
})
