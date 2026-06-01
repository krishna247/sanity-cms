# Live Preview Plan — Sanity Presentation + Astro Visual Editing

**Status:** **Stages A–G DONE & deployed (2026-06-01).** Preview Worker live at
`https://sasinfra-frontend-preview.sas-infra.workers.dev` behind Cloudflare Access.
Only remaining: the in-browser G7 eyeball (Access-gated → Krishna confirms overlays
render in Presentation) + the R-13 optimizeDeps client-hydration verdict. · **Rev:** v4
(2026-06-01; §12 Rounds 3–4 log the as-built deltas) · **Architecture:** A (static prod
on Pages + separate SSR preview Worker) · **Phase 2 shipped.**

**Scope:** spans `repos/sanity` (Studio) and `repos/frontend` (Astro). Lives in the
Studio repo next to `CONTENT_ARCHITECTURE_PLAN.md`, but **most work is in the
frontend.** §12 logs the adversarial review rounds + the as-built implementation log.

> **Astro 6 reality check (round 2).** Three earlier "fixes" assumed Astro-5-era
> APIs that Astro 6 changed. Corrected here: (a) `prerender` can no longer be a
> dynamic expression — use an `astro:route:setup` integration; (b)
> `Astro.locals.runtime.env` was removed — use `astro:env/server`; (c) the
> `@astrojs/cloudflare` adapter dropped **Cloudflare Pages** support — the preview
> is a **Cloudflare Workers** deploy. Production (static, on Pages) is untouched.

---

## 1. Goal

Editor opens the **Presentation tool** in the Studio and:
- sees the live frontend in an iframe rendering **draft** content,
- **clicks any text** to jump to the matching Studio field,
- sees edits on the next refresh,

**without changing production.** The public site (`sasinfra-frontend`, Cloudflare
**Pages**) stays 100% static. Preview is a separate, additive **Workers** deployment.

---

## 2. Current state (verified 2026-05-31)

### Studio — `repos/sanity`
- Sanity v4, **npm** (no pnpm cooldown here). Workspaces `production` + `old`.
  Self-hosted on Cloudflare **Pages** `sasinfra-cms` (not `*.sanity.studio`).
- Project **`ajw4irs3`**, dataset `production`. **Content fully seeded & published**
  (`seed-content.mjs`) → preview renders real content immediately.
- `sanity.config.ts` has `presentationTool({ resolve, previewUrl: { initial } })`;
  `presentation/resolve.ts` maps every doc type via `lib/routing.ts`.
- **GAP:** `previewUrl.previewMode.enable` missing → no draft toggle / overlays.

### Frontend — `repos/frontend`
- Astro v6, **`output: 'static'`**, **pnpm** (30-day `minimumReleaseAge`), Cloudflare
  **Pages** `sasinfra-frontend` via `.github/workflows/deploy.yml`
  (`wrangler pages deploy dist/`, account `659a3f2bef182e72dacb2ae344b2bf8a`).
- Build-time fetch via a hand-rolled `@sanity/client` (`src/lib/sanity.ts`),
  `apiVersion:'2026-05-31'`, `perspective:'published'`, `useCdn:false`. No stega.
- **Three data files** all change: `content.ts` (10 `drafts.**` filters), `blog.ts`
  (own filter at **line 80**, bypasses any loader), `siteSettings.ts`
  (**module-level promise cache**, line 157, feeds sitewide JSON-LD).
