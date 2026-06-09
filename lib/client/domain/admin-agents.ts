export const CLIENT_AGENT_SCOPES = [
  'portfolio:read',
  'site-content:read',
  'site-content:update',
  'projects:read',
  'projects:create',
  'projects:update',
  'projects:delete',
  'skills:read',
  'skills:create',
  'skills:update',
  'skills:delete',
  'contact-content:read',
  'contact-content:create',
  'content-overview:read',
  'blog-posts:read',
  'blog-posts:create',
  'blog-posts:update',
  'blog-posts:delete',
  'blog-taxonomy:read',
  'blog-categories:create',
  'blog-categories:update',
  'blog-categories:delete',
  'blog-tags:create',
  'blog-tags:update',
  'blog-tags:delete',
  'blog-tools:fetch-url',
  'blog-tools:convert-markdown',
  'comments:read',
  'comments:create',
  'comments:delete',
  'contact-submissions:read',
  'contact-submissions:update',
  'contact-submissions:export',
  'metrics:read'
] as const

export type ClientAgentScope = typeof CLIENT_AGENT_SCOPES[number]
export type AgentScopeTemplateId =
  | 'publicContext'
  | 'portfolioEditor'
  | 'blogWriter'
  | 'blogMaintainer'
  | 'commentModerator'
  | 'inboxAnalyst'
  | 'fullOperator'

export interface AgentScopeCatalogItem {
  value: ClientAgentScope
  action: string
  label: string
}

export interface AgentScopeGroup {
  id: string
  label: string
  scopes: AgentScopeCatalogItem[]
}

export interface AgentScopeTemplate {
  id: AgentScopeTemplateId
  label: string
  description: string
  scopes: ClientAgentScope[]
}

const SCOPE_GROUPS: Array<{ id: string; label: string; prefixes: string[] }> = [
  { id: 'portfolio', label: 'Portfolio', prefixes: ['portfolio'] },
  { id: 'site-content', label: 'Site Content', prefixes: ['site-content'] },
  { id: 'projects', label: 'Projects', prefixes: ['projects'] },
  { id: 'skills', label: 'Skills', prefixes: ['skills'] },
  { id: 'contact-content', label: 'Contact Content', prefixes: ['contact-content'] },
  { id: 'content-overview', label: 'Content Overview', prefixes: ['content-overview'] },
  { id: 'blog-posts', label: 'Blog Posts', prefixes: ['blog-posts'] },
  { id: 'blog-taxonomy', label: 'Blog Taxonomy', prefixes: ['blog-taxonomy', 'blog-categories', 'blog-tags'] },
  { id: 'blog-tools', label: 'Blog Tools', prefixes: ['blog-tools'] },
  { id: 'comments', label: 'Comments', prefixes: ['comments'] },
  { id: 'contact-submissions', label: 'Contact Submissions', prefixes: ['contact-submissions'] },
  { id: 'metrics', label: 'Metrics', prefixes: ['metrics'] }
]

function uniqueScopes(scopes: ClientAgentScope[]) {
  return [...new Set(scopes)]
}

function scopePrefix(scope: ClientAgentScope) {
  return scope.split(':')[0]
}

function scopeAction(scope: ClientAgentScope) {
  return scope.split(':').slice(1).join(':')
}

