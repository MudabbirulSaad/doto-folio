"use client"

export function SectionNebula({ className }: { className?: string }) {
    return (
        <div className={`absolute inset-x-0 top-0 h-[500px] -z-10 pointer-events-none overflow-hidden ${className}`}>
            {/* CSS-only Nebula Accent */}
            {/* We use multiple radial gradients to simulate the nebula clouds */}
            <div className="absolute inset-0 opacity-40 animate-pulse-slow">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
              radial-gradient(circle at 50% 30%, var(--primary) 0%, transparent 40%),
              radial-gradient(circle at 20% 40%, var(--secondary) 0%, transparent 30%),
              radial-gradient(circle at 80% 20%, var(--primary) 0%, transparent 35%)
            `,
                        filter: 'blur(60px)',
                        transform: 'scale(1.2)',
                    }}
                />
            </div>

            {/* Gradient Mask for seamless blending */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>
    )
}
