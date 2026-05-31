# SAS Infra — Content Architecture & Studio Organization Plan

**Status:** v2.6 — final coherence pass (Codex/GPT-5). `/legal` and `/projects` are non-rendered prefixes; projects showcase lives on Home. Anchor-link contract, catch-all ownership, and `projectUpdate` anchor id tightened; page-family menu completed.
**Scope:** `repos/sanity` (schema + Studio structure) and `repos/frontend` (routing, rendering, preview).
**Goal:** Make Sanity the genuine source of truth for **every** page the site serves,
with a Studio whose top-level organization is a faithful mirror of the site's URL
hierarchy and naming that matches the URLs/titles.

> **Out of scope (by instruction):** migration effort, backward compatibility, and
> URL-change redirects. This is the *ideal greenfield end-state*. Sequencing is a
> later concern.

> **What changed since v1:** the spine is now a **first-class Route Model** (§3) —
> routes are a validated, cross-type invariant, not per-type slugs kept in sync by
> discipline. Added index-page singletons (§4.1), a route-collision fix for
> `/projects/updates` (§4.1/§5), a Visual Editing/Presentation section (§9), editor-
> ergonomics requirements (§10), a discriminated link object (§6.3), and per-family
> block menus (§6.2). The 6 open decisions (v1 §9) are now **resolved** (§11). **§12
> models SAS Crown's bespoke components now** (Crown is structurally finished) and
> lists **SAS iTower's as pending** (WIP).

---

## 1. Design principles

1. **Routes are a modeled invariant, not a convention.** Every URL-bearing document
   resolves to exactly one route through a single shared resolver. Slugs, nav,
   internal links, `getStaticPaths`, the sitemap, JSON-LD, and the Presentation
   tool all derive their URLs from that one resolver — they cannot drift.
2. **Studio mirrors the site map, not the database schema.** The root list reads
   like the website's navigation; an editor maps "the About page" → the "About"
   item without translation.
3. **Every URL is CMS-owned — including index pages.** `/`, `/blog`,
   `/projects/updates` are documents too (singletons), not hardcoded route shells.
   No `_type=="page"` orphan; no hardcoded hero/filter copy left in `.astro`.
   (`/projects` is a non-rendered prefix — the projects showcase lives on Home.)
4. **One page-builder, restricted per document family.** Bespoke layouts are an
   ordered array of typed section blocks — but home, generic pages, and projects
   each expose a curated subset of the block vocabulary, not the whole menu.
5. **Reusable content is referenced, not duplicated.** People, partners, press,
   jobs, updates are first-class documents referenced by blocks.
6. **Naming aligns to URLs/titles**, and a page's Studio location ⇄ its URL are
   derivable from one another via the route model. No hidden mapping.
7. **Honest separation of "has a URL" vs "reusable building block."** URL docs live
   in the URL-mirrored tree; shared library docs live in a labelled Library group.

---

## 2. Current state (baseline)

Two workspaces: `production` (live) and `old` (WordPress archive). The live Studio
root is a flat, type-centric list (`structure/index.ts`). URL ⇄ CMS reality:

| URL | Route file | Sanity | CMS-driven? |
|---|---|---|---|
| `/` | `index.astro` | — | ❌ hardcoded |
| `/about` `/careers` `/contact` `/media` | `*.astro` | — | ❌ hardcoded |
| `/blog` | `blog.astro` | `blogPost` list; **hero/filter copy hardcoded** | ⚠️ partial |
| `/blog/[slug]` | `blog/[slug].astro` | `blogPost` → `author`,`category` | ✅ |
| `/legal/{cookies,privacy,terms}` | `legal/*.astro` | — | ❌ hardcoded |
| `/projects/updates` | `projects/updates.astro` | — (`data/updates.ts`) | ❌ hardcoded |
| `/sas-crown` `/sas-itower` | `*.astro` | `project` (SEO/JSON-LD only); **nav via `data/projects.ts`** | ⚠️ partial |

Problems: (a) Studio organized by type, not URL; (b) `page` type renders nothing
(0 `_type=="page"` queries); (c) index/listing pages and project nav carry hardcoded
content; (d) naming disagrees with URLs (flat `/sas-crown`, "Projects" folder).

---

## 3. The Route Model (the spine)

### 3.1 `route` object (embedded on every URL-bearing document)