function titleCase(value: string) {
  return value
    .split(/[-:]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function groupForScope(scope: ClientAgentScope) {
  const prefix = scopePrefix(scope)
  const group = SCOPE_GROUPS.find(item => item.prefixes.includes(prefix))
  return group || { id: prefix, label: titleCase(prefix), prefixes: [prefix] }
}

export function toAgentScopeGroups(scopes: readonly ClientAgentScope[] = CLIENT_AGENT_SCOPES): AgentScopeGroup[] {
  const grouped = new Map<string, AgentScopeGroup>()

  scopes.forEach(scope => {
    const group = groupForScope(scope)
    const action = scopeAction(scope)
    const existing = grouped.get(group.id) || {
      id: group.id,
      label: group.label,
      scopes: []
    }

    existing.scopes.push({
      value: scope,
      action,
      label: titleCase(action)
    })
    grouped.set(group.id, existing)
  })

  return SCOPE_GROUPS
    .map(group => grouped.get(group.id))
    .filter((group): group is AgentScopeGroup => Boolean(group))
}

export function summarizeAgentScopes(scopes: readonly ClientAgentScope[]) {
  if (scopes.length === 0) return 'No scopes'

  const counts = new Map<string, number>()
  scopes.forEach(scope => {
    const group = groupForScope(scope)
    counts.set(group.label, (counts.get(group.label) || 0) + 1)
  })

  return [...counts.entries()]
    .map(([label, count]) => `${label} ${count}`)
    .join(', ')
}

export const AGENT_SCOPE_TEMPLATES: AgentScopeTemplate[] = [
  {
    id: 'publicContext',
    label: 'Public context',
    description: 'Read public portfolio context only.',
    scopes: ['portfolio:read']
  },
  {
    id: 'portfolioEditor',
    label: 'Portfolio editor',
    description: 'Edit portfolio projects, skills, site copy, and contact content.',
    scopes: [
      'portfolio:read',
      'site-content:read',
      'site-content:update',
      'projects:read',
      'projects:create',
      'projects:update',
      'projects:delete',
      'skills:read',
      'skills:create',
      'skills:update',
      'skills:delete',
      'contact-content:read',
      'contact-content:create',
      'content-overview:read'
    ]
  },
  {
    id: 'blogWriter',
    label: 'Blog writer',
    description: 'Draft and update posts with taxonomy and conversion tools.',
    scopes: [
      'blog-posts:read',
      'blog-posts:create',
      'blog-posts:update',
      'blog-taxonomy:read',
      'blog-categories:create',
      'blog-categories:update',
      'blog-tags:create',
      'blog-tags:update',
      'blog-tools:fetch-url',
      'blog-tools:convert-markdown'
    ]
  },
  {
    id: 'blogMaintainer',
    label: 'Blog maintainer',
    description: 'Full blog post, taxonomy, and blog tool access.',
    scopes: [
      'blog-posts:read',
      'blog-posts:create',
      'blog-posts:update',
      'blog-posts:delete',
      'blog-taxonomy:read',
      'blog-categories:create',
      'blog-categories:update',
      'blog-categories:delete',
      'blog-tags:create',
      'blog-tags:update',
      'blog-tags:delete',
      'blog-tools:fetch-url',
      'blog-tools:convert-markdown'
    ]
  },
  {
    id: 'commentModerator',
    label: 'Comment moderator',
    description: 'Read, reply to, and delete blog comments.',
    scopes: ['comments:read', 'comments:create', 'comments:delete']
  },
  {
    id: 'inboxAnalyst',
    label: 'Inbox analyst',
    description: 'Review submissions, exports, metrics, and content overview.',
    scopes: [
      'contact-submissions:read',
      'contact-submissions:update',
      'contact-submissions:export',
      'metrics:read',
      'content-overview:read'
    ]
  },
  {
    id: 'fullOperator',
    label: 'Full operator',
    description: 'All currently assignable agent scopes.',
    scopes: [...CLIENT_AGENT_SCOPES]
  }
].map(template => ({ ...template, scopes: uniqueScopes(template.scopes) }))
export type ClientAgentAccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type ClientAgentInvitationStatus = 'pending' | 'claimed' | 'expired' | 'revoked'

export interface AdminAgentAccessRequest {
  id: string
  agentName: string
  toolName: string
  reason: string
  requestedScopes: ClientAgentScope[]
  approvedScopes: ClientAgentScope[]
  status: ClientAgentAccessRequestStatus
  expiresAt: string
  approvedBy?: string | null
  rejectedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminAgentToken {
  id: string
  requestId?: string | null
  invitationId?: string | null
  agentName: string
  toolName: string
  scopes: ClientAgentScope[]
  expiresAt: string | null
  revokedAt?: string | null
  lastUsedAt?: string | null
  createdAt: string
}

export interface AdminAgentInvitation {
  id: string
  agentLabel: string
  toolName: string
  scopes: ClientAgentScope[]
  instructionsMd: string
  status: ClientAgentInvitationStatus
  expiresAt: string
  tokenExpiresAt: string | null
  createdBy: string
  claimedTokenId?: string | null
  claimedAt?: string | null
  createdAt: string
  updatedAt: string
}
