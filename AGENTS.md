# Portfolio Agent Access

This project supports invite-first, scoped CLI agent access through the
portfolio web app. Agents must use the Next.js API routes and must never ask
for Supabase credentials.

## Public Entry Point

Tell an agent:

```text
Read https://mudabbirulsaad.com/skill.md and join with code YOUR_INVITE_CODE.
```

Agents can read public context without authentication:

```bash
curl "$PORTFOLIO_BASE_URL/api/agent/public-context"
```

Public context contains public portfolio/blog data only.

## Claim An Invitation

PowerShell on Windows:

```powershell
$body = @{ code = 'YOUR_INVITE_CODE' } | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Uri "$PORTFOLIO_BASE_URL/api/agent/invitations/claim" `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

macOS, Linux, or shells with normal single-quote behavior:

```bash
curl -X POST "$PORTFOLIO_BASE_URL/api/agent/invitations/claim" \
  -H "Content-Type: application/json" \
  -d '{"code":"YOUR_INVITE_CODE"}'
```

The claim response includes a bearer token only once. Store it only in a local
ignored file or environment variable:

```bash
export PORTFOLIO_AGENT_TOKEN="pa_..."
```

## Inspect Access And Instructions

```bash
curl "$PORTFOLIO_BASE_URL/api/agent/me" \
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"

curl "$PORTFOLIO_BASE_URL/api/agent/instructions" \
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"

curl "$PORTFOLIO_BASE_URL/api/agent/context" \
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
```

`/api/agent/instructions` returns only the private task instructions and
scope-aware guidance for the granted token.

## Fallback Access Request

If no invite code is available, an agent may request access and wait for admin
approval.

```powershell
$body = @{
  agentName = 'Codex'
  toolName = 'codex-cli'
  reason = 'Help with a portfolio task'
  requestedScopes = @('portfolio:read')
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Uri "$PORTFOLIO_BASE_URL/api/agent/access-requests" `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

Poll for approval:

```bash
curl "$PORTFOLIO_BASE_URL/api/agent/access-requests/$REQUEST_CODE"
```

Agents should use their assigned name when one exists. If no stable name has
been provided, they may omit `agentName`; the server records the request as
`Agent`.

See `docs/agent-access.md` for the admin model and scope map.