```
route {
  segment:  slug      // single path segment only, e.g. "privacy" — never "legal/privacy"
  section?: string    // optional reserved, NON-rendered path prefix, e.g. "legal"
  // computed at query time: full path = [section, segment].filter(Boolean).join('/')
}
```

- **Single-segment slugs only.** The default `slug` type strips `/` and slugifies
  the source; storing full paths fights the input and breaks the "open preview"
  affordance. Grouping is expressed by `section`, not by slashes.
- **`section` is a non-rendered prefix.** `legal` pages get `section: 'legal'` →
  `/legal/privacy`, but **there is no `/legal` page** — `section` is a reserved
  path namespace (a fixed, extensible enum), not a document. No deep arbitrary
  page-under-page nesting; sections are the one grouping mechanism. (Type prefixes
  `/blog` `/projects` come from the resolver's type switch, §3.2 — not from `section`.)
- **Index/root docs** use a reserved sentinel (`segment = ""` or a `routeKind`
  enum: `home | section-index | leaf`) so `/`, `/blog` resolve to a bare path.
- Sanity enforces default slug uniqueness *within a type* only. Route uniqueness
  must be **cross-type and namespace-aware**, so:

### 3.2 `resolveHref(doc)` — the single resolver

One utility, shared by the Studio (Presentation `resolve.locations`) and the
frontend (`src/lib/routing.ts`):

```
resolveHref(doc):
  blogPost          → `/blog/${route.segment}`
  project           → `/projects/${route.segment}`
  projectUpdate     → `/projects/updates#${route.segment}`  (anchor on the updates page — not a standalone route)
  page              → `/${[route.section, route.segment].filter(Boolean).join('/')}`
  *IndexPage        → fixed path for the index (`/`, `/blog`, `/projects/updates`)
```

Every internal link (`cta.reference`, Portable Text `internalLink`, navigation
items, sitemap, JSON-LD `url`, OG `url`) calls `resolveHref`. **No URL string is
ever hand-authored or hardcoded** outside this function.

### 3.3 Cross-type route uniqueness + reserved segments

- A **build-time validation** (and a Studio `validation.custom` on `route.segment`)
  asserts the *full resolved path* is unique across `page`, `project`, `blogPost`,
  and the rendering index singletons. (`projectUpdate.route.segment` is an **anchor id**,
  not a standalone path — it's validated unique *within* the updates feed instead.)
- **Reserved segments/sections** are enforced so content can't shadow a route: e.g.
  a `project` may not take segment `updates` (collides with `/projects/updates`); a
  top-level `page` (no `section`) may not take `blog`, `projects` (type prefixes) or
  `legal` (a reserved section namespace).
- This is the invariant that prevents the "slugs/nav/static-paths drift apart"
  failure both reviews flagged.

---

## 4. Content architecture — documents

### 4.1 URL-bearing documents (render at a route)

| Type | Renders at | Card. | Notes |
|---|---|---|---|
| `homePage` *(singleton)* | `/` | 1 | Page-builder (home-family blocks). Owns the public **projects showcase** (`feed(projects)`, anchor `#projects`) — replaces `data/projects.ts`. |
| `blogIndexPage` *(singleton)* | `/blog` | 1 | Hero/intro/filter copy + SEO. Replaces hardcoded `blog.astro` copy. |
| `updatesIndexPage` *(singleton)* | `/projects/updates` | 1 | Header + pulls the updates feed. Resolves the route collision. |
| `page` | `/{section?}/{segment}` | many | Page-builder (page-family blocks). About/Careers/Contact/Media + Legal children are **fixed-ID `page` docs** pinned in Studio with singleton-like action guards. Legal children carry `section: 'legal'` (no `/legal` page is rendered). |
| `project` | `/projects/{segment}` | many | Page-builder (project-family blocks) + structured fields (specs/amenities/RERA/location/JSON-LD). |
| `projectUpdate` | feed item on `/projects/updates` (and on its `project`) | many | `{date, project→, category, headline, body?, media: youtube\|image, pdf?, route.segment (anchor id)}` (shape per §12.1). Anchor target, not a standalone route. Replaces `data/updates.ts`. |
| `blogPost` | `/blog/{segment}` | many | `author` ref retargets to `person`. |

### 4.2 Library documents (reusable, no own URL)

| Type | Used by | Replaces |
|---|---|---|
| `person` | `peopleBlock`, `blogPost.author` | `author` (unified: `roles[]` = author/leadership/founder) |
| `partner` | `logoWallBlock` | inline `/about` partner markup |
| `pressItem` | `feedBlock(source:press)`, `/media` | `data/media.ts` |
| `jobPosting` | `feedBlock(source:jobs)`, `/careers` | hardcoded listings |
| `category` | `blogPost.category` | unchanged |

### 4.3 Config singletons

| Type | Notes |
|---|---|
| `siteSettings` | Unchanged — identity, contact, social, Organization JSON-LD. |
| `navigation` | **Built now** (not optional). Header/footer menus as `navItem[]` using the discriminated link object (§6.3) so items point at internal refs, external URLs, or anchors — all via `resolveHref`. |

---

## 5. Studio structure (URL-mirrored)

`structure/index.ts` rewritten to mirror the URL hierarchy. Editors navigate by
page name; reusable content is quarantined in **Library**.

```
Content
├─ ⚙  Site Settings              (singleton)
├─ 🧭 Navigation                 (singleton)
│
├─ 🏠 Home                       /                 (singleton)
│
├─ ✍  Blog                       /blog
│   ├─ Blog Index                /blog             (singleton: hero/filter copy)
│   ├─ Posts
│   ├─ Categories
│   └─ Authors      (person filtered roles∋author · create seeds roles:['author'])
│
├─ 🏗  Projects                  (folder — no /projects page; showcase is on Home)
│   ├─ Updates                   /projects/updates (singleton index)
│   │   └─ Update Items          (projectUpdate list)
│   ├─ SAS Crown                 /projects/sas-crown   (pinned flagship)
│   ├─ SAS iTower                /projects/sas-itower  (pinned flagship)
│   └─ — All Projects —          (full list, grouped by status)
│
├─ 📄 Pages
│   ├─ About                     /about     (fixed-ID, guarded)
│   ├─ Careers                   /careers   (fixed-ID, guarded)
│   ├─ Contact                   /contact   (fixed-ID, guarded)
│   ├─ Media                     /media     (fixed-ID, guarded)
│   ├─ Legal                     /legal/*  (group label — /legal itself does NOT render)
│   │   ├─ Privacy   ├─ Terms   └─ Cookies   (create seeds section='legal')
│   └─ — Other Pages —           (catch-all: any page not pinned/legal — nothing unreachable)
│
└─ 🧩 Library  (reusable — no own URL)
    ├─ People · Partners · Press Items · Job Postings
```

Requirements baked into the structure (not just folders):
- **"Other Pages" catch-all** so a newly-created generic `page` is always reachable
  (`page && !(_id in [pinned ids]) && section != 'legal'`). Closes the relocated-orphan hole.
- **`initialValueTemplates`** on filtered create panes: Authors → `roles:['author']`;
  Legal → `section: 'legal'`; Update Items → today's date. Else created docs
  vanish from the very list that made them.
- **Pinned/fixed-ID docs** (Home, indexes, About/Careers/Contact/Media) get a
  document-action guard so they can't be duplicated/deleted (see §10).
- **Status-grouped "All Projects"** via four GROQ-filtered children
  (Upcoming / Under Construction / Ready to Move / Completed). Flagships also pinned
  above — a deliberate (documented) double-listing for convenience.
- **No `/projects` landing.** The "Projects" folder is organizational (like Legal /
  Library); `/projects` does not render. The public projects showcase is a
  `feed(projects)` block on **Home** (anchor `#projects`), and the "Projects" nav item
  is an anchor link to `/#projects` (§6.3 `kind:'anchor'`).

---

## 6. Page-builder & objects

### 6.1 `pageBuilder` array, restricted per family

A shared array type, but the `of:[]` menu is curated per document family via the
structure/schema so editors aren't shown irrelevant blocks:

- **home-family:** hero, featureGrid, statsStrip, feed(projects), feed(updates), cta, contactForm, map
- **page-family:** hero, prose, featureGrid, statsStrip, timeline, people, logoWall, gallery, quote, cta, contactForm, map, cardGrid, feed
- **project-family:** projectHero, prose, statsStrip, gallery, specsRef, amenitiesRef, floorPlans, signatureFeature, amenityZones, locationMap, quote, cta, contactForm, feed(updates) — see §12.1 for the bespoke ones. *(iTower-only blocks still deferred — §12.2.)*

### 6.2 Block taxonomy (~15 shared)

| Block | Covers today | Notes |
|---|---|---|
| `heroBlock` (variant: editorial \| minimal) | `*-hero` (non-project) | eyebrow, rich title, dek, media, `ctas` — *project hero is its own `projectHeroBlock`, §12.1A* |
| `proseBlock` | `au-story`, `*-intro`, `lg-section` | eyebrow, heading, `body: portableText` |
| `statsStripBlock` | `pp-hero-stats`, `eng-stats`, `strip-grid` | `items:{value,label,suffix}[]` |
| `timelineBlock` | `au-timeline` | `milestones:{year,title,body}[]` |
| `peopleBlock` (grid \| featured) | `au-team`, `au-chair` | `people: person[]` |
| `logoWallBlock` | `au-partners` | `partners: partner[]` |
| `galleryBlock` (carousel \| grid) | `pp-gallery` | `images: imageWithAlt[]` |
| `specsRefBlock` | `pp-specs`, `cw-specs` | renders `project.specifications` (no inline copy) |
| `amenitiesRefBlock` | `cw/pp-amenities` | renders `project.amenities` (no inline copy) |
| `quoteBlock` | `au-chair-quote`, `contact-quote` | quote + **single-shape attribution**: optional `person` ref + optional `nameOverride`/`roleOverride` |
| `ctaBlock` | all `*-cta` | eyebrow, heading, dek, `actions: link[]` |
| `featureGridBlock` | `about-features` | `features:{icon,title,text}[]` — kept distinct from cards (different preview/validation) |
| `cardGridBlock` *(manual)* | manual cards | editor-picked `cards[]` |
| `feedBlock` *(computed)* | `updates-grid`, press grid, `cr-grid` | `source: press\|jobs\|projects\|blog\|updates`, `limit`, ordering. **Runs a secondary GROQ per block** — the one non-flat projection; documented as such. |
| `contactFormBlock` | `contact-form`, `ct-form` | `variant` enum selects a fixed form component + `formTarget`; fields are **not** editor-modeled |
| `mapBlock` | `ct-map` (simple embed) | `location` ref/geopoint — *project location uses `locationMapBlock` §12.1E, not this* |

Every block defines `preview` (icon + meaningful title) and `validation` on required
fields so empty bands can't publish.

### 6.3 Objects — discriminated `link`

Replace the loose `cta` (which today allows neither **or** both `url` and
`reference`) with a discriminated link object reused by CTAs, nav, and Portable Text:

```
link {
  kind: 'internal' | 'external' | 'anchor' | 'file' | 'email' | 'phone'
  reference?  (kind=internal|anchor → page/project/blogPost/homePage/blogIndexPage/updatesIndexPage)
  anchorId?   (kind=anchor → resolves to `${resolveHref(reference)}#${anchorId}`, e.g. homePage + 'projects')
  href?       (kind=external)
  file?       (kind=file)
  // internal & anchor URLs are produced by resolveHref — never hand-authored;
  // exactly-one target enforced by validation
}
```

`imageWithAlt` already requires `alt` (good); extend required-alt to the raw `image`
fields that remain (`seo.ogImage`, `siteSettings.logo`, project amenity icons) except
those explicitly marked decorative. `portableText.internalLink` is wired to
`resolveHref` in the renderer (today it is defined but unrendered).

Reused as-is: `seo`, `location`, `socialLink`, `portableText` (+ internalLink fix).

---

## 7. URL ⇄ document map (target)

| URL | Document | Studio location |
|---|---|---|
| `/` | `homePage` | Home |
| `/blog` | `blogIndexPage` | Blog › Blog Index |
| `/blog/{seg}` | `blogPost` | Blog › Posts |
| `/projects` | *(no page — non-rendered prefix)* | Projects (folder, organizational) |
| `/projects/updates` | `updatesIndexPage` (+ `projectUpdate` items) | Projects › Updates |
| `/projects/{seg}` | `project` (seg ≠ `updates`) | Projects › … |
| `/about` `/careers` `/contact` `/media` | fixed-ID `page` | Pages › … |
| `/legal/{seg}` | `page` section=`legal` *(no `/legal` page)* | Pages › Legal › … |
| `/{seg}` | `page` (no section) | Pages › Other Pages |

---

## 8. Frontend changes (`repos/frontend`)

1. **`src/lib/routing.ts`** — the `resolveHref(doc)` resolver (§3.2) + reserved-segment
   list. Single import for nav, blocks, sitemap, JSON-LD, Presentation.
2. **Routes** (all data-driven; hardcoded page files deleted):
   - `index.astro` → `homePage` (incl. the `#projects` showcase block); `blog.astro` →
     `blogIndexPage`. There is **no** `/projects` index route.
   - `[...slug].astro` catch-all → **`page` docs only** (incl. `section:'legal'`),
     composing path from the optional `section` prefix. The index singletons are owned
     by the explicit route files above — the catch-all never emits them (avoids
     duplicate `/`, `/blog`, `/projects/updates`). `getStaticPaths()` **must** filter drafts
     (`!(_id in path("drafts.**"))`) and the build client **must** pin
     `perspective: 'published'` (today `sanity.ts` sets neither) or every page
     double-renders → build error.
   - `projects/[slug].astro` → `project`; `projects/updates.astro` →
     `updatesIndexPage` + feed; `blog/[slug].astro` unchanged in spirit.
