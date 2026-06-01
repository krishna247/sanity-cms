# SEO Migration Manifest — live WordPress → new Astro+Sanity build

**Philosophy:** move existing SEO **as-is**. On-page text (title / description /
OG) is migrated **verbatim** from live `sasinfra.com` (overflow kept — the ≤160
tidy-up is explicitly deferred). Where the new build's URL differs, we **keep the
new clean URL and 301-redirect** the old one (standard migration practice — no
ranking equity lost). Every row below is either *"migrated verbatim"* or
*"changed, because ___"* so each delta is justifiable.

Sources: `SEO_REVIEW_LIVE.md` (live capture, 2026-06-01) + `src/lib/routing.ts`
(new URL model) + Sanity `ajw4irs3/production`.

**Write split:** meta text + OG → Sanity (`sanity exec` patch scripts). 301s →
the frontend host (Cloudflare Pages `public/_redirects`, format `/old /new 301`).
Structured-data parity → code in `src/lib/jsonld.ts` (NOT a data move — see §5).

---

## 1. 301 redirect map (the core "as-is" artifact)

Old live URL → new build URL. Drop into `repos/frontend/public/_redirects`.

```
# ── Pages ──────────────────────────────────────────────
/privacy-policy/            /legal/privacy        301
/cookie-policy/             /legal/cookies        301
/terms-conditions/          /legal/terms          301
/sas-infra-careers/         /careers              301
/project-updates/           /projects/updates     301
/sas-infra-blog/            /blog                 301
/news-articles/             /blog                 301   # no 1:1 equiv; folds into blog
/about-sas-infra-hyderabad/ /about                301   # live canonical About page (see §2)
/about-sas-infra/           /about                301   # 301s to the canonical on live
# /contact/, /media/ and /about/ already match new routes (trailing-slash normalize only)

# ── Project landing pages → canonical project (5 → 2) ──
/tallest-residential-tower-in-south-india/          /projects/sas-crown    301
/luxury-4-5-bhk-apartments-financial-district/      /projects/sas-crown    301
/sas-itower-commercial-spaces-nanakramguda-khajaguda/  /projects/sas-itower 301
/commercial-spaces-nanakramguda-khajaguda/          /projects/sas-itower   301
/sas-itower-office-spaces-hyderabad/                /projects/sas-itower   301

# ── Dead / drifted ────────────────────────────────────
/challenges-in-large-scale-construction/   /blog   301   # live 404 today; catch backlinks
/hyderabad-ongoing-real-estate-trends/   /blog/hyderabad-ongoing-real-estate-trends  301
/hyderabads-ongoing-real-estate-trends/  /blog/hyderabad-ongoing-real-estate-trends  301  # live canonical variant

# ── Blog posts: root slug → /blog/<slug> (30 posts) ──
/fsi-high-rise-buildings-heritage-projects-guide/        /blog/fsi-high-rise-buildings-heritage-projects-guide        301
/2025-investment-styles-affluent-luxury-real-estate-trends/  /blog/2025-investment-styles-affluent-luxury-real-estate-trends  301
/remote-work-evolution-home-buying-preferences/          /blog/remote-work-evolution-home-buying-preferences          301
/impact-of-virtual-tours-on-home-buying/                 /blog/impact-of-virtual-tours-on-home-buying                 301
/hyderabad-rising-as-indias-high-rise-capital/           /blog/hyderabad-rising-as-indias-high-rise-capital           301
/kokapet-real-estate-growth/                             /blog/kokapet-real-estate-growth                             301
/what-will-real-estate-look-like-in-five-years/          /blog/what-will-real-estate-look-like-in-five-years          301
/five-misconceptions-about-hyderabads-luxury-real-estate/ /blog/five-misconceptions-about-hyderabads-luxury-real-estate 301
/maintaining-your-apartment-after-construction/          /blog/maintaining-your-apartment-after-construction          301
/eco-friendly-homes-explained/                           /blog/eco-friendly-homes-explained                           301
/residential-vs-commercial-real-estate/                  /blog/residential-vs-commercial-real-estate                  301
/guide-to-finding-the-right-investment-opportunity/      /blog/guide-to-finding-the-right-investment-opportunity      301
/common-mistakes-first-time-home-buyers-make/            /blog/common-mistakes-first-time-home-buyers-make            301
/high-rise-culture-in-hyderabad/                         /blog/high-rise-culture-in-hyderabad                         301
/luxury-living-is-who-you-live-among/                    /blog/luxury-living-is-who-you-live-among                    301
/privacy-meets-grandeur-high-rise-living/                /blog/privacy-meets-grandeur-high-rise-living                301
/commercial-real-estate-smart-money-moving/             /blog/commercial-real-estate-smart-money-moving              301
/hydra-explained/                                        /blog/hydra-explained                                        301
/go-111-preserving-hyderabads-lakes-and-green-zones/     /blog/go-111-preserving-hyderabads-lakes-and-green-zones     301
/why-is-real-estate-the-most-profitable-industry/        /blog/why-is-real-estate-the-most-profitable-industry        301
/physical-vs-paper-buildings-homebuyers-guide/           /blog/physical-vs-paper-buildings-homebuyers-guide           301
/elevators-lifeline-hyderabads-high-rise-skyline/        /blog/elevators-lifeline-hyderabads-high-rise-skyline        301
/hyderabad-indias-next-silicon-valley/                   /blog/hyderabad-indias-next-silicon-valley                   301
/reaching-for-the-sky-sas-crown-south-indias-tallest-landmark/  /blog/reaching-for-the-sky-sas-crown-south-indias-tallest-landmark  301
/living-above-the-clouds-the-rise-of-hyderabads-skyscrapers/    /blog/living-above-the-clouds-the-rise-of-hyderabads-skyscrapers    301
/deep-foundations-importance-in-skyscrapers/             /blog/deep-foundations-importance-in-skyscrapers             301
/ready-to-move-in-property-meaning/                      /blog/ready-to-move-in-property-meaning                      301
/india-a-beacon-of-growth-amid-global-slowdowns/         /blog/india-a-beacon-of-growth-amid-global-slowdowns         301
/how-a-doctor-rewrote-the-rules-of-real-estate/          /blog/how-a-doctor-rewrote-the-rules-of-real-estate          301
```
*(`/blog/fire-noc-for-high-rise-buildings-meaning` is net-new in Sanity — no old
URL, no redirect.)*

