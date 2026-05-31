# Live Preview Plan — Sanity Presentation + Astro Visual Editing

**Status:** Proposed · **Rev:** v3 (2026-05-31, Astro-6 corrections from review round 2) ·
**Architecture:** A (static prod + separate SSR preview deploy) · **Phase 2 committed.**

**Scope:** spans `repos/sanity` (Studio) and `repos/frontend` (Astro). Lives in the
Studio repo next to `CONTENT_ARCHITECTURE_PLAN.md`, but **most work is in the
frontend.** §12 logs two adversarial review rounds.

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
| Deploy | `wrangler pages deploy dist/` (`deploy.yml`, unchanged) | `wrangler deploy` w/ `wrangler.jsonc` → `@astrojs/cloudflare/entrypoints/server` |
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
routes import the token from `astro:env/server`. Local dev: `.dev.vars` +
`platformProxy` (still the supported local mechanism).

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

> Run local dev with the **Cloudflare (Workers) adapter + `platformProxy` + `.dev.vars`**
> so the token resolves the same way it will when deployed (kills the C1 false-positive
> where it works in `astro dev` then is missing on deploy).

### Frontend `repos/frontend`
- **Deps** (pnpm): `@sanity/astro`, `@astrojs/react`, `@astrojs/cloudflare`,
  `@sanity/visual-editing`, `@sanity/preview-url-secret`, `groq`. `@sanity/astro`
  3.3.1 (Astro-6 support, 2026-03-13) clears the 30-day cooldown; **verify the other
  5 at install** and lower a floor only if blocked (never disable the cooldown).
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
- **Data layer (findings C2/C3) — all three files via `loadQuery`:**
  - `content.ts`: remove **all 10** `drafts.**` filters; add `loadQuery`-backed
    `getPageByPath`/`getProjectBySlug`.
  - `blog.ts`: route `getAllPosts`/`getPostBySlug` through `loadQuery`; **remove the
    line-80 filter**; add a direct `getPostBySlug` (no full-collection `.find()`).
  - `siteSettings.ts`: route through `loadQuery`; **scope the module cache**
    (build-only / perspective-keyed) — finding I6.
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
Studio (`:3333`) + frontend (`:4321`, Workers adapter + `platformProxy` + `.dev.vars`):
overlays, click-to-edit, refresh, **and a real `drafts` request** in the network tab.

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

### 6.1 Preview URL — default to a `workers.dev` subdomain
Use the free subdomain `sasinfra-frontend-preview.<account>.workers.dev`: zero DNS, stable,
immediate. A custom domain (`preview.sasinfra.com`) means DNS work and the domain is split
GoDaddy/Cloudflare (CLAUDE.md) — not worth it for an internal editor preview. Confirm the
account's `workers.dev` subdomain is enabled (one-time account setting).

### 6.2 `wrangler.jsonc` (preview Worker)
- `name: "sasinfra-frontend-preview"`
- `main: "@astrojs/cloudflare/entrypoints/server"`
- `compatibility_date: "<recent>"`
- `compatibility_flags: ["nodejs_compat"]` — **required**: `@sanity/client` /
  `@sanity/preview-url-secret` use `node:crypto`/`buffer`.
- `assets: { directory: "./dist", binding: "ASSETS" }` — how the Worker serves the built
  client assets (adapter mostly wires this automatically; set it explicitly to be safe).
- `workers_dev: true`.

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
- `functions/` is Pages-only — irrelevant to the Workers preview.
- Cookie needs `SameSite=None; Secure` → HTTPS or `localhost` only.
- React enters only as a draft-mode island — code-split, never shipped to visitors.
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

---

## 13. Implementation checklist (execution order)

Ordered so production is never at risk; each stage has a gate. A–F local; G deploy.
**Client: golden-path `@sanity/astro` `sanity:client`.** **No `prerender` exports —
the `output` mode does the split.**

### Stage A — Scaffolding (no behavior change)
- [ ] A1. `pnpm add` the 6 deps; resolve cooldown at install (lower floors only if blocked; never disable). Commit lockfile.
- [ ] A2. `astro.config.mjs`: `PREVIEW_BUILD` (via `process.env`) gates `output` (`static`↔`server`), adapter (`@astrojs/cloudflare` Workers), and integrations (`react()`, inject-routes integration). Always `sanity()` with explicit `apiVersion:'2026-05-31'`/`perspective:'published'`/`useCdn:false`/`stega.studioUrl`. Add `env.schema` `SANITY_API_READ_TOKEN` (server/secret/optional) + `vite.optimizeDeps.include`.
- [ ] A3. `src/env.d.ts`: `/// <reference types="@sanity/astro/module" />`.
- [ ] **Gate A (both directions):** `pnpm build` (no flag) → static `dist/`, no Workers entry, no draft-mode routes. `PREVIEW_BUILD=1 pnpm build` → Workers entry + `/api/draft-mode/*` SSR.