3. **Block renderer** — `src/components/blocks/<Block>.astro` + a `<PageBuilder>`
   dispatcher mapping `_type` → component, preserving existing CSS classes
   (`au-*`, `pp-*`, `cr-*`). `feedBlock` runs its secondary query.
4. **Data layer** — typed GROQ projecting each block, null-guarding every deref
   (`person->`, `partner->`, feed sources) so a deleted reference can't break the build.
5. **JSON-LD** (`jsonld.ts`) continues reading structured fields from `siteSettings`
   + `project`; `url` fields now come from `resolveHref`.

---

## 9. Visual editing / Presentation (new — table stakes for a page-builder)

- Add `presentationTool({ previewUrl, resolve })` to `sanity.config.ts` (today only
  `structureTool` + `visionTool`).
- `resolve.locations` maps each document → its route via the **same `resolveHref`**.
- Frontend: add `@sanity/visual-editing`, an Astro draft-mode/preview route, a
  preview client (`perspective: 'previewDrafts'`, `useCdn:false`) separate from the
  published build client, and **Stega encoding only on visible body content** —
  never on `<head>`/SEO/JSON-LD/href values (strip or fetch those without Stega).
- Result: editors arrange page-builder sections against a live preview with
  click-to-edit overlays.

---

## 10. Editor ergonomics (new — requirements)

