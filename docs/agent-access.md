# Agent Access

Agent access is a device-code style flow for CLI tools such as Codex, Claude
Code, Gemini CLI, Hermes, and OpenClaw. The agent requests scopes, the human
admin approves from the web app, and the agent receives a scoped bearer token.

Agents authenticate with:

```http
Authorization: Bearer pa_...
```

Human admin sessions continue to use Supabase auth cookies.

## Flow

1. Agent creates `POST /api/agent/access-requests`.
2. Agent shows the returned request code to the admin.
3. Admin opens `/admin/agents`, narrows or approves scopes, then approves.
4. Agent polls `GET /api/agent/access-requests/[code]`.
5. Agent stores the returned token in a local ignored credential store.
6. Agent calls `GET /api/agent/me` and `GET /api/agent/context` to verify access.

Raw request codes and raw tokens are not stored by the app. Server storage uses
hashes only.

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
- `comments:delete`
- `contact-submissions:read`
- `contact-submissions:update`
- `contact-submissions:export`
- `metrics:read`

Agent management is human-admin only in v1.

## Safety Rules

- Never use Supabase credentials from an agent.
- Request only the scopes needed for the current task.
- Prefer draft blog changes before publishing.
- Do not delete content unless the user explicitly asked for deletion and the
  token has the matching delete scope.
- Re-check `/api/agent/me` when an API returns `401` or `403`.