### Stage B — Data layer (golden-path client + core refactor)
- [ ] B1. `src/lib/sanity.ts`: client from `sanity:client`; keep `urlForImage`/`portableTextToHtml`.
- [ ] B2. `src/sanity/lib/load-query.ts`: wrap `sanity:client`; perspective/stega/`resultSourceMap` on cookie; **token from `astro:env/server`**, passed in, draft-mode only.
- [ ] B3. `src/sanity/lib/draft-mode.ts`: read perspective cookie.
- [ ] B4. `content.ts`: all fetches → `loadQuery`; **remove all 10** filters; add `loadQuery` `getPageByPath`/`getProjectBySlug`.
- [ ] B5. `blog.ts`: → `loadQuery`; **remove line-80 filter**; direct `getPostBySlug`.
- [ ] B6. `siteSettings.ts`: → `loadQuery`; **scope the module cache** (I6).
- [ ] B7. *(Optional)* `groq` `defineQuery` + `sanity typegen generate`.
- [ ] **Gate B (semantic, not byte-identical — I-A):** `pnpm build` (no flag); (1) **assert zero stega** markers in output, (2) text/links/JSON-LD equal vs current prod after `stegaClean` normalization.

### Stage C — SEO / stega safety
- [ ] C1. `SEO.astro`: deep `stegaClean()` of `title`/`description`/`imageAlt`/`article.*` + **each `jsonLd` object** (line 84-86). Body keeps stega.
- [ ] **Gate C:** no-op when stega off → prod `<head>` unchanged.

### Stage D — Visual-editing runtime (preview-only)
- [ ] D1. SSR fallbacks: add `blog/[slug]` fallback; route `[...slug]`/`projects/[slug]` fallbacks via `loadQuery` (C3). **No `prerender` exports.**
- [ ] D2. `src/sanity/routes/enable.ts` + `disable.ts` (token via `astro:env/server`); `injectRoute`d only when `PREVIEW_BUILD` (§3.1).
- [ ] D3. `SanityVisualEditing.tsx` + `DisableDraftMode.tsx` (`client:only="react"`).
- [ ] D4. `SiteLayout.astro`: render islands only when the perspective cookie is present.

### Stage E — Studio (npm, trivial)
- [ ] E1. `sanity.config.ts`: add `previewMode: { enable: '/api/draft-mode/enable' }`.

### Stage F — Local validation (Phase 0 prereqs)
- [ ] F1. Token in `.dev.vars` (done); CORS `localhost:4321` **+ the Studio origin** (Allow credentials).
- [ ] F2. Studio (`:3333`) + frontend (`:4321`, Workers adapter + `platformProxy`); confirm overlays, click-to-edit, refresh, **and a real `drafts` request**.

### Stage G — Deploy (Phase 2, Cloudflare **Workers**) — see §6
- [ ] G0. 🔴 **Verify `CLOUDFLARE_API_TOKEN` has Workers Scripts:Edit** (current token is Pages-scoped for `pages deploy`); broaden or mint a Workers token. Hard prerequisite — do first.
- [ ] G1. Confirm the account `workers.dev` subdomain is enabled; preview URL = `sasinfra-frontend-preview.<acct>.workers.dev`.
- [ ] G2. `wrangler.jsonc`: `main: @astrojs/cloudflare/entrypoints/server`, `name`, `compatibility_date`, `compatibility_flags: ["nodejs_compat"]`, `assets`(`./dist`/`ASSETS`), `workers_dev: true`.
- [ ] G3. `deploy-preview.yml`: `PREVIEW_BUILD=1` build → `wrangler deploy` (`cloudflare/wrangler-action@v3`, `command: deploy`).
- [ ] G4. `wrangler secret put SANITY_API_READ_TOKEN` (one-time); read via `astro:env/server`.
- [ ] G5. Studio `SANITY_STUDIO_PREVIEW_URL` + `stega.studioUrl`; add the Worker origin to CORS (credentials).
- [ ] G6. Verify **on the deployed Worker** (drafts render, token resolves at request time).

### Parallelism / independence
- A → B → C are behavior-preserving under `published`; could ship to prod independently.
- D and E are independent once B/C land. Only G is Workers-specific.
