// build-itower-pois.mjs
// ---------------------------------------------------------------------------
// Regenerates the SAS iTower location-map "points of interest" — geocodes each
// landmark by name (Google Places API, New) and pulls a traffic-aware drive
// time from the tower (Google Routes API · computeRouteMatrix), then prints:
//   1. a human-readable table (sorted by drive time), and
//   2. a Sanity-ready `pointsOfInterest` array you can paste/patch into the
//      sas-itower project's locationMapBlock (key "itMap").
//
// The POIs live in the CMS (locationMapBlock.pointsOfInterest), which is the
// source of truth — this script is just how we refresh coordinates/times.
//
// Usage:
//   GOOGLE_MAPS_API_KEY=xxxx node scripts/build-itower-pois.mjs
//
// The key needs ONLY these two APIs enabled on its Cloud project:
//   • Places API (New)   — geocoding by name
//   • Routes API         — drive distance + time
// (Geocoding API / Distance Matrix are NOT required.)
//
// NOTE: the key is read from the environment and is never written to disk or
// committed. It is used at build time only — the map itself renders keyless
// (MapLibre + OpenFreeMap), so this key never ships in the frontend bundle.
// ---------------------------------------------------------------------------

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.error('Set GOOGLE_MAPS_API_KEY in the environment first.');
  process.exit(1);
}

// iTower origin — must match the project geopoint + the 3D model placement in
// frontend/public/map-3d.js (SAS_ITOWER). Do not change without updating both.
const ITOWER = { latitude: 17.419178012275573, longitude: 78.36055538892053 };

// Curated landmarks for a Grade-A commercial-tower location story. Edit this
// list to add/drop POIs, then re-run and patch the CMS with the output.
// `category` is the short label shown in the legend; `query` is the Places
// text search (include "Hyderabad" / the locality to disambiguate).
const POIS = [
  { category: 'Hospital',      query: 'Continental Hospitals Nanakramguda Hyderabad' },
  { category: 'Landmark',      query: 'IKEA Hyderabad Hitech City' },
  { category: 'Metro Station', query: 'Raidurg Metro Station Hyderabad' },
  { category: 'Institution',   query: 'Indian School of Business Hyderabad' },
  { category: 'Hotel',         query: 'ITC Kohenur Hyderabad' },
  { category: 'Retail',        query: 'Sarath City Capital Mall Hyderabad' },
  { category: 'Airport',       query: 'Rajiv Gandhi International Airport Hyderabad' },
  // Swap options (geocoded clean, currently unused):
  // { category: 'Hospital',     query: 'AIG Hospitals Gachibowli Hyderabad' },
  // { category: 'Retail',       query: 'Inorbit Mall Madhapur Hyderabad' },
  // { category: 'Tech Campus',  query: 'Microsoft India Development Center Gachibowli Hyderabad' },
];

// Short display names per query (keeps leader-ring labels compact). Falls back
// to the Places displayName when a query isn't listed here.
const DISPLAY_NAME = {
  'Continental Hospitals Nanakramguda Hyderabad': 'Continental Hospitals',
  'IKEA Hyderabad Hitech City': 'IKEA Hyderabad',
  'Raidurg Metro Station Hyderabad': 'Raidurg Metro',
  'Indian School of Business Hyderabad': 'Indian School of Business',
  'ITC Kohenur Hyderabad': 'ITC Kohenur',
  'Sarath City Capital Mall Hyderabad': 'Sarath City Mall',
  'Rajiv Gandhi International Airport Hyderabad': 'RGI Airport',
};

async function place(q) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: q }),
  });
  const d = await res.json();
  const p = d.places?.[0];
  if (!p) throw new Error(`No Places result for: ${q}`);
  return { name: p.displayName?.text, addr: p.formattedAddress, lat: p.location.latitude, lng: p.location.longitude };
}

async function driveTimes(dests) {
  const res = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,condition',
    },
    body: JSON.stringify({
      origins: [{ waypoint: { location: { latLng: ITOWER } } }],
      destinations: dests.map((d) => ({ waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } } })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    }),
  });
  return res.json();
}

const geo = [];
for (const poi of POIS) {
  const g = await place(poi.query);
  geo.push({ category: poi.category, name: DISPLAY_NAME[poi.query] || g.name, addr: g.addr, lat: g.lat, lng: g.lng });
}

const matrix = await driveTimes(geo);
const byDest = {};
for (const row of matrix) byDest[row.destinationIndex] = row;
geo.forEach((g, i) => {
  const row = byDest[i] || {};
  g.km = row.distanceMeters ? +(row.distanceMeters / 1000).toFixed(1) : null;
  g.driveMinutes = row.duration ? Math.round(parseInt(row.duration) / 60) : null;
});

geo.sort((a, b) => (a.driveMinutes ?? 1e9) - (b.driveMinutes ?? 1e9));

console.log('\n=== iTower POIs (sorted by drive time) ===\n');
for (const g of geo) {
  console.log(`${String(g.driveMinutes).padStart(3)} min  ${String(g.km).padStart(5)} km  [${g.category}]  ${g.name}`);
  console.log(`           ${g.lat.toFixed(6)}, ${g.lng.toFixed(6)}  ·  ${g.addr}`);
}

// Sanity-ready array for locationMapBlock.pointsOfInterest (omit _key — Sanity
// assigns one on insert). Patch path:
//   pageBuilder[_key=="itMap"].pointsOfInterest
const sanityArray = geo.map((g) => ({
  _type: 'poi',
  name: g.name,
  category: g.category,
  driveMinutes: g.driveMinutes,
  location: { _type: 'geopoint', lat: g.lat, lng: g.lng },
}));
console.log('\n=== Sanity pointsOfInterest array ===\n');
console.log(JSON.stringify(sanityArray, null, 2));
