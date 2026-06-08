# Hexagonal Server Architecture

This codebase now keeps server-side business behavior behind application ports under `lib/server`.

## Layers

- `lib/server/domain`: shared domain/application errors and pure concepts.
- `lib/server/application`: use cases and port interfaces. Tests target these modules for behavior.
- `lib/server/adapters/supabase`: Supabase repositories and auth delivery implementations.
- `lib/server/adapters/email`: email notifier implementations.
- `lib/server/adapters/http`: HTTP-facing helpers such as response and reCAPTCHA adapters.
- `lib/server/composition`: factories that wire Next routes to concrete adapters.

## Route Pattern

`app/**/route.ts` files should stay thin:

1. Parse request input and route params.
2. Apply HTTP concerns such as auth, rate limiting, and CORS.
3. Call a composed use case from `lib/server/composition`.
4. Map application errors to existing response envelopes.

Routes should not contain Supabase table logic, email delivery logic, or domain workflow rules.

## Testing Pattern

Use TDD vertical slices:

- Application tests verify behavior through use cases and fake ports.
- Adapter contract tests verify table/RPC/auth/email mapping without coupling to application internals.
- Full verification is `npm test` and `npm run build`.

Legacy modules in `lib/data` may re-export new server modules temporarily to avoid noisy caller churn. New server behavior should be added in `lib/server` first.
