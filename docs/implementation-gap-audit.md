# Implementation Gap Audit

Current branch: `main`

Scope: backend and frontend wiring gaps after the hexagonal refactor, with special attention to unused/unwired code and public frontend sections that still render static content while backend/admin data exists.

## High Priority Gaps

### Public portfolio content is only partially wired to backend data

Status: Closed in public portfolio wiring slice.

Evidence:

- `tests/public-portfolio-content.test.ts`
- `tests/client/public-portfolio-sections.test.tsx`
- `npm test`
- `npm run test:client`
- `npm run build`

- `components/hero-section.tsx` fetches `/api/site-content` and uses `hero_*` fields.
- `components/about-section.tsx` is still fully static even though `site_content` exposes:
  - `about_title`
  - `about_intro`
  - `about_description`
  - `about_personal`
  - `education_title`
  - `education_degree`
  - `education_field`
  - `education_institution`
  - `approach_title`
  - `approach_description`
- `components/contact-section.tsx` is still fully static even though backend/admin data exists for:
  - `site_content.contact_title`
  - `site_content.contact_description`
  - `site_content.contact_opportunities_title`
  - `site_content.contact_opportunities_description`
  - `contact_methods`
  - `social_links`
- `components/footer-section.tsx` is still static even though `site_content` exposes:
  - `footer_brand_name`
  - `footer_brand_description`
  - `footer_location`
  - `footer_university`
  - `footer_field`
  - `footer_copyright`
- `components/projects-section.tsx` renders a local `projectPlaceholders` array even though project management and Supabase-backed project use cases exist.
- `components/skills-section.tsx` renders a local `skillCategories` array even though skill management and Supabase-backed skill use cases exist.

Recommended fix:

1. Add public/server composition use cases for published projects, published skills, contact methods, social links, and site content.
2. Fetch those from `app/page.tsx` server-side and pass data into presentational sections.
3. Keep fallback/default content inside application use cases, not inside UI components.

### Content dashboard links to missing admin pages

Status: Closed in admin content route slice.

Evidence:

- `tests/admin-content-routes.test.ts`
- `tests/client/admin-content-navigation.test.tsx`
- `npm test`
- `npm run test:client`
- `npm run build`

`app/admin/content/page.tsx` links to pages that do not exist:

- `/admin/content/contact` -> missing `app/admin/content/contact/page.tsx`
- `/admin/content/settings` -> missing `app/admin/content/settings/page.tsx`

The backend has `app/api/admin/content/contact/route.ts`, and the dashboard displays contact/social counts, so at least the contact page is clearly an unfinished implementation.

Recommended fix:

1. Implement `/admin/content/contact` with list/create/edit/delete flows for contact methods and social links.
2. Either implement `/admin/content/settings` or remove/rename the dashboard card until settings are real.

### Client hexagonal refactor is incomplete

Several client pages/components still own raw `fetch`, response parsing, validation, mutation workflows, and UI messages directly:

- `app/admin/blog/categories/page.tsx`
- `app/admin/blog/tags/page.tsx`
- `app/admin/blog/posts/new/page.tsx`
- `app/admin/blog/posts/[id]/edit/page.tsx`
- `app/admin/comments/page.tsx`
- `app/admin/content/page.tsx`
- `app/admin/content/hero-about/page.tsx`
- `app/admin/content/skills/page.tsx`
- `components/admin/contact-submissions-table.tsx`
- `components/hero-section.tsx`
- `components/seo/dynamic-seo.tsx`

Existing client application coverage is partial:

- `lib/client/application/admin/projects.ts` covers project form helpers and save/delete behavior.
- `lib/client/application/admin/blog-posts.ts` only covers filtering, summary, and delete. It does not cover post create/update, category/tag creation, markdown conversion, URL metadata fetch, or edit-page workflows.

Recommended fix:

1. Create missing `lib/client/application` workflows and `lib/client/adapters/http` gateways.
2. Move page-level request parsing and API envelope handling out of components.
3. Add behavior tests before each extraction.

### Server application layer still imports legacy services

`lib/server/application/blog/blog-post-detail.ts` imports `getHybridRecommendations` from `@/lib/services/recommendation`.

This violates the architecture rule that server application modules must not import legacy `lib/services/**` contracts.

Recommended fix:

1. Move recommendation logic into `lib/server/application/blog` or `lib/server/domain`.
2. Or inject it through a recommendation port if the algorithm should remain replaceable.
3. Remove or repurpose `lib/services/recommendation.ts` after callers are migrated.

### Supabase adapter typing remains incomplete

Examples:

- `lib/server/adapters/supabase/blog/public-blog-listing-repository.ts` defines `from(table: string): any`.
- `lib/server/adapters/supabase/admin/dashboard-repository.ts` accepts `adminClient: any` and maps untyped users/posts/comments.
- Shared `lib/server/adapters/supabase/types.ts` still defaults `SupabaseResult<T = any>`.

Recommended fix:

1. Add narrow interfaces for the specific query/auth operations used by each adapter.
2. Replace adapter-level `any` with typed result rows.
3. Add adapter contract tests for the newly typed operations.

### API route thinness is inconsistent

Status: Closed across backend editor tools and submission export slices.

Evidence:

