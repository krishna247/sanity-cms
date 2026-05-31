# Live Preview Plan — Sanity Presentation + Astro Visual Editing

**Status:** Proposed · **Date:** 2026-05-31 · **Architecture:** A (static prod + separate SSR preview deploy)

**Scope:** spans two repos — `repos/sanity` (Studio) and `repos/frontend` (Astro site).
This doc lives in the Studio repo because that's where the existing
`CONTENT_ARCHITECTURE_PLAN.md` lives, but **most of the work is in the frontend.**

---

## 1. Goal

Let an editor open the **Presentation tool** in the Studio and:

- see the live frontend in an iframe rendering **draft** (unpublished) content,
- **click any text** to jump straight to the matching field in the Studio,
- see edits reflected on the next refresh,

**without changing production.** The public site at `sasinfra-frontend`
(Cloudflare Pages) stays 100% static, fast, and SEO-clean. Preview is additive.

---

## 2. Current state (verified 2026-05-31)

### Studio — `repos/sanity`
- Sanity v4, two workspaces (`production`, `old`). Self-hosted on Cloudflare
  Pages project **`sasinfra-cms`** (not `*.sanity.studio` — `get_project_studios`
  returns none, so CORS origins must be added manually).
- Project ID **`ajw4irs3`**, dataset `production`.
- `sanity.config.ts` already has `presentationTool({ resolve, previewUrl: { initial } })`.
- `presentation/resolve.ts` already maps **every** doc type (`homePage`,
  `blogIndexPage`, `updatesIndexPage`, `page`, `project`, `blogPost`,
  `projectUpdate`) to a frontend URL via the shared `lib/routing.ts`.
- **GAP:** `previewUrl.previewMode.enable` is **missing**. Without it the iframe
  only ever shows *published* content — no draft toggle, no overlays.

### Frontend — `repos/frontend`
- Astro v6, **`output: 'static'`**, deployed to Pages project **`sasinfra-frontend`**
  via `.github/workflows/deploy.yml` (Cloudflare `wrangler-action`, account
  `659a3f2bef182e72dacb2ae344b2bf8a`).
- Data fetched **at build time** through a hand-rolled `@sanity/client`
  (`src/lib/sanity.ts`): `perspective: 'published'`, `useCdn: false`. **Not**
  using `@sanity/astro`, so there is no stega / content-source-map encoding →
  overlays are impossible today.
- Every GROQ query in `src/data/content.ts` hardcodes
  `!(_id in path("drafts.**"))` — which would *exclude* the drafts preview must show.
- No React, no `@sanity/visual-editing`, no draft-mode routes, no viewer token.
- `src/lib/routing.ts` is duplicated from the Studio and **already aligns**
  resolver hrefs with real routes (`/`, `/blog`, `/blog/:slug`, `/projects/:slug`,
  `/projects/updates#:slug`, `/:section/:segment`).

### The core blocker
Draft preview = read a per-request cookie → fetch drafts with a token. That is
**server-side rendering**. A static build cannot do it. So we need SSR
*somewhere* — and we'll confine it to a dedicated preview deployment.

---

## 3. Architecture (Path A)

Two deployments from **one** frontend codebase, switched by a build-time env flag
(e.g. `PREVIEW_BUILD=1`):

| | Production | Preview |
|---|---|---|
| Pages project | `sasinfra-frontend` (existing) | `sasinfra-frontend-preview` (new) |
| Astro `output` | `static` | `server` |
| Adapter | none | `@astrojs/cloudflare` |
| Perspective | `published` (build time) | `drafts` (request time, token) |
| Stega / overlays | off | on |
| Trigger | push to `main` (unchanged) | push to `main` → new workflow |
| Studio `previewUrl.initial` | — | → preview deployment URL |

Production `astro.config.mjs` and `deploy.yml` are **left untouched**. The preview
build flips `output` to `'server'`, adds the Cloudflare adapter, and activates the
SSR-only draft-mode routes. The SSR-only files (`/api/draft-mode/*`) are active
only in the preview build.

> **Implementation detail to lock down first (Phase 1, task 0):** the exact
> single-codebase / dual-build mechanism. Recommended: read `PREVIEW_BUILD` in
> `astro.config.mjs` and conditionally set `output` + `adapter`; the draft-mode
> API routes use `export const prerender = false` (SSR-only, so they're inert in
> the static prod build). Validate that `pnpm build` (no flag) still produces a
> clean static `dist/` with no adapter required.

### Runtime flow (how the pieces fit)
1. Editor opens Presentation → Studio loads the **preview URL** in an iframe.
2. Studio calls `<preview>/api/draft-mode/enable` with a signed secret.
3. `validatePreviewUrl` (`@sanity/preview-url-secret`) verifies it, sets the
   perspective cookie (`SameSite=None; Secure`), redirects to the target page.
4. The page re-renders SSR: `getDraftModeProps(Astro.cookies)` → `loadQuery`
   fetches the **drafts** perspective with the viewer token, **stega-encoded**.
5. `<SanityVisualEditing>` (React island, draft-mode only) reads the stega
   strings, draws click-to-edit overlays, syncs history with the Studio.
6. Editor edits a field → `refresh` callback → full page reload → fresh drafts.

---

## 4. Phase 0 — Prereqs (needs your input)

1. **Viewer token.** Create in [manage → project `ajw4irs3` → API → Tokens] with
   **Viewer** permission. Store as `SANITY_API_READ_TOKEN`:
   - frontend `.env` locally (server-only, never bundled),
   - Cloudflare Pages secret on `sasinfra-frontend-preview` (Phase 2).
2. **CORS origins** with **Allow credentials** checked:
   - `http://localhost:4321` (dev) — needed for Phase 1,
   - the preview deployment origin (Phase 2).
   Can be added via Sanity MCP (`add_cors_origin`) or `npx sanity cors add … --credentials`.

