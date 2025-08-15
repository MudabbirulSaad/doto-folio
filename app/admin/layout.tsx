import AdminNavigation from '@/components/admin/admin-navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication is handled by middleware

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
