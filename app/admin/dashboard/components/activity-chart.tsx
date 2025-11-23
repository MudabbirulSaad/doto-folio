'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'

interface ActivityData {
    date: string
    views: number
    comments: number
}

interface ActivityChartProps {
    data: ActivityData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm mb-8"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Activity Overview
                    </h3>
                    <p className="text-sm text-muted-foreground">Views and comments over the last 30 days</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#18181b',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            name="Page Views"
                        />
                        <Area
                            type="monotone"
                            dataKey="comments"
                            stroke="#EC4899"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorComments)"
                            name="Comments"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
