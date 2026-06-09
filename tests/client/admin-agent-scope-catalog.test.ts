import { describe, expect, it } from 'vitest'
import {
  AGENT_SCOPE_TEMPLATES,
  CLIENT_AGENT_SCOPES,
  summarizeAgentScopes,
  toAgentScopeGroups
} from '@/lib/client/domain/admin-agents'

describe('admin agent scope catalog', () => {
  it('assigns every client agent scope to exactly one group', () => {
    const groupedScopes = toAgentScopeGroups(CLIENT_AGENT_SCOPES)
      .flatMap(group => group.scopes.map(scope => scope.value))

    expect(groupedScopes).toHaveLength(CLIENT_AGENT_SCOPES.length)
    expect(new Set(groupedScopes)).toEqual(new Set(CLIENT_AGENT_SCOPES))
  })

  it('defines practical permission templates without duplicate scopes', () => {
    const templates = Object.fromEntries(AGENT_SCOPE_TEMPLATES.map(template => [template.id, template.scopes]))

    expect(templates.publicContext).toEqual(['portfolio:read'])
    expect(templates.commentModerator).toEqual(['comments:read', 'comments:create', 'comments:delete'])
    expect(templates.blogWriter).toContain('blog-posts:create')
    expect(templates.blogWriter).not.toContain('blog-posts:delete')
    expect(templates.fullOperator).toEqual(CLIENT_AGENT_SCOPES)

    AGENT_SCOPE_TEMPLATES.forEach(template => {
      expect(new Set(template.scopes).size).toBe(template.scopes.length)
    })
  })

  it('summarizes selected scopes by compact resource labels', () => {
    expect(summarizeAgentScopes([
      'blog-posts:read',
      'blog-posts:create',
      'comments:read',
      'comments:delete',
      'projects:update'
    ])).toEqual('Blog Posts 2, Comments 2, Projects 1')
  })
})
