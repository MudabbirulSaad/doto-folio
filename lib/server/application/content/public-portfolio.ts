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

export interface PublicSkill {
  id: string
  name: string
  category: string
  proficiency: number
  icon_name: string
  display_order: number
  is_published?: boolean
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
  listPublishedSkills(): Promise<PublicSkill[]>
  listPublishedContactMethods(): Promise<PublicContactMethod[]>
  listPublishedSocialLinks(): Promise<PublicSocialLink[]>
}

export interface PublicPortfolioContent {
  siteContent: Record<string, unknown>
  projects: PublicProject[]
  skills: PublicSkill[]
  contactMethods: PublicContactMethod[]
  socialLinks: PublicSocialLink[]
}

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

export async function getPublicPortfolioContent(
  repository: PublicPortfolioRepository
): Promise<PublicPortfolioContent> {
  const [siteContent, projects, skills, contactMethods, socialLinks] = await Promise.all([
    repository.getPublishedSiteContent(),
    repository.listPublishedProjects(),
    repository.listPublishedSkills(),
    repository.listPublishedContactMethods(),
    repository.listPublishedSocialLinks()
  ])

  return {
    siteContent: siteContent || DEFAULT_SITE_CONTENT,
    projects: published(projects).sort(byDisplayOrder).map(sortProject),
    skills: published(skills).sort(byDisplayOrder),
    contactMethods: published(contactMethods).sort(byDisplayOrder),
    socialLinks: published(socialLinks).sort(byDisplayOrder)
  }
}
