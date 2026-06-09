'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, CheckCircle, KeyRound, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  approveAdminAgentRequest,
  loadAdminAgents,
  rejectAdminAgentRequest,
  revokeAdminAgentToken
} from '@/lib/client/application/admin/agents'
import { createAdminAgentApiGateway } from '@/lib/client/adapters/http/admin-agents-api'
import type {
  AdminAgentAccessRequest,
  AdminAgentToken,
  ClientAgentScope
} from '@/lib/client/domain/admin-agents'

const gateway = createAdminAgentApiGateway()

function messageForLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to load agent access'
  const lower = message.toLowerCase()

  if (lower.includes('agent_access_requests') || lower.includes('agent_tokens') || lower.includes('agent_audit_events')) {
    return 'Agent access tables are missing. Apply supabase/migrations/20260609_agent_access.sql, then refresh this page.'
  }

  return message
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function ScopeSelector({
  request,
  selected,
  onChange
}: {
  request: AdminAgentAccessRequest
  selected: ClientAgentScope[]
  onChange: (scopes: ClientAgentScope[]) => void
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected])

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {request.requestedScopes.map(scope => (
        <label
          key={scope}
          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground"
        >
          <input
            type="checkbox"
            checked={selectedSet.has(scope)}
            onChange={event => {
              onChange(
                event.target.checked
                  ? [...selected, scope]
                  : selected.filter(item => item !== scope)
              )
            }}
          />
          <span className="break-all">{scope}</span>
        </label>
      ))}
    </div>
  )
}

export default function AdminAgentsPage() {
  const [requests, setRequests] = useState<AdminAgentAccessRequest[]>([])
  const [tokens, setTokens] = useState<AdminAgentToken[]>([])
  const [selectedScopes, setSelectedScopes] = useState<Record<string, ClientAgentScope[]>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function refresh() {
    const data = await loadAdminAgents(gateway)
    setRequests(data.requests)
    setTokens(data.tokens)
    setSelectedScopes(current => {
      const next = { ...current }
      data.requests.forEach(request => {
        if (!next[request.id]) next[request.id] = request.requestedScopes
      })
      return next
    })
  }

  useEffect(() => {
    refresh()
      .catch(error => {
        console.error('Failed to load agents:', error)
        setMessage({ type: 'error', text: messageForLoadError(error) })
      })
      .finally(() => setLoading(false))
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
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

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Bot className="h-5 w-5 text-primary" />
          Pending Requests
        </h2>

        {requests.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-muted-foreground">
            No active agent requests.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
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
                    <ScopeSelector
                      request={request}
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

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
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
                    <div className="mt-2 flex flex-wrap gap-1">
                      {token.scopes.map(scope => (
                        <Badge key={scope} variant="outline" className="border-white/10 text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => revoke(token)}
                    disabled={busyId === token.id}
                    variant="outline"
                    className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                  >
                    Revoke
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
