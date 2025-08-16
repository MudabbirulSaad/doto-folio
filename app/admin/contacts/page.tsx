import { requireAdminAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import ContactSubmissionsTable from '@/components/admin/contact-submissions-table'
import { Mail } from 'lucide-react'

async function getContactSubmissions() {
  try {
    const supabase = await createClient()
    
    const { data: submissions, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contact submissions:', error)
      return []
    }

    return submissions || []
  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    return []
  }
}

export default async function ContactSubmissionsPage() {
  // Require authentication
  await requireAdminAuth()

  // Get contact submissions
  const submissions = await getContactSubmissions()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Contact Submissions</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and view all contact form submissions from your portfolio.
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="admin-mobile-grid admin-tablet-grid grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="admin-card-mobile bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{submissions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">
                {submissions.filter(s => {
                  const submissionDate = new Date(s.created_at)
                  const now = new Date()
                  return submissionDate.getMonth() === now.getMonth() && 
                         submissionDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-foreground">
                {submissions.filter(s => {
                  const submissionDate = new Date(s.created_at)
                  const now = new Date()
                  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
                  return submissionDate >= weekStart
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <ContactSubmissionsTable initialSubmissions={submissions} />
      </div>
    </div>
  )
}
