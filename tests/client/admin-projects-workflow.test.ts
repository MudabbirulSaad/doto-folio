import { describe, expect, it, vi } from 'vitest'
import {
  addProjectTechnology,
  emptyProjectForm,
  projectToForm,
  removeProjectTechnology,
  saveProject,
  type AdminProjectGateway
} from '@/lib/client/application/admin/projects'
import type { AdminProject } from '@/lib/client/domain/admin-content'

const project: AdminProject = {
  id: 'project-1',
  title: 'Portfolio',
  description: 'Personal site',
  status: 'Completed',
  display_order: 1,
  is_featured: true,
  is_published: true,
  project_technologies: [{ id: 'tech-1', technology_name: 'Next.js', display_order: 1 }]
}

describe('admin project workflow', () => {
  it('maps a project into editable form data', () => {
    expect(projectToForm(project)).toEqual({
      title: 'Portfolio',
      description: 'Personal site',
      status: 'Completed',
      technologies: ['Next.js'],
      is_featured: true,
      is_published: true
    })
  })

  it('adds and removes technologies without duplicates', () => {
    const withTechnology = addProjectTechnology(emptyProjectForm(), ' Next.js ')

    expect(addProjectTechnology(withTechnology, 'Next.js')).toBe(withTechnology)
    expect(removeProjectTechnology(withTechnology, 'Next.js').technologies).toEqual([])
  })

  it('validates before saving and delegates valid changes to the gateway', async () => {
    const gateway: AdminProjectGateway = {
      list: vi.fn(),
      create: vi.fn(async () => project),
      update: vi.fn(async () => project),
      delete: vi.fn()
    }

    expect(await saveProject(gateway, emptyProjectForm())).toEqual({
      success: false,
      error: 'Title and description are required'
    })

    const result = await saveProject(gateway, {
      ...emptyProjectForm(),
      title: 'Portfolio',
      description: 'Personal site'
    })

    expect(result).toEqual({ success: true, project })
    expect(gateway.create).toHaveBeenCalled()
  })
})