- `functions/_middleware.js` (250 lines) — redirects in **Pages Functions** (a
  Pages-only construct; lives at **repo root**, picked up because prod deploy runs
  `wrangler pages deploy` from the root, *not* because it's in `dist/`).
- `src/lib/routing.ts` (frontend) and `repos/sanity/lib/routing.ts` (Studio) are
  **NOT identical** — they share only `resolveHref` (`_type → href`). That mapping
  is the real contract.

### Core blocker
Draft preview = per-request cookie → fetch drafts with a token = **SSR**. Static
can't. We confine SSR to a separate **Workers** preview deployment.

---

## 3. Architecture (Path A) + the dual-build mechanism

One frontend codebase, two targets, switched by build env flag `PREVIEW_BUILD`:

| | Production | Preview |
|---|---|---|
| Platform | Cloudflare **Pages** `sasinfra-frontend` (existing) | Cloudflare **Workers** (new) |
| `PREVIEW_BUILD` | unset | `1` |
| Astro `output` | `static` | `server` |
| Adapter | **none** | `@astrojs/cloudflare` (Workers) |
| Deploy | `wrangler pages deploy dist/` (`deploy.yml`, unchanged) | `wrangler deploy` — adapter 13.x **auto-generates** `dist/server/wrangler.json` (`main: entry.mjs`); `wrangler.preview.jsonc` via adapter `configPath` adds `nodejs_compat`/`name` (see §6.2) |
| `functions/_middleware.js` | active (redirects) | irrelevant (Pages-only) |
| Perspective | `published` (build time) | cookie-driven `drafts` (request time) |
| Stega / overlays | off | on |
| Draft-mode routes | **not present** (injected only in preview) | injected via integration |

### 3.1 How one codebase yields both builds — **output-mode driven, no `prerender` exprs**
`astro.config.mjs` reads `PREVIEW_BUILD` (via `process.env`, since config runs in Node):
- **Output mode does the prerender split** — no per-route `prerender` flag anywhere:
  - Prod (`output:'static'`): every page prerenders to static HTML, no adapter,
    no `_worker`. Behaves exactly as today.
  - Preview (`output:'server'` + adapter): every page is SSR by default. No flag needed.
  > **Why not `export const prerender = !import.meta.env.PREVIEW_BUILD`** (round-2
  > finding C-A): Astro 5+ **removed dynamic `prerender` values** — only literal
  > `true`/`false` are allowed; a dynamic/negated expression is silently ignored
  > and reverts to the default. Driving the split by `output` mode sidesteps this
  > entirely. If a per-route override is ever needed, use an **`astro:route:setup`
  > integration** (the maintainer-recommended replacement), not an env expression.
- **Draft-mode API routes are injected only in preview.** Keep `enable.ts`/`disable.ts`
  under `src/sanity/routes/` (outside `src/pages/`, so they're never auto-routed).
  A small inline integration, added to `integrations` **only when `PREVIEW_BUILD`**,
  `injectRoute`s them. Result: the prod static build never contains them, so their
  server-only imports are never prerendered (avoids the `cloudflare:workers`
  import-in-prerender hazard — see §3.3).
- **Integrations gated on the flag:** preview adds `react()`, `@sanity/astro` stega,
  the inject-routes integration, and `vite.optimizeDeps`. Prod adds none of these
  runtime pieces.
- **CI gate (Gate A):** assert **both** directions — `pnpm build` (no flag) → static
  `dist/`, no Workers entry, no draft-mode routes; `PREVIEW_BUILD=1 pnpm build` →
  Workers entry present and `/api/draft-mode/*` are SSR.

### 3.2 Redirects vs the preview (round-2 finding C-C reframed)
`functions/_middleware.js` is a **Cloudflare Pages** construct; it has no bearing on
the **Workers** preview (the old "`_worker.js` vs `functions/`" framing was Pages-era
and is dropped). Prod keeps its `functions/` redirects untouched. The preview does
**not** need legacy redirects (editors reach canonical routes via the resolver). If
ever needed, port the logic into **Astro middleware** (`src/middleware.ts`), which
runs inside the Workers SSR runtime.

### 3.3 Token access (round-2 finding C-B) — **`astro:env/server`, not `Astro.locals`**
`Astro.locals.runtime.env` was **removed in Astro 6**. Read the token via
**`astro:env/server`** (define `SANITY_API_READ_TOKEN` as a `secret`/`server` field
in the `env.schema`): build-safe, adapter-agnostic, and sidesteps the documented
`import { env } from 'cloudflare:workers'` hazard (that raw import can break
prerendered routes — "Unsupported ESM URL scheme"). `loadQuery` and the draft-mode
routes import the token from `astro:env/server`.

> **As-built (round 3):** `@astrojs/cloudflare` **13.x** is built on
> `@cloudflare/vite-plugin` and **dropped the `platformProxy` option** the v3 plan
> assumed. There is nothing to configure — the adapter reads `wrangler` config and
> **`.dev.vars`** itself, so the local token (in `repos/frontend/.dev.vars`) and the
> deployed Workers secret both resolve through `astro:env/server` with no extra
> plumbing. The dev command just needs `PREVIEW_BUILD=1` so the adapter + middleware
> + draft routes exist (see §5 "Validate locally").

### 3.4 Runtime flow
1. Editor opens Presentation → Studio loads the **preview URL** in an iframe.
2. Studio calls `<preview>/api/draft-mode/enable` with a signed secret.
3. `validatePreviewUrl` verifies it, sets the perspective cookie
   (`SameSite=None; Secure`), redirects to the target page.
4. Page renders SSR: cookie → `loadQuery` fetches `drafts` with the
   `astro:env/server` token, stega-encoded.
5. `<SanityVisualEditing>` (React island, draft-mode only) draws overlays, syncs
   history with the Studio.
6. Edit → `refresh` → full page reload → fresh drafts.

### 3.5 Perspective model & trust boundary (as-built, round 3)
The "draft mode" toggle is **not** a custom boolean — it is the **standard
`sanity-preview-perspective` cookie** (name imported from
`@sanity/preview-url-secret/constants`, so it never drifts from the library):
- **`/api/draft-mode/enable`** validates the signed secret via `validatePreviewUrl`
  and writes the cookie to the Studio's perspective (`'drafts'` by default), as
  `SameSite=None; Secure` (cross-origin iframe). **`/disable`** deletes it.
- **A preview-only Astro middleware** (`src/sanity/middleware.ts`, registered via
  `addMiddleware({ order: 'pre' })` inside the gated integration) reads that cookie
  once per request and runs the whole request inside a **`node:async_hooks`
  `AsyncLocalStorage`** scope (`runWithPerspective`). `loadQuery` calls
  `getPerspective()` from that store — so **no data function threads a flag**, and
  `getPerspective()` defaults to `'published'` whenever no middleware ran (i.e. the
  entire static prod build). `node:async_hooks` is why Stage G needs `nodejs_compat`.
- The canonical **`<VisualEditing>` island** owns the cookie client-side: its
  `onPerspectiveChange` rewrites `sanity-preview-perspective` and reloads; `history`
  + `refresh` adapters drive navigation/refetch (Astro has no SPA router / Live API).
- 🔴 **Trust boundary:** this cookie is **client-writable BY DESIGN** (the island
  sets it), so it is **NOT** a security control. Anyone hitting the deployed Worker
  could forge `sanity-preview-perspective=drafts` and read unpublished content with
  the server token. **The Worker MUST sit behind Cloudflare Access (same policy as
  `cms.sasinfra.com`)** — that edge gate, not the cookie, is what authenticates
  editors. This is a **hard Stage-G prerequisite** (§6.0, §13 G6), and it is the
  resolution to the round-3 "forgeable cookie" finding.

---

## 4. Phase 0 — Prereqs

1. **Viewer token** — created (Viewer scope, project `ajw4irs3`). Stored in
   `repos/frontend/.dev.vars` (gitignored) for local; a **Workers secret** for the
   deployed preview. Used only to read drafts + read the preview-url-secret doc (I1).
   *(Pasted in chat → treat as exposed; rotate once preview is live.)*
2. **CORS** with **Allow credentials** — add **all three**:
   - `http://localhost:4321` (dev),
   - the deployed preview origin (Phase 2),
   - **the Studio's own origin** `https://<sasinfra-cms host>` (round-2 finding M-B):
     the Presentation tool's browser session calls the project API to **mint** the
     preview-url-secret, so the Studio origin must be a credentialed CORS entry.
   Add via Sanity MCP `add_cors_origin` or `npx sanity cors add … --credentials`.

---

## 5. Phase 1 — Wire visual editing (local, zero prod impact)

> Run local dev with the **Cloudflare (Workers) adapter + `.dev.vars` + `PREVIEW_BUILD=1`**
> (adapter 13.x reads `.dev.vars` itself — no `platformProxy`, R-2) so the token resolves
> the same way it will when deployed (kills the C1 false-positive where it works in
> `astro dev` then is missing on deploy).

### Frontend `repos/frontend`
- **Deps** (pnpm): `@sanity/astro`, `@astrojs/react`, `@astrojs/cloudflare`,
  `@sanity/visual-editing`, `@sanity/preview-url-secret`, `groq`. `@sanity/astro`
  3.3.1 (Astro-6 support, 2026-03-13) clears the 30-day cooldown; **verify the other
  5 at install** and lower a floor only if blocked (never disable the cooldown).
  - **As-built (round 3) — extra deps the plan didn't list:** `@astrojs/react` 5.x
    pulls in **`react` + `react-dom`** as *peer* deps that pnpm does not auto-install,
    so both were added explicitly (`react`/`react-dom` 19.x, runtime — only the
    draft-mode islands import them, code-split out of prod). Dev-only:
    **`@portabletext/types`** (the `PortableTextBlock` type for the rebuilt
    `portableTextToHtml`), plus `@types/react` / `@types/react-dom`. All cleared the
    cooldown at install; no floors were lowered.
- **`astro.config.mjs`** — §3.1 mechanism: `output`/adapter/integrations gated on
  `PREVIEW_BUILD`; `sanity()` with explicit `apiVersion:'2026-05-31'`,
  `perspective:'published'`, `useCdn:false`, and `stega.studioUrl` (stega enabled
  per-fetch only); `env.schema` with `SANITY_API_READ_TOKEN` (`server`/`secret`,
  optional); the inject-routes integration; `vite.optimizeDeps.include`
  (`react/compiler-runtime`, `lodash/*`).
- **`src/env.d.ts`** — `/// <reference types="@sanity/astro/module" />`.
- **Token (C-B):** `import { SANITY_API_READ_TOKEN } from 'astro:env/server'`; pass
  into `loadQuery`; used only in draft mode. Never `import.meta.env` /
  `Astro.locals.runtime`.
- **`src/sanity/lib/load-query.ts`** — wraps `sanity:client`; perspective + stega +
  `resultSourceMap` switch on the cookie.
- **`src/sanity/lib/draft-mode.ts`** — read the perspective cookie from `Astro.cookies`.
- **Data layer (findings C2/C3) — all data files via `loadQuery`:**
  - `content.ts`: remove **all 10** `drafts.**` filters; add `loadQuery`-backed
    `getPageByPath`/`getProjectBySlug`.
  - `blog.ts`: route `getAllPosts`/`getPostBySlug` through `loadQuery`; **remove the
    line-80 filter**; add a direct `getPostBySlug` (no full-collection `.find()`).
  - `siteSettings.ts`: route through `loadQuery`; **scope the module cache**
    (build-only / perspective-keyed) — finding I6.
  - `projectSeo.ts` (**as-built — a 4th file the plan missed**): same shape as
    `siteSettings.ts`. It has a per-slug module-level promise cache feeding the
    project JSON-LD; routed through `loadQuery` and given the **same I6 cache
    bypass** — `if (isPreviewing()) return fetchProjectSeo(slug)` before consulting
    the cache, so a long-lived Worker doesn't pin the first draft it saw.
- **`src/lib/sanity.ts`** — source the client from `sanity:client`; keep
  `urlForImage`/`portableTextToHtml` (rebuild the image builder from `sanity:client`).
- **SSR fallbacks (C3):** add the missing `blog/[slug].astro` fallback
  (`Astro.props.post ?? await getPostBySlug(...)`); route `[...slug]`/`projects/[slug]`
  fallbacks through `loadQuery`. (No `prerender` exports — output mode handles it.)
- **Stega chokepoint (I2):** in `src/components/SEO.astro`, deep-`stegaClean()`
  `title`/`description`/`imageAlt`/`article.*` + **each `jsonLd` object** before
  `JSON.stringify` (line 84-86). `stegaClean` is recursive (confirmed, finding I-C),
  so this strips stega from all nested JSON-LD fields in one place. Body content
  keeps stega for overlays. (Literal/env-built values carry no stega — harmless.)
- **Stega in routing/logic (as-built, round 3) — NOT a config filter:** stega marker
  chars also corrupt any string used as **control flow**, not just display: a `_type`
  / `kind` switch misses, an `href` segment gets invisible chars, a slug/category
  comparison fails. So `stegaClean` is also applied at the **routing chokepoints** —
  `resolveHref`/`resolveLinkHref` clean `_type`, `kind`, `section`, and the URL
  segments — plus the handful of other logic fields (the feed `source`, blog
  slug/category, the `projects/[slug]` lookup). The plan considered a single
  **config-level `stega.filter`** instead, but **`filterDefault` is not exported from
  `@sanity/client/stega`**, so a global filter can't cleanly preserve display strings
  while stripping logic strings. Per-chokepoint cleaning is the chosen model;
  `stegaClean` is a no-op in the published build, so all of this is free in prod.
- **Islands:** `SanityVisualEditing.tsx` + `DisableDraftMode.tsx`
  (`client:only="react"`), rendered in `SiteLayout.astro` **only when the perspective
  cookie is present** (public visitors never load React).
- **Draft-mode routes:** `src/sanity/routes/enable.ts` + `disable.ts`, `injectRoute`d
  only in the preview build (§3.1); token via `astro:env/server`.

### Studio `repos/sanity` (npm — trivial)
Add to `presentationTool`:
```ts
previewUrl: {
  initial: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
  previewMode: { enable: '/api/draft-mode/enable' },
}
```

### Validate locally
Studio (`:3333`) + frontend (`:4321`, Workers adapter + `.dev.vars`, `PREVIEW_BUILD=1`
— no `platformProxy`, R-2): overlays, click-to-edit, refresh, **and a real `drafts`
request** in the network tab.

---

## 6. Phase 2 — Deployed preview (Cloudflare **Workers**) — infra spec

Stages A–F need **no** Cloudflare account work; everything here does. The Worker is
created on first `wrangler deploy` (no pre-provisioning like a Pages project).

### 6.0 Hard prerequisite — Cloudflare API token scope 🔴
The existing `CLOUDFLARE_API_TOKEN` GH secret is used for `wrangler pages deploy`
(**Pages:Edit**). A Workers deploy **and** `wrangler secret put` need
**Workers Scripts:Edit** (+ Account Settings:Read). **Verify the token's scope first**;
if it's Pages-only, broaden it or mint a Workers-scoped token. This is the single most
likely Stage-G blocker, and a wrong-scope failure is a silent 403 until you read the logs.

### 6.0b Hard prerequisite — Cloudflare Access gate 🔴 (the security boundary)
The preview Worker reads **unpublished drafts** with a server token, and its
`sanity-preview-perspective` cookie is **client-forgeable by design** (§3.5) — so the
Worker itself is **not** safe to expose publicly. **Before sharing the preview URL,
put the Worker behind Cloudflare Access under the same policy as `cms.sasinfra.com`**
(the Studio host) so only authenticated editors reach it. This is the resolution to
the round-3 forgeable-cookie finding and a **non-negotiable Stage-G step (§13 G6)** —
not a follow-up. Validate that the Presentation **iframe** still authenticates: it is
a cross-origin embed, so the Access session must be established (the editor is already
signed into Access for the Studio; confirm the iframe inherits/re-establishes it
rather than being blocked by frame-ancestors or a missing Access cookie).

### 6.1 Preview URL — default to a `workers.dev` subdomain
Use the free subdomain `sasinfra-frontend-preview.<account>.workers.dev`: zero DNS, stable,
immediate. A custom domain (`preview.sasinfra.com`) means DNS work and the domain is split
GoDaddy/Cloudflare (CLAUDE.md) — not worth it for an internal editor preview. Confirm the
account's `workers.dev` subdomain is enabled (one-time account setting).

### 6.2 `wrangler.jsonc` (preview Worker) — **reconcile, don't hand-author `main`**
> **As-built correction (round 3).** The v3 plan assumed we'd hand-write
> `main: "@astrojs/cloudflare/entrypoints/server"`. **Adapter 13.x does not work that
> way.** A `PREVIEW_BUILD=1` build **auto-generates `dist/server/wrangler.json`**
> (verified 2026-06-01) with the entry already wired:
> ```jsonc
> { "main": "entry.mjs", "compatibility_date": "2026-04-15", "compatibility_flags": [],
>   "assets": { "binding": "ASSETS", "directory": "../client" },
>   "kv_namespaces": [{ "binding": "SESSION" }], "images": { "binding": "IMAGES" },
>   "name": "frontend", "observability": { "enabled": true }, "no_bundle": true, … }
> ```
> So `main` and `assets` are **already correct and must not be overridden**. What the
> generated file is **missing** for our deploy:
> - **`compatibility_flags: ["nodejs_compat"]`** 🔴 — generated as **empty `[]`**, but
>   the build WARNs `Unexpected Node.js imports … "node:async_hooks"` (from
>   `draft-mode.ts`'s `AsyncLocalStorage`) plus `node:crypto`/`buffer` from
>   `@sanity/client`/`@sanity/preview-url-secret`. Without this flag the Worker
>   throws at runtime. **This is the must-add.**
> - **`name`** is `"frontend"`, not `"sasinfra-frontend-preview"`.
> - **`workers_dev: true`** to expose the `*.workers.dev` URL.
>
> **G2 — SOLVED via a non-default `configPath` (implemented 2026-06-01, Round 4).**
> A plain root `wrangler.jsonc` is the wrong vehicle: the **production** deploy is
> `wrangler pages deploy dist/` run from this repo root, and modern wrangler
> auto-reads `wrangler.{toml,json,jsonc}` — so a root Workers config would be picked
> up by the *Pages* deploy. Instead, the preview config lives in a **non-default
> filename, `wrangler.preview.jsonc`**, wired via the adapter's `configPath` option
> (`cloudflare({ configPath: './wrangler.preview.jsonc' })`, PREVIEW_BUILD only). The
> adapter spreads `cloudflareOptions` into the `@cloudflare/vite-plugin`, so this one
> file feeds **both** `astro dev` and the build — and the generated
> `dist/server/wrangler.json` now bakes in `compatibility_flags: ["nodejs_compat"]` +
> `name: "sasinfra-frontend-preview"` (verified). `main`/`assets`/`compatibility_date`
> stay adapter-generated; the prod Pages deploy never sees the file. The auto-added
> `SESSION` (KV) / `IMAGES` bindings are vite-plugin defaults — kept (harmless).
> **Still open for G3:** confirm how `wrangler deploy` in CI resolves the config
> (point `-c dist/server/wrangler.json`, or let the adapter's deploy path drive) +
> `account_id`.
>
> 🔴 **`nodejs_compat` is also a Stage-F (local dev) prerequisite, not just deploy.**
> Without `wrangler.preview.jsonc`, `PREVIEW_BUILD=1 astro dev` 500s **every** request
> (`Failed to load url node:async_hooks` — the workerd dev runtime has no compat flag).
> With it, dev serves published + drafts correctly (Round 4).

### 6.3 Deploy workflow
`repos/frontend/.github/workflows/deploy-preview.yml` — checkout → pnpm → build with
`PREVIEW_BUILD=1` → `wrangler deploy` (`cloudflare/wrangler-action@v3`, `command: deploy`),
using the Workers-scoped token (6.0). Production `deploy.yml` (Pages) is **untouched**.

### 6.4 Worker secret
One-time `wrangler secret put SANITY_API_READ_TOKEN` (or dashboard); read at runtime via
`astro:env/server`. Needs the Workers-scoped token. Not a build var, never in the repo.

### 6.5 Studio + CORS
`SANITY_STUDIO_PREVIEW_URL` → the Worker URL; `stega.studioUrl` → live `sasinfra-cms`
Studio URL. Add the Worker origin to Sanity CORS (**Allow credentials**) **before first use**.

### 6.6 Verify on the deployed Worker
Open Presentation against the deployed preview — confirm drafts render, overlays work, and
the token resolves at **request time** (the C1 failure mode only surfaces here, not in
`astro dev`).

---

## 7. Env vars & secrets

| Var | Where | Notes |
|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` | both builds | `ajw4irs3` / `production`, in `deploy.yml` + `.env` |
| `SANITY_API_READ_TOKEN` | **preview only** | Viewer token; `.dev.vars` local, **Workers secret** deployed; read via `astro:env/server` |
| `PREVIEW_BUILD` | preview build | flips `output`/adapter/integrations/route-injection |
| `SANITY_STUDIO_PREVIEW_URL` | Studio build | → preview Worker URL |
| `stega.studioUrl` | frontend integration | → live `sasinfra-cms` Studio URL |

---

## 8. Repo-specific gotchas
- **`prerender` cannot be dynamic** (Astro 5+): split builds by `output` mode, not an
  env expression; use `astro:route:setup` for any per-route override (C-A).
- **`Astro.locals.runtime` is gone** (Astro 6): token via `astro:env/server` (C-B).
- **`@astrojs/cloudflare` is Workers-only** (Astro 6): preview = `wrangler deploy`;
  prod stays Pages (C-C).
- **Adapter 13.x dropped `platformProxy`** and **auto-generates
  `dist/server/wrangler.json`** (`main: entry.mjs`, `assets`→`../client`) — don't
  hand-author `main`; add `nodejs_compat` (generated empty) + `name` via
  `wrangler.preview.jsonc` wired through the adapter `configPath` (a **non-default**
  filename so the prod `wrangler pages deploy` can't read it — §6.2). `.dev.vars` is
  read by the adapter itself; no `platformProxy` plumbing (§3.3). `nodejs_compat` is
  also required for **local `astro dev`**, not just deploy (R-10).
- **The perspective cookie is forgeable by design** → it is NOT the trust boundary;
  Cloudflare Access on the Worker is (§3.5, §6.0b).
- **Stega corrupts logic strings, not just display** → `stegaClean` at the
  `resolveHref`/`resolveLinkHref` chokepoints + logic fields, **not** a config
  `stega.filter` (`filterDefault` isn't exported from `@sanity/client/stega`) (§5).
- React enters only as a draft-mode island, behind an
  `import.meta.env.PREVIEW_BUILD` **compile-time literal** (vite `define`) so the
  whole `await import('…/VisualEditing.astro')` branch is dead-code-eliminated from
  prod — code-split, never shipped to visitors.
- `functions/` is Pages-only — irrelevant to the Workers preview.
- Cookie needs `SameSite=None; Secure` → HTTPS or `localhost` only.
- Astro has **no Live Content API**; updates trigger a full reload (expected).
- `drafts` perspective requires `useCdn:false` (already true).
- Shared contract is **only** `resolveHref`'s `_type → href` (I3).
- Per root CLAUDE.md: never `git add -A`; stage by path; pushes auto-deploy.

---

## 9. Effort & sequencing
- **Phase 1** is the bulk — the 3-file data refactor + SSR fallbacks + SEO stega
  chokepoint + islands + the gated config. Fully testable locally; zero prod risk.
- **Phase 2** is the Workers deploy (new `wrangler.jsonc` + workflow + secret + CORS).
- Complete & demo Phase 1 before Phase 2. Stages A–F are platform-agnostic; only
  Stage G is Workers-specific.

## 10. Future / optional
- **Content Releases** — needs the release-perspective stack + Studio config; defer.
- **Presentation queries** (block-level refetch) — optimize later.

---

## 11. References
- Sanity — *Visual Editing with Astro*: https://www.sanity.io/docs/visual-editing/astro-visual-editing
- Sanity — *Static and server rendering in Astro*: https://www.sanity.io/docs/astro/static-and-server-rendering
- Astro — *Cloudflare adapter* (Workers-only, `astro:env`, `.dev.vars`, "Upgrading to v13 / Astro 6"): https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Astro — *Upgrade to v5* (dynamic `prerender` removed → `astro:route:setup`): https://docs.astro.build/en/guides/upgrade-to/v5/
- Astro — prerender expression issue: https://github.com/withastro/astro/issues/12981
- Sanity — *Perspectives* (filter removal safe under `published`): https://www.sanity.io/docs/content-lake/perspectives
- Floors: `sanity` 4.x (Studio) · `astro` 6.x · `@sanity/astro` 3.3.1+ ·
  `@astrojs/react` 5+ · `@astrojs/cloudflare` (Astro-6/Workers) · `@sanity/visual-editing` 5.x ·
  `@sanity/preview-url-secret` latest.

---

## 12. Adversarial review log

### Round 1 (v1 → v2)
| # | Finding | Resolution |
|---|---|---|
| C1 | Token via `import.meta.env` undefined at request time on Cloudflare | Runtime-read; superseded by round-2 C-B → `astro:env/server` (§3.3) |
| C2 | Refactor scope missed `blog.ts` + `siteSettings.ts` | All three files via `loadQuery`; filter removal **safe under `published`**, mandatory under `drafts` (§5) |
| C3 | `blog/[slug].astro` has no SSR fallback | Add fallback via `loadQuery` (§5) |
| C4 | `_worker.js` vs `functions/_middleware.js` | Superseded by C-C: Workers preview, `functions/` is Pages-only (§3.2) |
| I1 | preview-url-secret token scope | Studio mints via editor session (write); frontend Viewer token reads; verify (§4) |
| I2 | Stega coverage incomplete | One chokepoint: deep `stegaClean()` in `SEO.astro` (§5) |
| I3 | `routing.ts` files not identical | Real contract is `resolveHref` only (§2, §8) |
| I4 | "routes inert in prod" wrong; `optimizeDeps` omitted | Superseded by C-A (output-mode split); `optimizeDeps` added (§3.1, §5) |
| I5 | Cooldown analysis lumped both repos | Studio npm (no cooldown); only the 6 frontend deps (§5) |
| I6 | `siteSettings.ts` module cache unsafe under SSR | Build-only / perspective-keyed (§5) |

### Round 2 (v2 → v3, Astro-6 corrections) — **was NO-GO; now resolved**
| # | Finding | Resolution |
|---|---|---|
| **C-A** | `export const prerender = !import.meta.env.PREVIEW_BUILD` unsupported — Astro 5+ removed dynamic `prerender` values | Split builds by **`output` mode**; no `prerender` exprs; `astro:route:setup` for any override; draft-mode routes `injectRoute`d only in preview (§3.1) |
| **C-B** | `Astro.locals.runtime.env` removed in Astro 6 | Token via **`astro:env/server`** (avoids the `cloudflare:workers` import-in-prerender hazard); `.dev.vars`+`platformProxy` local (§3.3, §5) |
| **C-C** | `@astrojs/cloudflare` dropped Cloudflare **Pages** support — Workers-only | Preview is a **Workers** deploy (`wrangler deploy`, `@astrojs/cloudflare/entrypoints/server`); prod stays Pages, untouched (§3, §3.2, §6) |
| **I-A** | Gate B "byte-identical HTML" is the wrong gate after adopting `sanity:client` | Gate B = **semantic** equivalence after `stegaClean` normalization **+ assert zero stega** in the no-flag build; pin `apiVersion`/`perspective`/`useCdn` in the integration (§13 Gate B) |
| **I-B** | Cooldown framed as a risk for `@sanity/astro` | `@sanity/astro` 3.3.1 (2026-03-13) clears the 30-day cooldown; verify the other 5 (§5) |
| **I-C** | Is the `SEO.astro` chokepoint sufficient? | ✅ `stegaClean` deep-cleans nested objects/arrays — confirmed sufficient (§5) |
| **M-A** | Gate A didn't prove the mechanism | Gate A asserts **both** build directions (§3.1, §13) |
| **M-B** | Studio's own origin not in CORS for secret minting | Add `https://<sasinfra-cms host>` as a credentialed CORS origin (§4) |

### Round 3 — As-built deltas (Stages A–D built & verified locally, 2026-06-01)
What changed between the v3 plan and the working implementation (both builds pass:
no-flag → static prod-identical, zero React/stega; `PREVIEW_BUILD=1` → SSR Worker
entry + draft routes + middleware + React islands):
| # | Plan said | As built | §ref |
|---|---|---|---|
| **R-1** | preview `main: @astrojs/cloudflare/entrypoints/server` (hand-written) | adapter 13.x **auto-generates `dist/server/wrangler.json`** with `main: entry.mjs`; G2 reconciles a root `wrangler.jsonc` for `nodejs_compat`/`name`/`workers_dev` only | §3 table, §6.2 |
| **R-2** | local dev via `.dev.vars` + `platformProxy` | 13.x **dropped `platformProxy`**; adapter reads `.dev.vars` itself, just needs `PREVIEW_BUILD=1` | §3.3, §8 |
| **R-3** | draft toggle = "read the perspective cookie in a helper" | standard **`sanity-preview-perspective` cookie** + **`AsyncLocalStorage` middleware** (`order:'pre'`); `loadQuery` reads `getPerspective()`; `<VisualEditing>` owns the cookie client-side | §3.5, §13 D2–D4 |
| **R-4** | cookie security unaddressed | cookie is **client-forgeable by design** → **Cloudflare Access** on the Worker is the gate (same policy as `cms.sasinfra.com`); hard Stage-G prereq | §3.5, §6.0b, §13 G6 |
| **R-5** | stega only at the `SEO.astro` head chokepoint | also **centralized in `resolveHref`/`resolveLinkHref`** + logic fields (feed `source`, blog slug/category, `projects/[slug]`); **no config `stega.filter`** (`filterDefault` not exported) | §5, §8 |
| **R-6** | 6 deps | + **`react`/`react-dom`** (@astrojs/react peers pnpm won't auto-add) + dev **`@portabletext/types`**/`@types/react*`; all cleared the cooldown | §5 |
| **R-7** | "three data files" | **four** — `projectSeo.ts` had the same I6 module-cache hazard as `siteSettings.ts`; given the same draft-mode cache bypass | §5 |
| **R-8** | — (Codex review of A–D) | 3 actionable findings fixed; 1 deferred **pre-existing** HTML-injection sink in `blog/[slug].astro` (`set:html` of an un-escaped title) fixed 2026-06-01 — escape first, then wrap emphasis words | — |
| **R-9** | open question | build WARNs `optimizeDeps` lodash/* + `node:async_hooks` "Unexpected Node.js imports" — expected; resolved by `nodejs_compat`; get a live verdict in Stage F | §6.2, §13 F2 |

### Round 4 — Stage-F local validation findings (2026-06-01)
Ran `PREVIEW_BUILD=1 astro dev` + curl smoke tests (server-side; browser overlay
check still pending with Krishna). Verdicts:
| # | Finding | Resolution |
|---|---|---|
| **R-10** | 🔴 `node:async_hooks` (the R-9 "open question") is a **hard blocker in dev too**, not just deploy — without `nodejs_compat` **every** request 500s (`Failed to load url node:async_hooks`). | Created **`wrangler.preview.jsonc`** (`nodejs_compat`, name, compat date) wired via the adapter's **`configPath`** (non-default filename → prod Pages deploy never reads it). Fixes dev AND bakes `nodejs_compat` into the generated `dist/server/wrangler.json` → **closes most of G2** (§6.2). |
| **R-11** | Studio origin: the deployed Studio is **`https://cms.sasinfra.com`** (custom domain, confirmed via project CORS), not the `sasinfra-cms.pages.dev` the config defaulted to. | `STUDIO_URL` default corrected to `https://cms.sasinfra.com`; override `SANITY_STUDIO_URL=http://localhost:3333` for local Stage F. CORS already had localhost:4321/3333 + cms.sasinfra.com (credentialed). |
| **R-12** | **Smoke test GREEN (server-side):** published `/` = 0 stega / 0 React; drafts `/` = 22.5k stega markers + `SanityVisualEditing`/`DisableDraftMode` islands; `/disable`→307, `/enable`(no secret)→401; token resolves from `.dev.vars`; draft `<head>` title stega-clean (chokepoint). | F1 done; F2 server-side verified. **Still pending:** in-browser overlay/click-to-edit/refresh hydration (needs the authenticated Studio session). |
| **R-13** | `optimizeDeps.include` WARNs persist (`lodash/*`, `react-is`, `styled-components`, `react/compiler-runtime` fail to resolve — some auto-discovered from `@sanity/visual-editing`). | **Non-fatal server-side** (pages render, islands emit). These are the VE overlay's *client* deps — whether they block **hydration** is the open browser-side verdict. Trim/correct the list once the browser confirms. Also: the **first request after a dev restart / config edit** can render published while vite re-optimizes — reload once. |

---

## 13. Implementation checklist (execution order)

Ordered so production is never at risk; each stage has a gate. A–F local; G deploy.
**Client: golden-path `@sanity/astro` `sanity:client`.** **No `prerender` exports —
the `output` mode does the split.**

### Stage A — Scaffolding (no behavior change) — ✅ DONE (2026-06-01)
- [x] A1. `pnpm add` the deps; resolve cooldown at install (lower floors only if blocked; never disable). Commit lockfile. *(As-built: also `react`/`react-dom` + dev `@portabletext/types`/`@types/react*` — R-6.)*
- [x] A2. `astro.config.mjs`: `PREVIEW_BUILD` (via `process.env`) gates `output` (`static`↔`server`), adapter (`@astrojs/cloudflare` Workers), and integrations (`react()` + the `sanityPreviewRuntime()` integration that `injectRoute`s the draft routes **and** `addMiddleware`s the perspective middleware). Always `sanity()` with explicit `apiVersion:'2026-05-31'`/`perspective:'published'`/`useCdn:false`/`stega.studioUrl`. Add `env.schema` `SANITY_API_READ_TOKEN` (server/secret/optional) + `vite.optimizeDeps.include` + `vite.define` `import.meta.env.PREVIEW_BUILD` literal (dead-code-elim of the React island in prod).
- [x] A3. `src/env.d.ts`: `/// <reference types="@sanity/astro/module" />`.
- [x] **Gate A (both directions):** ✅ `pnpm build` (no flag) → static `dist/`, no Workers entry, no draft-mode routes. `PREVIEW_BUILD=1 pnpm build` → Workers entry (`dist/server/entry.mjs`) + `/api/draft-mode/*` SSR + middleware.

### Stage B — Data layer (golden-path client + core refactor) — ✅ DONE (2026-06-01)
- [x] B1. `src/lib/sanity.ts`: client from `sanity:client`; keep `urlForImage`/`portableTextToHtml` (rebuilt image-URL builder from `sanity:client`; `@portabletext/types` for the block type).
- [x] B2. `src/sanity/lib/load-query.ts`: wrap `sanity:client`; perspective/stega/`resultSourceMap` switch on `getPerspective()`; **token from `astro:env/server`**, passed in, draft-mode only; throws if previewing without a token.
- [x] B3. `src/sanity/lib/draft-mode.ts`: `AsyncLocalStorage` perspective store + `runWithPerspective`/`getPerspective`/`isPreviewing`/`readPerspectiveCookie` (R-3).
- [x] B4. `content.ts`: all fetches → `loadQuery`; **removed all 10** filters; added `loadQuery` `getPageByPath`/`getProjectBySlug`.
- [x] B5. `blog.ts`: → `loadQuery`; **removed line-80 filter**; direct `getPostBySlug`.
- [x] B6. `siteSettings.ts`: → `loadQuery`; **module cache bypassed when previewing** (I6). **+ `projectSeo.ts`** got the identical treatment (R-7).
- [ ] B7. *(Optional, NOT done)* `groq` `defineQuery` + `sanity typegen generate` — queries remain plain strings.
- [x] **Gate B (semantic, not byte-identical — I-A):** ✅ no-flag build is prod-identical (semantically equal to baseline), **zero stega** markers, zero React, no worker.

### Stage C — SEO / stega safety — ✅ DONE (2026-06-01)
- [x] C1. `SEO.astro`: deep `stegaClean()` of `title`/`description`/`imageAlt`/`article.*` + **each `jsonLd` object** (line 56-60). Body keeps stega. **+ R-5:** stega also cleaned at `resolveHref`/`resolveLinkHref` + logic fields; **no** config `stega.filter`.
- [x] **Gate C:** ✅ no-op when stega off → prod `<head>` unchanged.

### Stage D — Visual-editing runtime (preview-only) — ✅ DONE (2026-06-01)
- [x] D1. SSR fallbacks: added `blog/[slug]` fallback (`Astro.props.post ?? getPostBySlug`); `[...slug]`/`projects/[slug]` fallbacks via `loadQuery` (C3). **No `prerender` exports.**
- [x] D2. `src/sanity/routes/enable.ts` (`validatePreviewUrl` → set `sanity-preview-perspective` cookie `SameSite=None;Secure`) + `disable.ts` (delete cookie); token via `astro:env/server`; `injectRoute`d only when `PREVIEW_BUILD` (§3.1). **+ `src/sanity/middleware.ts`** runs each request in the perspective `AsyncLocalStorage` scope (R-3).
- [x] D3. `SanityVisualEditing.tsx` (overlays + history/refresh/`onPerspectiveChange` adapters) + `DisableDraftMode.tsx`, hosted by `VisualEditing.astro` (`client:only="react"`).
- [x] D4. `SiteLayout.astro`: islands loaded via a **dynamic import** gated on `import.meta.env.PREVIEW_BUILD && isPreviewing()` — preview build + draft request only; prod branch is dead-code-eliminated.
- [x] *(Codex re-review of A–D done; 3 findings fixed. The deferred pre-existing `blog/[slug].astro` `set:html` HTML-injection sink — R-8 — fixed 2026-06-01.)*

### Stage E — Studio (npm, trivial) — ✅ DONE (2026-06-01, committed a37379e)
- [x] E1. `sanity.config.ts`: added `previewMode: { enable: '/api/draft-mode/enable' }` to `presentationTool` (kept the existing `initial`).

### Stage F — Local validation — F1 + F2(server-side) ✅ DONE; browser overlay check ⏳ (Krishna)
- [x] F1. Token in `.dev.vars` (done); **CORS (Allow credentials)** confirmed for `http://localhost:4321`, `http://localhost:3333`, **and the Studio origin `https://cms.sasinfra.com`** (all three already present + credentialed; R-11).
- [x] F2 (server-side). `PREVIEW_BUILD=1 astro dev` (**needs `wrangler.preview.jsonc` for `nodejs_compat` — R-10**) + curl smoke test GREEN: published clean (0 stega/0 React), drafts carry 22.5k stega + VE islands, `/disable`→307, `/enable`(no secret)→401, token resolves, `<head>` stega-clean (R-12). `optimizeDeps` WARNs are non-fatal server-side (R-13).
- [ ] F2 (browser). Studio (`:3333`, `SANITY_STUDIO_URL=http://localhost:3333` on the frontend) → open Presentation → confirm overlays **hydrate**, click-to-edit, refresh, and a real `drafts` request. This is where the R-13 `optimizeDeps` client-hydration verdict lands.

### Stage G — Deploy (Cloudflare **Workers**) — ✅ G0–G6 DONE & verified (2026-06-01); G7 = in-browser eyeball pending
**Deployed: `https://sasinfra-frontend-preview.sas-infra.workers.dev`** (account `659a3f2…` = SAS Infra; Access team `sasinfra.cloudflareaccess.com`).
- [x] G0. New **Workers-scoped token** minted (least-privilege; prod token stays Pages-only) → GH secret `CLOUDFLARE_WORKERS_API_TOKEN`.
- [x] G1. workers.dev subdomain = **`sas-infra.workers.dev`** (already set on the SAS Infra account).
- [x] G2. `wrangler.preview.jsonc` via adapter `configPath` (R-10) — bakes `nodejs_compat` + name into `dist/server/wrangler.json`.
- [x] G3. **`deploy-preview.yml`** (`wrangler-action@v4`, `command: deploy --config dist/server/wrangler.json`; validated via `--dry-run`). Now `push:[main]` + `workflow_dispatch`. First run ✅ — deployed; wrangler **auto-provisioned** the `SESSION` KV namespace (the unbacked-binding worry was moot). Prod `deploy.yml` untouched.
- [x] G4. `SANITY_API_READ_TOKEN` set as a Worker secret (via dashboard UI). Read at request time via `astro:env/server`.
- [x] G5. Sanity CORS for the Worker origin (credentialed) + Studio `SANITY_STUDIO_PREVIEW_URL` → the Worker URL (redeploy Studio for it to take effect).
- [x] G6. 🔴 **Cloudflare Access ENABLED** on the workers.dev route (verified: Worker 302-redirects to `sasinfra.cloudflareaccess.com/cdn-cgi/access/login/…`). Resolves the forgeable-cookie finding (§3.5, §6.0b).
- [ ] G7 (in-browser, Krishna). Open Presentation in `cms.sasinfra.com` → authenticate through Access → confirm **drafts render + overlays/click-to-edit/refresh**. Access gates `curl`, so this is browser-only; also lands the R-13 `optimizeDeps` client-hydration verdict. **Pre-deploy checks already passed:** published renders on the real Worker, `nodejs_compat` works at runtime, drafts safely blocked before the secret (302→/404, no leak).

### Parallelism / independence
- A → B → C are behavior-preserving under `published`; could ship to prod independently.
- D and E are independent once B/C land. Only G is Workers-specific.
