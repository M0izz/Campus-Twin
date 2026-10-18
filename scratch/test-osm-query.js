// Test script to verify real OpenStreetMap Overpass building footprint ingestion
const fetch = globalThis.fetch;

async function testFetchOsm() {
  console.log('--- Testing OpenStreetMap Nominatim Search ---');
  const searchUrl = 'https://nominatim.openstreetmap.org/search?q=Massachusetts+Institute+of+Technology&format=json&limit=1';
  const res = await fetch(searchUrl, {
    headers: { 'User-Agent': 'CampusTwin-Test/1.0' }
  });
  const data = await res.json();
  if (!data || data.length === 0) {
    console.error('No results from Nominatim');
    return;
  }

  const mit = data[0];
  const lat = parseFloat(mit.lat);
  const lon = parseFloat(mit.lon);
  console.log(`Found MIT: ${mit.display_name.split(',')[0]} at (${lat}, ${lon})`);

  console.log('\n--- Testing Overpass API Footprint Query ---');
  const radius = 250; // meters
  const deltaLat = radius / 111320;
  const deltaLon = radius / (111320 * Math.cos(lat * Math.PI / 180));

  const south = lat - deltaLat;
  const north = lat + deltaLat;
  const west = lon - deltaLon;
  const east = lon + deltaLon;

  const query = `
    [out:json][timeout:15];
    (
      way["building"](${south},${west},${north},${east});
      way["highway"~"footway|path|pedestrian"](${south},${west},${north},${east});
    );
    out body geom 30;
  `;

  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  console.log(`Querying ${overpassUrl} with bounding box [${south.toFixed(4)}, ${west.toFixed(4)}, ${north.toFixed(4)}, ${east.toFixed(4)}]...`);

  const opRes = await fetch(overpassUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'CampusTwin-Test/1.0'
    },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!opRes.ok) {
    console.error(`Overpass HTTP error: ${opRes.status} ${opRes.statusText}`);
    return;
  }

  const opData = await opRes.json();
  const elements = opData.elements || [];
  const buildings = elements.filter(e => e.tags && e.tags.building && e.geometry);
  const paths = elements.filter(e => e.tags && e.tags.highway && e.geometry);

  console.log(`\nSuccess! Retrieved:`);
  console.log(`- ${buildings.length} real building footprints`);
  console.log(`- ${paths.length} real pedestrian pathways`);

  if (buildings.length > 0) {
    const sample = buildings[0];
    console.log(`\nSample Building:`);
    console.log(`- Name: ${sample.tags.name || 'Unnamed Building'}`);
    console.log(`- OSM Way ID: ${sample.id}`);
    console.log(`- Levels/Height: ${sample.tags['building:levels'] || sample.tags.height || 'Estimated'}`);
    console.log(`- Polygon vertices: ${sample.geometry.length} points`);
    console.log(`- First 2 vertices:`, sample.geometry.slice(0, 2));
  }
}

testFetchOsm().catch(console.error);
