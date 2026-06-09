# Agent Access

Agent access is invite-first for CLI tools such as Codex, Claude Code, Gemini
CLI, Hermes, and OpenClaw. Public portfolio context is open. Privileged admin
work requires a scoped bearer token issued from an admin-created one-time
invitation, with the existing access-request flow kept as fallback.

Agents authenticate with:

```http
Authorization: Bearer pa_...
```

Human admin sessions continue to use Supabase auth cookies.

## Flows

Preferred invite flow:

1. Admin opens `/admin/agents`.
2. Admin creates an invitation with agent label, tool name, scopes, expiry, and task markdown.
3. Admin tells the agent: `Read https://mudabbirulsaad.com/skill.md and join with code ...`.
4. Agent claims `POST /api/agent/invitations/claim`.
5. Agent stores the returned token locally.
6. Agent calls `/api/agent/me`, `/api/agent/instructions`, and `/api/agent/context`.

Fallback request flow:

1. Agent creates `POST /api/agent/access-requests`.
2. Admin approves or narrows scopes in `/admin/agents`.
3. Agent polls `GET /api/agent/access-requests/[code]`.

Raw invite codes, request codes, and bearer tokens are never stored. Server
storage uses hashes only.

Admins can edit active tokens at any time from `/admin/agents`: add or remove
scopes, set a new expiry duration, make access permanent, or revoke access.

## Public And Private Surfaces

Public:

- `GET /skill.md`
- `GET /api/agent/public-context`

Private agent:

- `GET /api/agent/me`
- `GET /api/agent/context`
- `GET /api/agent/instructions`

Admin:

- `GET/POST /api/admin/agents/invitations`
- `POST /api/admin/agents/invitations/[id]/revoke`
- Existing request approval and token revocation routes.
- `PUT /api/admin/agents/tokens/[id]` to update active token scopes and expiry.

## Scopes

Portfolio/content:

- `portfolio:read`
- `site-content:read`
- `site-content:update`
- `projects:read`
- `projects:create`
- `projects:update`
- `projects:delete`
- `skills:read`
- `skills:create`
- `skills:update`
- `skills:delete`
- `contact-content:read`
- `contact-content:create`
- `content-overview:read`

Blog:

- `blog-posts:read`
- `blog-posts:create`
- `blog-posts:update`
- `blog-posts:delete`
- `blog-taxonomy:read`
- `blog-categories:create`
- `blog-categories:update`
- `blog-categories:delete`
- `blog-tags:create`
- `blog-tags:update`
- `blog-tags:delete`
- `blog-tools:fetch-url`
- `blog-tools:convert-markdown`

Admin operations:

- `comments:read`
- `comments:create`
- `comments:delete`
- `contact-submissions:read`
- `contact-submissions:update`
- `contact-submissions:export`
- `metrics:read`

Agent management remains human-admin only.

## Safety Rules

- Never use Supabase credentials from an agent.
- Public `/skill.md` must not expose admin endpoint examples or the full scope catalog.
- Request or invite only the scopes needed for the current task.
- Use a stable agent name when available; otherwise the request flow accepts a generic `Agent` label.
- Prefer draft blog changes before publishing.
- Do not delete content unless the user explicitly asked for deletion and the token has the matching delete scope.
- Re-check `/api/agent/me` when an API returns `401` or `403`.
