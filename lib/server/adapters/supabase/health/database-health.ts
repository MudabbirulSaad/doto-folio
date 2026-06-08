export function createSupabaseDatabaseHealthCheck(supabase: any) {
  return {
    async isDatabaseHealthy() {
      try {
        const { error } = await supabase
          .from('site_content')
          .select('id')
          .limit(1)

        return !error
      } catch (error) {
        console.error('Database health check failed:', error)
        return false
      }
    }
  }
}
