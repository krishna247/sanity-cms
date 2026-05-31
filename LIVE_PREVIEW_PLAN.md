# Live Preview Plan — Sanity Presentation + Astro Visual Editing

**Status:** Proposed · **Rev:** v2 (2026-05-31, revised after adversarial review) ·
**Architecture:** A (static prod + separate SSR preview deploy) · **Phase 2 committed.**

**Scope:** spans `repos/sanity` (Studio) and `repos/frontend` (Astro). This doc
lives in the Studio repo next to `CONTENT_ARCHITECTURE_PLAN.md`, but **most work
is in the frontend.** v2 incorporates the findings in §12.

---

## 1. Goal

Editor opens the **Presentation tool** in the Studio and:
- sees the live frontend in an iframe rendering **draft** content,
- **clicks any text** to jump to the matching Studio field,
- sees edits on the next refresh,

**without changing production.** The public site (`sasinfra-frontend`, Cloudflare
Pages) stays 100% static. Preview is a separate, additive deployment.

---

## 2. Current state (verified 2026-05-31)

### Studio — `repos/sanity`
- Sanity v4, **npm** (`package-lock.json` — no pnpm cooldown here). Workspaces
  `production` + `old`. Self-hosted on Cloudflare Pages **`sasinfra-cms`** (not
  `*.sanity.studio`; `get_project_studios` → none → CORS added manually).
- Project **`ajw4irs3`**, dataset `production`. **Content is fully seeded &
  published** (`repos/sanity/seed-content.mjs`): singletons, pages, projects,
  updates, people, partners. `pressItem`/`jobPosting` intentionally empty. So the
  preview will render real content immediately.
- `sanity.config.ts` already has `presentationTool({ resolve, previewUrl: { initial } })`;
  `presentation/resolve.ts` maps every doc type via `lib/routing.ts`.
- **GAP:** `previewUrl.previewMode.enable` is missing → no draft toggle / overlays.

### Frontend — `repos/frontend`
- Astro v6, **`output: 'static'`**, **pnpm** (30-day `minimumReleaseAge` cooldown),
  Pages project **`sasinfra-frontend`** via `.github/workflows/deploy.yml`
  (Cloudflare account `659a3f2bef182e72dacb2ae344b2bf8a`).
- Build-time fetch via a hand-rolled `@sanity/client` (`src/lib/sanity.ts`),
  `perspective: 'published'`, `useCdn: false`. No `@sanity/astro` → no stega.
- **Two separate data files**, both must change:
  - `src/data/content.ts` — pages/projects/updates/press/jobs/blog-feed; **10**
    occurrences of `!(_id in path("drafts.**"))`.
  - `src/data/blog.ts` — blog index/detail (`getAllPosts`/`getPostBySlug`); its own
    filter at **line 80**; **bypasses any loader today**.
  - `src/data/siteSettings.ts` — Org/footer; **module-level promise cache**
    (`let cached` at line 157) feeding sitewide JSON-LD.
