import { createClient } from '@supabase/supabase-js'
import { createComment, listComments } from '@/lib/server/application/comments/comments'
import { createSupabaseCommentRepository } from '@/lib/server/adapters/supabase/comments/comments-repository'
import { createSupabaseCommenterAuthenticator } from '@/lib/server/adapters/supabase/comments/commenter-authenticator'
import type { CreateCommentInput } from '@/lib/server/application/comments/comments'

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function createCommentUseCases() {
  const supabaseAdmin = createSupabaseAdminClient()
  const repository = createSupabaseCommentRepository(supabaseAdmin)
  const authenticator = createSupabaseCommenterAuthenticator(supabaseAdmin)

  return {
    list: (postId: string) => listComments(repository, postId),
    create: (token: string, input: CreateCommentInput) => createComment(repository, authenticator, token, input)
  }
}
