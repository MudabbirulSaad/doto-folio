import { createClient } from '@supabase/supabase-js'
import type { SupabaseAdminDataClient } from '@/lib/server/adapters/supabase/types'
import { createComment, listComments } from '@/lib/server/application/comments/comments'
import { deleteAdminComment, listAdminComments } from '@/lib/server/application/comments/admin-comments'
import { createSupabaseCommentRepository } from '@/lib/server/adapters/supabase/comments/comments-repository'
import { createSupabaseCommenterAuthenticator } from '@/lib/server/adapters/supabase/comments/commenter-authenticator'
import { createSupabaseAdminCommentRepository } from '@/lib/server/adapters/supabase/comments/admin-comments-repository'
import type { CreateCommentInput } from '@/lib/server/application/comments/comments'
import { createAgentAccessDependencies } from '@/lib/server/composition/agent-access'
import { resolveAgentCommentAuthor } from '@/lib/server/application/agent-access/agent-access'

function createSupabaseAdminClient(): SupabaseAdminDataClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as unknown as SupabaseAdminDataClient
}

export function createCommentUseCases() {
  const supabaseAdmin = createSupabaseAdminClient()
  const repository = createSupabaseCommentRepository(supabaseAdmin)
  const userAuthenticator = createSupabaseCommenterAuthenticator(supabaseAdmin)
  const agentAccessDeps = createAgentAccessDependencies()

  return {
    list: (postId: string) => listComments(repository, postId),
    create: (token: string, input: CreateCommentInput) => createComment(repository, {
      async authenticate(bearerToken) {
        const user = await userAuthenticator.authenticate(bearerToken)
        if (user) return user

        const authorId = await resolveAgentCommentAuthor(agentAccessDeps, bearerToken)
        return { type: 'agent', id: authorId }
      }
    }, token, input)
  }
}

export function createAdminCommentUseCases() {
  const supabaseAdmin = createSupabaseAdminClient()
  const repository = createSupabaseAdminCommentRepository(supabaseAdmin)

  return {
    list: () => listAdminComments(repository),
    delete: (id: string) => deleteAdminComment(repository, id)
  }
}
