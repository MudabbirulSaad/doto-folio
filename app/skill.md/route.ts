import { AGENT_SCOPES } from '@/lib/server/application/agent-access/agent-access'

export const dynamic = 'force-dynamic'

function siteBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, '')

  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function skillMarkdown(baseUrl: string) {
  const apiBase = `${baseUrl}/api`
  const scopes = AGENT_SCOPES.map(scope => `- \`${scope}\``).join('\n')

  return `---
name: saad-portfolio
version: 1.0.0
description: Scoped agent access for Mudabbirul Saad's portfolio, blog, comments, and admin content.
homepage: ${baseUrl}
metadata: {"agent_access":{"api_base":"${apiBase}","context":"${apiBase}/agent/context"}}
---

# SAAD Portfolio Agent Access

This skill lets CLI agents request scoped access to Mudabbirul Saad's portfolio admin API.

Give an agent this instruction:

\`\`\`text
Read ${baseUrl}/skill.md and follow the instructions to request portfolio access.
\`\`\`

## Skill Files

| File | URL |
|------|-----|
| **SKILL.md** | \`${baseUrl}/skill.md\` |
| **Agent Context** | \`${apiBase}/agent/context\` |
| **Agent Identity** | \`${apiBase}/agent/me\` |

## Critical Security Rules

- Only send portfolio agent tokens to \`${baseUrl}\`.
- Never send a portfolio token to another domain, webhook, logging tool, or debugging service.
- Never ask for Supabase credentials.
- Agents must use the Next.js API routes documented here.
- Agents must only perform actions covered by their granted scopes.

## Request Access

Create an access request.

PowerShell on Windows:

\`\`\`powershell
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

Invoke-RestMethod \`
  -Uri '${apiBase}/agent/access-requests' \`
  -Method Post \`
  -ContentType 'application/json' \`
  -Body $body
\`\`\`

macOS, Linux, or shells with normal single-quote behavior:

\`\`\`bash
curl -X POST ${apiBase}/agent/access-requests \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentName": "Codex",
    "toolName": "codex-cli",
    "reason": "Draft and update portfolio blog posts",
    "requestedScopes": ["portfolio:read", "blog-posts:read", "blog-posts:create", "blog-posts:update"]
  }'
\`\`\`

If PowerShell returns \`INVALID_JSON\`, use the \`Invoke-RestMethod\` example above instead of \`curl.exe -d '{...}'\`.

Response includes a short \`code\`. Show that code to the human admin and ask them to approve it in:

\`\`\`text
${baseUrl}/admin/agents
\`\`\`

## Poll For Approval

\`\`\`bash
curl ${apiBase}/agent/access-requests/YOUR_REQUEST_CODE
\`\`\`

Possible statuses:

- \`pending\` - wait for the admin.
- \`approved\` - response includes a bearer token.
- \`rejected\` - stop and tell the user.
- \`expired\` - create a new request.

Save the returned token in a local ignored credential store, memory, or environment variable:

\`\`\`bash
export PORTFOLIO_AGENT_TOKEN="pa_..."
\`\`\`

## Verify Your Access

\`\`\`bash
curl ${apiBase}/agent/me \\
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
\`\`\`

Read your granted scopes before taking action.

## Load Portfolio Context

\`\`\`bash
curl ${apiBase}/agent/context \\
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
\`\`\`

The context endpoint returns public portfolio/blog context, granted scopes, API metadata, and safety notes.
It does not include hidden drafts, contact submissions, comments, metrics, secrets, or Supabase credentials.

## Available Scopes

${scopes}

## Common Tasks

### Read public portfolio context

Request:

\`\`\`json
["portfolio:read"]
\`\`\`

Then call:

\`\`\`bash
curl ${apiBase}/agent/context \\
  -H "Authorization: Bearer $PORTFOLIO_AGENT_TOKEN"
\`\`\`

### Draft or update blog posts

Request:

\`\`\`json
["portfolio:read", "blog-taxonomy:read", "blog-posts:read", "blog-posts:create", "blog-posts:update", "blog-tools:convert-markdown", "blog-tools:fetch-url"]
\`\`\`

Useful endpoints after approval:

- \`GET ${apiBase}/admin/blog/posts\`
- \`POST ${apiBase}/admin/blog/posts\`
- \`GET ${apiBase}/admin/blog/posts/POST_ID\`
- \`PUT ${apiBase}/admin/blog/posts/POST_ID\`
- \`GET ${apiBase}/admin/blog/categories\`
- \`GET ${apiBase}/admin/blog/tags\`
- \`POST ${apiBase}/admin/blog/convert-markdown\`
- \`GET ${apiBase}/admin/blog/fetch-url?url=...\`

### Moderate comments

Request:

\`\`\`json
["comments:read", "comments:delete"]
\`\`\`

Useful endpoints after approval:

- \`GET ${apiBase}/admin/comments\`
- \`DELETE ${apiBase}/admin/comments?id=COMMENT_ID\`

### Manage portfolio projects or skills

Request only the scopes required for the task:

\`\`\`json
["projects:read", "projects:create", "projects:update"]
\`\`\`

or:

\`\`\`json
["skills:read", "skills:create", "skills:update"]
\`\`\`

Useful endpoints after approval:

- \`GET ${apiBase}/admin/content/projects\`
- \`POST ${apiBase}/admin/content/projects\`
- \`PUT ${apiBase}/admin/content/projects/PROJECT_ID\`
- \`GET ${apiBase}/admin/content/skills\`
- \`POST ${apiBase}/admin/content/skills\`
- \`PUT ${apiBase}/admin/content/skills/SKILL_ID\`

## Response Format

Most successful responses use:

\`\`\`json
{"success": true, "data": {}}
\`\`\`

Errors use:

\`\`\`json
{"success": false, "error": {"code": "FORBIDDEN", "message": "Agent token is missing required scope"}}
\`\`\`

If you receive:

- \`401\` - token missing, expired, revoked, or invalid.
- \`403\` - token is valid but lacks the required scope.
- \`429\` - wait before retrying.

## Agent Behavior Rules

- Confirm granted scopes with \`/api/agent/me\` before making admin changes.
- Prefer creating drafts unless the human explicitly asks to publish.
- Do not delete posts, projects, skills, comments, tags, or categories unless the user explicitly asked and the token has a delete scope.
- Summarize intended changes before destructive operations.
- Store tokens locally only; do not commit them to the repository.
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