---

## 2. Pages — verbatim meta move + justification

"Write to Sanity" = set `seo.metaTitle` / `seo.metaDescription` to the live value
verbatim. og column: import the live image to `seo.ogImage`, or keep fallback.

| Sanity doc | Old URL | New URL | metaTitle (verbatim from live) | metaDescription (verbatim from live) | Change & justification |
|---|---|---|---|---|---|
| `homePage` | `/` | `/` | Luxury Apartments & Office Spaces in Hyderabad \| SAS Infra | Discover ultra-luxury gated community residences and premium Grade-A commercial developments in Hyderabad with us, defined by high-rise living and corporate excellence—luxury apartments hyderabad, office space hyderabad. | **Overwrites** current brand-led Sanity copy with live keyword-led copy. Justify: preserve ranking page. URL unchanged. |
| `page-contact` | `/contact/` | `/contact` | Contact SAS Infra \| Office Details & Enquiries | Contact SAS Infra for project enquiries, partnerships, and support. Find office details and reach the team directly. | Verbatim. Trailing-slash normalize only. |
| `page-privacy` | `/privacy-policy/` | `/legal/privacy` | Privacy Policy \| SAS Infra | Learn how we collect, use, and safeguard your data—details are outlined in our privacy policy. | Verbatim text. URL changed (new IA) → 301. |
| `page-cookies` | `/cookie-policy/` | `/legal/cookies` | Cookie Policy \| SAS Infra | Understand how we use these tools to enhance site experience and performance—explained in our cookie policy. | Verbatim text. URL changed → 301. |
| `page-terms` | `/terms-conditions/` | `/legal/terms` | Terms & Conditions \| SAS Infra | Learn about the guidelines that govern your use of our website and related services in our terms & conditions. | Verbatim text. URL changed → 301. |
| `page-media` | `/media/` | `/media` | Media & Press Coverage \| SAS Infra | Browse SAS Infra media coverage: press features, interviews, and third-party coverage highlighting projects and milestones. | Verbatim. URL matches. |
| `page-careers` | `/sas-infra-careers/` | `/careers` | SAS Infra Careers\| Real Estate Jobs in Hyderabad | Explore SAS Infra careers across engineering, design, operations, sales, and management roles in Hyderabad. | Verbatim text (note live title's missing space before `\|`). URL changed → 301. |
| `updatesIndexPage` | `/project-updates/` | `/projects/updates` | Project Updates & Construction Progress \| SAS Infra | Stay informed with our project updates on construction milestones, ongoing progress, and new developments across our portfolio. | Verbatim text. URL changed → 301. |
| `blogIndexPage` | `/sas-infra-blog/` | `/blog` | SAS Infra Blog | Latest news, insights and updates on commercial real estate, projects and developments on the SAS Infra blog. | Verbatim text. URL changed → 301. |
| `page-about` | `/about-sas-infra-hyderabad/` | `/about` | About SAS Infra Hyderabad \| Real Estate Developer | A prominent brand in the city, we're known for delivering luxury residential apartments and premium commercial spaces - SAS Infra Hyderabad | **Corrected:** About DOES exist on live (`/about/` + `/about-sas-infra/` 301 to this canonical). Migrated verbatim. URL changed → 301. Real photo og:image (`WhatsApp-Image-…-3.37.26-PM`) left on fallback like other pages. |
| *(none)* | `/news-articles/` | → `/blog` | — | — | No new equivalent. 301 to /blog. Justify: news/blog merged into one feed. |

**OG for pages:** live home/contact/privacy/terms/media use the **generic logo**;
careers/cookies have **none**. Recommend the Option 2-lite bespoke cards
(`SEO_REVIEW.md §5`) rather than migrating the logo — flagged as an improvement,
not a verbatim move.

---

## 3. Projects — 5 live pages → 2 canonical (pick the strongest meta)

Crown/iTower currently have **no** `seo.metaTitle`/`metaDescription` in Sanity.
Fill them verbatim from the strongest live doorway page; 301 the rest.

### `project-sas-crown` → `/projects/sas-crown`  (canonical source: `/tallest-residential-tower-in-south-india/`)
- **seo.metaTitle**: `Luxury Apartments in Kokapet Hyderabad | SAS Infra`
- **seo.metaDescription**: `Own ultra-luxury 3 & 4 BHK residences in Kokapet—an iconic high-rise near the Financial District with elite amenities, crafted for refined living in Luxury Apartments in Kokapet Hyderabad.`
- **seo.ogImage**: import live `SAS-Crown-Clubhouse-1-1024x596.webp`
- 301 in: `/tallest-residential-tower-in-south-india/`, `/luxury-4-5-bhk-apartments-financial-district/`
- ⚠ **BHK conflict**: live says "3 & 4 BHK"; Sanity `unitConfiguration` = "4 BHK". Reconcile before writing (factual — Krishna).

### `project-sas-itower` → `/projects/sas-itower`  (canonical source: `/sas-itower-commercial-spaces-nanakramguda-khajaguda/`)
- **seo.metaTitle**: `Premium Commercial Spaces Nanakramguda Khajaguda | SAS Infra`
- **seo.metaDescription**: `Discover premium Commercial Spaces Nanakramguda Khajaguda with prime connectivity, modern infrastructure, and strong investment potential in Hyderabad's Financial District.`
- **seo.ogImage**: import live `Blog_Image-copy.jpg` (or the nicer `BANNER-4` from the office-spaces page)
- 301 in: all three commercial slugs (see §1)
- Justify: consolidated 3 keyword-doorway pages into one canonical page; meta from the best-performing variant; rest 301'd (removes keyword cannibalization).

---

## 4. Blog — already verbatim; mostly a URL move

Blog `metaTitle` + `metaDescription` in Sanity are **already byte-identical to
live** (Sanity was seeded from this WP content). So for blog the "as-is move" is
**almost entirely the 301s in §1** — no Sanity text writes needed. Two cleanups
worth noting (optional, still "as-is"):
- `luxury-living-is-who-you-live-among` & `how-a-doctor-rewrote-the-rules-of-real-estate`:
  live **og:title differs** from the page title, and `how-a-doctor` live meta-desc
  (206) ≠ og-desc (473). Sanity currently holds one variant each — leave as-is
  unless you want to mirror the live SERP/social split.
- **OG images**: blog already serves the featured image as OG via fallback
  (`blog/[slug].astro:62`), matching live behavior — no action needed.

---

## 5. Structured data — parity is CODE, not a data move (decide separately)

Live emits richer JSON-LD than the new build. Migrating this is frontend work in
`src/lib/jsonld.ts` + layout, not Sanity. Gap:

| Schema on live (every page) | New build today | To reach parity |
|---|---|---|
| `RealEstateAgent` + `Organization` + `Place`/`PostalAddress` | `Organization` + `WebSite` | Add a `RealEstateAgent`/`LocalBusiness` node (data already in `siteSettings`). |
| `WebSite` + `SearchAction` (sitelinks search box) | `WebSite` (no SearchAction) | Add `potentialAction` SearchAction. |
| `BreadcrumbList` per page | Breadcrumb on pages/projects only | Extend to blog posts. |
| `BlogPosting` / `Article` + `VideoObject` | per-project schema only | Add Article schema on blog posts; VideoObject where videos exist. |

**Recommendation:** treat as a fast-follow "schema parity" ticket. Justify the
interim delta: "structured-data parity tracked separately; core Organization +
per-project schema already present."

---

## 6. Open factual items (block the relevant writes)
1. **Crown BHK** — "3 & 4 BHK" (live) vs "4 BHK" (Sanity) vs "4-5" (a live slug). Pick one.
2. **Home/About voice** — confirm overwriting home with live keyword-led copy is desired (About has no live source — stays original).
3. **OG cards** — bespoke (Option 2-lite) vs migrating the live logo/featured images.

---

## 7. Execution order (once approved)
1. **Sanity meta writes** (`sanity exec` patch scripts, published docs):
   `patch-seo-migrate-pages.mjs` (home + 8 pages verbatim), `patch-seo-migrate-projects.mjs`
   (Crown/iTower seo + BHK), + OG-image upload/import script.
2. **Redirects**: add the §1 block to `repos/frontend/public/_redirects`; deploy.
3. **Verify**: re-run the live extractor against the *new* deploy; curl a sample
   of old URLs → expect `301` to the new path; confirm new pages emit the
   migrated `<title>`/`<meta description>`/`og:image`.
4. **Schema parity** (§5) — separate ticket.
5. Submit the new `sitemap.xml` in Search Console; keep old sitemap until 301s are
   crawled.

> This manifest = the justification doc. Every page is "migrated verbatim" or
> carries a one-line reason for the change (URL IA, consolidation, net-new, or
> cleanup).
