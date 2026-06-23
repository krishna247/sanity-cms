# SEO Review — proposed Sanity copy (sign off before write)

Status: **DRAFT for Krishna's review.** Nothing has been written to Sanity yet.
Once you approve / edit the "Proposed" columns, I run the patch scripts.

Rules applied: `metaTitle` ≤ 60 chars, `metaDescription` ≤ 160 chars (Sanity
warns above these). Char counts below are approximate; the patch scripts assert
the real lengths before `.commit()`. Legend: ✅ = already fine, no change.

Live audit source: project `ajw4irs3` / dataset `production` (published).

---

## 1. Pages & singletons

Only rows that need a change are shown. **Fine as-is (no change):** `page-careers`,
`page-contact`, `page-media`, `page-cookies`, `page-privacy`, `page-terms`,
`blogIndexPage` — all within both limits.

| Doc | Field | Current (len) | Proposed (len) |
|---|---|---|---|
| `homePage` | metaDescription | "SAS Infra is a Hyderabad-based developer behind South India's tallest residential tower (SAS Crown), Hyderabad's tallest commercial tower (SAS iTower), and a premium retail destination." (185) | "SAS Infra is the Hyderabad developer behind SAS Crown, South India's tallest residential tower, and SAS iTower, the city's tallest commercial tower." (~147) |
| `homePage` | metaTitle | "SAS Infra — Creating Landmarks That Define Hyderabad" (52) | ✅ keep |
| `page-about` | metaTitle | "About SAS Infra — Twenty-five years building Hyderabad's landmarks" (66) | "About SAS Infra — 25 Years Building Hyderabad's Landmarks" (~57) |
| `page-about` | metaDescription | "Founded in 2000 by Dr. G.V. Rao, SAS Infra builds South India's tallest residential tower (SAS Crown), Hyderabad's tallest commercial tower (SAS iTower), and a premium retail destination (The Address)." (201) | "Founded in 2000 by Dr. G.V. Rao, SAS Infra builds Hyderabad's landmark towers — SAS Crown, SAS iTower, and the premium retail destination The Address." (~150) |
| `updatesIndexPage` | metaTitle | "Project Updates — SAS Crown & SAS iTower construction progress" (62) | "Project Updates — SAS Crown & SAS iTower Progress" (~49) |
| `updatesIndexPage` | metaDescription | (117) | ✅ keep |

---

## 2. Projects (currently have NO `seo.metaTitle` / `seo.metaDescription`)

These fall back to `title` + the long structured-data `seoDescription`. Adding a
purpose-built SERP title + description. `seoDescription` (the JSON-LD blurb)
stays unchanged.

### `project-sas-crown`
- **seo.metaTitle** (new): `SAS Crown — South India's Tallest Residential Tower` (~53)
- **seo.metaDescription** (new): `Ultra-luxury 4 BHK apartments in Kokapet, Hyderabad — 236m, G+57, designed by Aedas across 4.5 acres. South India's tallest residential tower.` (~140)
- **priceRange**: ⚠️ **NEEDS REAL VALUE from Krishna** (e.g. "₹8 Cr onwards" or a range). Will leave unset otherwise — not guessing.
- seoDescription / floors (58) / RERA (P02400002786) / unitConfig (4 BHK) / geo / locality (Kokapet): ✅ keep

### `project-sas-itower`
- **seo.metaTitle** (new): `SAS iTower — Hyderabad's Tallest Commercial Tower` (~49)
- **seo.metaDescription** (new): `Premium Grade-A offices in Nanakramguda — 171m, G+37, 1.2 lakh sq ft floor plates, LEED Gold + WELL Silver target, designed by Aedas.` (~135)
- **priceRange**: optional (commercial). Supply a per-sq-ft figure if you want it in the JSON-LD; otherwise leave unset.
- seoDescription / floors (38) / RERA (P02400000878) / geo / locality (Nanakramguda): ✅ keep

---

## 3. Blog posts — `metaDescription` trim (REQUIRED)

Today every post's `metaDescription` is a **verbatim copy of its `excerpt`**,
so 30 of 31 overflow 160 (up to 486). Below are distilled ≤160 descriptions.
`excerpt` and body copy are **not** touched (out of scope). One post is already
fine: `post-commercial-real-estate-smart-money-moving` (155) — ✅ no change.

