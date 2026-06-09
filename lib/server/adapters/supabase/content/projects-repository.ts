import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type { ProjectContent, ProjectRepository } from '@/lib/server/application/content/projects'

export function createSupabaseProjectRepository(supabase: SupabaseDataClient): ProjectRepository {
  return {
    async listProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(`
        *,
        project_technologies (
          id,
          technology_name,
          display_order
        )
      `)
        .order('display_order', { ascending: true }) as {
          data: ProjectContent[] | null
          error: { message: string } | null
        }

      if (error) throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch projects', [error.message])
      return data || []
    },

    async getProject(id) {
      const { data, error } = await supabase
        .from('projects')
        .select(`
        *,
        project_technologies (
          id,
          technology_name,
          display_order
        )
      `)
        .eq('id', id)
        .single<ProjectContent>()

      if (error) return null
      return data
    },

    async getLastDisplayOrder() {
      const { data } = await supabase
        .from('projects')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single<{ display_order?: number | null }>()

      return data?.display_order || 0
    },

    async createProject(data) {
      const { data: project, error } = await supabase
        .from('projects')
        .insert(data)
        .select()
        .single<ProjectContent>()

      if (error) throw new ApplicationError('DATABASE_ERROR', 'Failed to create project', [error.message])
      if (!project) throw new ApplicationError('DATABASE_ERROR', 'Failed to create project', ['No project returned'])
      return project
    },

    async updateProject(id, data) {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single<ProjectContent>()

      if (error) throw new ApplicationError('DATABASE_ERROR', 'Failed to update project', [error.message])
    },

    async deleteProject(id) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw new ApplicationError('DATABASE_ERROR', 'Failed to delete project', [error.message])
    },

    async replaceTechnologies(projectId, technologies) {
      await supabase
        .from('project_technologies')
        .delete()
        .eq('project_id', projectId)

      if (technologies.length === 0) return

      const { error } = await supabase
        .from('project_technologies')
        .insert(technologies)

      if (error) {
        console.error('Error replacing project technologies:', error)
      }
    }
  }
}