- **Field groups (tabs)** on large forms — esp. `project`: *Content · Page Builder ·
  SEO & Structured Data · Settings* — so the form is navigable.
- **`document.actions` resolver** (modern API; **not** the deprecated
  `__experimental_actions`) removing `duplicate`/`delete`/`unpublish` for all
  singletons and fixed-ID pages; fixed-ID docs also get a **read-only `route.segment`**.
- **`initialValueTemplates`** per §5 (roles, section, date).
- **Validation** everywhere: required block fields, discriminated-link exactly-one,
  required alt, cross-type route uniqueness (§3.3).

---

## 11. Resolved decisions (were v1 §9 open questions)

1. **`/projects/updates`** → dedicated **`projectUpdate`** documents + an
   **`updatesIndexPage`** singleton; the project page pulls
   `*[_type=="projectUpdate" && project._ref==^._id]`. (Also removes the route collision.)
2. **Home/About etc.** → **singletons / fixed-ID pages with action guards**, plus the
   "Other Pages" bucket for generic pages. Home stays a distinct `homePage` type only
   because its block menu (project-strip + updates feed) genuinely differs.
3. **`navigation`** → **built now** (leaving nav in code contradicts source-of-truth).
4. **`person`** → **unify `author` into `person`** with `roles[]`; retarget
   `blogPost.author`; filter the Authors pane; seed role via init template.
