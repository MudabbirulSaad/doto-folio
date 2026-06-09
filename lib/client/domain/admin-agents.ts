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
  'comments:delete',
  'contact-submissions:read',
  'contact-submissions:update',
  'contact-submissions:export',
  'metrics:read'
] as const

export type ClientAgentScope = typeof CLIENT_AGENT_SCOPES[number]
export type ClientAgentAccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired'

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
  agentName: string
  toolName: string
  scopes: ClientAgentScope[]
  expiresAt: string
  revokedAt?: string | null
  lastUsedAt?: string | null
  createdAt: string
}
