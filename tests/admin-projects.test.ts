import test from 'node:test'
import assert from 'node:assert/strict'
import { ApplicationError } from '../lib/server/domain/errors'
import {
  createProject,
  listProjects,
  updateProject,
  type ProjectContent,
  type ProjectRepository
} from '../lib/server/application/content/projects'

function projectRepository(): ProjectRepository & { projects: Record<string, ProjectContent>; technologies: Record<string, string[]> } {
  return {
    projects: {
      'project-1': {
        id: 'project-1',
        title: 'One',
        description: 'Description',
        status: 'Completed',
        display_order: 1,
        project_technologies: [
          { technology_name: 'B', display_order: 2 },
          { technology_name: 'A', display_order: 1 }
        ]
      }
    },
    technologies: {},
    async listProjects() {
      return Object.values(this.projects)
    },
    async getProject(id) {
      return this.projects[id] || null
    },
    async getLastDisplayOrder() {
      return 4
    },
    async createProject(data) {
      this.projects['project-2'] = { id: 'project-2', ...data }
      return this.projects['project-2']
    },
    async updateProject(id, data) {
      this.projects[id] = { ...this.projects[id], ...data }
    },
    async deleteProject(id) {
      delete this.projects[id]
    },
    async replaceTechnologies(projectId, technologies) {
      this.technologies[projectId] = technologies.map(technology => technology.technology_name)
    }
  }
}

test('listProjects sorts technologies by display order', async () => {
  const projects = await listProjects(projectRepository())

  assert.deepEqual(projects[0].project_technologies?.map(technology => technology.technology_name), ['A', 'B'])
})

test('createProject validates fields, assigns next display order, and stores technologies', async () => {
  const repository = projectRepository()

  await assert.rejects(
    () => createProject(repository, { title: '', description: 'Description', status: 'Completed' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const project = await createProject(repository, {
    title: 'Two',
    description: 'Description',
    status: 'Completed',
    technologies: ['Next.js', 'Supabase']
  })

  assert.equal(project.display_order, 5)
  assert.deepEqual(repository.technologies['project-2'], ['Next.js', 'Supabase'])
})

test('updateProject validates status and replaces technologies', async () => {
  const repository = projectRepository()

  await assert.rejects(
    () => updateProject(repository, 'project-1', { title: 'One', description: 'Description', status: 'Invalid' }),
    /Invalid status/
  )

  await updateProject(repository, 'project-1', {
    title: 'Updated',
    description: 'Description',
    status: 'Planning',
    technologies: ['TypeScript']
  })

  assert.equal(repository.projects['project-1'].title, 'Updated')
  assert.deepEqual(repository.technologies['project-1'], ['TypeScript'])
})
