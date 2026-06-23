# SEO Review — LIVE sasinfra.com baseline (companion to SEO_REVIEW.md)

**What this is:** the *actual currently-indexed* on-page SEO of the live
`sasinfra.com`, captured from the production site so we can decide what to
migrate/preserve into Sanity. `SEO_REVIEW.md` holds my *drafted* copy; this file
holds the *live* copy. Nothing here is written to Sanity.

**Provenance:** live site is **WordPress + Rank Math SEO** (Hostinger/LiteSpeed)
— a completely different stack from the new Astro+Sanity build. Enumerated via
`sitemap_index.xml` (post / page / category / local sitemaps); fetched with 3
parallel subagents through `/tmp/seo_fetch.py` (curl + tag extraction). 48 HTML
URLs, all HTTP 200 except one 404 (noted). Captured 2026-06-01.

**Headline takeaways** (detail in §4):
1. The Sanity blog content was clearly **seeded from this WP site** — blog meta
   descriptions are byte-identical to the live ones, so they carry the **same
   ≤160 overflow**. ⇒ For blog, my drafted ≤160 copy in `SEO_REVIEW.md` beats
   the live values. **Migrating live→Sanity would not fix blog overflow.**
2. The live **page-level** descriptions (contact/privacy/cookies/terms/media/
   careers/news/updates) ARE hand-tuned and within limits — better than guesses.
3. The live site runs **5 keyword-targeted project landing pages** (2 residential
   + 3 commercial "doorway" pages) vs the new build's 1-per-project. Their tuned
   titles/descriptions are worth harvesting for Crown/iTower SEO.
4. Live structured data is **much richer**: every page emits `RealEstateAgent` +
   `Organization` + `Place`/`PostalAddress` + `WebSite`; home adds a
   `SearchAction` (sitelinks search box); posts add `BlogPosting`. The new build
   only emits Organization/WebSite + per-project schema.
5. Unit-config conflict: live Crown pages say **"3 & 4 BHK"**; Sanity says **"4 BHK"**;
   one live slug says "4-5 BHK". Needs a single source of truth.

---

## 1. Pages & singletons — live vs Sanity doc

Robots on every live page = `follow, index, max-snippet:-1, max-image-preview:large`
(indexable). "og:img" column: ✅ real image · �﹕generic logo · ✗ none.

| Sanity doc | Live URL | Live title (len) | Live meta description (len) | og:img |
|---|---|---|---|---|
| `homePage` | `/` | Luxury Apartments & Office Spaces in Hyderabad \| SAS Infra (58) | Discover ultra-luxury gated community residences and premium Grade-A commercial developments in Hyderabad with us… —luxury apartments hyderabad, office space hyderabad. (220 ⚠) | �﹕logo |
| `page-contact` | `/contact/` | Contact SAS Infra \| Office Details & Enquiries (46) | Contact SAS Infra for project enquiries, partnerships, and support. Find office details and reach the team directly. (116) | �﹕logo |
| `page-privacy` | `/privacy-policy/` | Privacy Policy \| SAS Infra (26) | Learn how we collect, use, and safeguard your data—details are outlined in our privacy policy. (94) | �﹕logo |
| `page-cookies` | `/cookie-policy/` | Cookie Policy \| SAS Infra (25) | Understand how we use these tools to enhance site experience and performance—explained in our cookie policy. (108) | ✗ |
| `page-terms` | `/terms-conditions/` | Terms & Conditions \| SAS Infra (30) | Learn about the guidelines that govern your use of our website and related services in our terms & conditions. (110) | �﹕logo |
| `page-media` | `/media/` | Media & Press Coverage \| SAS Infra (34) | Browse SAS Infra media coverage: press features, interviews, and third-party coverage highlighting projects and milestones. (123) | �﹕logo |
| `page-careers` | `/sas-infra-careers/` | SAS Infra Careers\| Real Estate Jobs in Hyderabad (48) | Explore SAS Infra careers across engineering, design, operations, sales, and management roles in Hyderabad. (107) | ✗ |
| `updatesIndexPage` | `/project-updates/` | Project Updates & Construction Progress \| SAS Infra (51) | Stay informed with our project updates on construction milestones, ongoing progress, and new developments across our portfolio. (127) | ✅ ChatGPT-Image…png |
| `blogIndexPage` | `/sas-infra-blog/` | SAS Infra Blog (14) | Latest news, insights and updates on commercial real estate, projects and developments on the SAS Infra blog. (109) | ✗ |
| *(no Sanity doc)* | `/news-articles/` | Hyderabad Real Estate News \| SAS Infra (38) | Explore the latest Hyderabad real estate news, market trends, and premium property insights shared by our experts. (114) | �﹕logo |
| *(no Sanity doc)* | `/category/news-articles/` | News Articles \| SAS Infra (25) | *(none)* | ✗ |
| *(no Sanity doc)* | `/category/blogs/` | Blogs \| SAS Infra (17) | *(none)* | ✗ |

