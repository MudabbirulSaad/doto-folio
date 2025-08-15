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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
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
