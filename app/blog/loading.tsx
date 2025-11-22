import { SectionNebula } from '@/components/section-nebula'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function Loading() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden z-0">
            <SectionNebula />

            {/* Hero Skeleton */}
            <section className="py-20 md:py-32 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center space-y-8 animate-pulse">
                        <div className="h-12 md:h-16 w-3/4 mx-auto bg-white/10 rounded-xl backdrop-blur-md" />
                        <div className="h-6 w-2/3 mx-auto bg-white/5 rounded-lg backdrop-blur-sm" />

                        <div className="flex justify-center gap-4 pt-4">
                            <div className="h-12 w-40 bg-white/5 rounded-xl backdrop-blur-sm" />
                            <div className="h-12 w-40 bg-white/5 rounded-xl backdrop-blur-sm" />
                        </div>

                        <div className="flex justify-center gap-8 pt-4">
                            <div className="h-4 w-24 bg-white/5 rounded" />
                            <div className="h-4 w-24 bg-white/5 rounded" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Skeleton */}
            <div className="container mx-auto px-4 pb-20 relative z-10">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Search & Filters Skeleton */}
                    <div className="space-y-6">
                        <div className="h-24 w-full bg-white/5 rounded-2xl backdrop-blur-md border border-white/10" />
                    </div>

                    {/* Featured Posts Skeleton */}
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <div className="h-8 w-48 mx-auto bg-white/5 rounded-lg" />
                            <div className="h-4 w-96 mx-auto bg-white/5 rounded" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-[400px] bg-white/5 rounded-2xl backdrop-blur-md border border-white/10" />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
