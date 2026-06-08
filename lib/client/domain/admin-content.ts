export interface AdminProjectTechnology {
  id: string
  technology_name: string
  display_order: number
}

export interface AdminProject {
  id: string
  title: string
  description: string
  status: 'Planning' | 'In Development' | 'Completed' | 'On Hold'
  display_order: number
  is_featured: boolean
  is_published: boolean
  project_technologies: AdminProjectTechnology[]
}

export interface AdminProjectFormData {
  title: string
  description: string
  status: AdminProject['status']
  technologies: string[]
  is_featured: boolean
  is_published: boolean
}
