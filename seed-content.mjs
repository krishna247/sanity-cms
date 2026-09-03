// HISTORICAL SEED — predates the 2026-09-03 schema trim (partner discipline/country,
// projectUpdate body/pdf, updatesIndexPage, plateAnatomy/consultants/brochure blocks
// no longer exist). Do NOT run against production; kept for reference only.
// One-off content population for the v2.6 content architecture.
// Source of truth: repos/frontend (page copy from git history d4bd117~1, assets
// from repos/frontend/public). Idempotent: dedupes asset uploads by
// originalFilename and uses createOrReplace / patch.set so re-runs are safe.
//
//   SANITY_MCP_TOKEN=<token> node seed-content.mjs
//
import { createClient } from '@sanity/client'
import { readFileSync, existsSync } from 'node:fs'
import { basename, extname } from 'node:path'

const token = process.env.SANITY_MCP_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!token) throw new Error('Set SANITY_MCP_TOKEN')

const client = createClient({
  projectId: 'ajw4irs3',
  dataset: 'production',
  apiVersion: '2026-05-31',
  token,
  useCdn: false,
})

const PUBLIC = '/Users/krishna/sasinfra/repos/frontend/public'
const CROWN = 'aa5e687c-43db-4b4c-8b2c-9e685a02d459'
const ITOWER = 'd25b2baa-cb72-44f8-b687-adad7ebda338'

// ── key + asset helpers ──────────────────────────────────────────
let _k = 0
const uid = () => `k${++_k}`

