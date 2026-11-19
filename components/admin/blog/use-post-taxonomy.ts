import { useEffect, useState } from 'react'
import {
  loadAdminBlogCategories,
  loadAdminBlogTags,
  type AdminBlogTaxonomyGateway
} from '@/lib/client/application/admin/blog-taxonomy'
import type { BlogCategory, BlogTag } from '@/lib/types/blog'

export function usePostTaxonomy(gateway: AdminBlogTaxonomyGateway) {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])

  useEffect(() => {
    let active = true
    void loadAdminBlogCategories(gateway).then(result => {
      if (active && result.success) setCategories(result.categories)
    })
    void loadAdminBlogTags(gateway).then(result => {
      if (active && result.success) setTags(result.tags)
    })
    return () => { active = false }
  }, [gateway])

  return { categories, setCategories, tags, setTags }
}
