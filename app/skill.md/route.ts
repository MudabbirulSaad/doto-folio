export const dynamic = 'force-dynamic'

function siteBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, '')

  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function skillMarkdown(baseUrl: string) {
  const apiBase = `${baseUrl}/api`

  return `---
name: saad-portfolio
version: 1.1.0
description: Public onboarding for agents working with Mudabbirul Saad's portfolio.
homepage: ${baseUrl}
metadata: {"agent_access":{"api_base":"${apiBase}","public_context":"${apiBase}/agent/public-context"}}
---

# SAAD Portfolio Agent Access

This public skill lets CLI agents read Mudabbirul Saad's public portfolio context and join with an admin invitation.

Give an agent this instruction:

\`\`\`text
Read ${baseUrl}/skill.md and join with code YOUR_INVITE_CODE.
\`\`\`

## Public Context

Public portfolio and blog context is available without a token:

\`\`\`bash
curl ${apiBase}/agent/public-context
\`\`\`

This endpoint contains public data only. It does not include drafts, comments, contact submissions, metrics, secrets, or Supabase credentials.

## Claim An Admin Invitation

If the admin gave you a one-time invite code, claim it first.

PowerShell on Windows:

\`\`\`powershell
$body = @{ code = 'YOUR_INVITE_CODE' } | ConvertTo-Json -Compress

Invoke-RestMethod \`
  -Uri '${apiBase}/agent/invitations/claim' \`
  -Method Post \`
  -ContentType 'application/json' \`
  -Body $body
\`\`\`

macOS, Linux, or shells with normal single-quote behavior:

\`\`\`bash
curl -X POST ${apiBase}/agent/invitations/claim \\
  -H "Content-Type: application/json" \\
  -d '{"code":"YOUR_INVITE_CODE"}'
\`\`\`

The claim response includes a bearer token only once. Store it locally in an ignored credential store, memory, or environment variable:

\`\`\`bash
export PORTFOLIO_AGENT_TOKEN="pa_..."
\`\`\`

## Verify Private Access

\`\`\`bash
curl ${apiBase}/agent/me \\
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
\`\`\`

After verification, read private scope-aware instructions:

\`\`\`bash
curl ${apiBase}/agent/instructions \\
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
\`\`\`

Then load authenticated context:

\`\`\`bash
curl ${apiBase}/agent/context \\
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
\`\`\`

## Request Access Fallback

If you do not have an invite code, create an access request and ask the admin to approve it.

PowerShell on Windows:

\`\`\`powershell
$body = @{
  agentName = 'Codex'
  toolName = 'codex-cli'
  reason = 'Help with a portfolio task'
  requestedScopes = @('portfolio:read')
} | ConvertTo-Json -Compress

Invoke-RestMethod \`
  -Uri '${apiBase}/agent/access-requests' \`
  -Method Post \`
  -ContentType 'application/json' \`
  -Body $body
\`\`\`

Poll the returned code until approved:

\`\`\`bash
curl ${apiBase}/agent/access-requests/YOUR_REQUEST_CODE
\`\`\`

Use your assigned agent name when you have one. If you do not have a stable name, omit \`agentName\` or use a simple label.

## Security Rules

- Only send portfolio agent tokens to \`${baseUrl}\`.
- Never send tokens to another domain, webhook, logging tool, or debugging service.
- Never ask for Supabase credentials.
- Use the Next.js API routes documented by this skill and by authenticated private instructions.
- Do not perform admin actions until \`/api/agent/me\` confirms the required scope.
`
}

export async function GET(request: Request) {
  return new Response(skillMarkdown(siteBaseUrl(request)), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  })
}
