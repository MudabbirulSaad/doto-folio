'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Mail,
  Calendar,
  Search,
  Eye,
  ExternalLink,
  User,
  MessageSquare,
  Download,
  CheckCircle,
  Circle,
  ChevronDown,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,

} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAdminContactSubmissionApiGateway } from '@/lib/client/adapters/http/admin-contact-submissions-api'
import {
  exportAdminContactSubmissions,
  loadAdminContactSubmissions,
  updateAdminContactSubmissionReadStatus
} from '@/lib/client/application/admin/contact-submissions'
import type {
  AdminContactSubmission,
  AdminContactSubmissionExportFormat
} from '@/lib/client/domain/contact-submissions'

interface ContactSubmissionsTableProps {
  initialSubmissions: AdminContactSubmission[]
}

export default function ContactSubmissionsTable({ initialSubmissions }: ContactSubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<AdminContactSubmission[]>(initialSubmissions)
  const [searchTerm, setSearchTerm] = useState('')
  const [readStatusFilter, setReadStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<AdminContactSubmission | null>(null)
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const gateway = useMemo(() => createAdminContactSubmissionApiGateway(), [])

  const currentFilters = useCallback(() => ({
    search: searchTerm,
    readStatus: readStatusFilter,
    timeFilter
  }), [searchTerm, readStatusFilter, timeFilter])

  // Fetch submissions with filters
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await loadAdminContactSubmissions(gateway, currentFilters())

      if (result.success) {
        setSubmissions(result.submissions)
      } else {
        console.error('Failed to fetch submissions:', result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentFilters, gateway])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, readStatusFilter, timeFilter, fetchSubmissions])

  // Mark submissions as read/unread
  const updateReadStatus = async (submissionIds: string[], isRead: boolean) => {
    const result = await updateAdminContactSubmissionReadStatus(gateway, submissionIds, isRead)

    if (result.success) {
      setSubmissions(prev => prev.map(sub =>
        result.submissionIds.includes(sub.id)
          ? { ...sub, is_read: result.isRead, read_at: result.isRead ? new Date().toISOString() : null }
          : sub
      ))
      setSelectedSubmissions([])
    } else {
      console.error('Failed to update read status:', result.error)
    }
  }

  // Export submissions
  const exportSubmissions = async (format: AdminContactSubmissionExportFormat) => {
    setIsExporting(true)
    try {
      const result = await exportAdminContactSubmissions(gateway, format, currentFilters())

      if (result.success) {
        const url = window.URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Export failed:', result.error)
      }
    } catch (error) {
      console.error('Error exporting submissions:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Toggle submission selection
  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    )
  }

  // Select all submissions
  const toggleSelectAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([])
    } else {
      setSelectedSubmissions(submissions.map(sub => sub.id))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // const truncateText = (text: string, maxLength: number) => {
  //   if (text.length <= maxLength) return text
  //   return text.substring(0, maxLength) + '...'
  // }

  return (
    <div className="admin-card-mobile p-4 md:p-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>

          {/* Read Status Filter */}
          <Select value={readStatusFilter} onValueChange={setReadStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Read Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Bulk Actions */}
          {selectedSubmissions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateReadStatus(selectedSubmissions, true)}
                className="admin-touch-target"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Read ({selectedSubmissions.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateReadStatus(selectedSubmissions, false)}
                className="admin-touch-target"
              >
                <Circle className="w-4 h-4 mr-2" />
                Mark Unread
              </Button>
            </div>
          )}

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting} className="admin-touch-target">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportSubmissions('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSubmissions('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSubmissions('html')}>
                Export as HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Select All Checkbox */}
      {submissions.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/30 rounded-lg">
          <Checkbox
            checked={selectedSubmissions.length === submissions.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all submissions
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading submissions...</span>
        </div>
      )}

      {/* Submissions List */}
      {!isLoading && submissions.length > 0 ? (
        <div className="space-y-3 md:space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className={`admin-card-mobile border rounded-xl p-3 md:p-4 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                submission.is_read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
              } ${selectedSubmissions.includes(submission.id) ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Selection Checkbox */}
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedSubmissions.includes(submission.id)}
                      onCheckedChange={() => toggleSubmissionSelection(submission.id)}
                    />
                  </div>

                  {/* Read Status Indicator */}
                  <div className="mt-1 flex-shrink-0">
                    {submission.is_read ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <User className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{submission.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 min-w-0">
                        <Mail className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${submission.email}`}
                          className="text-sm text-primary hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {submission.email}
                        </a>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-foreground line-clamp-1">{submission.subject}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 break-words mobile-card-content">
                        {submission.message}
                      </p>
                    </div>

                    {/* Read Status Info */}
                    {submission.is_read && submission.read_at && (
                      <div className="text-xs text-muted-foreground">
                        Read {formatDate(submission.read_at)}
                        {submission.read_by && ` by ${submission.read_by}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end space-y-2 flex-shrink-0">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="whitespace-nowrap">{formatDate(submission.created_at)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateReadStatus([submission.id], !submission.is_read)
                      }}
                      className="admin-touch-target text-xs"
                    >
                      {submission.is_read ? (
                        <>
                          <Circle className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Mark Unread</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Mark Read</span>
                        </>
                      )}
                    </Button>

                    <Button variant="outline" size="sm" className="admin-touch-target text-xs">
                      <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Button>

                    <a
                      href={`mailto:${submission.email}?subject=Re: ${submission.subject}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" className="admin-touch-target text-xs">
                        <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span className="hidden sm:inline">Reply</span>
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm || readStatusFilter !== 'all' || timeFilter !== 'all'
              ? 'No matching submissions'
              : 'No submissions yet'
            }
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || readStatusFilter !== 'all' || timeFilter !== 'all'
              ? 'No contact submissions match your current filters.'
              : 'Contact form submissions will appear here when visitors reach out.'
            }
          </p>
          {(searchTerm || readStatusFilter !== 'all' || timeFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setReadStatusFilter('all')
                setTimeFilter('all')
              }}
              className="mt-4"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : null}

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
