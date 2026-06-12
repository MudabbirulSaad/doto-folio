import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiPrincipal } from '@/lib/auth/api-authorization'
import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from '@/lib/server/application/content/projects'
import {
  getAdminSiteContent,
  getPublishedSiteContent,
  saveSiteContent,
  type SiteContentInput
} from '@/lib/server/application/content/site-content'
import {
  createContactContentItem,
  getContactContent,
  type CreateContactContentInput
} from '@/lib/server/application/content/contact-content'
import {
  createSkillCapability,
  createSkillEvidence,
  deleteSkillCapability,
  deleteSkillEvidence,
  listSkillCapabilities,
  type SkillCapabilityInput,
  type SkillEvidenceInput,
  updateSkillCapability,
  updateSkillEvidence
} from '@/lib/server/application/content/skill-capabilities'
import { getPublicPortfolioContent } from '@/lib/server/application/content/public-portfolio'
import { getAdminContentOverview } from '@/lib/server/application/content/content-overview'
import { createSupabaseProjectRepository } from '@/lib/server/adapters/supabase/content/projects-repository'
import { createSupabaseSiteContentRepository } from '@/lib/server/adapters/supabase/content/site-content-repository'
import { createSupabaseContactContentRepository } from '@/lib/server/adapters/supabase/content/contact-content-repository'
import { createSupabaseSkillCapabilityRepository } from '@/lib/server/adapters/supabase/content/skill-capabilities-repository'
import { createSupabaseAdminContentOverviewRepository } from '@/lib/server/adapters/supabase/content/content-overview-repository'
import type { ProjectInput } from '@/lib/server/application/content/projects'

async function createContentClient(principal?: ApiPrincipal): Promise<SupabaseDataClient> {
  return principal ? createAdminClient() : await createClient()
}

export async function createProjectUseCases(principal?: ApiPrincipal) {
  const repository = createSupabaseProjectRepository(await createContentClient(principal))

  return {
    list: () => listProjects(repository),
    get: (id: string) => getProject(repository, id),
    create: (input: ProjectInput) => createProject(repository, input),
    update: (id: string, input: ProjectInput) => updateProject(repository, id, input),
    delete: (id: string) => deleteProject(repository, id)
  }
}

export async function createSiteContentUseCases(principal?: ApiPrincipal) {
  const repository = createSupabaseSiteContentRepository(await createContentClient(principal))

  return {
    getPublished: () => getPublishedSiteContent(repository),
    getAdmin: () => getAdminSiteContent(repository),
    save: (input: SiteContentInput) => saveSiteContent(repository, input)
  }
}

export async function createContactContentUseCases(principal?: ApiPrincipal) {
  const repository = createSupabaseContactContentRepository(await createContentClient(principal))

  return {
    get: () => getContactContent(repository),
    create: (input: CreateContactContentInput) => createContactContentItem(repository, input)
  }
}

export async function createSkillCapabilityUseCases(principal?: ApiPrincipal) {
  const repository = createSupabaseSkillCapabilityRepository(await createContentClient(principal))

  return {
    list: () => listSkillCapabilities(repository),
    listPublished: () => listSkillCapabilities(repository, { publishedOnly: true }),
    createCapability: (input: SkillCapabilityInput) => createSkillCapability(repository, input),
    updateCapability: (id: string, input: SkillCapabilityInput) => updateSkillCapability(repository, id, input),
    deleteCapability: (id: string) => deleteSkillCapability(repository, id),
    createEvidence: (capabilityId: string, input: SkillEvidenceInput) => createSkillEvidence(repository, capabilityId, input),
    updateEvidence: (id: string, input: SkillEvidenceInput) => updateSkillEvidence(repository, id, input),
    deleteEvidence: (id: string) => deleteSkillEvidence(repository, id)
  }
}

export async function createAdminContentOverviewUseCase(principal?: ApiPrincipal) {
  const repository = createSupabaseAdminContentOverviewRepository(await createContentClient(principal))

  return () => getAdminContentOverview(repository)
}

export async function createPublicPortfolioContentUseCase() {
  const supabase = await createClient()
  const siteContentRepository = createSupabaseSiteContentRepository(supabase)
  const projectRepository = createSupabaseProjectRepository(supabase)
  const skillCapabilityRepository = createSupabaseSkillCapabilityRepository(supabase)
  const contactRepository = createSupabaseContactContentRepository(supabase)

  return () => getPublicPortfolioContent({
    getPublishedSiteContent: () => siteContentRepository.getPublishedSiteContent(),
    listPublishedProjects: () => projectRepository.listProjects(),
    listPublishedSkillCapabilities: () => skillCapabilityRepository.listCapabilities({ publishedOnly: true }),
    listPublishedContactMethods: () => contactRepository.listContactMethods(),
    listPublishedSocialLinks: () => contactRepository.listSocialLinks()
  })
}
