'use client'

import { motion } from 'framer-motion'
import {
    Eye,
    MessageSquare,
    Mail,
    Briefcase,
    ArrowUpRight,
    TrendingUp,
    Users
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStatsProps {
    stats: {
        totalViews: number
        totalComments: number
        totalSubmissions: number
        totalProjects: number
        viewsGrowth: number
        commentsGrowth: number
    }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    const statCards = [
        {
            title: 'Total Post Views',
            value: stats.totalViews,
            icon: Eye,
            change: `+${stats.viewsGrowth}%`,
            trend: 'up',
            href: '/admin/analytics', // Placeholder or actual analytics page
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        },
        {
            title: 'Total Comments',
            value: stats.totalComments,
            icon: MessageSquare,
            change: `+${stats.commentsGrowth}%`,
            trend: 'up',
            href: '/admin/comments',
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/10',
            borderColor: 'border-pink-500/20'
        },
        {
            title: 'Contact Submissions',
            value: stats.totalSubmissions,
            icon: Mail,
            change: 'New',
            trend: 'neutral',
            href: '/admin/contacts',
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20'
        },
        {
            title: 'Active Projects',
            value: stats.totalProjects,
            icon: Briefcase,
            change: 'Portfolio',
            trend: 'neutral',
            href: '/admin/content/projects',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Link key={stat.title} href={stat.href}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] hover:border-primary/30 transition-all duration-300 group backdrop-blur-sm relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                {stat.change && (
                                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full bg-white/5 border border-white/10 ${stat.trend === 'up' ? 'text-green-400' : 'text-muted-foreground'
                                        }`}>
                                        {stat.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                                        {stat.change}
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {stat.value.toLocaleString()}
                                </h3>
                            </div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </motion.div>
                    </Link>
                )
            })}
        </div>
    )
}
