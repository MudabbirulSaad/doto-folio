import { ApplicationError } from '@/lib/server/domain/errors'
import type { PublicProject, PublicProjectTechnology } from '@/lib/server/application/content/public-portfolio'

const VALID_PROJECT_STATUSES = ['Planning', 'In Development', 'Completed', 'On Hold'] as const

export type ProjectStatus = typeof VALID_PROJECT_STATUSES[number]
export type ProjectTechnology = PublicProjectTechnology & { project_id?: string }
export type ProjectContent = PublicProject & {
  created_at?: string
  updated_at?: string
  is_featured?: boolean
}
export type ProjectCreateData = Omit<ProjectContent, 'id' | 'project_technologies'>
export type ProjectUpdateData = Partial<ProjectCreateData> & { updated_at: string }

export interface ProjectRepository {
  listProjects(): Promise<ProjectContent[]>
  getProject(id: string): Promise<ProjectContent | null>
  getLastDisplayOrder(): Promise<number>
  createProject(data: ProjectCreateData): Promise<ProjectContent>
  updateProject(id: string, data: ProjectUpdateData): Promise<void>
  deleteProject(id: string): Promise<void>
  replaceTechnologies(projectId: string, technologies: ProjectTechnology[]): Promise<void>
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

function sortProjectTechnologies(project: ProjectContent): ProjectContent {
  return {
    ...project,
    project_technologies: [...(project.project_technologies || [])].sort(
      (a, b) => a.display_order - b.display_order
    ) || []
  }
}

function isProjectStatus(status: string): status is ProjectStatus {
  return VALID_PROJECT_STATUSES.includes(status as ProjectStatus)
}

type ValidProjectInput = ProjectInput & {
  title: string
  description: string
  status: ProjectStatus
}

function assertValidProject(input: ProjectInput): asserts input is ValidProjectInput {
  if (!input.title || !input.description || !input.status) {
    throw new ApplicationError('VALIDATION_ERROR', 'Title, description, and status are required')
  }

  if (!isProjectStatus(input.status)) {
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
    title: input.title!,
    description: input.description!,
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
    title: input.title!,
    description: input.description!,
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
