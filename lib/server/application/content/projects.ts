import { ApplicationError } from '@/lib/server/domain/errors'

const VALID_PROJECT_STATUSES = ['Planning', 'In Development', 'Completed', 'On Hold']

export interface ProjectRepository {
  listProjects(): Promise<any[]>
  getProject(id: string): Promise<any | null>
  getLastDisplayOrder(): Promise<number>
  createProject(data: Record<string, unknown>): Promise<any>
  updateProject(id: string, data: Record<string, unknown>): Promise<void>
  deleteProject(id: string): Promise<void>
  replaceTechnologies(projectId: string, technologies: Array<{ technology_name: string; display_order: number }>): Promise<void>
}

export interface ProjectInput {
  title?: string
  description?: string
  status?: string
  display_order?: number
  is_featured?: boolean
  is_published?: boolean
  technologies?: string[]
}

function sortProjectTechnologies(project: any) {
  return {
    ...project,
    project_technologies: project.project_technologies?.sort(
      (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
    ) || []
  }
}

function assertValidProject(input: ProjectInput) {
  if (!input.title || !input.description || !input.status) {
    throw new ApplicationError('VALIDATION_ERROR', 'Title, description, and status are required')
  }

  if (!VALID_PROJECT_STATUSES.includes(input.status)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid status')
  }
}

function technologyRows(projectId: string, technologies: string[]) {
  return technologies.map((technologyName, index) => ({
    project_id: projectId,
    technology_name: technologyName,
    display_order: index + 1
  }))
}

export async function listProjects(repository: ProjectRepository) {
  const projects = await repository.listProjects()
  return projects.map(sortProjectTechnologies)
}

export async function getProject(repository: ProjectRepository, id: string) {
  const project = await repository.getProject(id)
  if (!project) {
    throw new ApplicationError('NOT_FOUND', 'Project not found')
  }

  return sortProjectTechnologies(project)
}

export async function createProject(repository: ProjectRepository, input: ProjectInput) {
  assertValidProject(input)
  const nextDisplayOrder = (await repository.getLastDisplayOrder()) + 1
  const project = await repository.createProject({
    title: input.title,
    description: input.description,
    status: input.status,
    display_order: input.display_order || nextDisplayOrder,
    is_featured: input.is_featured || false,
    is_published: input.is_published !== undefined ? input.is_published : true
  })

  if (input.technologies?.length) {
    await repository.replaceTechnologies(project.id, technologyRows(project.id, input.technologies))
  }

  return project
}

export async function updateProject(repository: ProjectRepository, id: string, input: ProjectInput, options: { now?: () => Date } = {}) {
  assertValidProject(input)
  await repository.updateProject(id, {
    title: input.title,
    description: input.description,
    status: input.status,
    display_order: input.display_order,
    is_featured: input.is_featured || false,
    is_published: input.is_published !== undefined ? input.is_published : true,
    updated_at: (options.now || (() => new Date()))().toISOString()
  })

  if (Array.isArray(input.technologies)) {
    await repository.replaceTechnologies(id, technologyRows(id, input.technologies))
  }
}

export async function deleteProject(repository: ProjectRepository, id: string) {
  await repository.deleteProject(id)
}