- `tests/blog-editor-tools.test.ts`
- `tests/admin-submissions.test.ts`
- `npm test`
- `npm run test:client`
- `npm run build`

Routes that still own application logic:

- None currently listed in this section.

Closed:

- `app/api/admin/blog/fetch-url/route.ts` now delegates URL validation and metadata extraction to `lib/server/application/blog/editor-tools.ts`, with the route injecting the HTTP fetcher.
- `app/api/admin/blog/convert-markdown/route.ts` now delegates markdown-to-EditorJS conversion to `lib/server/application/blog/editor-tools.ts`.
- `app/api/admin/submissions/export/route.ts` now delegates CSV/JSON/HTML formatting to `exportContactSubmissions` in `lib/server/application/contact/admin-submissions.ts`.

Recommended fix:

1. Keep new admin API utilities on this route-thin pattern.

## Medium Priority Gaps

### Admin API authentication conventions are split

`proxy.ts` says admin API authentication is handled by `withAuth` in each route, but admin API routes currently use a mixture of:

- `withAuth`
- `requireAdminAuth`
- `getCurrentAdminUser`
- unauthenticated public-ish GET handlers under `/api/admin/content/*`

Examples:

- `app/api/admin/content/projects/route.ts` has unauthenticated `GET` and authenticated `POST`.
- `app/api/admin/content/skills/route.ts` has unauthenticated `GET` and authenticated `POST`.
- `app/api/admin/content/contact/route.ts` has unauthenticated `GET` and authenticated `POST`.

This may be intentional for public content reads, but the `/api/admin/*` namespace and proxy comment make the contract unclear.

Recommended fix:

1. Move public content reads to `/api/content/*` or server-side composition.
2. Protect all `/api/admin/*` routes consistently.
3. Update proxy comments and tests to match the chosen convention.

### Legacy pass-through modules remain

Likely obsolete compatibility modules:

- `lib/data/blog-post-detail.ts`
- `lib/data/blog-post-workflow.ts`
- `lib/data/public-blog-listing.ts`

Current public blog page still imports `BlogServerData` from `lib/data/blog-server.ts`.

Recommended fix:

1. Move `app/blog/page.tsx` away from `lib/data/blog-server.ts`.
2. Remove unused `lib/data/*` pass-throughs after import searches prove no callers remain.

### Potentially unused components/utilities

The current import graph found no app callers for:

- `components/blog/mobile-stay-updated.tsx`
- `components/utils/email-protection.tsx`
- `components/ui/form.tsx`
- `components/ui/navigation-menu.tsx`
- `components/ui/sheet.tsx`
- `lib/api/documentation.ts`

Some `components/ui/*` files may be intentionally kept as design-system inventory. The others should either be wired into real UI or removed.

## Backend/Frontend Data Wiring Checklist

### Site content

- Backend: present.
- Admin edit page: present for hero/about fields.
- Public frontend: only hero and dynamic SEO use it.
- Gap: about, contact intro/opportunity copy, footer fields are stranded.

### Projects

- Backend/admin API: present.
- Admin page: present.
- Public frontend: static placeholders.
- Gap: published project data is not rendered on home page.

### Skills

- Backend/admin API: present.
- Admin page: present.
- Public frontend: static skill categories.
- Gap: published skill data is not rendered on home page.

### Contact methods/social links

- Backend/admin API: present.
- Admin page: missing.
- Public frontend: static contact methods/social links.
- Gap: no complete admin UI and no public rendering from stored data.

### Blog posts

- Backend/public API: present.
- Public listing/detail pages: wired, but `app/blog/page.tsx` still uses legacy `lib/data/blog-server.ts`.
- Admin listing page: partially refactored.
- Admin create/edit/taxonomy pages: still raw workflow-heavy client pages.

### Comments

- Backend/public/admin APIs: present.
- Public comment components: partially refactored through client application/adapters.
- Admin comments page: still raw fetch/workflow-heavy.

### Contact submissions

- Backend/admin APIs: present.
- Admin contacts page: server-side initial load exists.
- Client table: still owns filtering, mutations, export fetch, and browser download workflow directly.

## Suggested Fix Order

1. Implement missing `/admin/content/contact` or remove the broken dashboard link.
2. Wire public home sections to backend data: projects, skills, about, contact, footer.
3. Normalize public/admin API boundaries so public content reads do not live under ambiguous `/api/admin/*` routes.
4. Extract remaining admin client workflows into `lib/client/application` and `lib/client/adapters/http`.
5. Move recommendation logic out of `lib/services` and finish Supabase adapter typing.
6. Move fat route logic for URL metadata, markdown conversion, and exports into testable application modules.
7. Remove or wire likely-unused modules after focused import checks.

## Evidence Commands Used

- `rg --files`
- `rg -n -e 'fetch\\(' app components lib --glob '*.ts' --glob '*.tsx'`
- `rg -n -e '@/lib/supabase|@/lib/server|@/lib/data|@/lib/services|@/lib/client' app components lib --glob '*.ts' --glob '*.tsx'`
- `rg -n -e 'static|hardcoded|TODO|FIXME|mock|placeholder|coming soon|sample|dummy' app components lib docs --glob '*.ts' --glob '*.tsx' --glob '*.md'`
- Node import graph over `app`, `components`, `lib`, and `tests`.