5. **Block granularity** → ~15 shared blocks, **menus restricted per family**;
   `cardGrid` (manual) split from `feed` (computed); `featureGrid` kept distinct from
   cards. Project-specific interactive blocks deferred (§12).
6. **Project specs/amenities** → **structured `project` fields stay canonical**
   (JSON-LD reads them); `specsRefBlock`/`amenitiesRefBlock` are presentational
   pointers with **no inline overrides** (prevents JSON-LD/page divergence).

---

## 12. Bespoke project-page components

Project pages are **not** generic page-builder pages — they are bespoke, designed
long-form layouts with stateful CSS/JS micro-components. The governing principle:
**Sanity owns the structured data; the Astro/JS component owns the interaction
behaviour and rendering.** No interaction *logic* (radio-tab state, scroll-spy wiring,
hover/click handlers) is modeled in the CMS. **Boundary clarification:** coordinates
that *locate a label* (map / master-plan / floor-plate pins) are **content** — they
live with the pin's label data — whereas the hover/click/scroll *behaviour* that acts
on them is the component's. Annotation geometry is data; interaction is code.

**SAS Crown is structurally finished**, so its components are modeled now (§12.1).
**SAS iTower is WIP**, so its additional/superset components stay pending (§12.2).

### 12.0 Cross-cutting: the icon system

