# Portfolio Agent Access

This project supports scoped CLI agent access through the portfolio web app.
Agents must use the Next.js API. Do not request, read, or use Supabase service
role credentials.

## Request Access

Create an access request.

PowerShell on Windows:

```powershell
$body = @{
  agentName = 'Codex'
  toolName = 'codex-cli'
  reason = 'Draft and update portfolio blog posts'
  requestedScopes = @(
    'portfolio:read',
    'blog-posts:read',
    'blog-posts:create',
    'blog-posts:update'
  )
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Uri "$PORTFOLIO_BASE_URL/api/agent/access-requests" `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

macOS, Linux, or shells with normal single-quote behavior:

```bash
curl -X POST "$PORTFOLIO_BASE_URL/api/agent/access-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "Codex",
    "toolName": "codex-cli",
    "reason": "Draft and update blog posts",
    "requestedScopes": ["portfolio:read", "blog-posts:read", "blog-posts:create", "blog-posts:update"]
  }'
```

If PowerShell returns `INVALID_JSON`, use the `Invoke-RestMethod` example above instead of `curl.exe -d '{...}'`.

The response includes a short request `code`. Tell the admin this code and wait
for approval in `/admin/agents`.

Poll for approval:

```bash
curl "$PORTFOLIO_BASE_URL/api/agent/access-requests/$REQUEST_CODE"
```

When approved, the response includes a bearer token. Store it only in a local
ignored file or environment variable:

```bash
export PORTFOLIO_AGENT_TOKEN="pa_..."
```

## Inspect Access

```bash
curl "$PORTFOLIO_BASE_URL/api/agent/me" \
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
```

## Load Context

```bash
curl "$PORTFOLIO_BASE_URL/api/agent/context" \
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
```

The context endpoint returns public portfolio/blog context, granted scopes, and
API metadata. Hidden drafts, comments, contact submissions, metrics, and other
admin-only data are not included unless the agent explicitly has matching read
scopes and calls the relevant API.

See `docs/agent-access.md` for the full scope map.
