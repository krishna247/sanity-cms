import {getCliClient} from 'sanity/cli'

// Align the seeded SAS iTower content with the original bespoke design so the
// rewired ITowerPage stays pixel-identical:
//  - embed <em>/<br> accents into headings rendered via set:html
//  - spec values regain their forced <br> line breaks (grid variant)
//  - amenities head + list replaced with the original 10 work-life amenities
//    (the seed held 6 generic items + a wrong "Specifications" eyebrow)
//  - contact left-column heading/dek matched to the original copy
const client = getCliClient().withConfig({dataset: 'production'})

const specifications = [
  {icon: 'fallback', label: 'Status', value: 'Under<br />Construction'},
  {icon: 'building', label: 'Total Land', value: '10.36 Acres'},
  {icon: 'building', label: 'Tower Height', value: '171 m<br />G + 37'},
  {icon: 'building', label: 'Floor Plate', value: '1.2 L sq ft<br />(typical)'},
  {icon: 'building', label: 'Built-up', value: '6.0 M sq ft<br />mixed-use'},
  {icon: 'building', label: 'Ceiling', value: '4.1 m<br />floor-to-ceiling'},
  {icon: 'security', label: 'Refuge Floors', value: 'Code-compliant<br />throughout'},
  {icon: 'parking', label: 'Parking', value: 'App-based<br />multi-level'},
  {icon: 'fallback', label: 'Sustainability', value: 'LEED Gold +<br />WELL Silver'},
  {icon: 'building', label: 'Architect', value: 'Aedas'},
  {icon: 'retail', label: 'Leasing', value: 'CBRE'},
  {icon: 'building', label: 'Location', value: 'Nanakramguda<br />Hyderabad CBD'},
].map((s, i) => ({_key: `spec-${i}`, _type: 'spec', ...s}))

const amenities = [
  {icon: 'dining', name: 'Multi-cuisine Food Court'},
  {icon: 'theatre', name: '9-Screen Multiplex'},
  {icon: 'retail', name: 'Luxury Retail'},
  {icon: 'security', name: 'Executive Club'},
  {icon: 'pool', name: 'Wellness Deck & Pool'},
  {icon: 'gym', name: 'Health Club'},
  {icon: 'retail', name: 'Mini Mart'},
  {icon: 'ev', name: 'EV Charging & Valet'},
  {icon: 'building', name: 'Conference Suites'},
  {icon: 'security', name: 'Clinic & Pharmacy'},
].map((a, i) => ({_key: `amen-${i}`, _type: 'amenity', ...a}))

const res = await client
  .patch('project-sas-itower')
  .set({
    'pageBuilder[_key=="k337"].title': 'The tallest <em>business</em><br />tower in Hyderabad.',
    'pageBuilder[_key=="k343"].head.heading': 'Engineered for those who <em>build</em> the future.',
    'pageBuilder[_key=="k350"].head.heading': 'Premium commercial spaces in <em>Nanakramguda</em>, Hyderabad.',
    'pageBuilder[_key=="k351"].head.eyebrow': 'Amenities',
    'pageBuilder[_key=="k351"].head.heading': 'Crafted for <em>work-life</em> balance.',
    'pageBuilder[_key=="k351"].head.dek':
      'A complete ecosystem on site — across the office floors, the wellness deck, and the podium retail block.',
    'pageBuilder[_key=="k358"].head.heading': 'Tour <em>SAS iTower</em><br />at Nanakramguda.',
    'pageBuilder[_key=="k358"].head.dek':
      'Leave the details below and our leasing team — alongside CBRE — will be in touch within one business day to arrange a private tour of the experience centre and a walk-through of available floor plates.',
    specifications,
    amenities,
  })
  .commit()
console.log('patched', res._id, 'rev', res._rev)