Crown's spec cards (`pp-spec-card`) and amenity cards (`pp-am-card`) use **inline
SVG icons that are part of the design system**, not arbitrary uploads. Model icon
selection as a **curated icon-token enum** (`bank`, `ev`, `pool`, `theatre`, `spa`,
…) resolved to an SVG component on the frontend — **never** an image upload. Applies
to `project.specifications[].icon`, `project.amenities[].icon` (changing today's
`type:image` to a token enum), and any block exposing an icon. Rationale: preserves
visual consistency, keeps payloads small, and stops editors breaking the design with
off-style raster icons. The token registry is the single source on the frontend; the
enum `list` in Studio is generated from it so the two cannot drift. Require a frontend
**fallback token** for unknown values (release-coupling safety: a doc referencing a
token not yet shipped renders the fallback, never a blank). No hybrid image-upload path
unless SAS expects one-off custom icon art per project.

### 12.1 SAS Crown — model now (structurally finished)

Five new project-family blocks plus refinements to shared blocks. Each block stores
**data only**; the existing CSS classes / JS behaviours are preserved by the renderer.

**A. `projectHeroBlock`** (`pp-hero`)
```
{ media: { kind: 'video'|'image', video?: file, poster?: image, image?: imageWithAlt },
  logo: imageWithAlt,                 // project wordmark (svg)
  eyebrow: string,                    // "Residential · Kokapet, Hyderabad"
  title: string (rich/emphasis),
  ctas: link[],                       // discriminated link (§6.3)
  stats: { label, value }[] }         // 6 hero cells (Height/Floors/Config/Sizes/Land/Open Space)
```
*Tension to resolve:* hero `stats` overlap `project` structured fields
(`numberOfFloors`, `unitConfiguration`, …). Default to **referencing** the project
fields where one exists; only free-type a cell that has no structured source.

