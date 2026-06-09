'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, CheckCircle, Copy, KeyRound, Loader2, Send, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  approveAdminAgentRequest,
  createAdminAgentInvitation,
  loadAdminAgents,
  rejectAdminAgentRequest,
  revokeAdminAgentInvitation,
  revokeAdminAgentToken,
  updateAdminAgentTokenAccess
} from '@/lib/client/application/admin/agents'
import { createAdminAgentApiGateway } from '@/lib/client/adapters/http/admin-agents-api'
import {
  AGENT_SCOPE_TEMPLATES,
  CLIENT_AGENT_SCOPES,
  summarizeAgentScopes,
  toAgentScopeGroups
} from '@/lib/client/domain/admin-agents'
import type {
  AdminAgentAccessRequest,
  AdminAgentInvitation,
  AdminAgentToken,
  ClientAgentScope
} from '@/lib/client/domain/admin-agents'

const gateway = createAdminAgentApiGateway()

function messageForLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to load agent access'
  const lower = message.toLowerCase()

  if (
    lower.includes('agent_access_requests') ||
    lower.includes('agent_invitations') ||
    lower.includes('agent_tokens') ||
    lower.includes('agent_audit_events')
  ) {
    return 'Agent access tables are missing. Apply supabase/migrations/20260609_agent_access.sql and supabase/migrations/20260609_agent_invitations.sql, then refresh this page.'
  }

  return message
}

function formatDate(value: string | null) {
  if (!value) return 'Permanent'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function tokenHoursFromNow(expiresAt: string | null) {
  if (!expiresAt) return '24'
  const hours = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000))
  return String(Math.max(1, hours))
}

function toggleScope(selected: ClientAgentScope[], scope: ClientAgentScope) {
  return selected.includes(scope)
    ? selected.filter(item => item !== scope)
    : [...selected, scope]
}

function intersectScopes(scopes: readonly ClientAgentScope[], available: readonly ClientAgentScope[]) {
  const availableSet = new Set(available)
  return scopes.filter(scope => availableSet.has(scope))
}

