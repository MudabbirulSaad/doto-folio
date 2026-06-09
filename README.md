# SAAD Portfolio

A full-stack portfolio and content management system for Mudabbirul Saad. The public site presents portfolio content, projects, skills, blog posts, comments, contact flows, and subscriptions; the admin area manages content, blog publishing, comments, submissions, metrics, and scoped agent access.

## Features

- Public portfolio with backend-managed hero, about, projects, skills, contact, and footer content.
- Blog platform with categories, tags, recommendations, Editor.js content, markdown conversion, comments, and view tracking.
- Admin CMS for portfolio content, projects, skills, contact methods, blog posts, taxonomy, contact submissions, comments, and agent access.
- Contact form and newsletter subscription workflows with validation, persistence, email notification adapters, and rate limiting.
- Invite-first agent access through public `/skill.md`, public context, scoped bearer tokens, access requests, private instructions, and audit events.
- Hexagonal server/client architecture documented in `docs/hexagonal-architecture.md`.
- Server, route, adapter, and client workflow tests.

## Tech Stack

- Next.js 16.2.6 with App Router and Turbopack
- React 19.2.0
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui-style primitives and Radix UI
- Supabase for database and auth
- Nodemailer email adapters
- Vitest and Node test runner

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Required environment values are documented in `.env.example`. Keep real secrets in ignored local files or deployment-provider environment variables. Rotate any credentials that have ever been committed, shared, or exposed in local logs.

## Verification

Run the main checks before opening a PR or publishing the repository:

```bash
npm run lint
npm test
npm run test:client
npm run build
```

Generate the OpenAPI-style API summary:

```bash
npm run api:docs
```

## Public Repository Safety

This project is safe to share publicly only when secrets stay outside Git. `.gitignore` ignores `.env*`, `.vercel`, and private key files.

Before making the repository public, rotate credentials that have existed in local development or deployment environments:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GMAIL_PASS`
- `RECAPTCHA_SECRET_KEY`
- production credentials stored in `.env` or deployment providers

Public browser variables such as `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, and `NEXT_PUBLIC_GA_MEASUREMENT_ID` can be visible to users, but they must still be scoped safely in their providers.

## Agent Access

Agents should not receive Supabase credentials. Give an invited agent this public instruction:

```text
Read https://mudabbirulsaad.com/skill.md and join with code YOUR_INVITE_CODE.
```

The agent APIs expose public context without authentication and private scope-aware context through invite-issued bearer tokens. See `AGENTS.md` and `docs/agent-access.md` for the full model.

## Architecture

The codebase separates framework, database, email, and HTTP details from application workflows:

- `lib/server/application`: server use cases and port interfaces
- `lib/server/adapters`: Supabase, email, and HTTP adapters
- `lib/server/composition`: concrete wiring for Next routes
- `lib/client/application`: browser workflows and validation
- `lib/client/adapters/http`: typed API gateways

Route handlers should stay thin: parse input, apply HTTP concerns, call composed use cases, and map errors.

## Rate Limiting

Current API rate limiting is process-local and in-memory. It is useful for development and light portfolio traffic, but it is not a distributed abuse-prevention system. Before relying on it for serious production protection, replace the store with a shared backend such as Redis, Upstash, or a provider-level rate-limiting feature.

## License

Private and proprietary to Mudabbirul Saad.