- `functions/_middleware.js` (**250 lines**) handles redirects in Pages Functions
  (legacy `_redirects` exceeded Cloudflare's ~238-rule cap).
- `src/lib/routing.ts` (frontend) and `repos/sanity/lib/routing.ts` (Studio) are
  **NOT identical** — they share only `resolveHref` (`_type → href`). That mapping
  is the real contract; the rest diverges (frontend has `resolveLinkHref`; Studio
  has `RESERVED_SECTIONS`).

### Core blocker
Draft preview = read a per-request cookie → fetch drafts with a token = **SSR**.
A static build can't. We confine SSR to a separate preview deployment.

---

## 3. Architecture (Path A) + the dual-build mechanism

Two Cloudflare Pages projects from **one** frontend codebase, switched by a
build-time env flag `PREVIEW_BUILD`:

| | Production | Preview |
|---|---|---|
| Pages project | `sasinfra-frontend` (existing) | `sasinfra-frontend-preview` (new) |
| `PREVIEW_BUILD` | unset | `1` |
| Astro `output` | `static` | `server` |
| Adapter | **none** | `@astrojs/cloudflare` |
| `_worker.js` emitted | no | yes |
| `functions/_middleware.js` | active (redirects) | **not shipped** (see §3.2) |
| Perspective | `published` (build time) | cookie-driven `drafts` (request time) |
| Stega / overlays | off | on |
| Trigger | push `main` → `deploy.yml` (unchanged) | push `main` → `deploy-preview.yml` (new) |

### 3.1 How one codebase yields both builds
- **`astro.config.mjs`** reads `PREVIEW_BUILD`. When set: `output:'server'`,
  add `@astrojs/cloudflare` adapter, `react()`, `@sanity/astro` with
  `stega.studioUrl`, and the `vite.optimizeDeps` block. When unset: `output:'static'`,
  **no adapter**, integrations that have no runtime effect tree-shake out.
- **Per-route `prerender`** — every previewable page and the draft-mode API routes
  export:
  ```ts
  export const prerender = !import.meta.env.PREVIEW_BUILD; // inlined at build
  ```
  - Prod (unset → `true`): pages prerender to static HTML exactly as today; **no
    adapter required, no `_worker.js`.**
  - Preview (`1` → `false`): pages render per-request (drafts); API routes are SSR.
  > **Why this matters (review finding I4):** a `prerender=false` route in an
  > `output:'static'` build makes Astro *demand an adapter* ("found a server-rendered
  > route but no adapter") — the routes are **not** "inert." The `prerender`
  > expression is what keeps the prod build pure-static.
- **Draft-mode API handlers** early-return `404` when `!import.meta.env.PREVIEW_BUILD`,
  so prerendering them in prod is a harmless no-op (no `validatePreviewUrl` at build).
- **CI gate:** `deploy.yml` must verify `pnpm build` (no flag) emits a static
  `dist/` with **no `_worker.js`** before trusting "prod untouched."

### 3.2 Redirects vs the SSR worker (review finding C4)
Cloudflare Pages **ignores `functions/` whenever `_worker.js` is present**, and
`@astrojs/cloudflare` deploys SSR *as* `_worker.js`. So the preview cannot use
`functions/_middleware.js`.
- **Decision:** the preview project does **not** need the legacy redirects —
  editors reach pages via the Studio resolver → canonical routes, not legacy URLs.
  `deploy-preview.yml` deploys only `dist/` (with `_worker.js`); the `functions/`
  dir is prod-only.
- If preview ever needs redirects, **port the logic into Astro middleware**
  (`src/middleware.ts`), which runs inside the SSR worker. Do **not** rely on
  `functions/` in the preview project.

### 3.3 Runtime flow
1. Editor opens Presentation → Studio loads the **preview URL** in an iframe.
2. Studio calls `<preview>/api/draft-mode/enable` with a signed secret.
3. `validatePreviewUrl` verifies it, sets the perspective cookie
   (`SameSite=None; Secure`), redirects to the target page.
4. Page renders SSR: cookie → `loadQuery` fetches `drafts` with the **runtime**
   token (§5), stega-encoded.
5. `<SanityVisualEditing>` (React island, draft-mode only) draws overlays, syncs
   history with the Studio.
6. Edit → `refresh` → full page reload → fresh drafts.

---

## 4. Phase 0 — Prereqs

1. **Viewer token** — create in [manage → `ajw4irs3` → API → Tokens] (Viewer).
   (CLI login + `SANITY_MCP_TOKEN` are available, so this can be scripted.) Used
   only to **read** drafts and **read** the preview-url-secret doc — see I1 (§12).
2. **CORS** with **Allow credentials**: `http://localhost:4321` (dev) and the
   preview origin (Phase 2). Add via Sanity MCP `add_cors_origin` or
   `npx sanity cors add … --credentials`.
3. **Token storage:** `.dev.vars` locally (Wrangler), Cloudflare Pages **secret**
   on `sasinfra-frontend-preview` (Phase 2). **Never** a build-time GH var and
   **never** `import.meta.env` at runtime (see §5 / finding C1).

---

## 5. Phase 1 — Wire visual editing (local, zero prod impact)

> **Run local dev with the Cloudflare adapter + `platformProxy`** (not `@astrojs/node`)
> so `Astro.locals.runtime.env` exists locally and **local ≡ deployed runtime**.
> This is deliberate: it prevents the C1 false-positive where `import.meta.env`
> works in `astro dev` but the token is `undefined` on deployed workerd.

### Frontend `repos/frontend`
- **Deps** (pnpm, subject to cooldown — expect to lower a floor or two):
  `@sanity/astro`, `@astrojs/react`, `@astrojs/cloudflare`,
  `@sanity/visual-editing`, `@sanity/preview-url-secret`, `groq`.
- **`astro.config.mjs`** — the `PREVIEW_BUILD` branching from §3.1, `sanity()`
  with `stega.studioUrl`, `react()`, and:
  ```js
  vite: { optimizeDeps: { include: [
    'react/compiler-runtime','lodash/isObject.js','lodash/groupBy.js',
    'lodash/keyBy.js','lodash/partition.js','lodash/sortedIndex.js',
  ] } }
  ```
- **`src/env.d.ts`** — add `/// <reference types="@sanity/astro/module" />`.
- **Token access (finding C1):** read via `Astro.locals.runtime.env.SANITY_API_READ_TOKEN`
  (pages) and `context.locals.runtime.env` (API routes). `loadQuery` takes the
  token as a **parameter** — it must never read `import.meta.env`. (Evaluate
  `astro:env/server` as a cleaner abstraction; verify the installed
  `@astrojs/cloudflare` supports it.)
- **`src/sanity/lib/load-query.ts`** — perspective + stega + source maps switch on
  the cookie; token passed in, used only in draft mode.
- **`src/sanity/lib/draft-mode.ts`** — read the perspective cookie from `Astro.cookies`.
- **Data layer refactor (findings C2/C3) — all three files:**
  - `content.ts`: route every fetch through `loadQuery`; **remove all 10**
    `!(_id in path("drafts.**"))` filters (safe under `published`; mandatory for
    `drafts` — see §12 C2). Add a `loadQuery`-backed `getProjectBySlug`/`getPageByPath`.
  - `blog.ts`: route `getAllPosts`/`getPostBySlug` through `loadQuery`; **remove
    the line-80 filter**. Add a real `getPostBySlug` (don't `getAllPosts().find()`
    per request).
  - `siteSettings.ts`: route through `loadQuery`; **scope the module cache** —
    memoize only at build (prod), fetch per-request in preview, or key by
    perspective (finding I6).
- **SSR fallbacks (finding C3):** `blog/[slug].astro` currently does
  `const { post } = Astro.props` with **no fallback** → breaks in SSR. Add
  `const post = Astro.props.post ?? await getPostBySlug(Astro.params.slug)` via
  `loadQuery`. Audit `[...slug].astro` and `projects/[slug].astro` — their
  fallbacks exist but must route through `loadQuery`.
- **Stega in `<head>` (finding I2) — single chokepoint:** in `src/components/SEO.astro`,
  deep-`stegaClean()` `title`, `description`, `imageAlt`, `article.*`, and **each
  `jsonLd` object** before `JSON.stringify` (line 84-86). `stegaClean` is recursive,
  so cleaning the JSON-LD objects covers `organizationJsonLd`/`websiteJsonLd`/
  `articleJsonLd`/`residenceJsonLd`/`officeBuildingJsonLd`/`breadcrumbJsonLd` in one
  place. **Body content (PageBuilder/PortableText) keeps stega** for overlays.
  (Optionally clean body `<img alt>` too — preview-only, low risk.)
- **Visual-editing islands:** `src/components/SanityVisualEditing.tsx` +
  `DisableDraftMode.tsx` (`client:only="react"`), rendered in `SiteLayout.astro`
  **only when the perspective cookie is present** (public visitors never load React).
- **Draft-mode routes:** `src/pages/api/draft-mode/enable.ts` + `disable.ts`, with
  `prerender = !import.meta.env.PREVIEW_BUILD` and the prod no-op guard (§3.1).

### Studio `repos/sanity` (npm — no cooldown, trivial)
Add to the existing `presentationTool`:
```ts
previewUrl: {
  initial: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
  previewMode: { enable: '/api/draft-mode/enable' },
}
```
Resolver already aligns — no change.

### Validate locally
Studio (`:3333`) + frontend (`:4321`, Cloudflare adapter + platformProxy + `.dev.vars`):
overlays appear, click-to-edit navigates, editing refreshes the iframe, **and the
token is actually being read** (confirm a `drafts`-perspective request in the
network tab, not a silent published fallback).

---

## 6. Phase 2 — Deployed preview environment

- **New Pages project** `sasinfra-frontend-preview`.
- **`repos/frontend/.github/workflows/deploy-preview.yml`** — mirrors `deploy.yml`
  but: `PREVIEW_BUILD=1`, `--project-name=sasinfra-frontend-preview`, and deploys
  only `dist/` (no `functions/`, per §3.2). Production `deploy.yml` is **untouched**.
- **Token as a Cloudflare Pages secret** on the preview project (runtime binding,
  read via `Astro.locals.runtime.env`). Not a build var.
- **Studio:** point `SANITY_STUDIO_PREVIEW_URL` at the preview deployment; set
  `stega.studioUrl` to the live `sasinfra-cms` Studio URL.
- **CORS:** add the preview origin (Allow credentials) **before first use**.
- **Verify on the deployed preview**, not just locally — confirm drafts render and
  the token resolves at request time (the C1 trap only shows up here).

---

## 7. Env vars & secrets

| Var | Where | Notes |
|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` | both builds | `ajw4irs3` / `production`, already in `deploy.yml` |
| `SANITY_API_READ_TOKEN` | **preview only** | Viewer token; `.dev.vars` local, **CF Pages secret** deployed; runtime-read |
| `PREVIEW_BUILD` | preview build | flips `output`/adapter/integrations/`prerender` |
| `SANITY_STUDIO_PREVIEW_URL` | Studio build | → preview deployment URL |
| `stega.studioUrl` | frontend integration | → live `sasinfra-cms` Studio URL |

---

## 8. Repo-specific gotchas
- **Token is runtime-bound on Cloudflare** — `import.meta.env` is build-time only;
  use `Astro.locals.runtime.env`. Works in `astro dev` only via `platformProxy` +
  `.dev.vars` (C1).
- **`functions/` and `_worker.js` are mutually exclusive** on Pages (C4).
- Cookie needs `SameSite=None; Secure` → HTTPS or `localhost` only.
- React enters the frontend only as a draft-mode island — code-split, never shipped
  to public visitors.
- Astro has **no Live Content API**; updates trigger a full page reload (expected).
- `drafts` perspective requires `useCdn: false` (already true).
- The shared contract is **only** `resolveHref`'s `_type → href` mapping; consider
  extracting just that into a tested shared module (I3).
- Per root CLAUDE.md: never `git add -A`; stage changed files by path; pushes
  auto-deploy.

---

## 9. Effort & sequencing
- **Phase 1** is the bulk — the 3-file data refactor (`content.ts` + `blog.ts` +
  `siteSettings.ts`), the SSR fallbacks, the SEO stega chokepoint, and the islands.
  Fully testable locally (with the Cloudflare adapter so it mirrors prod). Zero
  production risk.
- **Phase 2** is config/CI — new Pages project, `deploy-preview.yml`, runtime secret,
  CORS. The C1/C4 risks live here; verify on the deployed preview.
- Complete & demo Phase 1 before standing up Phase 2.

## 10. Future / optional
- **Content Releases** — needs the release-perspective stack + Studio config
  (more than "for free"); defer.
- **Presentation queries** (block-level refetch) — optimization for large
  page-builder docs; skip until the basic flow is proven.

---

## 11. References
- Sanity — *Visual Editing with Astro* (Astro 6 SSR):
  https://www.sanity.io/docs/visual-editing/astro-visual-editing
- Sanity — *Static and server rendering in Astro*:
  https://www.sanity.io/docs/astro/static-and-server-rendering
- Astro — *Cloudflare adapter* (runtime env / `Astro.locals.runtime.env`,
  `platformProxy`): https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Sanity — *Perspectives* (why removing the draft filter is safe under `published`):
  https://www.sanity.io/docs/content-lake/perspectives
- Floors: `sanity` 4.x (Studio) · `astro` 6.x · `@sanity/astro` 3.3.1+ ·
  `@astrojs/react` 5+ · `@astrojs/cloudflare` (latest) · `@sanity/visual-editing` 5.x ·
  `@sanity/preview-url-secret` latest.

---

## 12. Review corrections incorporated (v2)

Adversarial review of v1 (2026-05-31). Resolutions folded into the sections above.

| # | Finding | Resolution |
|---|---|---|
| **C1** | Token via `import.meta.env` is `undefined` at request time on Cloudflare workerd; passes `astro dev` then silently serves published/empty | Read via `Astro.locals.runtime.env`; `loadQuery` takes token as param; local dev uses Cloudflare adapter + `platformProxy` + `.dev.vars` so local ≡ deployed; verify on deployed preview (§3.1, §5, §6, §8) |
| **C2** | "Refactor `content.ts`" missed `blog.ts` (own filter, line 80) and `siteSettings.ts`; blog path bypasses the loader | Refactor scope = all three files; remove filters in all. *Confirmed:* removing the filter is **safe under `published`** (perspective already excludes drafts, no double-count) and **mandatory under `drafts`** (§5) |
| **C3** | `blog/[slug].astro` has no SSR fallback → undefined in preview | Add `props.post ?? await getPostBySlug()` via `loadQuery`; audit `[...slug]`/`projects/[slug]` fallbacks (§5) |
| **C4** | `@astrojs/cloudflare` `_worker.js` is mutually exclusive with the existing `functions/_middleware.js` → preview loses redirects | Preview doesn't ship `functions/`; editors reach canonical routes via resolver; port to Astro middleware only if needed (§3.2) |
| **I1** | `validatePreviewUrl` secret doc — is a Viewer token enough? | Studio mints the secret via the editor's logged-in session (write); the frontend's Viewer token only **reads** the secret doc (Viewer can read). **Verify end-to-end**; likely fine (§4) |
| **I2** | Stega-clean list incomplete (sitewide Org JSON-LD, blog, breadcrumb, og alt) | Single chokepoint: deep-`stegaClean()` in `SEO.astro` (title/description/imageAlt/article + each jsonLd object); body keeps stega (§5) |
| **I3** | The two `routing.ts` files aren't identical | Real contract is only `resolveHref`'s `_type → href`; consider extracting it (§2, §8) |
| **I4** | Dual-build "routes inert in prod" is wrong — `prerender=false` forces an adapter; `optimizeDeps` omitted | `prerender = !import.meta.env.PREVIEW_BUILD` + prod no-op guards; adapter/integrations gated on the flag; `optimizeDeps` added; CI verifies pure-static prod (§3.1, §5) |
| **I5** | Cooldown analysis lumped both repos | Studio is **npm** (no cooldown); only the 6 frontend deps hit the pnpm cooldown — expect to lower floors (§2, §5) |
| **I6** | `siteSettings.ts` module-level promise cache is unsafe per-request under SSR | Memoize at build only; per-request (or perspective-keyed) in preview (§5) |
| verdict | v1 not safe as written; the riskiest item (filter removal) is actually safe; landmines concentrate in Phase 2 (Cloudflare) | All folded in; Phase 2 retained per decision, with C1/C4/I6 treated as first-class design problems |

---

## 13. Implementation checklist (execution order)

Ordered so production is never at risk; each stage has a verification gate.
Stages A–F are local (zero prod impact); G is the deploy.
**Client decision: golden path** — adopt `@sanity/astro`'s `sanity:client`
(typed queries via `groq`/TypeGen), not a hand-wrapped client.

### Stage A — Scaffolding (no behavior change)
- [ ] A1. `pnpm add` the 6 deps; resolve the cooldown (lower caret floors to the newest ≥30-day release per root CLAUDE.md — do **not** disable it); commit lockfile.
- [ ] A2. `astro.config.mjs`: `PREVIEW_BUILD` branch — default `static`/no-adapter (unchanged); preview `server` + `@astrojs/cloudflare` + `react()`. Always register `sanity()` (`projectId`/`dataset`/`apiVersion`/`useCdn:false`/`stega.studioUrl`) so `sanity:client` exists in both builds. Add `vite.optimizeDeps.include`.
- [ ] A3. `src/env.d.ts`: add `/// <reference types="@sanity/astro/module" />`.
- [ ] **Gate A:** `pnpm build` (no flag) → static `dist/`, **no `_worker.js`**.

### Stage B — Data layer (golden-path client + the core refactor)
- [ ] B1. `src/lib/sanity.ts`: source the client from `sanity:client`; keep `urlForImage`/`portableTextToHtml` (rebuild the image builder from `sanity:client`).
- [ ] B2. `src/sanity/lib/load-query.ts`: wrap `sanity:client`; switch perspective/stega/`resultSourceMap` on the cookie; **token passed in** (from `Astro.locals.runtime.env`), used only in draft mode.
- [ ] B3. `src/sanity/lib/draft-mode.ts`: read the perspective cookie from `Astro.cookies`.
- [ ] B4. `content.ts`: route every fetch → `loadQuery`; **remove all 10** `drafts.**` filters; add `loadQuery`-backed `getPageByPath`/`getProjectBySlug`.
- [ ] B5. `blog.ts`: `getAllPosts`/`getPostBySlug` → `loadQuery`; **remove the line-80 filter**; add a direct `getPostBySlug` (no full-collection `.find()`).
- [ ] B6. `siteSettings.ts`: → `loadQuery`; **scope the module cache** (build-only / perspective-keyed) — finding I6.
- [ ] B7. *(Optional, golden-path)* wrap queries in `groq` `defineQuery`; run `sanity typegen generate` for typed results.
- [ ] **Gate B (critical):** `pnpm build` (no flag), diff HTML vs the current prod build → **identical**. Empirically proves filter removal is safe under `published`.

### Stage C — SEO / stega safety
- [ ] C1. `src/components/SEO.astro`: deep `stegaClean()` of `title`/`description`/`imageAlt`/`article.*` + **each `jsonLd` object** before `JSON.stringify` (line 84-86) — covers all JSON-LD in one place. Body content keeps stega.
- [ ] **Gate C:** no-op when stega is off → prod `<head>` bytes unchanged.

### Stage D — Visual-editing runtime (preview-only)
- [ ] D1. `export const prerender = !import.meta.env.PREVIEW_BUILD` on `index`, `[...slug]`, `projects/[slug]`, `blog/[slug]`.
- [ ] D2. SSR fallbacks: add the missing `blog/[slug]` fallback; route `[...slug]`/`projects/[slug]` fallbacks through `loadQuery` (finding C3).
- [ ] D3. `api/draft-mode/enable.ts` + `disable.ts` (`prerender` expr + prod no-op guard).
- [ ] D4. `SanityVisualEditing.tsx` + `DisableDraftMode.tsx` (`client:only="react"`).
- [ ] D5. `SiteLayout.astro`: render the islands only when the perspective cookie is present.

### Stage E — Studio (npm, trivial)
- [ ] E1. `sanity.config.ts`: add `previewMode: { enable: '/api/draft-mode/enable' }`.

### Stage F — Local validation (Phase 0 prereqs)
- [ ] F1. Viewer token → `.dev.vars`; add CORS `http://localhost:4321` (Allow credentials).
- [ ] F2. Run Studio (`:3333`) + frontend (`:4321`, Cloudflare adapter + `platformProxy`); confirm overlays, click-to-edit, refresh, **and a real `drafts` request** in the network tab (not a silent published fallback).

### Stage G — Deploy (Phase 2)
- [ ] G1. New Pages project `sasinfra-frontend-preview`.
- [ ] G2. `deploy-preview.yml`: `PREVIEW_BUILD=1`, `--project-name=sasinfra-frontend-preview`, deploy `dist/` only (no `functions/`, per §3.2).
- [ ] G3. Token as CF Pages **secret**; add CORS preview origin (credentials); Studio `SANITY_STUDIO_PREVIEW_URL` + `stega.studioUrl`.
- [ ] G4. Verify **on the deployed preview** (the C1 trap only surfaces here).

### Parallelism / independence
- A → B → C are behavior-preserving under `published` and could ship to prod independently of preview.
- D and E are independent of each other once B/C land.