Notes: `/news-articles/` is a second press/news index distinct from `/media/` —
the new build has no equivalent (press renders inside `/media`). Category
archives have no Sanity equivalent (categories exist as docs, no archive route).

---

## 2. Project landing pages — live runs 5 → new build has 2

The WP site uses multiple keyword-doorway pages per project. All `og:type=article`,
schema includes `Article` + `VideoObject` + `RealEstateAgent`.

### → maps to `project-sas-crown` (residential, Kokapet)
| Live URL | Title (len) | Description (len) | Unit claim | og:img |
|---|---|---|---|---|
| `/tallest-residential-tower-in-south-india/` | Luxury Apartments in Kokapet Hyderabad \| SAS Infra (50) | Own ultra-luxury **3 & 4 BHK** residences in Kokapet—an iconic high-rise near the Financial District… (188 ⚠) | 3 & 4 BHK | ✅ SAS-Crown-Clubhouse |
| `/luxury-4-5-bhk-apartments-financial-district/` | Gated Community Luxury Apartments in Hyderabad \| SAS Infra (58) | Explore premium **3 & 4 BHK** residences with world-class amenities, clubhouse living… (160) | slug says 4-5, body 3 & 4 | ✗ |

### → maps to `project-sas-itower` (commercial, Nanakramguda)
| Live URL | Title (len) | Description (len) | og:img |
|---|---|---|---|
| `/sas-itower-commercial-spaces-nanakramguda-khajaguda/` | Premium Commercial Spaces Nanakramguda Khajaguda \| SAS Infra (60) | Discover premium Commercial Spaces Nanakramguda Khajaguda with prime connectivity… (172 ⚠) | ✅ Blog_Image-copy.jpg |
| `/commercial-spaces-nanakramguda-khajaguda/` | Premium Commercial Office Spaces in Hyderabad \| SAS Infra (57) | Discover landmark business destinations with prime connectivity… (200 ⚠) | ✗ |
| `/sas-itower-office-spaces-hyderabad/` | Premium Office Spaces Hyderabad \| Grade A Commercial Spaces for Business Growth (79 ⚠) | Explore premium office spaces Hyderabad offers, featuring Grade A infrastructure… (200 ⚠) | ✅ BANNER-4 |

---

## 3. Blog posts — live values

**Critical:** every live blog `meta description` is the **verbatim post excerpt**
(same text now in Sanity), so 28/30 overflow ≤160 exactly as in `SEO_REVIEW.md`.
⇒ Use my distilled ≤160 descriptions from `SEO_REVIEW.md §3` for Sanity, **not**
these. Live `title` and `og:image` are the genuinely useful columns here.

Mapping: 30 posts are 1:1 (live ↔ Sanity, slug = `post-<live-slug>`). Exceptions:
- **`fire-noc-for-high-rise-buildings-meaning`** — Sanity-only, **no live page**.
- **`challenges-in-large-scale-construction`** — in live sitemap but **HTTP 404**
  (`robots: noindex`), no Sanity doc. Dead URL; exclude / set up a redirect.