const CT = { svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', mp4: 'video/mp4', pdf: 'application/pdf' }
const assetCache = new Map()

async function uploadAsset(relPath, kind /* 'image' | 'file' */) {
  const fname = basename(relPath)
  if (assetCache.has(fname)) return assetCache.get(fname)
  const type = kind === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset'
  const existing = await client.fetch('*[_type==$t && originalFilename==$f][0]._id', { t: type, f: fname })
  if (existing) { assetCache.set(fname, existing); return existing }
  const abs = `${PUBLIC}${relPath}`
  if (!existsSync(abs)) { console.warn('  ! missing asset', relPath); assetCache.set(fname, null); return null }
  const ext = extname(fname).slice(1).toLowerCase()
  const res = await client.assets.upload(kind, readFileSync(abs), { filename: fname, contentType: CT[ext] })
  console.log('  ↑ uploaded', fname, '->', res._id)
  assetCache.set(fname, res._id)
  return res._id
}

async function IMG(relPath, alt, caption) {
  const id = await uploadAsset(`/images/${relPath}`, 'image')
  if (!id) return undefined
  return { _type: 'imageWithAlt', image: { _type: 'image', asset: { _type: 'reference', _ref: id } }, alt, ...(caption ? { caption } : {}) }
}
async function VIDEO(relPath) {
  const id = await uploadAsset(`/${relPath}`, 'file')
  return id ? { _type: 'file', asset: { _type: 'reference', _ref: id } } : undefined
}
async function fileByName(name) {
  const id = await client.fetch('*[_type=="sanity.fileAsset" && originalFilename==$n][0]._id', { n: name })
  if (!id) console.warn('  ! file asset not found:', name)
  return id
}
const fileRef = (id) => (id ? { _type: 'file', asset: { _type: 'reference', _ref: id } } : undefined)

// ── portable text ────────────────────────────────────────────────
const span = (t) => ({ _type: 'span', _key: uid(), text: t, marks: [] })
const para = (t, style = 'normal') => ({ _type: 'block', _key: uid(), style, markDefs: [], children: [span(t)] })
const ptBody = (items) => items.map((it) => (typeof it === 'string' ? para(it) : para(it.text, it.style)))

// ── links (exactly one target enforced by schema) ───────────────
const ref = (id) => ({ _type: 'reference', _ref: id })
const lInternal = (label, id, variant = 'primary') => ({ _type: 'link', _key: uid(), label, kind: 'internal', reference: ref(id), variant })
const lAnchor = (label, id, anchorId, variant = 'primary') => ({ _type: 'link', _key: uid(), label, kind: 'anchor', reference: ref(id), anchorId, variant })
const lExternal = (label, href, variant = 'primary') => ({ _type: 'link', _key: uid(), label, kind: 'external', href, variant })
const lEmail = (label, email, variant = 'primary') => ({ _type: 'link', _key: uid(), label, kind: 'email', email, variant })
const lFile = (label, fid, variant = 'secondary') => ({ _type: 'link', _key: uid(), label, kind: 'file', file: fileRef(fid), variant })

const seo = (metaTitle, metaDescription) => ({ metaTitle, metaDescription })
const head = (eyebrow, heading, dek) => ({ ...(eyebrow ? { eyebrow } : {}), ...(heading ? { heading } : {}), ...(dek ? { dek } : {}) })

// block factories (every page-builder member needs _type + _key)
const B = (_type, props) => ({ _type, _key: uid(), ...props })

async function main() {
  const docs = []
  const push = (d) => docs.push(d)

  // ════════════ LIBRARY: people ════════════
  const chairImg = await IMG('chairman-gv-rao.webp', 'Dr. G.V. Rao, Founder and Chairman of SAS Infra, seated in a modern office lounge.')
  push({
    _id: 'person-gv-rao', _type: 'person', name: 'Dr. G.V. Rao',
    slug: { _type: 'slug', current: 'dr-gv-rao' }, roles: ['founder', 'leadership'], jobTitle: 'Chairman',
    bio: 'Founder of SAS Infra (2000). An industry outsider — with a background in veterinary science and organic farming — who built the company from the ground up by assembling professional talent and partnering with global architecture and engineering firms.',
    ...(chairImg ? { image: chairImg } : {}),
  })
  const directors = [
    ['person-yadagiri-rao', 'Mr. G. Yadagiri Rao', 'Director · Logistics & Site Operations', 'Oversees construction logistics, site coordination, and material procurement across all active projects.'],
    ['person-vamsi-vadlamudi', 'Mr. Vamsi Krishna Vadlamudi', 'Director · Projects & Engineering', 'Leads engineering design, structural execution, and contractor coordination from foundation to handover.'],
    ['person-parikshith', 'Mr. Parikshith', 'Director · Sales & Marketing', 'Drives brand strategy, digital presence, and lead generation across all SAS Infra business units.'],
    ['person-jayasurya', 'Dr. Jayasurya', 'Director · Sales & Marketing', 'Manages channel partner relationships, buyer experience, and on-ground sales operations.'],
    ['person-karthik', 'Mr. Kondapaneni Karthik', 'Director · Legal & Operations', 'Handles regulatory compliance, RERA registrations, legal documentation, and operational governance.'],
  ]
  for (const [id, name, jobTitle, bio] of directors) {
    push({ _id: id, _type: 'person', name, slug: { _type: 'slug', current: id.replace('person-', '') }, roles: ['leadership'], jobTitle, bio })
  }
  push({ _id: 'person-sas-infra', _type: 'person', name: 'SAS Infra', slug: { _type: 'slug', current: 'sas-infra-editorial' }, roles: ['author'], jobTitle: 'Editorial Team' })

  // ════════════ LIBRARY: partners ════════════
  const partnerDefs = [
    ['partner-aedas', 'Aedas', 'Architecture & Design', 'UK / Hong Kong', 'partner-aedas.png'],
    ['partner-arup', 'Arup', 'Structural Engineering', 'United Kingdom', 'partner-arup.svg'],
    ['partner-coffey', 'Coffey', 'Structural Engineering', 'Australia', 'partner-coffey.png'],
    ['partner-godrej', 'Godrej', 'Building Systems & Automation', 'India', 'partner-godrej.png'],
    ['partner-siemens', 'Siemens', 'Building Automation', 'Germany', 'partner-siemens.svg'],
    ['partner-honeywell', 'Honeywell', 'Automation & Controls', 'USA', 'partner-honeywell.svg'],
    ['partner-bosch', 'Bosch', 'Security Systems', 'Germany', 'partner-bosch.svg'],
    ['partner-kone', 'KONE', 'Elevators', 'Finland', 'partner-kone.svg'],
    ['partner-schindler', 'Schindler', 'Elevators', 'Switzerland', 'partner-schindler.png'],
    ['partner-otis', 'Otis', 'Elevators', 'USA', 'partner-otis.svg'],
    ['partner-mitsubishi', 'Mitsubishi Electric', 'Vertical Transport', 'Japan', 'partner-mitsubishi.svg'],
    ['partner-toto', 'TOTO', 'Sanitaryware', 'Japan', 'partner-toto.svg'],
    ['partner-saint-gobain', 'Saint-Gobain', 'Glass', 'France', 'partner-saint-gobain.svg'],
    ['partner-schueco', 'Schüco', 'Facade Systems', 'Germany', 'partner-schueco.svg'],
    ['partner-kohler', 'Kohler', 'Sanitaryware', 'USA', 'partner-kohler.svg'],
    ['partner-duravit', 'Duravit', 'Sanitaryware', 'Germany', 'partner-duravit.svg'],
    ['partner-hansgrohe', 'Hansgrohe', 'Bathroom Fittings', 'Germany', 'partner-hansgrohe.svg'],
    ['partner-daikin', 'Daikin', 'HVAC', 'Japan', 'partner-daikin.svg'],
    ['partner-carrier', 'Carrier', 'HVAC', 'USA', 'partner-carrier.svg'],
  ]
  for (const [id, name, discipline, country, logo] of partnerDefs) {
    const logoImg = await IMG(logo, `${name} logo`)
    push({ _id: id, _type: 'partner', name, discipline, country, ...(logoImg ? { logo: logoImg } : {}) })
  }

  // ════════════ PROJECT UPDATES ════════════
  const puPdf = {
    crownFeb: await fileByName('CROWN-PU-FEB-26-copy.pdf'),
    crownJan: await fileByName('CROWN-PU-JAN-26-copy-1.pdf'),
    itowerMar: await fileByName('iTOWER-PU-MARCH-26.pdf'),
    itowerFeb: await fileByName('ITOWER-PU-FEB-26-copy.pdf'),
    itowerJan: await fileByName('ITOWER-JAN-PU-26-copy.pdf'),
  }
  const updates = [
    ['pu-itower-2026-03', '2026-03-01', ITOWER, 'itower-2026-03', 'construction', 'SASPHERE — March aerial sweep over Nanakramguda', 'Cladding panels installed across the south-facing facade. Vertical-transport shafts now visible from the Service Road perspective. Image set captured by SASPHERE on 12 March 2026.', puPdf.itowerMar],
    ['pu-crown-2026-02', '2026-02-01', CROWN, 'crown-2026-02', 'construction', 'February — slab pour on level 42', 'Concrete pour completed for the 42nd-floor slab. Mock-up apartment finishes are now under installation in the show-home wing at Kokapet.', puPdf.crownFeb],
    ['pu-itower-2026-02', '2026-02-01', ITOWER, 'itower-2026-02', 'construction', 'SASPHERE — February progress overview', 'Core completion proceeding ahead of schedule. Building-systems installation (Siemens, Honeywell, Bosch) underway across the lower podium floors.', puPdf.itowerFeb],
    ['pu-crown-2026-01', '2026-01-01', CROWN, 'crown-2026-01', 'milestone', 'January — show-home opens at Kokapet', 'Show-home wing for prospective residents now open by appointment. Aedas-designed lobby experience and a fully fit-out 4-BHK reference apartment available to walk through.', puPdf.crownJan],
    ['pu-itower-2026-01', '2026-01-01', ITOWER, 'itower-2026-01', 'milestone', 'January — structural milestone, level 24', 'Structural pour completed up to level 24. Arup peer review on track for the next milestone set. Experience-centre opening at Nanakramguda announced for Q2.', puPdf.itowerJan],
  ]
  for (const [id, date, project, segment, category, headline, body, pdf] of updates) {
    push({
      _id: id, _type: 'projectUpdate', date, project: ref(project),
      route: { segment: { _type: 'slug', current: segment } },
      category, headline, body: ptBody([body]),
      ...(pdf ? { pdf: fileRef(pdf) } : {}),
    })
  }

  // ════════════ SINGLETONS ════════════
  push({
    _id: 'blogIndexPage', _type: 'blogIndexPage', title: 'Blog', eyebrow: 'Blog',
    heading: 'Notes on building Hyderabad.',
    dek: 'Essays, profiles, and industry perspective from the team at SAS Infra. On luxury real-estate, high-rise construction, urban planning, and the city we are helping to shape.',
    seo: seo('Blog — SAS Infra', 'Long-form essays and industry perspectives on luxury real estate, high-rise construction, and Hyderabad\'s vertical growth.'),
  })
  push({
    _id: 'updatesIndexPage', _type: 'updatesIndexPage', title: 'Project Updates', eyebrow: 'Updates',
    heading: "Here's what we're building, this month.",
    dek: 'Monthly construction updates from active SAS Infra developments. Aerial sweeps captured by SASPHERE and on-site image sets, published the first week of each month.',
    seo: seo('Project Updates — SAS Crown & SAS iTower construction progress', 'Monthly construction updates, drone aerials, and site progress for SAS Crown (Kokapet) and SAS iTower (Nanakramguda).'),
  })

  // Navigation
  const navItem = (label, link, children) => ({ _type: 'navItem', _key: uid(), label, link, ...(children ? { children } : {}) })
  push({
    _id: 'navigation', _type: 'navigation', title: 'Navigation',
    header: [
      navItem('Projects', lAnchor('Projects', 'homePage', 'projects', 'text')),
      navItem('About', lInternal('About', 'page-about', 'text')),
      navItem('Updates', lInternal('Updates', 'updatesIndexPage', 'text')),
      navItem('Blog', lInternal('Blog', 'blogIndexPage', 'text')),
      navItem('Contact', lInternal('Contact', 'page-contact', 'text')),
    ],
    footer: [
      navItem('Quick Links', lInternal('Home', 'homePage', 'text'), [
        navItem('Home', lInternal('Home', 'homePage', 'text')),
        navItem('About Us', lInternal('About Us', 'page-about', 'text')),
        navItem('Careers', lInternal('Careers', 'page-careers', 'text')),
        navItem('Updates', lInternal('Updates', 'updatesIndexPage', 'text')),
        navItem('Blog', lInternal('Blog', 'blogIndexPage', 'text')),
      ]),
      navItem('Projects', lAnchor('Projects', 'homePage', 'projects', 'text'), [
        navItem('SAS Crown — Residential', lInternal('SAS Crown', CROWN, 'text')),
        navItem('SAS iTower — Commercial', lInternal('SAS iTower', ITOWER, 'text')),
      ]),
      navItem('Contact', lInternal('Send a message', 'page-contact', 'text'), [
        navItem('+91 97186 62299', { _type: 'link', _key: uid(), label: '+91 97186 62299', kind: 'phone', phone: '+919718662299', variant: 'text' }),
        navItem('sales@sasinfra.com', lEmail('sales@sasinfra.com', 'sales@sasinfra.com', 'text')),
        navItem('Send a message', lInternal('Send a message', 'page-contact', 'text')),
      ]),
      navItem('Legal', lInternal('Privacy', 'page-privacy', 'text'), [
        navItem('Terms', lInternal('Terms', 'page-terms', 'text')),
        navItem('Privacy', lInternal('Privacy', 'page-privacy', 'text')),
        navItem('Cookies', lInternal('Cookies', 'page-cookies', 'text')),
      ]),
    ],
  })

  // ════════════ HOME PAGE ════════════
  const homeHeroImg = await IMG('hero-building.png', 'SAS Infra — landmarks of Hyderabad')
  push({
    _id: 'homePage', _type: 'homePage', title: 'Home',
    seo: seo('SAS Infra — Creating Landmarks That Define Hyderabad', "SAS Infra is a Hyderabad-based developer behind South India's tallest residential tower (SAS Crown), Hyderabad's tallest commercial tower (SAS iTower), and a premium retail destination."),
    pageBuilder: [
      B('heroBlock', {
        variant: 'editorial', title: 'Creating landmarks that define Hyderabad.',
        ...(homeHeroImg ? { media: { kind: 'image', image: homeHeroImg } } : {}),
        ctas: [lAnchor('Explore Projects', 'homePage', 'projects', 'primary')],
      }),
      B('statsStripBlock', {
        countUp: true, head: head(null, 'Built to a standard the city can measure.'),
        items: [
          { _key: uid(), value: '10', suffix: 'M+', label: 'Square feet under development' },
          { _key: uid(), value: '3', label: 'Landmark projects across Hyderabad' },
          { _key: uid(), value: '171', suffix: 'm', label: "South India's tallest residential tower" },
          { _key: uid(), value: '15', suffix: 'K+', label: 'Happy customers and partners' },
        ],
      }),
      B('featureGridBlock', {
        head: head(null, 'Building what Hyderabad will be known for.', "Every SAS Infra development is designed with global architecture partners, engineered to standards that exceed regulatory benchmarks, and positioned in Hyderabad's highest-growth corridors. We build for the long term — from the structural core outward."),
        features: [
          { _key: uid(), title: 'Premium Design', text: 'Collaborations with internationally recognised architecture and design firms.' },
          { _key: uid(), title: 'Strategic Locations', text: "Every project positioned within Hyderabad's most connected corridors." },
          { _key: uid(), title: 'Global Standards', text: "Engineering and material specifications benchmarked against the world's best." },
          { _key: uid(), title: 'Future-Ready', text: 'Infrastructure designed for how people will live and work in the next decade, not the last one.' },
        ],
      }),
      B('feedBlock', { source: 'projects', limit: 4, head: head('Landmark Projects', 'A portfolio of defining places, shaping the skyline of Hyderabad.') }),
      B('featureGridBlock', {
        head: head('Why Choose SAS Infra', 'Four commitments, kept on every project.'),
        features: [
          { _key: uid(), title: 'Transparent Process', text: 'Clear communication from launch through handover. No surprises, no hidden costs, no shifted timelines without a reason you can trust.' },
          { _key: uid(), title: 'Long-Term Partnership', text: 'Committed to the continued value and maintenance of every development we deliver, decades after the keys are handed over.' },
          { _key: uid(), title: 'Global Expertise, Local Roots', text: "International design partners paired with deep familiarity of Hyderabad's terrain, climate, and regulatory landscape." },
          { _key: uid(), title: 'Engineering Excellence', text: "Specifications and structural standards benchmarked against the world's best — routinely exceeding regulatory minimums." },
        ],
      }),
      B('mapBlock', {
        head: head(null, "Anchored on Hyderabad's most connected corridor."),
        location: { _type: 'location', city: 'Hyderabad', state: 'Telangana', geopoint: { _type: 'geopoint', lat: 17.401836, lng: 78.338721 } },
      }),
      B('feedBlock', { source: 'updates', limit: 3, head: head('Latest Updates', 'Construction milestones, news, and insights.'), cta: lInternal('View All Updates', 'updatesIndexPage', 'text') }),
      B('contactFormBlock', {
        variant: 'sales', formTarget: 'home-enquiry',
        head: head('Start the Conversation', 'Begin your journey with SAS Infra.', "Tell us a little about what you're looking for and our team will be in touch within one business day."),
        leadOptions: [
          { _key: uid(), label: 'SAS Crown — Residential', value: 'sas-crown' },
          { _key: uid(), label: 'SAS iTower — Commercial', value: 'sas-itower' },
          { _key: uid(), label: 'The Address — Retail Leasing', value: 'the-address' },
          { _key: uid(), label: 'SAS Kukatpally — Pre-Launch', value: 'sas-kukatpally' },
          { _key: uid(), label: 'General Enquiry', value: 'general' },
        ],
      }),
    ],
  })

  // ════════════ ABOUT ════════════
  push({
    _id: 'page-about', _type: 'page', title: 'About',
    route: { segment: { _type: 'slug', current: 'about' } },
    seo: seo("About SAS Infra — Twenty-five years building Hyderabad's landmarks", "Founded in 2000 by Dr. G.V. Rao, SAS Infra builds South India's tallest residential tower (SAS Crown), Hyderabad's tallest commercial tower (SAS iTower), and a premium retail destination (The Address)."),
    pageBuilder: [
      B('heroBlock', { variant: 'minimal', title: 'Twenty-five years building what Hyderabad will be known for.', dek: "Founded in 2000 by Dr. G.V. Rao. Today, a portfolio that includes South India's tallest residential tower, Hyderabad's tallest commercial tower, and a premium retail destination — built with global partners and operated for the long term." }),
      B('proseBlock', {
        head: head('I — Our Story', 'An industry outsider who chose to build for the long term.'),
        body: ptBody([
          'SAS Infra was founded in 2000 by Dr. G.V. Rao — not from within the real estate industry, but from a conviction that Hyderabad deserved developments built with the same precision and integrity that he brought from his earlier career.',
          'Over two decades, the company has navigated economic downturns, volatile market cycles, and a global pandemic — each time emerging with a stronger conviction about what it takes to build developments that last. The approach has always been the same: assemble the best professional talent, partner with global firms, execute with discipline, and let the buildings speak.',
          "Today, SAS Infra's portfolio includes South India's tallest residential tower (SAS Crown, Kokapet), Hyderabad's tallest commercial development (SAS iTower, Nanakramguda), and a premium retail destination (The Address). The company is headquartered at ACE Tech Park in Hyderabad's Financial District.",
        ]),
      }),
      B('peopleBlock', { variant: 'featured', head: head('II — Leadership', 'Dr. G.V. Rao · Chairman.'), people: [{ _type: 'reference', _key: uid(), _ref: 'person-gv-rao' }] }),
      B('quoteBlock', {
        quote: 'When I entered real estate in 2000, I had no background in the industry. What I had was a belief that Hyderabad deserved developments built with honesty — where the specifications promised in the brochure are the specifications delivered on site.',
        person: ref('person-gv-rao'),
      }),
      B('peopleBlock', {
        variant: 'grid',
        head: head('III — The Team', 'A leadership group with operating depth.', 'Five directors lead day-to-day execution across construction, engineering, sales, and governance — each accountable for an outcome, not a department.'),
        people: directors.map(([id]) => ({ _type: 'reference', _key: uid(), _ref: id })),
      }),
      B('logoWallBlock', {
        head: head('IV — Global Partners', 'Global firms, at every layer of the building.'),
        partners: ['partner-aedas', 'partner-arup', 'partner-coffey', 'partner-godrej', 'partner-siemens', 'partner-honeywell', 'partner-bosch', 'partner-kone', 'partner-schindler', 'partner-otis', 'partner-mitsubishi'].map((id) => ({ _type: 'reference', _key: uid(), _ref: id })),
      }),
      B('timelineBlock', {
        head: head('V — Milestones', 'From 2000 to today.', 'Twenty-five years of buildings. The dates below mark the moments that shaped what SAS Infra has become.'),
        milestones: [
          { _key: uid(), year: '2000', title: 'SAS Infra founded', body: 'Dr. G.V. Rao establishes the company in Hyderabad with a single conviction: build with the integrity of an industry outsider.' },
          { _key: uid(), year: '2018', title: 'SAS iTower announced', body: "Hyderabad's tallest commercial tower revealed for Nanakramguda — 171 m, 37 storeys, designed with Aedas, leasing by CBRE." },
          { _key: uid(), year: '2021', title: 'SAS Crown announced', body: "South India's tallest residential tower revealed at Kokapet — G+59 floors of ultra-luxury 4 & 5 BHK residences in the Financial District." },
          { _key: uid(), year: '2023', title: 'SAS iTower breaks ground', body: 'Foundation work begins in Nanakramguda. Structural engineering by Arup; building systems by Siemens, Honeywell, Bosch.' },
          { _key: uid(), year: '2024', title: 'The Address announced', body: 'Premium retail destination announced as part of the iTower mixed-use ecosystem — fine dining, curated retail, lifestyle.' },
          { _key: uid(), year: '2026', title: 'SAS Kukatpally pre-launch', body: "The next chapter — a residential development for Hyderabad's most established neighbourhood. Registrations of interest now open." },
        ],
      }),
      B('ctaBlock', {
        head: head('Visit SAS Infra', 'Come see what we have built, and what we are building next.', 'Our team will arrange a tour of the show home at Kokapet, the iTower experience centre at Nanakramguda, or a private meeting at our office in Financial District.'),
        actions: [lInternal('Schedule a Conversation', 'page-contact', 'primary'), lAnchor('Explore Our Projects', 'homePage', 'projects', 'secondary')],
      }),
    ],
  })

  // ════════════ CAREERS ════════════
  push({
    _id: 'page-careers', _type: 'page', title: 'Careers',
    route: { segment: { _type: 'slug', current: 'careers' } },
    seo: seo('Careers at SAS Infra — Build what Hyderabad is known for', 'Join SAS Infra: structured paths, global partners, work that shapes Hyderabad. Roles across engineering, design, operations, sales, and legal.'),
    pageBuilder: [
      B('heroBlock', { variant: 'minimal', eyebrow: 'Careers', title: 'Build what Hyderabad will be known for.', dek: "SAS Infra builds South India's tallest residential tower, Hyderabad's tallest commercial development, and a premium retail destination — alongside Aedas, Arup, Siemens, KONE, and other global partners. We're looking for people who want their work to matter on the skyline." }),
      B('proseBlock', {
        head: head('I — How we work', 'A team built for the long term.'),
        body: ptBody([
          'SAS Infra is a forward-looking team guided by a clear long-term vision. Roles here are built for talented individuals across functions who are eager to learn, contribute, and grow — in a collaborative, process-driven environment where initiative is encouraged, capability is strengthened, and performance is recognised.',
          "You'll work on diverse, high-impact projects alongside experienced professionals across disciplines. Whether your expertise is in engineering, design, operations, sales, management, or support roles, you'll find meaningful opportunities to build skills, take ownership, and progress on a defined growth path.",
          'SAS Infra is an equal opportunity employer. We offer structured career paths, continuous learning, exposure to international partnerships, and a process-driven work culture focused on delivering high-quality work with excellence and expertise.',
          'We believe in the potential of people and invite driven individuals from diverse backgrounds to contribute to our mission of building trust for every stakeholder. We promote a healthy work–life balance and an environment where the right aptitude and attitude are valued as much as performance.',
        ]),
      }),
      B('featureGridBlock', {
        head: head("II — Where you'd fit", 'Six disciplines. One operating culture.', "We hire across the company. Below are the broad areas — but specific openings vary. Reach out even if you don't see your function listed."),
        features: [
          { _key: uid(), title: 'Engineering', text: 'Structural design, MEP, site engineering. Work alongside Arup, Coffey, and senior in-house engineers across active towers.' },
          { _key: uid(), title: 'Architecture & Design', text: 'Master planning and architectural execution in collaboration with global firms (Aedas) on landmark towers.' },
          { _key: uid(), title: 'Operations & Site', text: 'Construction logistics, vendor coordination, and on-ground build management at Kokapet and Nanakramguda.' },
          { _key: uid(), title: 'Sales & Marketing', text: 'Brand strategy, channel partnerships, and high-touch buyer experience for ultra-luxury residential and Grade-A commercial.' },
          { _key: uid(), title: 'Legal & Compliance', text: 'RERA, statutory approvals, contracts, and operational governance across active and upcoming projects.' },
          { _key: uid(), title: 'Finance & Strategy', text: 'Capital planning, financial controls, and project economics across the development pipeline.' },
        ],
      }),
      B('ctaBlock', {
        head: head('Apply', 'Send us your profile.', "We review every application personally. Send a CV and a short note on what kind of role and team you're looking for."),
        actions: [lEmail('Email Careers', 'careers@sasinfra.com', 'primary'), lInternal('Contact Us', 'page-contact', 'secondary')],
      }),
    ],
  })

  // ════════════ CONTACT ════════════
  push({
    _id: 'page-contact', _type: 'page', title: 'Contact',
    route: { segment: { _type: 'slug', current: 'contact' } },
    seo: seo('Contact SAS Infra — Office, sales & enquiries', 'Reach SAS Infra at our Hyderabad office in Financial District, by phone, by email, or via the form.'),
    pageBuilder: [
      B('heroBlock', { variant: 'minimal', eyebrow: 'Contact', title: 'Come see what we are building.', dek: "Tell us which project you'd like to know about, and our team will arrange a private show-home tour, an iTower experience-centre visit, or a meeting at our Financial District office." }),
      B('contactFormBlock', {
        variant: 'general', formTarget: 'contact', head: head(null, 'Send us a message'),
        leadOptions: [
          { _key: uid(), label: 'SAS Crown — Kokapet (residential)', value: 'sas-crown' },
          { _key: uid(), label: 'SAS iTower — Nanakramguda (commercial)', value: 'sas-itower' },
          { _key: uid(), label: 'The Address (retail)', value: 'the-address' },
          { _key: uid(), label: 'General enquiry', value: 'general' },
        ],
      }),
      B('proseBlock', {
        head: head(null, 'Visit us'),
        body: ptBody([
          { text: 'Office', style: 'h3' },
          '12th Floor, ACE Tech Park · 1201, Narsingi · Nanakramguda Service Rd · Financial District · Hyderabad · Telangana 500032',
          { text: 'Call', style: 'h3' },
          '+91 97186 62299 · +040 6776 8999',
          { text: 'Email', style: 'h3' },
          'sales@sasinfra.com · careers@sasinfra.com',
          { text: 'Hours', style: 'h3' },
          'Mon–Fri 10:00 — 18:00 · Saturday 10:00 — 17:00 · Sunday Closed',
        ]),
      }),
      B('mapBlock', {
        head: head(null, 'Find us'),
        location: { _type: 'location', address: '12th Floor, ACE Tech Park, 1201, Narsingi, Nanakramguda Service Rd, Financial District', city: 'Hyderabad', state: 'Telangana', pincode: '500032', geopoint: { _type: 'geopoint', lat: 17.419178, lng: 78.360555 } },
      }),
    ],
  })

  // ════════════ MEDIA ════════════
  push({
    _id: 'page-media', _type: 'page', title: 'Media',
    route: { segment: { _type: 'slug', current: 'media' } },
    seo: seo('Media & Press Coverage — SAS Infra', "Press coverage of SAS Infra's milestones, projects, and leadership across leading publications."),
    pageBuilder: [
      B('heroBlock', { variant: 'minimal', eyebrow: 'Media', title: 'Press & coverage.', dek: "A curated record of media coverage on SAS Infra's milestones, landmark achievements, and project successes — as documented by leading publications across the industry." }),
      B('feedBlock', { source: 'press', limit: 12, head: head(null, 'In the press') }),
      B('ctaBlock', {
        head: head(null, 'For interviews, image requests, or media kit access.', 'Our team responds within one business day. Logos, renders, fact-sheets, and leadership bios available on request.'),
        actions: [lEmail('Email Press Desk', 'sales@sasinfra.com', 'primary')],
      }),
    ],
  })

  // ════════════ LEGAL ════════════
  const legalHero = (eyebrow, title, meta) => B('heroBlock', { variant: 'minimal', eyebrow, title, dek: meta })
  push({
    _id: 'page-privacy', _type: 'page', title: 'Privacy',
    route: { section: 'legal', segment: { _type: 'slug', current: 'privacy' } },
    seo: seo('Privacy Policy — SAS Infra', 'How SAS Infra collects, uses, and protects information from visitors to sasinfra.com.'),
    pageBuilder: [
      legalHero('Legal', 'Privacy Policy.', 'How we handle the information you share with us.'),
      B('proseBlock', { body: ptBody([
        { text: 'Information we collect', style: 'h2' },
        'We collect personal information to deliver a more relevant and efficient user experience. Certain website features require registration or submission of specific details to access services. Information you provide helps tailor content, services, and communications to your preferences.',
        'We may also automatically collect technical data such as IP address, device details, and usage patterns. Cookies and similar technologies may be used to improve functionality and performance, and users can control cookie preferences through browser settings.',
        { text: 'How information is used', style: 'h2' },
        'Collected data is used to operate and improve services, personalize user experience, analyze website performance, enhance content and layout, support promotional activities, and send administrative or service-related communications.',
        'By accepting the User Agreement and related terms, you consent to receiving these communications, with the option to opt out of non-essential messages where available.',
        { text: 'Information sharing and disclosure', style: 'h2' },
        'Personal information is not shared with third parties without user consent except where required by law or necessary for legitimate operational purposes. Aggregated, non-identifiable data may be shared for analytics, reporting, and service improvement.',
        'Users can browse most areas of the website without revealing identity, and personal data is required only for registration or specific services.',
        { text: 'Security and user responsibility', style: 'h2' },
        'Reasonable safeguards are used to protect user information. Users are responsible for maintaining the confidentiality of their account credentials and for all activities conducted through their accounts.',
        'Any loss arising from unauthorized access due to failure to protect login details is the user\'s responsibility. Transactions made using credit cards, debit cards, or other payment instruments are carried out at the user\'s risk, and no liability is assumed for misuse by third parties.',
        { text: 'User rights, legal compliance, and updates', style: 'h2' },
        'Users may request access, correction, update, deletion, or restriction of their personal data, and may seek confirmation of processing or data portability where applicable, by contacting krishna.j@sasinfra.com. Identity verification may be required before processing requests.',
        'The website complies with applicable Indian data protection laws and may disclose information when legally required or necessary to prevent fraud or security threats. This policy may be updated from time to time, and continued use of the website indicates acceptance of the revised version.',
        'Questions about this policy? Email krishna.j@sasinfra.com or call +91 97186 62299.',
      ]) }),
    ],
  })
  push({
    _id: 'page-terms', _type: 'page', title: 'Terms',
    route: { section: 'legal', segment: { _type: 'slug', current: 'terms' } },
    seo: seo('Terms & Conditions — SAS Infra', 'Terms governing the use of sasinfra.com and the services it offers.'),
    pageBuilder: [
      legalHero('Legal', 'Terms & Conditions.', 'By accessing and using sasinfra.com, you agree to comply with these terms. References to "you" mean any visitor; "we" or "us" mean SAS Infra.'),
      B('proseBlock', { body: ptBody([
        { text: 'Use of the website and intellectual property', style: 'h2' },
        'All content on this website, including text, design, graphics, media, and branding elements, is owned by or licensed to SAS Infra and is protected by intellectual property laws. Access is permitted for personal and informational use only.',
        'You may not republish, reproduce, duplicate, copy, sell, sublicense, or redistribute any material without prior written permission. Certain features may rely on cookies and similar technologies to improve functionality and user experience. Continued browsing indicates consent to such use as described in our Privacy Policy.',
        { text: 'User submissions and external links', style: 'h2' },
        'Where user comments or content submissions are enabled, such material reflects the views of the individual contributor and not SAS Infra. We do not pre-screen all submissions but reserve the right to monitor, edit, or remove content that is unlawful, offensive, misleading, or in violation of these terms. By posting content, you confirm that you have the right to share it and that it does not infringe third-party rights. You grant us a non-exclusive right to use and display that content in any format.',
        'Certain organizations such as government bodies, search engines, news platforms, and recognized business directories may link to the website without prior approval, provided the link is not misleading and does not imply false endorsement. Other link requests may be approved at our discretion. Use of logos or brand assets requires separate written permission. Framing or altering the visual presentation of the website through iFrames or similar methods is not allowed without consent.',
        { text: 'Liability, accuracy, and availability', style: 'h2' },
        'We do not guarantee that website content is always accurate, complete, or current, or that the website will remain continuously available. Information is provided on an "as is" basis for general purposes. We are not responsible for third-party websites linking to or from this site and are not liable for any claims arising from external content.',
        'To the fullest extent permitted by law, all warranties are excluded. Nothing in these terms limits liability where exclusion is not legally allowed, including liability for fraud or personal injury caused by negligence. Use of the website and reliance on its content is at your own risk.',
        { text: 'Changes and rights reserved', style: 'h2' },
        'We may revise these Terms and Conditions at any time. We also reserve the right to request removal of any inbound links and to restrict or terminate access where misuse is detected. Continued use after updates are posted constitutes acceptance of the revised terms.',
        'Users may contact us to report concerns about links or content, though removal or response is not guaranteed. These terms are interpreted in accordance with applicable Indian law.',
        'Questions? Email krishna.j@sasinfra.com or call +91 97186 62299.',
      ]) }),
    ],
  })
  push({
    _id: 'page-cookies', _type: 'page', title: 'Cookies',
    route: { section: 'legal', segment: { _type: 'slug', current: 'cookies' } },
    seo: seo('Cookie Policy — SAS Infra', 'How sasinfra.com uses cookies and how to manage them.'),
    pageBuilder: [
      legalHero('Legal', 'Cookie Policy.', 'What cookies we use, why we use them, and how to control them.'),
      B('proseBlock', { body: ptBody([
        { text: 'What are cookies?', style: 'h2' },
        'Cookies are small text files stored on your device to improve your browsing experience, enable essential website functions, and deliver relevant features and content. They help us understand how visitors use the website, remember preferences, and support performance and security.',
        'By continuing to use this website, you consent to the use of cookies as described here. You can disable cookies through your browser settings; however, doing so may limit or break certain features and services across this and other websites.',
        { text: 'Functional and account cookies', style: 'h2' },
        'We use cookies to manage account creation, login sessions, and general site administration. These cookies remember when you are signed in so you do not have to log in repeatedly while navigating between pages, and they are usually cleared when you log out.',
        'Cookies may also be used when you subscribe to newsletters or email updates to remember your subscription status, and when you submit forms such as contact or enquiry forms to retain your details for future correspondence. Preference cookies store your settings and choices to provide a consistent and personalized experience.',
        { text: 'Analytics and performance cookies', style: 'h2' },
        'We may use trusted third-party cookies, including analytics tools, to understand visitor behavior such as pages visited and time spent on the site. This information is collected in aggregated, non-personally identifiable form and is used to improve website performance, content quality, and usability.',
        'Cookies may also be used when testing new features or layout changes to ensure consistent experience and measure effectiveness.',
        { text: 'Advertising, partner, and social media cookies', style: 'h2' },
        'Advertising and marketing cookies may be used to measure campaign performance, control how often ads are shown, and display more relevant advertisements based on general interest data. Some cookies track whether visitors reach the site through partner or affiliate links so referrals can be credited appropriately.',
        'The website may also include social media features or plugins that set cookies and process data according to their respective privacy policies.',
        { text: 'More information and contact', style: 'h2' },
        'For more information about how cookies are used on this website, email krishna.j@sasinfra.com or call +91 97186 62299.',
      ]) }),
    ],
  })

  // ════════════ WRITE singletons / pages / library / updates ════════════
  console.log(`\nWriting ${docs.length} documents in one transaction…`)
  const tx = client.transaction()
  for (const d of docs) tx.createOrReplace(d)
  await tx.commit({ visibility: 'async' })
  for (const d of docs) console.log('  ✓', d._type.padEnd(16), d._id)

  // ════════════ PATCH: SAS Crown (full §12.1 project-family page) ════════════
  const crownHeroImg = await IMG('crown-tower-day.webp', 'SAS Crown residential tower over Kokapet at day')
  const crownVideo = await VIDEO('images/crown-hero.mp4')
  const crownLogo = await IMG('crown-logo.svg', 'SAS Crown')
  const crownBrochure = await fileByName('SAS_CROWN_BOOK_A3_V6_Final2_Print_CS6-copy-Copy-copy-Com2.pdf')
  const crownGallery = [
    ['crown-tower-day.webp', 'SAS Crown tower at day', 'tall'],
    ['crown-clubhouse.webp', 'SAS Crown Sky Club interior'],
    ['crown-interior-1.webp', 'SAS Crown residence interior'],
    ['crown-tower-aerial.webp', 'SAS Crown aerial view over Kokapet'],
    ['crown-clubhouse-perspective.webp', 'SAS Crown Sky Club perspective'],
    ['crown-interior-2.webp', 'SAS Crown apartment living space'],
    ['crown-tagline.webp', 'SAS Crown — South India\'s tallest residential tower'],
    ['crown-interior-3.webp', 'SAS Crown bedroom interior'],
  ]
  const crownGalleryImgs = []
  for (const [f, alt, size] of crownGallery) { const im = await IMG(f, alt); if (im) crownGalleryImgs.push({ _key: uid(), image: im, size: size || 'default' }) }
  const crownPlans = [
    [1, 'East Wing', '6,565 sq ft', 'crown-plan-1a.webp'],
    [2, 'West Wing', '7,200 sq ft', 'crown-plan-3a.webp'],
    [3, 'Corner', '7,920 sq ft', 'crown-plan-5a.webp'],
    [4, 'Sky Villa', '8,400 sq ft', 'crown-plan-6.webp'],
    [5, 'Full Floor', '8,811 sq ft', 'crown-plan-7.webp'],
  ]
  const crownPlanItems = []
  for (const [seq, label, size, f] of crownPlans) { const im = await IMG(f, `${label} floor plan`); if (im) crownPlanItems.push({ _key: uid(), seq, label, size, planImage: im }) }
  const crownFeatureImg = await IMG('crown-clubhouse-perspective.webp', 'Clubdom — Sky Club at SAS Crown')
  const crownAmenityImg = await IMG('crown-amenity.webp', 'Sky Club lifestyle render at SAS Crown')

  const crownPB = [
    B('projectHeroBlock', {
      ...(crownVideo || crownHeroImg ? { media: { kind: 'video', ...(crownVideo ? { video: crownVideo } : {}), ...(crownHeroImg ? { poster: crownHeroImg } : {}) } } : {}),
      ...(crownLogo ? { logo: crownLogo } : {}),
      eyebrow: 'Residential · Kokapet, Hyderabad', title: "South India's tallest residential tower.",
      ctas: [lInternal('Schedule a Visit', 'page-contact', 'primary'), ...(crownBrochure ? [lFile('Download Brochure', crownBrochure)] : [])],
      stats: [
        { _key: uid(), label: 'Height', value: '236 m' },
        { _key: uid(), label: 'Floors', value: 'G + 57' },
        { _key: uid(), label: 'Configuration', value: '4 BHK' },
        { _key: uid(), label: 'Sizes', value: '6,565–8,811 sq ft' },
        { _key: uid(), label: 'Land', value: '4.5 acres' },
        { _key: uid(), label: 'Open Space', value: '80%' },
      ],
    }),
    B('statsStripBlock', {
      countUp: true,
      items: [
        { _key: uid(), value: '236', suffix: 'm', label: "Tower height — South India's tallest residential" },
        { _key: uid(), value: '57', label: 'Floors' },
        { _key: uid(), value: '13', suffix: 'ft', label: 'Ceiling heights that redefine skyline living' },
        { _key: uid(), value: '80', suffix: '%', label: 'Open and landscaped space across the site' },
      ],
    }),
    B('specsRefBlock', { head: head('Specifications', 'Every detail defined. Every number that matters.') }),
    B('proseBlock', {
      head: head('The Vision', 'Luxury apartments in Kokapet, Hyderabad.'),
      body: ptBody([
        "SAS Crown — South India's tallest residential tower — rises 236 metres above Kokapet, the city's most rapidly maturing residential corridor. G + 57 floors set across 4.5 acres of lush greenery, with eighty percent of the site held as open and landscaped space.",
        'Each home is a 4 BHK with an office room and a maid room, ranging from 6,565 to 8,811 sq ft, with east-and-west orientations that bring through-light and ventilation. Italian marble flooring; thirteen-foot ceilings; private sky villas occupying entire upper floors. The Sky Club — at this height, the first of its kind in India — sits within Tower 2.',
        'Designed by Simon Naf · Aedas — design collaborators for landmark projects across Asia.',
      ]),
    }),
    B('galleryBlock', { variant: 'carousel', head: head('Gallery', 'An uninterrupted view of the city.'), images: crownGalleryImgs }),
    B('floorPlansBlock', {
      mode: 'list',
      head: head('Residences', "A bird's-eye view of the residence.", 'Five configurations across the tower — through-light layouts with east and west orientations. Sky villas occupy entire upper floors for whole-floor privacy. 4 BHK + Office + Maid · 6,565 – 8,811 sq ft · 13 ft ceilings.'),
      ...(crownBrochure ? { cta: lFile('Download Brochure', crownBrochure) } : {}),
      plans: crownPlanItems,
    }),
    B('signatureFeatureBlock', {
      variant: 'cinema', ...(crownFeatureImg ? { image: crownFeatureImg } : {}),
      eyebrow: 'Signature · Clubdom', heading: "The Sky Club — India's first at this height.",
      body: 'One lakh+ sq ft of curated amenity within Tower 2 — the highest residential clubhouse on the subcontinent. A measured retreat in the upper third of the tower, designed for the moments between the city below and the sky above.',
      items: ['Sky lounge & observation deck', 'Banquet & private dining', 'Heated swimming pool', 'Wellness · spa & massage', 'Yoga & meditation studio', 'Private theatre'],
    }),
    B('amenityZonesBlock', {
      head: head('Life at Crown', 'Everything we have on offer.', 'Three programmed zones across the Clubdom, ground level, and the Sky Club — each engineered to feel resident-only, never shared with the building next door.'),
      anchor: { ...(crownAmenityImg ? { image: crownAmenityImg } : {}), eyebrow: 'Within the Sky Club', heading: 'Where ten amenities belong.', body: 'The Sky Club anchors the upper third of Tower 2. Three programmed zones flow across its floors, each entered through its own lobby.' },
      zones: [
        { _key: uid(), seq: 1, title: 'Wellness & Leisure', items: ['Heated infinity pool', 'Spa & sauna', 'Yoga & meditation studio', 'Massage suites'] },
        { _key: uid(), seq: 2, title: 'Social & Entertainment', items: ['Two-hundred-seat banquet', 'Twenty-four-seat private theatre', 'Games & cards lounge'] },
        { _key: uid(), seq: 3, title: 'Family & Convenience', items: ['EV charging', 'Car wash', 'Mini-mart', 'Resident concierge'] },
      ],
    }),
    B('amenitiesRefBlock', { head: head('Amenities', 'Everything we have on offer.') }),
    B('locationMapBlock', {
      overture: { eyebrow: 'III — Location', heading: 'The Kokapet spine.', dek: 'Six minutes to ORR. Twelve to the Financial District.' },
      mapConfig: { mapProject: 'crown', frameStyle: 'disc' },
      locationCard: { eyebrow: 'The Project', heading: 'SAS Crown.', dek: "South India's tallest residential tower, rising over the Kokapet spine of Hyderabad's Financial District." },
      footnote: 'Travel times by car at 10:00 IST · Google Maps median, April 2026.',
    }),
    B('feedBlock', { source: 'updates', limit: 3, head: head('Watch It Rise', 'Construction milestones from Kokapet.'), cta: lInternal('View Full Construction Timeline', 'updatesIndexPage', 'text') }),
    B('contactFormBlock', {
      variant: 'sales', formTarget: 'crown-enquiry',
      head: head('Schedule a Visit', 'Tour SAS Crown at Kokapet.', 'Leave the details below and our residential team will be in touch within one business day to set up a private viewing of the project and the show home.'),
      leadOptions: [
        { _key: uid(), label: '4 BHK — 6,565 sq ft', value: '6565' },
        { _key: uid(), label: '4 BHK — 7,200 sq ft', value: '7200' },
        { _key: uid(), label: '4 BHK — 8,811 sq ft', value: '8811' },
        { _key: uid(), label: 'Sky Villa — full floor', value: 'sky-villa' },
      ],
    }),
  ]
  const crownAmenityIcons = { Banquet: 'fallback', 'EV Charging': 'ev', 'Car Wash': 'parking', Games: 'fallback', 'Mini Mart': 'retail', 'Swimming Pool': 'pool', 'Private Theater': 'theatre', Spa: 'spa', 'Yoga Studio': 'yoga', Massage: 'spa' }
  const crownAmenityList = ['Banquet', 'EV Charging', 'Car Wash', 'Games', 'Mini Mart', 'Swimming Pool', 'Private Theater', 'Spa', 'Yoga Studio', 'Massage'].map((n) => ({ _key: uid(), name: n, icon: crownAmenityIcons[n] }))
  await client.patch(CROWN).set({
    route: { segment: { _type: 'slug', current: 'sas-crown' } },
    ...(crownHeroImg ? { heroImage: crownHeroImg } : {}),
    ...(crownBrochure ? { brochure: fileRef(crownBrochure) } : {}),
    specifications: [
      { _key: uid(), icon: 'fallback', label: 'Status', value: 'Under Construction' },
      { _key: uid(), icon: 'building', label: 'Total Land', value: '4.5 Acres' },
      { _key: uid(), icon: 'building', label: 'Towers', value: '5 Towers' },
      { _key: uid(), icon: 'building', label: 'Flats', value: '~250 Units' },
      { _key: uid(), icon: 'building', label: 'Configuration', value: '4 BHK + Office & Maid' },
      { _key: uid(), icon: 'fallback', label: 'Type', value: 'Ultra-Luxury Residential' },
    ],
    amenities: crownAmenityList,
    pageBuilder: crownPB,
  }).commit()
  console.log('  ✓ patched project        SAS Crown')

  // ════════════ PATCH: SAS iTower (route + hero + basics, §12.2 deferred) ════════════
  const itowerHeroImg = await IMG('itower-drone-front.webp', 'SAS iTower commercial tower in Nanakramguda')
  const itowerVideo = await VIDEO('images/itower-hero.mp4')
  const itowerLogo = await IMG('itower-logo.svg', 'SAS iTower')
  const itowerBrochure = await fileByName('iTower_Brochure_For-Website.pdf')
  const itowerPB = [
    B('projectHeroBlock', {
      ...(itowerVideo || itowerHeroImg ? { media: { kind: 'video', ...(itowerVideo ? { video: itowerVideo } : {}), ...(itowerHeroImg ? { poster: itowerHeroImg } : {}) } } : {}),
      ...(itowerLogo ? { logo: itowerLogo } : {}),
      eyebrow: 'Commercial · Nanakramguda, Hyderabad', title: 'The tallest business tower in Hyderabad.',
      ctas: [lInternal('Leasing Enquiry', 'page-contact', 'primary'), ...(itowerBrochure ? [lFile('Download Brochure', itowerBrochure)] : [])],
      stats: [
        { _key: uid(), label: 'Height', value: '171 m' },
        { _key: uid(), label: 'Floors', value: 'G + 37' },
        { _key: uid(), label: 'Floor Plate', value: '1.2 L sq ft' },
        { _key: uid(), label: 'Total Built-up', value: '6.0 M sq ft' },
        { _key: uid(), label: 'Land', value: '10.36 acres' },
        { _key: uid(), label: 'Capacity', value: '50K+ employees' },
      ],
    }),
    B('statsStripBlock', {
      countUp: true,
      items: [
        { _key: uid(), value: '171', suffix: 'm', label: 'Tower height — tallest commercial in Hyderabad' },
        { _key: uid(), value: '37', label: 'Floors of Grade-A office' },
        { _key: uid(), value: '120', suffix: 'k sq ft', label: "Typical floor plate — city's largest" },
        { _key: uid(), value: '6', suffix: 'M sq ft', label: 'Total mixed-use development' },
      ],
    }),
    B('specsRefBlock', { head: head('Specifications', 'Engineered for those who build the future.') }),
    B('proseBlock', {
      head: head('The Vision', 'Premium commercial spaces in Nanakramguda, Hyderabad.'),
      body: ptBody([
        'SAS iTower stands as a majestic sentinel between the twin giants of commerce — HITEC City and the Financial District. At 171 metres and G+37 floors, it is the tallest commercial tower in South India: a 6.0 million sq ft mixed-use ecosystem rising over 10.36 acres of CBD-grade ground.',
        'Inside, the city\'s largest typical floor plate at 1.2 lakh sq ft offers versatile office layouts engineered for full-floor BFSI tenants, GCCs, and Indian corporates alike. A 4.1-metre floor-to-ceiling height runs through every storey. The signature digital LED façade — a first for any commercial project in Hyderabad — turns the building itself into a 171-metre brand surface.',
        'Designed by Aedas · leasing advised by CBRE · targeting LEED Gold and WELL Silver certification.',
      ]),
    }),
    B('amenitiesRefBlock', { head: head('Specifications', 'Built to a commercial standard the city has not seen.') }),
    B('feedBlock', { source: 'updates', limit: 3, head: head('Watch It Rise', 'Construction milestones from Nanakramguda.'), cta: lInternal('View Full Construction Timeline', 'updatesIndexPage', 'text') }),
    B('contactFormBlock', {
      variant: 'leasing', formTarget: 'itower-enquiry',
      head: head('Leasing Enquiry', 'Lease space at SAS iTower.', 'Tell us about your space requirement and our commercial leasing team (with CBRE) will respond within one business day.'),
      leadOptions: [
        { _key: uid(), label: 'Full-floor (1.2 L sq ft)', value: 'full-floor' },
        { _key: uid(), label: 'Half-floor', value: 'half-floor' },
        { _key: uid(), label: 'Multi-floor / HQ', value: 'multi-floor' },
        { _key: uid(), label: 'Retail (The Address)', value: 'retail' },
      ],
    }),
  ]
  const itowerSpecs = [
    ['fallback', 'Status', 'Under Construction'], ['building', 'Total Land', '10.36 Acres'],
    ['building', 'Tower Height', '171 m · G + 37'], ['building', 'Floor Plate', '1.2 L sq ft (typical)'],
    ['building', 'Built-up', '6.0 M sq ft mixed-use'], ['building', 'Ceiling', '4.1 m floor-to-ceiling'],
    ['security', 'Refuge Floors', 'Code-compliant throughout'], ['parking', 'Parking', 'App-based multi-level'],
    ['fallback', 'Sustainability', 'LEED Gold + WELL Silver'], ['building', 'Architect', 'Aedas'],
    ['retail', 'Leasing', 'CBRE'], ['building', 'Location', 'Nanakramguda · Hyderabad CBD'],
  ].map(([icon, label, value]) => ({ _key: uid(), icon, label, value }))
  const itowerAmenityIcons = { 'Grade-A office space': 'building', '1.2 lakh sq ft floor plates': 'building', 'LEED Gold target': 'fallback', 'WELL Silver target': 'fallback', 'High-speed lift lobbies': 'building', 'Conference & cafe levels': 'retail' }
  const itowerAmenityList = ['Grade-A office space', '1.2 lakh sq ft floor plates', 'LEED Gold target', 'WELL Silver target', 'High-speed lift lobbies', 'Conference & cafe levels'].map((n) => ({ _key: uid(), name: n, icon: itowerAmenityIcons[n] }))
  await client.patch(ITOWER).set({
    route: { segment: { _type: 'slug', current: 'sas-itower' } },
    ...(itowerHeroImg ? { heroImage: itowerHeroImg } : {}),
    ...(itowerBrochure ? { brochure: fileRef(itowerBrochure) } : {}),
    specifications: itowerSpecs,
    amenities: itowerAmenityList,
    pageBuilder: itowerPB,
  }).commit()
  console.log('  ✓ patched project        SAS iTower')

  // ════════════ PATCH: blogPosts (route + author -> person) ════════════
  const posts = await client.fetch('*[_type=="blogPost" && !(_id in path("drafts.**"))]{_id, "slug": slug.current, "hasRoute": defined(route.segment.current)}')
  let blogPatched = 0
  for (const p of posts) {
    const patch = client.patch(p._id).set({ author: ref('person-sas-infra') })
    if (!p.hasRoute && p.slug) patch.set({ route: { segment: { _type: 'slug', current: p.slug } } })
    await patch.commit()
    blogPatched++
  }
  console.log(`  ✓ patched ${blogPatched} blogPosts (author -> person-sas-infra${''}; routes added)`)

  // retire the legacy author doc now that nothing references it
  try { await client.delete('author-sas-infra'); console.log('  ✓ deleted legacy author-sas-infra') }
  catch (e) { console.warn('  ! could not delete legacy author:', e.message) }

  console.log('\nDone.')
}

main().catch((e) => { console.error(e); process.exit(1) })