| Doc | Proposed metaDescription (≤160) |
|---|---|
| `post-2025-investment-styles-affluent-luxury-real-estate-trends` | How high-net-worth buyers are reshaping 2025 portfolios through branded residences, high-rise luxury, and location-driven real estate investments. |
| `post-common-mistakes-first-time-home-buyers-make` | The costly errors first-time home buyers make — from underestimating total costs to skipping legal due diligence — and how to avoid them. |
| `post-deep-foundations-importance-in-skyscrapers` | Why deep foundations are critical to skyscrapers: how they ensure structural stability, distribute load, and let iconic towers rise safely. |
| `post-eco-friendly-homes-explained` | How sustainable design, energy-efficient systems, and green materials make eco-friendly homes healthier, cheaper to run, and a smarter investment. |
| `post-elevators-lifeline-hyderabads-high-rise-skyline` | How high-speed lifts, smart destination control, and safety engineering keep Hyderabad's high-rise towers moving — the lifeline of the skyline. |
| `post-fsi-high-rise-buildings-heritage-projects-guide` | How floor space index (FSI) rules, vertical development, and heritage limits shape smart real estate investment decisions in high-rise projects. |
| `post-fire-noc-for-high-rise-buildings-meaning` | What a Fire NOC means for high-rise buildings: why it's essential, what it certifies, and how it ensures fire-safety compliance in tall towers. |
| `post-five-misconceptions-about-hyderabads-luxury-real-estate` | Five myths about Hyderabad's luxury real estate — on pricing, demand, and returns — and the realities behind its premium high-rise market. |
| `post-guide-to-finding-the-right-investment-opportunity` | A practical guide to choosing the right investment: weighing location, market demand, risk, legal clarity, and long-term return potential. |
| `post-hyderabad-indias-next-silicon-valley` | How Hyderabad's IT boom, global tech giants, infrastructure, and startup culture are making it India's next Silicon Valley and a top property market. |
| `post-hyderabad-ongoing-real-estate-trends` | Hyderabad's real estate trends: IT-driven expansion, infrastructure upgrades, premium high-rises, and rising investor confidence across micro-markets. |
| `post-hyderabad-rising-as-indias-high-rise-capital` | How IT growth, premium housing demand, and major infrastructure are making Hyderabad India's high-rise capital and reshaping its skyline. |
| `post-impact-of-virtual-tours-on-home-buying` | How virtual tours transformed home buying — immersive 3D walkthroughs and real-time interaction make property search faster and location-independent. |
| `post-india-a-beacon-of-growth-amid-global-slowdowns` | How India stays resilient amid global slowdowns — infrastructure, digital transformation, and strong domestic demand drive its standout growth. |
| `post-kokapet-real-estate-growth` | How Kokapet became Hyderabad's premium destination: luxury high-rises, ORR connectivity, and proximity to the Financial District and IT hubs. |
| `post-living-above-the-clouds-the-rise-of-hyderabads-skyscrapers` | The rise of Hyderabad's skyscrapers: the engineering and vision driving vertical growth, and how luxury high-rise living is redefining the city. |
| `post-luxury-living-is-who-you-live-among` | True luxury living isn't about possessions — it's the community, environment, and people you live among. Why belonging defines premium living. |
| `post-physical-vs-paper-buildings-homebuyers-guide` | Physical vs paper buildings: how construction status, legal clearances, and delivery timelines help buyers invest in ready, secure homes. |
| `post-reaching-for-the-sky-sas-crown-south-indias-tallest-landmark` | The story of SAS Crown — South India's tallest residential tower — rising 60 storeys with one residence per floor through precision engineering. |
| `post-ready-to-move-in-property-meaning` | What a ready-to-move-in property means: its benefits, legal clarity, tax advantages, and why buyers prefer immediate possession with less risk. |
| `post-remote-work-evolution-home-buying-preferences` | How remote work reshaped home buying — buyers now prioritise larger homes, dedicated workspaces, connectivity, and lifestyle-driven locations. |
| `post-how-a-doctor-rewrote-the-rules-of-real-estate` | How Dr. G.V. Rao left a secure career to found SAS Infra and build SAS Crown, South India's tallest residential tower, reshaping Hyderabad's skyline. |
| `post-what-will-real-estate-look-like-in-five-years` | How technology, sustainability, and urban growth will reshape real estate over five years — smart homes, green buildings, and digital transactions. |
| `post-why-is-real-estate-the-most-profitable-industry` | Why real estate is among the most profitable industries: capital appreciation, rental income, leverage, and tangible asset security. |
| `post-go-111-preserving-hyderabads-lakes-and-green-zones` | How GO 111 protects Hyderabad's lakes and green zones by restricting construction in catchment areas — safeguarding ecology and groundwater. |
| `post-high-rise-culture-in-hyderabad` | How Hyderabad's shift to vertical living — luxury skyscrapers, panoramic views, and IT-corridor growth — is reshaping the city's skyline. |
| `post-hydra-explained` | HYDRA explained: its purpose, regulatory framework, and how it shapes urban planning, infrastructure control, and property compliance in Hyderabad. |
| `post-maintaining-your-apartment-after-construction` | How to maintain your apartment after construction — plumbing, electrical, waterproofing, and routine checks that protect comfort and resale value. |
| `post-privacy-meets-grandeur-high-rise-living` | How high-rise residences blend privacy and grandeur — limited homes per floor, panoramic views, and premium amenities that redefine urban luxury. |
| `post-residential-vs-commercial-real-estate` | Residential vs commercial real estate: how rental yields, risk, appreciation, and management differ — and how to pick the right asset class. |