| Sanity `post-…` | Live title (len) | Live desc len | Live og:image (filename) |
|---|---|---|---|
| fsi-high-rise-buildings-heritage-projects-guide | FSI high-rise heritage real estate investment guide (63 ⚠) | 275 ⚠ | BLOG-NEW-5.webp |
| 2025-investment-styles-affluent-luxury-real-estate-trends | 2025 investment styles affluent luxury real estate trends (69 ⚠) | 486 ⚠ | WhatsApp-Image…webp |
| remote-work-evolution-home-buying-preferences | Remote Work and the Evolution of Home Buying Preferences (68 ⚠) | 373 ⚠ | Blog_Image-scaled-1.webp |
| impact-of-virtual-tours-on-home-buying | Impact of Virtual Tours on Home Buying (50) | 417 ⚠ | Picture2.webp |
| hyderabad-rising-as-indias-high-rise-capital | Hyderabad: Rising as India's High Rise Capital (58) | 400 ⚠ | Do-you-know…hub.webp |
| hyderabad-ongoing-real-estate-trends | Hyderabad's Ongoing Real Estate Trends (50) | 377 ⚠ | Picture11213.webp · **301→ `/hyderabads-ongoing-real-estate-trends/`** |
| kokapet-real-estate-growth | Kokapet real estate growth (38, lc) | 374 ⚠ | Unveiling-Kokapets…webp |
| what-will-real-estate-look-like-in-five-years | What Will Real Estate Look Like in Five Years (57) | 396 ⚠ | blog-5.webp |
| five-misconceptions-about-hyderabads-luxury-real-estate | Five Misconceptions About Hyderabad's Luxury Real Estate (68 ⚠) | 403 ⚠ | BLOG-29.webp |
| maintaining-your-apartment-after-construction | maintaining your apartment after construction (57, lc) | 339 ⚠ | BLOG-NEW-3.webp |
| eco-friendly-homes-explained | Eco Friendly Homes Explained (40) | 415 ⚠ | blog-3.webp |
| residential-vs-commercial-real-estate | residential vs commercial real estate (49, lc) | 385 ⚠ | BLOG-NEW-4.webp |
| guide-to-finding-the-right-investment-opportunity | Guide to Finding the Right Investment Opportunity (61 ⚠) | 457 ⚠ | blog-28-1.webp |
| common-mistakes-first-time-home-buyers-make | Common Mistakes First Time Home Buyers Make (55) | 403 ⚠ | blog-4.webp |
| high-rise-culture-in-hyderabad | high rise culture in hyderabad (42, lc) | 392 ⚠ | High-Rise-Apartment-Culture…webp |
| luxury-living-is-who-you-live-among | Luxury Living Is Not What You Own — It's Who You Live Among (59) ⚠ **og:title differs** | 228 ⚠ | Blog_Image-3…png |
| privacy-meets-grandeur-high-rise-living | privacy meets grandeur high rise living (51, lc) | 366 ⚠ | Do-you-know…hub-1.webp |
| commercial-real-estate-smart-money-moving | Why Smart Money is Quietly Moving into Commercial Real Estate (73 ⚠) | **155 ✅** | Blog_Image-copy-2.jpg |
| hydra-explained | hydra explained (27, lc) | 292 ⚠ | blog-12-1…webp |
| go-111-preserving-hyderabads-lakes-and-green-zones | go 111 preserving hyderabads lakes and green zones (62 ⚠, lc) | 374 ⚠ | GO-111-Protecting.webp |
| why-is-real-estate-the-most-profitable-industry | Why is Real Estate the Most Profitable Industry (59) | 434 ⚠ | Why-is-Real-Estate…webp |
| physical-vs-paper-buildings-homebuyers-guide | Physical vs Paper Buildings: A Homebuyer's Guide (60) | 372 ⚠ | blog1.webp |
| elevators-lifeline-hyderabads-high-rise-skyline | Elevators: The Lifeline of Hyderabad's High-Rise Skyline (68 ⚠) | 440 ⚠ | blog4-1.webp |
| hyderabad-indias-next-silicon-valley | Hyderabad - India's Next Silicon Valley (51) | 397 ⚠ | Hyderabad-Indias-New-Silicon-Valley.webp |
| reaching-for-the-sky-sas-crown-south-indias-tallest-landmark | Reaching for the Sky: How SAS Crown Became South India's Tallest Landmark (85 ⚠) | 412 ⚠ | article.webp |
| living-above-the-clouds-the-rise-of-hyderabads-skyscrapers | Living Above the Clouds: The Rise of Hyderabad's Skyscrapers (72 ⚠) | 344 ⚠ | blog10-1.webp |
| deep-foundations-importance-in-skyscrapers | Deep Foundations' Importance in Skyscrapers (55) | 339 ⚠ | BLOG-NEW-6.webp |
| ready-to-move-in-property-meaning | Ready to Move in Property Explained (47) | 259 ⚠ | blog9-1.webp |
| india-a-beacon-of-growth-amid-global-slowdowns | India a beacon of growth (36, lc) | 420 ⚠ | BLOG-NEW-2.webp |
| how-a-doctor-rewrote-the-rules-of-real-estate | How a Doctor Rewrote the Rules of Real Estate (57) ⚠ **og:title differs** | **206** (meta) / 473 (og) | article.webp |

