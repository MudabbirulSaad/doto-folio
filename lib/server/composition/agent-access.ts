import { createHash, randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AGENT_SCOPES,
  approveAgentAccessRequest,
  authenticateAgentToken,
  createAgentAccessRequest,
  claimAgentInvitation,
  createAgentInvitation,
  getAgentInstructions,
  getAgentContext,
  listAgentAccessRequests,
  listAgentInvitations,
  listAgentTokens,
  pollAgentAccessRequest,
  rejectAgentAccessRequest,
  revokeAgentInvitation,
  revokeAgentToken,
  updateAgentTokenAccess,
  type AgentAccessDependencies,
  type AgentScope
} from '@/lib/server/application/agent-access/agent-access'
import {
  createSupabaseAgentAccessRequestRepository,
  createSupabaseAgentAuditRepository,
  createSupabaseAgentInvitationRepository,
  createSupabaseAgentTokenRepository
} from '@/lib/server/adapters/supabase/agent-access/agent-access-repository'
import { createPublicPortfolioContentUseCase } from '@/lib/server/composition/content'
import { createServiceRolePublicBlogListingUseCase, createServiceRolePublicBlogTaxonomyUseCases } from '@/lib/server/composition/blog'

function createTokenHasher() {
  return {
    async hash(value: string) {
      return createHash('sha256').update(value).digest('hex')
    }
  }
}

function createTokenGenerator() {
  return {
    accessCode() {
      return randomBytes(4).toString('hex').toUpperCase()
    },
    bearerToken() {
      return `pa_${randomBytes(32).toString('base64url')}`
    }
  }
}

function createSystemClock() {
  return {
    now() {
      return new Date()
    }
  }
}

function createPortfolioContextReader() {
  return {
    async read({ scopes }: { scopes: AgentScope[] }) {
      const portfolio = await (await createPublicPortfolioContentUseCase())()
      const listBlogPosts = createServiceRolePublicBlogListingUseCase()
      const taxonomy = createServiceRolePublicBlogTaxonomyUseCases()

      const [blog, categories] = await Promise.all([
        listBlogPosts({ page: 1, limit: 10 }, { defaultLimit: 10, maxLimit: 10, tagLimit: 6 }),
        taxonomy.categoriesWithCounts()
      ])

      return {
        portfolio,
        blog,
        categories,
        grantedScopes: scopes,
        availableScopes: AGENT_SCOPES,
        adminApiBase: '/api/admin',
        note: 'Use only endpoints covered by grantedScopes. Hidden drafts, submissions, comments, and metrics are not included in this context payload.'
      }
    }
  }
}

export async function readPublicAgentContext() {
  const portfolio = await (await createPublicPortfolioContentUseCase())()
  const listBlogPosts = createServiceRolePublicBlogListingUseCase()
  const taxonomy = createServiceRolePublicBlogTaxonomyUseCases()

  const [blog, categories] = await Promise.all([
    listBlogPosts({ page: 1, limit: 10 }, { defaultLimit: 10, maxLimit: 10, tagLimit: 6 }),
    taxonomy.categoriesWithCounts()
  ])

  return {
    portfolio,
    blog,
    categories,
    note: 'This context contains public portfolio and blog data only. Claim an admin invitation before making privileged changes.'
  }
}

export function createAgentAccessDependencies(): AgentAccessDependencies {
  const supabase = createAdminClient()

  return {
    requests: createSupabaseAgentAccessRequestRepository(supabase),
    invitations: createSupabaseAgentInvitationRepository(supabase),
    tokens: createSupabaseAgentTokenRepository(supabase),
    audit: createSupabaseAgentAuditRepository(supabase),
    hasher: createTokenHasher(),
    generator: createTokenGenerator(),
    clock: createSystemClock(),
    portfolioContext: createPortfolioContextReader()
  }
}

export function createAgentAccessUseCases() {
  const deps = createAgentAccessDependencies()

  return {
    createRequest: (input: Parameters<typeof createAgentAccessRequest>[1]) =>
      createAgentAccessRequest(deps, input),
    pollRequest: (code: string) => pollAgentAccessRequest(deps, code),
    listRequests: () => listAgentAccessRequests(deps),
    createInvitation: (input: Parameters<typeof createAgentInvitation>[1]) =>
      createAgentInvitation(deps, input),
    listInvitations: () => listAgentInvitations(deps),
    revokeInvitation: (input: Parameters<typeof revokeAgentInvitation>[1]) =>
      revokeAgentInvitation(deps, input),
    claimInvitation: (code: string) => claimAgentInvitation(deps, code),
    approveRequest: (input: Parameters<typeof approveAgentAccessRequest>[1]) =>
      approveAgentAccessRequest(deps, input),
    rejectRequest: (input: Parameters<typeof rejectAgentAccessRequest>[1]) =>
      rejectAgentAccessRequest(deps, input),
    authenticateToken: (token: string, requiredScope?: AgentScope, route?: string) =>
      authenticateAgentToken(deps, token, requiredScope, route),
    listTokens: () => listAgentTokens(deps),
    revokeToken: (input: Parameters<typeof revokeAgentToken>[1]) =>
      revokeAgentToken(deps, input),
    updateTokenAccess: (input: Parameters<typeof updateAgentTokenAccess>[1]) =>
      updateAgentTokenAccess(deps, input),
    getContext: (token: string) => getAgentContext(deps, token),
    getInstructions: (token: string) => getAgentInstructions(deps, token)
  }
}
