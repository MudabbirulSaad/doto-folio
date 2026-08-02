import { DEFAULT_SITE_CONTENT } from '@/lib/server/application/content/site-content'

export { DEFAULT_SITE_CONTENT }

export interface PublicProjectTechnology {
  id?: string
  technology_name: string
  display_order: number
}

export interface PublicProject {
  id: string
  title: string
  description: string
  status: string
  display_order: number
  is_published?: boolean
  project_technologies?: PublicProjectTechnology[]
}

export interface PublicSkillEvidence {
  id: string
  capability_id: string
  label: string
  description: string
  technologies: string[]
  proof_label?: string | null
  proof_url?: string | null
  display_order: number
  is_published?: boolean
}

export interface PublicSkillCapability {
  id: string
  title: string
  summary: string
  icon_name: string
  display_order: number
  is_published?: boolean
  evidence: PublicSkillEvidence[]
}

export interface PublicContactMethod {
  id: string
  title: string
  value: string
  description: string
  link: string
  icon_name: string
  display_order: number
  is_published?: boolean
}

export interface PublicSocialLink {
  id: string
  platform: string
  username?: string | null
  url: string
  icon_name: string
  display_order: number
  is_published?: boolean
}

export interface PublicPortfolioRepository {
  getPublishedSiteContent(): Promise<Record<string, unknown> | null>
  listPublishedProjects(): Promise<PublicProject[]>
  listPublishedSkillCapabilities(): Promise<PublicSkillCapability[]>
  listPublishedContactMethods(): Promise<PublicContactMethod[]>
  listPublishedSocialLinks(): Promise<PublicSocialLink[]>
}

export interface PublicPortfolioContent {
  siteContent: Record<string, unknown>
  projects: PublicProject[]
  skillCapabilities: PublicSkillCapability[]
  contactMethods: PublicContactMethod[]
  socialLinks: PublicSocialLink[]
}

export const DEFAULT_SOCIAL_LINKS: PublicSocialLink[] = [
  {
    id: 'default-linkedin',
    platform: 'LinkedIn',
    username: 'mudabbirul-saad-b71a0a211',
    url: 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/',
    icon_name: 'Linkedin',
    display_order: 1,
    is_published: true
  }
]

function byDisplayOrder(left: { display_order: number }, right: { display_order: number }) {
  return left.display_order - right.display_order
}

function published<T extends { is_published?: boolean }>(items: T[]) {
  return items.filter(item => item.is_published !== false)
}

function sortProject(project: PublicProject): PublicProject {
  return {
    ...project,
    project_technologies: [...(project.project_technologies || [])].sort(byDisplayOrder)
  }
}

function sortSkillCapability(capability: PublicSkillCapability): PublicSkillCapability {
  return {
    ...capability,
    evidence: published(capability.evidence).sort(byDisplayOrder)
  }
}

export async function getPublicPortfolioContent(
  repository: PublicPortfolioRepository
): Promise<PublicPortfolioContent> {
  const [siteContent, projects, skillCapabilities, contactMethods, socialLinks] = await Promise.all([
    repository.getPublishedSiteContent(),
    repository.listPublishedProjects(),
    repository.listPublishedSkillCapabilities(),
    repository.listPublishedContactMethods(),
    repository.listPublishedSocialLinks()
  ])

  const publishedSocialLinks = published(socialLinks).sort(byDisplayOrder)

  return {
    siteContent: siteContent || DEFAULT_SITE_CONTENT,
    projects: published(projects).sort(byDisplayOrder).map(sortProject),
    skillCapabilities: published(skillCapabilities).sort(byDisplayOrder).map(sortSkillCapability),
    contactMethods: published(contactMethods).sort(byDisplayOrder),
    socialLinks: publishedSocialLinks.length > 0
      ? publishedSocialLinks
      : DEFAULT_SOCIAL_LINKS.map(link => ({ ...link }))
  }
}
