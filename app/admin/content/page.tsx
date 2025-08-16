import { requireAdminAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  FolderOpen, 
  Layers, 
  Mail, 
  Settings,
  Edit,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react'

interface ContentStats {
  projectsCount: number
  skillsCount: number
  contactMethodsCount: number
  socialLinksCount: number
  isContentPublished: boolean
}

async function getContentStats(): Promise<ContentStats> {
  try {
    const supabase = await createClient()

    // Get projects count
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get skills count
    const { count: skillsCount } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get contact methods count
    const { count: contactMethodsCount } = await supabase
      .from('contact_methods')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get social links count
    const { count: socialLinksCount } = await supabase
      .from('social_links')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Check if site content is published
    const { data: siteContent } = await supabase
      .from('site_content')
      .select('is_published')
      .single()

    return {
      projectsCount: projectsCount || 0,
      skillsCount: skillsCount || 0,
      contactMethodsCount: contactMethodsCount || 0,
      socialLinksCount: socialLinksCount || 0,
      isContentPublished: siteContent?.is_published || false
    }
  } catch (error) {
    console.error('Error fetching content stats:', error)
    return {
      projectsCount: 0,
      skillsCount: 0,
      contactMethodsCount: 0,
      socialLinksCount: 0,
      isContentPublished: false
    }
  }
}

export default async function ContentManagementPage() {
  await requireAdminAuth()
  const stats = await getContentStats()

  const contentSections = [
    {
      title: 'Hero & About Content',
      description: 'Edit hero section, about text, education, and approach content',
      href: '/admin/content/hero-about',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-900/20',
      status: stats.isContentPublished ? 'Published' : 'Draft',
      statusColor: stats.isContentPublished ? 'text-green-600' : 'text-yellow-600'
    },
    {
      title: 'Projects Management',
      description: 'Add, edit, and manage portfolio projects with technologies',
      href: '/admin/content/projects',
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      darkBgColor: 'dark:bg-purple-900/20',
      status: `${stats.projectsCount} Projects`,
      statusColor: 'text-purple-600'
    },
    {
      title: 'Skills & Expertise',
      description: 'Manage skill categories and individual skills with proficiency levels',
      href: '/admin/content/skills',
      icon: Layers,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-900/20',
      status: `${stats.skillsCount} Skills`,
      statusColor: 'text-green-600'
    },
    {
      title: 'Contact & Social',
      description: 'Edit contact methods, social media links, and descriptions',
      href: '/admin/content/contact',
      icon: Mail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      darkBgColor: 'dark:bg-orange-900/20',
      status: `${stats.contactMethodsCount + stats.socialLinksCount} Links`,
      statusColor: 'text-orange-600'
    },
    {
      title: 'Site Settings',
      description: 'Manage navigation, footer content, and general site settings',
      href: '/admin/content/settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      darkBgColor: 'dark:bg-gray-900/20',
      status: 'Configure',
      statusColor: 'text-gray-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Content Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and customize all portfolio content from this central dashboard.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="admin-touch-target flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="admin-mobile-grid admin-tablet-grid grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="admin-card-mobile bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Total Content</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {stats.projectsCount + stats.skillsCount + stats.contactMethodsCount + stats.socialLinksCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold text-foreground">{stats.projectsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Layers className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Skills</p>
              <p className="text-2xl font-bold text-foreground">{stats.skillsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${stats.isContentPublished ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <FileText className={`w-5 h-5 ${stats.isContentPublished ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site Status</p>
              <p className={`text-sm font-medium ${stats.isContentPublished ? 'text-green-600' : 'text-yellow-600'}`}>
                {stats.isContentPublished ? 'Published' : 'Draft'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections Grid */}
      <div className="admin-mobile-grid admin-tablet-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {contentSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.title} href={section.href}>
              <div className="admin-card-mobile bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 md:p-3 rounded-lg ${section.bgColor} ${section.darkBgColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${section.color} dark:text-foreground`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full bg-secondary ${section.statusColor} ml-2`}>
                    {section.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">Click to manage</span>
                  <Edit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 md:mt-8 admin-card-mobile bg-card border border-border rounded-xl p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/content/projects">
            <Button size="sm" className="admin-touch-target flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </Button>
          </Link>
          <Link href="/admin/content/skills">
            <Button variant="outline" size="sm" className="admin-touch-target flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </Button>
          </Link>
          <Link href="/admin/content/hero-about">
            <Button variant="outline" size="sm" className="admin-touch-target flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit Hero Content</span>
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview Changes</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
