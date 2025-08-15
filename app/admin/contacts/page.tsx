import { requireAdminAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import ContactSubmissionsTable from '@/components/admin/contact-submissions-table'
import { Mail, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Submissions</h1>
          <p className="text-muted-foreground">
            Manage and view all contact form submissions from your portfolio.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
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
        <ContactSubmissionsTable submissions={submissions} />
      </div>
    </div>
  )
}
