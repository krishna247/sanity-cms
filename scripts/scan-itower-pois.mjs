// scan-itower-pois.mjs
// ---------------------------------------------------------------------------
// RANGE SCAN of relevant POIs around SAS iTower for a Grade-A COMMERCIAL tower
// location story. Uses Google Places API (New) `searchNearby` per relevant type
// within a radius, ranked by popularity, then pulls traffic-aware drive times
// (Routes API) from the tower. Prints a human table + a JSON candidate list to
// curate from. Schools / residential amenities are intentionally NOT scanned.
//
// Usage:  GOOGLE_MAPS_API_KEY=xxxx node scripts/scan-itower-pois.mjs
// APIs needed: Places API (New) + Routes API.
// ---------------------------------------------------------------------------
const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) { console.error('Set GOOGLE_MAPS_API_KEY in the environment first.'); process.exit(1); }

const ITOWER = { latitude: 17.419178012275573, longitude: 78.36055538892053 };
const RADIUS = 7000; // metres — covers Financial District, Gachibowli, Madhapur, HITEC City

// Place types relevant to a commercial office tower (NOT schools/residential).
const TYPE_GROUPS = [
  { label: 'Metro / Transit',     types: ['subway_station', 'train_station', 'transit_station'] },
  { label: 'Office / Business',   types: ['corporate_office'] },
  { label: 'Hotel',               types: ['hotel'] },
  { label: 'Hospital',            types: ['hospital'] },
  { label: 'Mall / Retail',       types: ['shopping_mall', 'department_store'] },
  { label: 'Convention / Events', types: ['convention_center', 'event_venue', 'performing_arts_theater'] },
  { label: 'Landmark / Leisure',  types: ['tourist_attraction', 'stadium', 'golf_course'] },
];

async function nearby(types) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.displayName,places.location,places.primaryType,places.rating,places.userRatingCount,places.formattedAddress',
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 12,
      locationRestriction: { circle: { center: ITOWER, radius: RADIUS } },
      rankPreference: 'POPULARITY',
    }),
  });
  const d = await res.json();
  if (d.error) { console.error(`  API error for [${types.join(',')}]:`, JSON.stringify(d.error.message || d.error)); return []; }
  return (d.places || []).map((p) => ({
    name: p.displayName?.text, type: p.primaryType,
    rating: p.rating ?? null, reviews: p.userRatingCount ?? 0,
    lat: p.location.latitude, lng: p.location.longitude, addr: p.formattedAddress,
  }));
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
      travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE',
    }),
  });
  return res.json();
}

// --- scan ---
const all = [];
const seen = new Set();
for (const g of TYPE_GROUPS) {
  const places = await nearby(g.types);
  for (const p of places) {
    if (!p.name) continue;
    const k = `${p.name}|${p.lat.toFixed(3)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    all.push({ ...p, group: g.label });
  }
}

// cap drive-matrix size (traffic-aware element limit), keep the most-reviewed first
all.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
const scored = all.slice(0, 60);

const matrix = await driveTimes(scored);
const byDest = {};
for (const row of matrix) byDest[row.destinationIndex] = row;
scored.forEach((g, i) => {
  const row = byDest[i] || {};
  g.km = row.distanceMeters ? +(row.distanceMeters / 1000).toFixed(1) : null;
  g.driveMinutes = row.duration ? Math.round(parseInt(row.duration) / 60) : null;
});

scored.sort((a, b) => (a.driveMinutes ?? 1e9) - (b.driveMinutes ?? 1e9));

console.log(`\n=== Range scan around SAS iTower (${RADIUS / 1000} km radius) — ${scored.length} candidates ===\n`);
for (const g of scored) {
  const stars = g.rating ? `★${g.rating} (${g.reviews})` : '';
  console.log(`${String(g.driveMinutes).padStart(3)} min ${String(g.km).padStart(5)} km  [${g.group}]  ${g.name}  ${stars}`);
  console.log(`           ${g.type || ''}  ·  ${g.addr || ''}`);
}

console.log('\n=== JSON (curate from this) ===\n');
console.log(JSON.stringify(scored.map((g) => ({
  name: g.name, group: g.group, type: g.type, rating: g.rating, reviews: g.reviews,
  driveMinutes: g.driveMinutes, km: g.km, lat: g.lat, lng: g.lng,
})), null, 2));