---

## 5. Phase 1 — Wire visual editing (local, zero prod impact)

Validate the entire flow on `localhost` before any deploy.

### Frontend `repos/frontend`
- **Deps** (subject to the repo's 30-day pnpm cooldown — see root CLAUDE.md):
  `@sanity/astro`, `@astrojs/react`, `@astrojs/cloudflare`,
  `@sanity/visual-editing`, `@sanity/preview-url-secret`, `groq`.
- **`astro.config.mjs`** — keep `output:'static'` for prod; behind `PREVIEW_BUILD`
  add `@astrojs/cloudflare` adapter + `output:'server'`. Always add the
  `sanity()` integration (`stega.studioUrl` = live `sasinfra-cms` URL) + `react()`.
- **`src/env.d.ts`** — add `/// <reference types="@sanity/astro/module" />`.
- **`src/sanity/lib/load-query.ts`** — draft-aware fetch: perspective +
  stega + source maps switch on the cookie; token only in draft mode.
- **`src/sanity/lib/draft-mode.ts`** — read the perspective cookie from `Astro.cookies`.
- **Refactor `src/data/content.ts`** — route all fetches through `loadQuery`;
  **remove the `!(_id in path("drafts.**"))` filters** (perspective now governs
  draft vs published). This is the largest single change.
- **`src/pages/api/draft-mode/enable.ts` + `disable.ts`** — the Studio↔frontend
  bridge (`prerender = false`).
- **`src/components/SanityVisualEditing.tsx` + `DisableDraftMode.tsx`** — React
  islands (`client:only="react"`).
- **`src/layouts/SiteLayout.astro`** — render the two islands only when the
  perspective cookie is present (so public visitors never load React).
- **`stegaClean()` all `<head>` / structured data** — `src/components/SEO.astro`,
  `seoTitle/seoDescription/seoImageUrl` in `content.ts`, `src/lib/jsonld.ts`,
  canonical URLs, and the sitemap serializer. **Stega chars in `<title>`/meta
  break SEO** — non-negotiable.
- Mark previewable routes (`index.astro`, `[...slug].astro`, project & blog
  pages) `prerender = false` **in the preview build only**.

### Studio `repos/sanity`
- `sanity.config.ts` — add to the existing `presentationTool`:
  ```ts
  previewUrl: {
    initial: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
    previewMode: { enable: '/api/draft-mode/enable' },
  }
  ```
  Resolver (`presentation/resolve.ts`) already aligns — no change.

### Validate
Run Studio (`:3333`) + `astro dev` (`:4321`), open Presentation, confirm:
overlays appear, click-to-edit navigates, editing a field refreshes the iframe.

---

## 6. Phase 2 — Deployed preview environment

- New Cloudflare Pages project **`sasinfra-frontend-preview`**.
- New `repos/frontend/.github/workflows/deploy-preview.yml` — same shape as
  `deploy.yml` but: `PREVIEW_BUILD=1`, `SANITY_API_READ_TOKEN` as a secret,
  `--project-name=sasinfra-frontend-preview`. (Production `deploy.yml` untouched.)
- Point Studio `SANITY_STUDIO_PREVIEW_URL` at the preview deployment; set
  `stega.studioUrl` to the live `sasinfra-cms` Studio URL.
- Add the preview origin to CORS (Allow credentials).

---

## 7. Env vars & secrets

| Var | Where | Notes |
|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | frontend build (both) | `ajw4irs3`, already set in `deploy.yml` |
| `PUBLIC_SANITY_DATASET` | frontend build (both) | `production`, already set |
| `SANITY_API_READ_TOKEN` | frontend **preview only** | Viewer token, server-only secret |
| `PREVIEW_BUILD` | frontend preview build | flips `output`/adapter |
| `SANITY_STUDIO_PREVIEW_URL` | Studio build | → preview deployment URL |
| `stega.studioUrl` | frontend integration config | → live `sasinfra-cms` Studio URL |

---

## 8. Repo-specific gotchas
- Cookie needs `SameSite=None; Secure` → works only over **HTTPS or `localhost`**
  (not a custom domain on plain HTTP).
- React enters the frontend, but only as a draft-mode island — code-split, never
  shipped to public visitors.
- Astro has **no Live Content API**; updates trigger a full page reload (expected).
- The `drafts` perspective requires `useCdn: false` (already the case).
- Two `lib/routing.ts` copies (Studio + frontend) must stay in sync — resolver
  hrefs and real routes are a contract. Already aligned today.
- Per root CLAUDE.md: never `git add -A`; stage only changed files by path.

---

## 9. Effort & sequencing
- **Phase 1** is the bulk (~the `content.ts` refactor + stega-cleaning + islands).
  Fully testable locally; no production risk.
- **Phase 2** is mostly config/CI (new Pages project, workflow, token, CORS).
- Recommend completing & demoing Phase 1 before standing up Phase 2.

## 10. Future / optional
- **Content Releases** — `loadQuery`'s perspective handling supports release
  stacks for free; surfaces in Presentation once enabled.
- **Presentation queries** (block-level refetch) — optimization for large
  page-builder docs; skip until the basic flow is proven.

---

## 11. References
- Sanity — *Visual Editing with Astro* (Astro 6 server-rendered):
  https://www.sanity.io/docs/visual-editing/astro-visual-editing
- Sanity — *Static and server rendering in Astro*:
  https://www.sanity.io/docs/astro/static-and-server-rendering
- Package floors: `sanity` 5.x · `astro` 6.x · `@sanity/astro` 3.3.1+ ·
  `@astrojs/react` 5+ · `@sanity/visual-editing` 5.x · `@sanity/preview-url-secret` latest.
