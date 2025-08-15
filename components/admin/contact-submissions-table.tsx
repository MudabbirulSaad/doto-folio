'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Mail, 
  Calendar, 
  Search, 
  Eye, 
  ExternalLink,
  User,
  MessageSquare
} from 'lucide-react'

interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
  updated_at: string
}

interface ContactSubmissionsTableProps {
  submissions: ContactSubmission[]
}

export default function ContactSubmissionsTable({ submissions }: ContactSubmissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission =>
    submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredSubmissions.length} of {submissions.length} submissions
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length > 0 ? (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{submission.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${submission.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {submission.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Subject:</span>
                    </div>
                    <p className="text-sm text-foreground font-medium pl-6">
                      {submission.subject}
                    </p>
                  </div>

                  {/* Message Preview */}
                  <div className="pl-6">
                    <p className="text-sm text-muted-foreground">
                      {truncateText(submission.message, 200)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </Button>
                  <a href={`mailto:${submission.email}?subject=Re: ${submission.subject}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Reply</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? 'No matching submissions' : 'No submissions yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'Try adjusting your search terms to find what you\'re looking for.'
              : 'Contact form submissions will appear here when visitors reach out.'
            }
          </p>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Contact Submission Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-foreground">{selectedSubmission.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{selectedSubmission.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-foreground">{selectedSubmission.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <div className="bg-secondary/50 rounded-lg p-4 mt-1">
                    <p className="text-foreground whitespace-pre-wrap">{selectedSubmission.message}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="text-foreground">{formatDate(selectedSubmission.created_at)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </Button>
                <a href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}>
                  <Button className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Reply via Email</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
