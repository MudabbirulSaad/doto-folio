'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    FileText,
    FolderOpen,
    Layers,
    Mail,
    Edit,
    Eye,
    Plus,
    BarChart3,
    MessageSquare
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { loadAdminContentOverview } from '@/lib/client/application/admin/content-overview'
import { createAdminContentOverviewApiGateway } from '@/lib/client/adapters/http/admin-content-overview-api'
import type { AdminContentOverviewStats } from '@/lib/client/domain/admin-overview'

export default function ContentManagementPage() {
    const [stats, setStats] = useState<AdminContentOverviewStats>({
        projectsCount: 0,
        skillsCount: 0,
        contactMethodsCount: 0,
        socialLinksCount: 0,
        isContentPublished: false,
        commentsCount: 0
    })

    useEffect(() => {
        let mounted = true

        const loadStats = async () => {
            const overviewGateway = createAdminContentOverviewApiGateway()
            const result = await loadAdminContentOverview(overviewGateway)
            if (!mounted) return

            if (result.success) {
                setStats(result.stats)
            }
        }

        loadStats().catch(() => {})

        return () => {
            mounted = false
        }
    }, [])

    const contentSections = [
        {
            title: 'Hero & About Content',
            description: 'Edit hero section, about text, education, and approach content',
            href: '/admin/content/hero-about',
            icon: FileText,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            status: stats.isContentPublished ? 'Published' : 'Draft',
            statusColor: stats.isContentPublished ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
        },
        {
            title: 'Projects Management',
            description: 'Add, edit, and manage portfolio projects with technologies',
            href: '/admin/content/projects',
            icon: FolderOpen,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            status: `${stats.projectsCount} Projects`,
            statusColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        },
        {
            title: 'Skills & Expertise',
            description: 'Manage skill categories and individual skills with proficiency levels',
            href: '/admin/content/skills',
            icon: Layers,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20',
            status: `${stats.skillsCount} Skills`,
            statusColor: 'text-green-400 bg-green-500/10 border-green-500/20'
        },
        {
            title: 'Comments',
            description: 'Manage blog comments, replies, and moderation',
            href: '/admin/comments',
            icon: MessageSquare,
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/10',
            borderColor: 'border-pink-500/20',
            status: `${stats.commentsCount} Comments`,
            statusColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
        },
        {
            title: 'Contact & Social',
            description: 'Edit contact methods, social media links, and descriptions',
            href: '/admin/content/contact',
            icon: Mail,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20',
            status: `${stats.contactMethodsCount + stats.socialLinksCount} Links`,
            statusColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
        }
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <Layers className="w-8 h-8 text-primary" />
                        Content Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and customize all portfolio content from this central dashboard.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <Link href="/" target="_blank">
                        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-white/5 border-white/10 hover:bg-white/10">
                            <Eye className="w-4 h-4" />
                            <span>Preview Site</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">Total Content</p>
                            <p className="text-2xl font-bold text-foreground">
                                {stats.projectsCount + stats.skillsCount + stats.contactMethodsCount + stats.socialLinksCount}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <FolderOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Projects</p>
                            <p className="text-2xl font-bold text-foreground">{stats.projectsCount}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Layers className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Skills</p>
                            <p className="text-2xl font-bold text-foreground">{stats.skillsCount}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${stats.isContentPublished ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                            <FileText className={`w-5 h-5 ${stats.isContentPublished ? 'text-green-400' : 'text-yellow-400'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Site Status</p>
                            <p className={`text-sm font-medium ${stats.isContentPublished ? 'text-green-400' : 'text-yellow-400'}`}>
                                {stats.isContentPublished ? 'Published' : 'Draft'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Content Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentSections.map((section, index) => {
                    const Icon = section.icon
                    return (
                        <Link key={section.title} href={section.href}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] hover:border-primary/30 transition-all duration-300 group backdrop-blur-sm h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${section.bgColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${section.color}`} />
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${section.statusColor} ml-2`}>
                                        {section.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {section.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    {section.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                                    <span className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">Click to manage</span>
                                    <Edit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </motion.div>
                        </Link>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
            >
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/content/projects">
                        <Button size="sm" className="flex items-center space-x-2 shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4" />
                            <span>Add Project</span>
                        </Button>
                    </Link>
                    <Link href="/admin/content/skills">
                        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-white/5 border-white/10 hover:bg-white/10">
                            <Plus className="w-4 h-4" />
                            <span>Add Skill</span>
                        </Button>
                    </Link>
                    <Link href="/admin/content/hero-about">
                        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-white/5 border-white/10 hover:bg-white/10">
                            <Edit className="w-4 h-4" />
                            <span>Edit Hero Content</span>
                        </Button>
                    </Link>
                    <Link href="/" target="_blank">
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-white/5">
                            <Eye className="w-4 h-4" />
                            <span>Preview Changes</span>
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