**B. `floorPlansBlock`** (`cw-plans` — Crown's **single-axis** tabbed switcher)
```
{ head: { eyebrow, heading (rich), sub, meta: {label,value}[], cta: link },
  plans: { seq, label, size, planImage: imageWithAlt }[] }   // 5 tabs for Crown
```
Radio-tab interactivity stays in the component. Crown is a flat list; iTower is **not**
a single Cartesian matrix (it has separate plate / block / rise / size variants —
§12.2). So don't pre-bake axis keys onto Crown's `plans[]`. Instead reserve a future
`mode` discriminator + `entries[]` model (§12.2) that Crown satisfies as `mode: 'list'`.

**C. `signatureFeatureBlock`** (`pp-feature` / `cwf-inline` · `cwf-cinema`)
```
{ variant: 'inline'|'cinema', image: imageWithAlt,
  eyebrow: string,            // "Signature · Clubdom"
  heading: string (rich), body: text, items: string[] }
```
Shared with iTower's "Digital Façade" feature. Note: `cwf-inline`/`cwf-cinema` are
dev **A/B harness** toggles (`harnessGroups`) — the CMS exposes one `variant`; the
harness machinery never surfaces in Studio.

**D. `amenityZonesBlock`** (`cw-amenities` editorial — "Life at Crown")
```
{ head: { label, heading (rich), dek },
  anchor: { image: imageWithAlt, eyebrow, heading (rich), body },
  zones: { seq, title, items: string[] }[] }                 // 3 programmed zones
```
Distinct from `amenitiesRefBlock` (the flat gold-icon grid, which renders
`project.amenities`). A project page can use both: zones (editorial) + flat grid.

**E. `locationMapBlock`** (`map-section`, disc mode)
```
{ overture: { eyebrow, heading (rich), dek },
  mapConfig: { mapProject: string, frameStyle: 'disc'|'editorial' },   // selects the procedural scene
  locationCard: { eyebrow, heading (rich), dek },
  footnote: string }
```
Geo comes from `project.location.geopoint`. **The 3D map is built procedurally in
`map-3d.js` keyed by `mapProject`** (Three.js primitives — see project memory); Sanity
owns the **copy + which scene**, never the geometry.

**Refinements to shared blocks (Crown-driven):**
- **Section heads + CTAs are editable, not hardcoded.** Every shared block rendered on
  a project page carries an optional `head { eyebrow|label, heading (rich), dek }` and
  optional `cta: link` — Crown has these on specs (`pp-specs-head`, L128), the gallery
  (head + "View All" CTA, L178), the flat amenities grid (L312), and updates (head +
  "View Full Timeline" CTA, L379). Where a block omits `head`/`cta`, the renderer uses
  a **documented per-block default**; copy is never hardcoded in the component. *(This
  is the main gap between "Crown is fully covered" and the finished Astro page.)*
- `specsRefBlock` → renders `project.specifications[]` incl. the new `icon` token (§12.0).
- `amenitiesRefBlock` → renders `project.amenities[]`; `icon` becomes a token enum.
- `galleryBlock` → per-tile `size` variant (`tall`|`default`) for the marquee carousel.
- `statsStripBlock` → `countUp: boolean` (the credibility strip animates via `data-count`).
- `contactFormBlock` → the "I'm Interested In" options **default** from
  `floorPlansBlock.plans` / project configs, but are an **explicit curated lead list**
  that may add/rename/drop entries (each optionally referencing a plan id / axis value)
  with label overrides. Crown's form (L442) curates the 5 plan tabs down to 4 options
  and renames "Sky Villa" — derivation *seeds*, it doesn't *lock*.
- Construction progress (`cw-progress`) is **not** a new block: it's
  `feedBlock(source: updates)` over `projectUpdate` docs
  `{ date, category, headline, media: youtube|image, pdf }` filtered to this project.

### 12.2 SAS iTower — pending (WIP)

Not modeled until the page design settles. Each is a superset or commercial-only
component with no finished Crown equivalent:

| Component (class) | Why pending |
|---|---|
| Master plan — 3 variants + positioned pins (`cw-master`) | Interactive pins at %-coords; design in flux |
| Vertical-anatomy scroll-spy (`cw-anatomy`) | `IntersectionObserver` band-tracking; data model TBD |
| Floor-plan **configurator**, multi-axis (`cw-plans`: block × rise × size) | Superset of Crown's single-axis `floorPlansBlock`; needs a plan **matrix** keyed on 3 axes |
| Floor-plate anatomy, annotated (`cw-plate-anatomy`) | Annotated callouts positioned on a plate image |
| Tenant positioning (`cw-tenants`: BFSI / GCC / Domestic) | Commercial-only; no residential analogue |
| Engineered numbers (`cw-engineered` / `eng-stats`) | May fold into `statsStripBlock`; defer until iTower stats finalize |
| Consultants row (`cw-consultants`) | May fold into `logoWallBlock`; defer |
| Five-page brochure scroll strip (`cw-brochure`) | Bespoke scroll component |
| Progress — timeline / then-now slider variants (`cw-progress` variants) | iTower's progress is more than an updates feed; timeline + before/after slider need their own data |

When picked up, follow §12.1's principle (model the data — pin coords **and** labels,
band defs, plan entries, tenant tiers; keep interaction behaviour in the component).
`floorPlansBlock` grows a `mode` discriminator (`list` for Crown · `configurator` for
iTower) with an `entries[]` / `axes[]` shape under `configurator` — a forward extension
Crown satisfies as `mode: 'list'`, **not** a flat sprinkle of optional axis keys and
**not** a fork.

---

## 13. Out of scope (restated)

Migration sequencing, content backfill, URL redirects, the `old` WordPress
workspace, and effort/timeline estimation. This plan defines the destination only.
