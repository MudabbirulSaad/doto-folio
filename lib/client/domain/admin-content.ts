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

export interface AdminSiteContent {
  id: string
  hero_title: string
  hero_subtitle: string | null
  hero_cta_text: string
  hero_cta_link: string
  about_title: string
  about_intro: string
  about_description: string
  about_personal: string
  education_title: string
  education_degree: string
  education_field: string
  education_institution: string
  approach_title: string
  approach_description: string
  contact_title: string
  contact_description: string
  contact_opportunities_title: string
  contact_opportunities_description: string
  footer_brand_name: string
  footer_brand_description: string
  footer_location: string
  footer_university: string
  footer_field: string
  footer_copyright: string
  is_published: boolean
}
