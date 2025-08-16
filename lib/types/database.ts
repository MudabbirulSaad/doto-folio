export interface Database {
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          is_read: boolean
          read_at: string | null
          read_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      site_content: {
        Row: {
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
          created_at: string
          updated_at: string
          is_published: boolean
        }
        Insert: {
          id?: string
          hero_title?: string
          hero_subtitle?: string | null
          hero_cta_text?: string
          hero_cta_link?: string
          about_title?: string
          about_intro?: string
          about_description?: string
          about_personal?: string
          education_title?: string
          education_degree?: string
          education_field?: string
          education_institution?: string
          approach_title?: string
          approach_description?: string
          contact_title?: string
          contact_description?: string
          contact_opportunities_title?: string
          contact_opportunities_description?: string
          footer_brand_name?: string
          footer_brand_description?: string
          footer_location?: string
          footer_university?: string
          footer_field?: string
          footer_copyright?: string
          created_at?: string
          updated_at?: string
          is_published?: boolean
        }
        Update: {
          id?: string
          hero_title?: string
          hero_subtitle?: string | null
          hero_cta_text?: string
          hero_cta_link?: string
          about_title?: string
          about_intro?: string
          about_description?: string
          about_personal?: string
          education_title?: string
          education_degree?: string
          education_field?: string
          education_institution?: string
          approach_title?: string
          approach_description?: string
          contact_title?: string
          contact_description?: string
          contact_opportunities_title?: string
          contact_opportunities_description?: string
          footer_brand_name?: string
          footer_brand_description?: string
          footer_location?: string
          footer_university?: string
          footer_field?: string
          footer_copyright?: string
          created_at?: string
          updated_at?: string
          is_published?: boolean
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          status: 'Planning' | 'In Development' | 'Completed' | 'On Hold'
          display_order: number
          is_featured: boolean
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status: 'Planning' | 'In Development' | 'Completed' | 'On Hold'
          display_order?: number
          is_featured?: boolean
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'Planning' | 'In Development' | 'Completed' | 'On Hold'
          display_order?: number
          is_featured?: boolean
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_technologies: {
        Row: {
          id: string
          project_id: string
          technology_name: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          technology_name: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          technology_name?: string
          display_order?: number
          created_at?: string
        }
      }
      skill_categories: {
        Row: {
          id: string
          title: string
          description: string | null
          display_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          category_id: string
          name: string
          level: 'Learning' | 'Intermediate' | 'Advanced' | 'Expert'
          description: string
          display_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          level: 'Learning' | 'Intermediate' | 'Advanced' | 'Expert'
          description: string
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          level?: 'Learning' | 'Intermediate' | 'Advanced' | 'Expert'
          description?: string
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contact_methods: {
        Row: {
          id: string
          title: string
          value: string
          description: string
          link: string
          icon_name: string
          display_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          value: string
          description: string
          link: string
          icon_name: string
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          value?: string
          description?: string
          link?: string
          icon_name?: string
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          platform: string
          url: string
          username: string | null
          icon_name: string
          display_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: string
          url: string
          username?: string | null
          icon_name: string
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform?: string
          url?: string
          username?: string | null
          icon_name?: string
          display_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          setting_type: 'text' | 'number' | 'boolean' | 'json'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          setting_type: 'text' | 'number' | 'boolean' | 'json'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          setting_type?: 'text' | 'number' | 'boolean' | 'json'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row']
export type ContactSubmissionInsert = Database['public']['Tables']['contact_submissions']['Insert']
export type ContactSubmissionUpdate = Database['public']['Tables']['contact_submissions']['Update']
