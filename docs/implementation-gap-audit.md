# Implementation Gap Audit

Current branch: `main`

Status: closed for the implementation gaps found during this audit. The only remaining direct `fetch` calls are intentional integration points listed below.

## Closed Gaps

### Public Portfolio Content Wiring

Status: Closed.

Evidence:

- `tests/public-portfolio-content.test.ts`
- `tests/client/public-portfolio-sections.test.tsx`
- `npm test`
- `npm run test:client`
- `npm run build`

Closed changes:

- `app/page.tsx` loads public portfolio content server-side through `createPublicPortfolioContentUseCase`.
- `components/about-section.tsx`, `components/contact-section.tsx`, `components/footer-section.tsx`, `components/projects-section.tsx`, and `components/skills-section.tsx` render backend-managed published content.
- Fallback defaults live in server application/composition instead of local UI placeholder arrays.

### Admin Content Navigation

Status: Closed.

Evidence:

- `tests/admin-content-routes.test.ts`
- `tests/client/admin-content-navigation.test.tsx`
- `npm test`
- `npm run test:client`
- `npm run build`

Closed changes:

- `/admin/content/contact` now exists.
- The unreal `/admin/content/settings` dashboard card was removed.
- Dashboard content links resolve to implemented pages.

### Frontend Hexagonal Workflows

Status: Closed for audited admin/public pages.

Evidence:

- `tests/client/admin-content-overview-workflow.test.ts`
- `tests/client/admin-contact-submissions-workflow.test.ts`
- `tests/client/admin-comments-workflow.test.ts`
- `tests/client/admin-site-content-workflow.test.ts`
- `tests/client/admin-skills-workflow.test.ts`
- `tests/client/admin-blog-taxonomy-workflow.test.ts`
- `tests/client/admin-blog-posts-workflow.test.ts`
- `tests/client/admin-recaptcha-workflow.test.ts`
- `npm run test:client`
- `npm run build`

Closed changes:

- Admin content overview delegates to `lib/client/application/admin/content-overview.ts` and `lib/client/adapters/http/admin-content-overview-api.ts`.
- Contact submissions table delegates list/update/export to `lib/client/application/admin/contact-submissions.ts` and `lib/client/adapters/http/admin-contact-submissions-api.ts`.
- Admin comments delegates list/delete/reply to `lib/client/application/admin/comments.ts` and `lib/client/adapters/http/admin-comments-api.ts`.
- Hero/about content delegates load/save to `lib/client/application/admin/site-content.ts` and `lib/client/adapters/http/admin-site-content-api.ts`.
- Admin skills delegates list/create/update/delete to `lib/client/application/admin/skills.ts` and `lib/client/adapters/http/admin-skills-api.ts`.
- Blog categories/tags delegate list/create/update/delete to `lib/client/application/admin/blog-taxonomy.ts` and `createAdminBlogTaxonomyApiGateway`.
- Blog post create/edit delegates post create/update/delete to `lib/client/application/admin/blog-posts.ts` and taxonomy reads/creates to `lib/client/application/admin/blog-taxonomy.ts`.
- Admin login delegates reCAPTCHA verification to `lib/client/application/admin/recaptcha.ts` and `lib/client/adapters/http/admin-recaptcha-api.ts`.

### Backend Application Seams

Status: Closed for audited seams.

Evidence:

- `tests/architecture-boundaries.test.ts`
- `tests/blog-editor-tools.test.ts`
- `tests/admin-submissions.test.ts`
- `tests/admin-comments-auth.test.ts`
- `tests/supabase-adapters.test.ts`
- `tests/admin-dashboard.test.ts`
- `npm test`

Closed changes:

- Blog recommendation logic moved out of `lib/services` into `lib/server/application/blog/recommendations.ts`.
- Server application modules are guarded against `@/lib/services` imports.
- Supabase adapter `any` seams for audited adapters were replaced with narrow client interfaces and boundary tests.
- Markdown conversion and URL metadata extraction moved into `lib/server/application/blog/editor-tools.ts`.
- Contact submission CSV/JSON/HTML export formatting moved into `lib/server/application/contact/admin-submissions.ts`.
- Admin comment deletion now has a real authenticated `DELETE /api/admin/comments?id=...` path backed by `deleteAdminComment`.

### Legacy Pass-Through Cleanup

Status: Closed for audited `lib/data` blog pass-throughs and unwired one-off UI utilities.

Evidence:

- `tests/architecture-boundaries.test.ts`
- `rg -n "@/lib/data|lib/data|BlogServerData"`
- `npm test`
- `npm run build`

Closed changes:

- `app/blog/page.tsx` no longer imports `lib/data/blog-server.ts`.
- Obsolete blog `lib/data/*` pass-throughs were removed.
- App routes are guarded against `@/lib/data` imports.
- Unreferenced one-off utilities `components/blog/mobile-stay-updated.tsx` and `components/utils/email-protection.tsx` were removed after import searches found no callers.

Retained reusable inventory:

- `lib/api/documentation.ts` is retained because `package.json` exposes the `api:docs` script through it.
- `components/ui/form.tsx`, `components/ui/navigation-menu.tsx`, and `components/ui/sheet.tsx` are retained as reusable shadcn-style UI primitives, not feature-specific dead code.

### Public Blog API Boundary

Status: Closed for audited server component reads.

Evidence:

- `tests/architecture-boundaries.test.ts`
- `npm test`
- `npm run build`

Closed changes:

- `app/blog/category/[slug]/page.tsx` and `app/blog/tag/[slug]/page.tsx` use server composition directly instead of fetching this app's own `/api/blog/*` endpoints over HTTP.
- Boundary tests guard against `app/blog` server pages using `NEXT_PUBLIC_SITE_URL` plus `/api/blog/*` internal HTTP calls.

## Intentional Integration Points

The final raw `fetch` scan intentionally leaves these calls:

- `lib/server/adapters/http/recaptcha-human-verifier.ts`: external Google reCAPTCHA adapter.
- `app/api/admin/blog/fetch-url/route.ts`: route injects `fetch` into the URL metadata application use case.
- `lib/auth/admin.ts`: browser auth helper calls `/api/auth/logout`; this is an auth integration helper, not UI workflow code.

The final legacy import scan intentionally leaves:

- `lib/server/adapters/email/contact-email-notifier.ts` and `lib/server/adapters/email/subscription-email-notifier.ts` importing `@/lib/services/email`. These are email infrastructure adapters wrapping the existing email transport. Server application modules do not import `@/lib/services`.

## Final Verification

Commands:

- `npm test`
- `npm run test:client`
- `npm run build`
- `rg -n -e "fetch\\(" app components lib --glob "*.ts" --glob "*.tsx"`
- `rg -n -e "@/lib/data|@/lib/services" app components lib tests --glob "*.ts" --glob "*.tsx"`

Current verification results:

- Server tests: 76 passing.
- Client tests: 44 passing.
- Production build: passing.
- `next.config.ts` remains the only unstaged local change and was not included in the refactor commits.