---

## 4. Blog posts — `metaTitle` (2 REQUIRED, rest OPTIONAL polish)

**Required (>60 chars → triggers warning):**

| Doc | Current (len) | Proposed (≤60) |
|---|---|---|
| `post-reaching-for-the-sky-sas-crown-south-indias-tallest-landmark` | "Reaching for the Sky: How SAS Crown Became South India's Tallest Landmark" (73) | "Reaching for the Sky: SAS Crown, South India's Tallest Tower" (~60) |
| `post-commercial-real-estate-smart-money-moving` | "Why Smart Money is Quietly Moving into Commercial Real Estate" (61) | "Why Smart Money Is Moving Into Commercial Real Estate" (~54) |

**Optional polish** — several titles are lowercase / slug-style. Opt in per row
(or "all" / "none"). These are cosmetic; descriptions above are the real fix.

| Doc | Current | Suggested |
|---|---|---|
| `post-go-111-preserving-hyderabads-lakes-and-green-zones` | "go 111 preserving hyderabads lakes and green zones" | "GO 111: Preserving Hyderabad's Lakes & Green Zones" |
| `post-high-rise-culture-in-hyderabad` | "high rise culture in hyderabad" | "High-Rise Culture in Hyderabad" |
| `post-hydra-explained` | "hydra explained" | "HYDRA Explained: What It Means for Hyderabad Property" |
| `post-maintaining-your-apartment-after-construction` | "maintaining your apartment after construction" | "Maintaining Your Apartment After Construction" |
| `post-privacy-meets-grandeur-high-rise-living` | "privacy meets grandeur high rise living" | "Privacy Meets Grandeur: High-Rise Living" |
| `post-residential-vs-commercial-real-estate` | "residential vs commercial real estate" | "Residential vs Commercial Real Estate" |
| `post-kokapet-real-estate-growth` | "Kokapet real estate growth" | "Kokapet Real Estate Growth" |
| `post-india-a-beacon-of-growth-amid-global-slowdowns` | "India a beacon of growth" | "India: A Beacon of Growth Amid Global Slowdowns" |
| `post-2025-investment-styles-affluent-luxury-real-estate-trends` | "2025 investment styles affluent luxury real estate trends" | "2025 Luxury Real Estate Investment Trends" |
| `post-fsi-high-rise-buildings-heritage-projects-guide` | "FSI high-rise heritage real estate investment guide" | "FSI & High-Rise Heritage: A Real Estate Investment Guide" |

---

## 5. OG images — Option 2-lite (5 bespoke 1200×630 cards)

Only the pages that currently fall to the generic `/og/og-default.png` get a
card. **Blog posts** (featured photo) and **projects** (hero render) keep their
existing photo fallbacks — no change. **Legal pages** stay on the generic default.

Production method: render an HTML card template at 1200×630 (reusing
`repos/frontend/brand/` marks + skyline imagery from `public/images/`), screenshot,
then upload to Sanity and set `seo.ogImage.image` + `seo.ogImage.alt`.

| Doc | Card headline | Suggested art | Alt text |
|---|---|---|---|
| `homePage` | "Creating landmarks that define Hyderabad" | SAS wordmark over Crown/iTower skyline render | "SAS Infra — creating landmarks that define Hyderabad." |
| `page-about` | "25 years building Hyderabad's landmarks" | skyline / chairman portrait tint | "About SAS Infra — twenty-five years building Hyderabad's landmarks." |
| `page-contact` | "Talk to SAS Infra" | Financial District office imagery | "Contact SAS Infra — Hyderabad office, sales and enquiries." |
| `page-careers` | "Build what Hyderabad is known for" | site / team imagery | "Careers at SAS Infra — build what Hyderabad is known for." |
| `page-media` | "Media & press" | press/logo wall | "SAS Infra media and press coverage." |

---

## 6. Open items needing Krishna's input
1. **Crown `priceRange`** — real figure/range (required to fill; else left unset).
2. **iTower `priceRange`** — optional commercial figure (else left unset).
3. **OG card art direction** — confirm the 5 headlines + which hero images to use.
4. **Optional blog title polish (§4)** — apply all / none / per-row.

## 7. Out of scope (confirmed correct as-is)
`projectUpdate`, `pressItem`, `jobPosting` — no `seo` object, no standalone
routes (render inside index pages). `siteSettings` JSON-LD already seeded.
`noIndex` left false everywhere. The dynamic OG generator (Option 3) deferred.