function CompactScopeSelector({
  label,
  availableScopes = CLIENT_AGENT_SCOPES,
  selected,
  onChange,
  templates = true
}: {
  label: string
  availableScopes?: readonly ClientAgentScope[]
  selected: ClientAgentScope[]
  onChange: (scopes: ClientAgentScope[]) => void
  templates?: boolean
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const groups = useMemo(() => toAgentScopeGroups(availableScopes), [availableScopes])

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground">Selected: {summarizeAgentScopes(selected)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-white/10 bg-white/5 px-2 text-xs"
            onClick={() => onChange([...availableScopes])}
          >
            Select all
          </Button>
          <Button
            type="button"
            aria-label={`Clear ${label.toLowerCase()} scopes`}
            variant="outline"
            size="sm"
            className="h-7 border-white/10 bg-white/5 px-2 text-xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      </div>

      {templates && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {AGENT_SCOPE_TEMPLATES.map(template => (
            <Button
              key={template.id}
              type="button"
              variant="outline"
              size="sm"
              title={template.description}
              className="h-7 shrink-0 border-white/10 bg-black/20 px-2 text-xs"
              onClick={() => onChange(intersectScopes(template.scopes, availableScopes))}
            >
              {template.label}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
        {groups.map(group => {
          const activeCount = group.scopes.filter(scope => selectedSet.has(scope.value)).length

          return (
            <div key={group.id} className="grid gap-2 rounded-md border border-white/10 bg-black/20 p-2 sm:grid-cols-[150px_1fr] sm:items-center">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{group.label}</span>
                <Badge variant="outline" className="border-white/10 text-[10px]">{activeCount}/{group.scopes.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.scopes.map(scope => (
                  <button
                    key={scope.value}
                    type="button"
                    aria-pressed={selectedSet.has(scope.value)}
                    title={scope.value}
                    onClick={() => onChange(toggleScope(selected, scope.value))}
                    className={`rounded-full border px-2 py-1 text-xs transition-colors ${selectedSet.has(scope.value)
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScopeSummary({ scopes }: { scopes: ClientAgentScope[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="outline" className="border-white/10 text-xs">
        {scopes.length} scopes
      </Badge>
      <span className="text-muted-foreground">{summarizeAgentScopes(scopes)}</span>
    </div>
  )
}

export default function AdminAgentsPage() {
  const [requests, setRequests] = useState<AdminAgentAccessRequest[]>([])
  const [invitations, setInvitations] = useState<AdminAgentInvitation[]>([])
  const [tokens, setTokens] = useState<AdminAgentToken[]>([])
  const [selectedScopes, setSelectedScopes] = useState<Record<string, ClientAgentScope[]>>({})
  const [inviteForm, setInviteForm] = useState({
    agentLabel: '',
    toolName: 'codex-cli',
    instructionsMd: '',
    inviteMinutes: '15',
    tokenHours: '24',
    tokenPermanent: false
  })
  const [inviteScopes, setInviteScopes] = useState<ClientAgentScope[]>(['portfolio:read'])
  const [tokenEdits, setTokenEdits] = useState<Record<string, {
    scopes: ClientAgentScope[]
    tokenHours: string
    permanent: boolean
  }>>({})
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const pendingRequests = requests.filter(request => request.status === 'pending')
  const resolvedRequests = requests.filter(request => request.status !== 'pending')
  const pendingInvitations = invitations.filter(invitation => invitation.status === 'pending')
  const claimedInvitations = invitations.filter(invitation => invitation.status === 'claimed')
  const closedInvitations = invitations.filter(invitation => invitation.status === 'revoked' || invitation.status === 'expired')
  const invitationGroups = [
    { label: 'Pending', invitations: pendingInvitations },
    { label: 'Claimed', invitations: claimedInvitations },
    { label: 'Closed', invitations: closedInvitations }
  ].filter(group => group.invitations.length > 0)

  async function refresh() {
    const data = await loadAdminAgents(gateway)
    setRequests(data.requests)
    setInvitations(data.invitations)
    setTokens(data.tokens)
    setTokenEdits(Object.fromEntries(data.tokens.map(token => [
      token.id,
      {
        scopes: token.scopes,
        tokenHours: tokenHoursFromNow(token.expiresAt),
        permanent: token.expiresAt === null
      }
    ])))
    setSelectedScopes(current => {
      const next = { ...current }
      data.requests.forEach(request => {
        if (!next[request.id]) next[request.id] = request.requestedScopes
      })
      return next
    })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh()
        .catch(error => {
          console.error('Failed to load agents:', error)
          setMessage({ type: 'error', text: messageForLoadError(error) })
        })
        .finally(() => setLoading(false))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  async function approve(request: AdminAgentAccessRequest) {
    setBusyId(request.id)
    setMessage(null)
    const result = await approveAdminAgentRequest(gateway, request.id, selectedScopes[request.id] || [])
    setBusyId(null)

    if (!result.success) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: 'Agent request approved' })
    await refresh()
  }

  async function createInvitation() {
    setBusyId('create-invitation')
    setMessage(null)
    const now = new Date()
    const inviteExpiresAt = new Date(now.getTime() + Number(inviteForm.inviteMinutes || 15) * 60 * 1000).toISOString()
    const tokenExpiresAt = inviteForm.tokenPermanent
      ? null
      : new Date(now.getTime() + Number(inviteForm.tokenHours || 24) * 60 * 60 * 1000).toISOString()
    const result = await createAdminAgentInvitation(gateway, {
      agentLabel: inviteForm.agentLabel,
      toolName: inviteForm.toolName,
      instructionsMd: inviteForm.instructionsMd,
      scopes: inviteScopes,
      inviteExpiresAt,
      tokenExpiresAt
    })
    setBusyId(null)

    if (!result.success) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setLastInviteCode(result.value.code)
    setInviteForm(current => ({ ...current, agentLabel: '', instructionsMd: '' }))
    setMessage({ type: 'success', text: 'Agent invitation created' })
    await refresh()
  }

  async function updateTokenAccess(token: AdminAgentToken) {
    const edit = tokenEdits[token.id]
    if (!edit) return

    setBusyId(`token-access-${token.id}`)
    setMessage(null)
    const expiresAt = edit.permanent
      ? null
      : new Date(Date.now() + Number(edit.tokenHours || 24) * 60 * 60 * 1000).toISOString()
    const result = await updateAdminAgentTokenAccess(gateway, token.id, {
      scopes: edit.scopes,
      expiresAt
    })
    setBusyId(null)

    if (!result.success) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: 'Agent token access updated' })
    await refresh()
  }

  async function revokeInvitation(invitation: AdminAgentInvitation) {
    if (!confirm(`Revoke invitation for ${invitation.agentLabel}?`)) return

    setBusyId(invitation.id)
    setMessage(null)
    const result = await revokeAdminAgentInvitation(gateway, invitation.id)
    setBusyId(null)

    if (!result.success) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: 'Agent invitation revoked' })
    await refresh()
  }

  async function reject(request: AdminAgentAccessRequest) {
    setBusyId(request.id)
    setMessage(null)
    const result = await rejectAdminAgentRequest(gateway, request.id)
    setBusyId(null)

    if (!result.success) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: 'Agent request rejected' })
    await refresh()
  }

  async function revoke(token: AdminAgentToken) {
    if (!confirm(`Revoke access for ${token.agentName}?`)) return

    setBusyId(token.id)
    setMessage(null)
    const result = await revokeAdminAgentToken(gateway, token.id)
    setBusyId(null)

    if (!result.success) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: 'Agent token revoked' })
    await refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Agent Access
          </h1>
          <p className="mt-1 text-muted-foreground">Approve scoped CLI access and revoke active agent tokens.</p>
        </div>
        <Button onClick={() => refresh()} variant="outline" className="border-white/10 bg-white/5">
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success'
          ? 'border-green-500/20 bg-green-500/10 text-green-300'
          : 'border-red-500/20 bg-red-500/10 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Send className="h-4 w-4 text-primary" />
            Create Invitation
          </h2>
          {lastInviteCode && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-white/10 bg-white/5"
              onClick={() => navigator.clipboard?.writeText(`Read ${window.location.origin}/skill.md and join with code ${lastInviteCode}`)}
            >
              <Copy className="h-4 w-4" />
              Copy {lastInviteCode}
            </Button>
          )}
        </div>
        <div className="grid gap-4 rounded-md border border-white/10 bg-black/20 p-4 lg:grid-cols-[340px_1fr]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Input
                placeholder="Agent label"
                value={inviteForm.agentLabel}
                onChange={event => setInviteForm(current => ({ ...current, agentLabel: event.target.value }))}
              />
              <Input
                placeholder="Tool name"
                value={inviteForm.toolName}
                onChange={event => setInviteForm(current => ({ ...current, toolName: event.target.value }))}
              />
              <Input
                type="number"
                min="1"
                placeholder="Invite expiry minutes"
                value={inviteForm.inviteMinutes}
                onChange={event => setInviteForm(current => ({ ...current, inviteMinutes: event.target.value }))}
              />
              <Input
                type="number"
                min="1"
                placeholder="Token expiry hours"
                value={inviteForm.tokenHours}
                disabled={inviteForm.tokenPermanent}
                onChange={event => setInviteForm(current => ({ ...current, tokenHours: event.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={inviteForm.tokenPermanent}
                onChange={event => setInviteForm(current => ({ ...current, tokenPermanent: event.target.checked }))}
              />
              Permanent token access
            </label>
            <Textarea
              className="min-h-28"
              placeholder="Task instructions markdown"
              value={inviteForm.instructionsMd}
              onChange={event => setInviteForm(current => ({ ...current, instructionsMd: event.target.value }))}
            />
            <Button onClick={createInvitation} disabled={busyId === 'create-invitation'} className="w-full gap-2">
              <Send className="h-4 w-4" />
              Create Invite
            </Button>
          </div>
          <div className="min-w-0">
            <CompactScopeSelector label="Invite" selected={inviteScopes} onChange={setInviteScopes} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Send className="h-5 w-5 text-primary" />
          Invitations
        </h2>

        {invitations.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-muted-foreground">
            No active agent invitations.
          </div>
        ) : (
          <div className="space-y-3">
            {invitationGroups.map(group => (
              <div key={group.label} className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</div>
                <div className="space-y-3">
                  {group.invitations.map(invitation => (
                    <article key={invitation.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{invitation.agentLabel}</h3>
                            <Badge variant="outline" className="border-white/10">{invitation.toolName}</Badge>
                            <Badge>{invitation.status}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Invite expires {formatDate(invitation.expiresAt)} - token expires {formatDate(invitation.tokenExpiresAt)}
                            {invitation.claimedAt ? ` - claimed ${formatDate(invitation.claimedAt)}` : ''}
                          </p>
                          <ScopeSummary scopes={invitation.scopes} />
                        </div>
                        {invitation.status === 'pending' && (
                          <Button
                            onClick={() => revokeInvitation(invitation)}
                            disabled={busyId === invitation.id}
                            variant="outline"
                            className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Bot className="h-5 w-5 text-primary" />
          Pending Requests
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-muted-foreground">
            No pending agent requests.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <article key={request.id} className="rounded-md border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{request.agentName}</h3>
                      <Badge variant="outline" className="border-white/10">{request.toolName}</Badge>
                      <Badge>{request.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{request.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Expires {formatDate(request.expiresAt)}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <>
                    <CompactScopeSelector
                      label={`${request.agentName} request`}
                      availableScopes={request.requestedScopes}
                      selected={selectedScopes[request.id] || request.requestedScopes}
                      onChange={scopes => setSelectedScopes(current => ({ ...current, [request.id]: scopes }))}
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={() => approve(request)}
                        disabled={busyId === request.id}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => reject(request)}
                        disabled={busyId === request.id}
                        variant="outline"
                        className="gap-2 border-red-500/20 text-red-300 hover:bg-red-500/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {resolvedRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CheckCircle className="h-5 w-5 text-primary" />
            Resolved Requests
          </h2>
          <div className="divide-y divide-white/10 overflow-hidden rounded-md border border-white/10 bg-black/20">
            {resolvedRequests.map(request => (
              <div key={request.id} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <div className="font-medium text-foreground">{request.agentName}</div>
                  <div className="text-muted-foreground">{request.toolName} - {request.reason}</div>
                </div>
                <Badge variant="outline" className="w-fit border-white/10">{request.status}</Badge>
                <div className="text-muted-foreground">{formatDate(request.updatedAt)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <KeyRound className="h-5 w-5 text-primary" />
          Active Tokens
        </h2>

        {tokens.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-muted-foreground">
            No active agent tokens.
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map(token => (
              <article key={token.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{token.agentName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {token.toolName} - expires {formatDate(token.expiresAt)}
                      {token.lastUsedAt ? ` - last used ${formatDate(token.lastUsedAt)}` : ''}
                    </p>
                    <ScopeSummary scopes={token.scopes} />
                    <details className="mt-3 rounded-md border border-white/10 bg-white/[0.025]">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">Edit access</summary>
                      <div className="space-y-3 border-t border-white/10 p-3">
                        <CompactScopeSelector
                          label={`${token.agentName} token`}
                          selected={tokenEdits[token.id]?.scopes || token.scopes}
                          onChange={scopes => setTokenEdits(current => ({
                            ...current,
                            [token.id]: {
                              scopes,
                              tokenHours: current[token.id]?.tokenHours || tokenHoursFromNow(token.expiresAt),
                              permanent: current[token.id]?.permanent ?? token.expiresAt === null
                            }
                          }))}
                        />
                        <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Token hours"
                            value={tokenEdits[token.id]?.tokenHours || tokenHoursFromNow(token.expiresAt)}
                            disabled={tokenEdits[token.id]?.permanent ?? token.expiresAt === null}
                            onChange={event => setTokenEdits(current => ({
                              ...current,
                              [token.id]: {
                                scopes: current[token.id]?.scopes || token.scopes,
                                tokenHours: event.target.value,
                                permanent: current[token.id]?.permanent ?? token.expiresAt === null
                              }
                            }))}
                          />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={tokenEdits[token.id]?.permanent ?? token.expiresAt === null}
                              onChange={event => setTokenEdits(current => ({
                                ...current,
                                [token.id]: {
                                  scopes: current[token.id]?.scopes || token.scopes,
                                  tokenHours: current[token.id]?.tokenHours || tokenHoursFromNow(token.expiresAt),
                                  permanent: event.target.checked
                                }
                              }))}
                            />
                            Permanent access
                          </label>
                        </div>
                      </div>
                    </details>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => updateTokenAccess(token)}
                      disabled={busyId === `token-access-${token.id}`}
                      variant="outline"
                      className="border-white/10 bg-white/5"
                    >
                      Save Access
                    </Button>
                    <Button
                      onClick={() => revoke(token)}
                      disabled={busyId === token.id}
                      variant="outline"
                      className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