`⚠`=over limit, `lc`=lowercase/slug-style title, `✅`=within limit.

---

## 4. Key findings & discrepancies
1. **Blog overflow is shared, not new.** Live meta descriptions == Sanity excerpts.
   28/30 overflow. The only concise live one is `commercial-real-estate-smart-money`
   (155). ⇒ blog descriptions: use `SEO_REVIEW.md §3`, not live.
2. **404 in sitemap:** `/challenges-in-large-scale-construction/` (noindex 404).
   Clean it from the sitemap or 301 it.
3. **Self-redirect:** `/hyderabad-ongoing-real-estate-trends/` 301→
   `/hyderabads-ongoing-real-estate-trends/` (canonical has the apostrophe-s).
   Slug drift — pick the canonical when setting up new-build redirects.
4. **og:title ≠ SEO title** on `luxury-living…` and `how-a-doctor…`. On
   `how-a-doctor` the live meta description (206) was hand-shortened while og:desc
   kept the 473-char original — a deliberate SERP-vs-social split.
5. **Unit config conflict:** live Crown = "3 & 4 BHK"; one live slug says "4-5 BHK";
   Sanity = "4 BHK". **Decide the real config** (affects `unitConfiguration` +
   the residence JSON-LD + §2 of `SEO_REVIEW.md`).
6. **Multiple landing pages → one canonical.** 5 live project pages collapse to 2
   Sanity projects. If SEO equity matters, plan **301s** from the retired doorway
   slugs to `/sas-crown` and `/sas-itower`.
7. **Missing og:image** on several live pages (careers, cookies, blog index,
   commercial-spaces, luxury-4-5-bhk, categories) — same social-card gap the new
   build has; reinforces the Option 2-lite OG-card plan.
8. **Richer schema on live** (`RealEstateAgent`, `SearchAction` sitelinks box,
   per-page `BreadcrumbList`). Candidate enhancements for the new build's
   `src/lib/jsonld.ts` — out of scope for this Sanity pass, worth a follow-up.

---

## 5. Recommended source-of-truth (per field)
- **Blog `metaTitle`** → take the live Title-Case titles where they're better than
  Sanity's lowercase ones (covers most of `SEO_REVIEW.md §4` optional list for
  free), but trim the ~10 that exceed 60 (live has many >60). 
- **Blog `metaDescription`** → **my drafted ≤160 set** (`SEO_REVIEW.md §3`). Live
  overflows.
- **Page descriptions** (contact/privacy/cookies/terms/media/careers/updates) →
  **live values are good and within limits** — prefer them over my drafts where
  they read better; both are valid.
- **Home/About titles+desc** → compare live ("Luxury Apartments & Office Spaces…")
  vs brand-led Sanity ("SAS Infra — Creating Landmarks…"). **Krishna's call**:
  keyword-led (live, ranks) vs brand-led (new design voice).
- **Project titles/desc** → harvest the live keyword-tuned copy (Kokapet / Grade-A
  Office) into Crown/iTower `seo.metaTitle`+`metaDescription`, reconciling BHK.
- **OG images** → the live featured-image URLs (✅ rows) could be imported to
  Sanity as `seo.ogImage` for posts/projects instead of relying on fallback.

> ⏭ Next decision for Krishna: for **Home/About and project pages**, do we keep
> the live SEO-tuned (keyword-led) copy, or the new brand-led copy? That choice
> drives whether `SEO_REVIEW.md` or this file becomes the write source per row.
