# Full-Stack Hexagonal Architecture

This codebase keeps business behavior behind application ports on both sides of the Next.js app.
Framework, browser, database, email, and HTTP details live in adapters; application modules own workflow
rules and are the preferred test surface.

## Server Layers

- `lib/server/domain`: shared domain/application errors and pure concepts.
- `lib/server/application`: use cases and port interfaces. Tests target these modules for behavior.
- `lib/server/adapters/supabase`: Supabase repositories and auth delivery implementations.
- `lib/server/adapters/email`: email notifier implementations.
- `lib/server/adapters/http`: HTTP-facing helpers such as response and reCAPTCHA adapters.
- `lib/server/composition`: factories that wire Next routes to concrete adapters.

Server application modules must not import `app/**`, `components/**`, `lib/client/**`, `lib/supabase/**`,
or legacy `lib/services/**` contracts. If a workflow needs data delivery, define the port in
`lib/server/application` and satisfy it from an adapter.

## Client Layers

- `lib/client/domain`: browser-facing domain types and result shapes.
- `lib/client/application`: UI workflows, validation, filters, view-model transformations, and port interfaces.
- `lib/client/adapters/http`: typed `fetch` adapters for Next API routes.

Client pages/components should avoid raw business workflows and untyped response handling. They may own
render state, animation, browser APIs, and component composition, but API calls should pass through a client
adapter and workflow logic should sit in `lib/client/application`.

## Route Pattern

`app/**/route.ts` files should stay thin:

1. Parse request input and route params.
2. Apply HTTP concerns such as auth, rate limiting, and CORS.
3. Call a composed use case from `lib/server/composition`.
4. Map application errors to existing response envelopes.

Routes should not contain Supabase table logic, email delivery logic, or domain workflow rules.

## UI Pattern

Interactive UI should follow this shape:

1. Keep route/page files as containers for state, layout, and user events.
2. Use `lib/client/application` for validation, filtering, summaries, form preparation, and success/failure
   workflows.
3. Use `lib/client/adapters/http` for concrete API calls.
4. Keep presentational components unaware of Supabase, server composition, or response envelopes.

## Testing Pattern

Use TDD vertical slices:

- Application tests verify behavior through use cases and fake ports.
- Adapter contract tests verify table/RPC/auth/email mapping without coupling to application internals.
- Client workflow/component tests run with `npm run test:client`.
- Server tests run with `npm test` or `npm run test:server`.
- Full verification is `npm test`, `npm run test:client`, and `npm run build`.

Legacy modules in `lib/data` may re-export new server modules temporarily to avoid noisy caller churn. New server behavior should be added in `lib/server` first.
Legacy modules in `lib/services` should be treated as compatibility adapters only. New browser-facing behavior
belongs in `lib/client`; new server behavior belongs in `lib/server`.
