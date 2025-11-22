import { SectionNebula } from '@/components/section-nebula'

export default function Loading() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden z-0">
            <SectionNebula />

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="max-w-7xl mx-auto animate-pulse">

                    {/* Header Skeleton */}
                    <div className="space-y-8 mb-12">
                        <div className="w-32 h-9 bg-white/5 rounded-lg backdrop-blur-sm" />

                        <div className="space-y-6">
                            <div className="w-24 h-6 bg-white/5 rounded-full backdrop-blur-sm" />
                            <div className="h-12 md:h-16 w-3/4 bg-white/10 rounded-xl backdrop-blur-md" />

                            <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                                <div className="w-48 h-10 bg-white/5 rounded-full backdrop-blur-sm" />
                                <div className="w-32 h-6 bg-white/5 rounded-full backdrop-blur-sm" />
                                <div className="w-32 h-6 bg-white/5 rounded-full backdrop-blur-sm" />
                            </div>
                        </div>

                        <div className="aspect-[21/9] w-full bg-white/5 rounded-2xl backdrop-blur-md border border-white/10" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Content Skeleton */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                            <div className="h-4 w-full bg-white/5 rounded backdrop-blur-sm" />
                            <div className="h-4 w-full bg-white/5 rounded backdrop-blur-sm" />
                            <div className="h-4 w-5/6 bg-white/5 rounded backdrop-blur-sm" />

                            <div className="h-64 w-full bg-white/5 rounded-xl backdrop-blur-md border border-white/10 my-8" />

                            <div className="h-4 w-full bg-white/5 rounded backdrop-blur-sm" />
                            <div className="h-4 w-4/5 bg-white/5 rounded backdrop-blur-sm" />
                        </div>

                        {/* Sidebar Skeleton */}
                        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6">
                            <div className="h-64 bg-white/5 rounded-xl backdrop-blur-md border border-white/10" />
                            <div className="h-40 bg-white/5 rounded-xl backdrop-blur-md border border-white/10" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
