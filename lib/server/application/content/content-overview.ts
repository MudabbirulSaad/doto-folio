export interface AdminContentOverviewCounts {
  projectsCount: number
  skillsCount: number
  contactMethodsCount: number
  socialLinksCount: number
  commentsCount: number
}

export interface AdminContentOverviewRepository {
  getPublishedCounts(): Promise<AdminContentOverviewCounts>
  isSiteContentPublished(): Promise<boolean>
}

export async function getAdminContentOverview(repository: AdminContentOverviewRepository) {
  const [counts, isContentPublished] = await Promise.all([
    repository.getPublishedCounts(),
    repository.isSiteContentPublished()
  ])

  return {
    ...counts,
    isContentPublished
  }
}
