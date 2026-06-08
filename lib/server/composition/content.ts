import { createClient } from '@/lib/supabase/server'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from '@/lib/server/application/content/projects'
import { createSupabaseProjectRepository } from '@/lib/server/adapters/supabase/content/projects-repository'
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
