import type { AdminProject, AdminProjectFormData } from '@/lib/client/domain/admin-content'

export interface AdminProjectGateway {
  list(): Promise<AdminProject[]>
  create(input: AdminProjectFormData): Promise<AdminProject>
  update(id: string, input: AdminProjectFormData): Promise<AdminProject>
  delete(id: string): Promise<void>
}

export function emptyProjectForm(): AdminProjectFormData {
  return {
    title: '',
    description: '',
    status: 'Planning',
    technologies: [],
    is_featured: false,
    is_published: true
  }
}

export function projectToForm(project: AdminProject): AdminProjectFormData {
  return {
    title: project.title,
    description: project.description,
    status: project.status,
    technologies: project.project_technologies.map(technology => technology.technology_name),
    is_featured: project.is_featured,
    is_published: project.is_published
  }
}

export function validateProjectForm(input: AdminProjectFormData): string | null {
  if (!input.title.trim() || !input.description.trim()) {
    return 'Title and description are required'
  }

  return null
}

export function addProjectTechnology(input: AdminProjectFormData, technology: string): AdminProjectFormData {
  const trimmed = technology.trim()

  if (!trimmed || input.technologies.includes(trimmed)) {
    return input
  }

  return {
    ...input,
    technologies: [...input.technologies, trimmed]
  }
}

export function removeProjectTechnology(input: AdminProjectFormData, technology: string): AdminProjectFormData {
  return {
    ...input,
    technologies: input.technologies.filter(item => item !== technology)
  }
}

export async function saveProject(
  gateway: AdminProjectGateway,
  input: AdminProjectFormData,
  projectId?: string
) {
  const error = validateProjectForm(input)

  if (error) {
    return { success: false as const, error }
  }

  try {
    const project = projectId ? await gateway.update(projectId, input) : await gateway.create(input)
    return { success: true as const, project }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to save project'
    }
  }
}
