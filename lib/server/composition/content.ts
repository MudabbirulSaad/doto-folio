import { createClient } from '@/lib/supabase/server'
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
  saveSiteContent
} from '@/lib/server/application/content/site-content'
import {
  createContactContentItem,
  getContactContent
} from '@/lib/server/application/content/contact-content'
import {
  createFlatSkill,
  createSkillInCategory,
  deleteSkill,
  listFlatSkills,
  updateFlatSkill
} from '@/lib/server/application/content/skills'
import { getAdminContentOverview } from '@/lib/server/application/content/content-overview'
import { createSupabaseProjectRepository } from '@/lib/server/adapters/supabase/content/projects-repository'
import { createSupabaseSiteContentRepository } from '@/lib/server/adapters/supabase/content/site-content-repository'
import { createSupabaseContactContentRepository } from '@/lib/server/adapters/supabase/content/contact-content-repository'
import { createSupabaseSkillContentRepository } from '@/lib/server/adapters/supabase/content/skills-repository'
import { createSupabaseAdminContentOverviewRepository } from '@/lib/server/adapters/supabase/content/content-overview-repository'
import type { ProjectInput } from '@/lib/server/application/content/projects'

export async function createProjectUseCases() {
  const repository = createSupabaseProjectRepository(await createClient())

  return {
    list: () => listProjects(repository),
    get: (id: string) => getProject(repository, id),
    create: (input: ProjectInput) => createProject(repository, input),
    update: (id: string, input: ProjectInput) => updateProject(repository, id, input),
    delete: (id: string) => deleteProject(repository, id)
  }
}

export async function createSiteContentUseCases() {
  const repository = createSupabaseSiteContentRepository(await createClient())

  return {
    getPublished: () => getPublishedSiteContent(repository),
    getAdmin: () => getAdminSiteContent(repository),
    save: (input: Record<string, any>) => saveSiteContent(repository, input)
  }
}

export async function createContactContentUseCases() {
  const repository = createSupabaseContactContentRepository(await createClient())

  return {
    get: () => getContactContent(repository),
    create: (input: Record<string, any>) => createContactContentItem(repository, input)
  }
}

export async function createSkillContentUseCases() {
  const repository = createSupabaseSkillContentRepository(await createClient())

  return {
    listFlat: () => listFlatSkills(repository),
    createFlat: (input: Record<string, any>) => createFlatSkill(repository, input),
    updateFlat: (id: string, input: Record<string, any>) => updateFlatSkill(repository, id, input),
    delete: (id: string) => deleteSkill(repository, id),
    createInCategory: (categoryId: string, input: Record<string, any>) => createSkillInCategory(repository, categoryId, input)
  }
}

export async function createAdminContentOverviewUseCase() {
  const repository = createSupabaseAdminContentOverviewRepository(await createClient())

  return () => getAdminContentOverview(repository)
}
