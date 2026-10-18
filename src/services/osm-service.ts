import type {
  Building,
  AccessPoint,
  Client,
  Scenario,
  CampusSpatialBounds,
  CampusPathway,
  BuildingPoint,
} from '../types/scenario';
import { geoToCartesian } from './campus-data';

export interface DiscoveredCampus {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  source: 'osm' | 'curated' | 'user';
  attribution: string;
  distanceKm?: number;
  rawType?: string;
}

export interface OsmFetchResult {
  success: boolean;
  scenario?: Scenario;
  error?: string;
  buildingCount?: number;
  pathwayCount?: number;
  attribution?: string;
}

// Reliable public Overpass API mirrors
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://kumi.systems/api/interpreter',
];

/**
 * Searches for real educational institutions near a geographic coordinate using
 * OpenStreetMap Nominatim reverse geocoding + Overpass / Nominatim search.
 */
export async function discoverNearbyCampuses(
  lat: number,
  lng: number,
  radiusKm = 25
): Promise<{ success: boolean; campuses: DiscoveredCampus[]; error?: string }> {
  try {
    // 1. First reverse geocode the user's coordinate to get local city/country
    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    let userCity = 'Nearby';
    let userCountry = '';

    try {
      const revRes = await fetch(reverseUrl, {
        headers: { 'User-Agent': 'CampusTwin-DigitalTwin/2.0 (contact@campustwin.org)' },
      });
      if (revRes.ok) {
        const revData = await revRes.json();
        userCity =
          revData.address?.city ||
          revData.address?.town ||
          revData.address?.municipality ||
          revData.address?.county ||
          'Nearby';
        userCountry = revData.address?.country || '';
      }
    } catch {
      // Continue to search even if reverse geocode fails
    }

    // 2. Query Overpass API for educational amenity nodes/ways within radiusKm
    const radiusMeters = Math.min(radiusKm * 1000, 30000);
    const overpassQuery = `
      [out:json][timeout:12];
      (
        nwr["amenity"="university"](around:${radiusMeters},${lat},${lng});
        nwr["amenity"="college"](around:${radiusMeters},${lat},${lng});
        nwr["campus"="university"](around:${radiusMeters},${lat},${lng});
      );
      out center tags 12;
    `;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'CampusTwin-DigitalTwin/2.0',
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const elements: any[] = data.elements || [];

          if (elements.length > 0) {
            const seen = new Set<string>();
            const campuses: DiscoveredCampus[] = [];

            for (const el of elements) {
              const name = el.tags?.name || el.tags?.['name:en'] || el.tags?.operator;
              if (!name || seen.has(name.toLowerCase())) continue;
              seen.add(name.toLowerCase());

              const cLat = el.lat || el.center?.lat;
              const cLng = el.lon || el.center?.lon;
              if (!cLat || !cLng) continue;

              const distKm = computeHaversineDistanceKm(lat, lng, cLat, cLng);

              campuses.push({
                id: `osm-node-${el.id}`,
                name: name,
                shortName: name.length > 32 ? name.slice(0, 30) + '...' : name,
                city: el.tags?.['addr:city'] || userCity,
                country: el.tags?.['addr:country'] || userCountry,
                coordinates: { lat: cLat, lng: cLng },
                bounds: {
                  north: cLat + 0.0035,
                  south: cLat - 0.0035,
                  east: cLng + 0.0045,
                  west: cLng - 0.0045,
                },
                source: 'osm',
                attribution: 'OpenStreetMap contributors (ODbL)',
                distanceKm: Math.round(distKm * 10) / 10,
                rawType: el.tags?.amenity || 'university',
              });
            }

            if (campuses.length > 0) {
              campuses.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
              return { success: true, campuses };
            }
          }
        }
      } catch {
        // Try next endpoint on failure
        continue;
      }
    }

    // 3. Fallback: Query Nominatim with bounded box around user coordinates
    const delta = radiusKm / 111.0;
    const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=university+OR+college&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=8`;

    const nomRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'CampusTwin-DigitalTwin/2.0' },
    });

    if (nomRes.ok) {
      const items = await nomRes.json();
      if (Array.isArray(items) && items.length > 0) {
        const campuses: DiscoveredCampus[] = items.map((item: any) => {
          const cLat = parseFloat(item.lat);
          const cLng = parseFloat(item.lon);
          const name = item.display_name.split(',')[0];
          const bb = item.boundingbox?.map(parseFloat) || [
            cLat - 0.003,
            cLat + 0.003,
            cLng - 0.004,
            cLng + 0.004,
          ];

          return {
            id: `osm-${item.osm_id}`,
            name,
            shortName: name,
            city: item.address?.city || item.address?.town || userCity,
            country: item.address?.country || userCountry,
            coordinates: { lat: cLat, lng: cLng },
            bounds: {
              south: Math.min(bb[0], bb[1]),
              north: Math.max(bb[0], bb[1]),
              west: Math.min(bb[2], bb[3]),
              east: Math.max(bb[2], bb[3]),
            },
            source: 'osm',
            attribution: 'OpenStreetMap contributors (ODbL)',
            distanceKm: Math.round(computeHaversineDistanceKm(lat, lng, cLat, cLng) * 10) / 10,
          };
        });

        campuses.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        return { success: true, campuses };
      }
    }

    return {
      success: false,
      campuses: [],
      error: `No university or college found within ${radiusKm}km of your location. Try searching by name or load demo mode.`,
    };
  } catch (err: any) {
    return {
      success: false,
      campuses: [],
      error: err.message || 'Failed to search nearby campuses',
    };
  }
}

/**
 * Searches OpenStreetMap Nominatim for universities/campuses by keyword query.
 */
export async function searchCampusesOnline(query: string): Promise<DiscoveredCampus[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    clean
  )}&format=json&addressdetails=1&limit=8`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CampusTwin-DigitalTwin/2.0' },
    });

    if (!res.ok) return [];
    const items = await res.json();

    return items.map((item: any) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const name = item.display_name.split(',')[0];
      const bb = item.boundingbox?.map(parseFloat) || [
        lat - 0.003,
        lat + 0.003,
        lng - 0.004,
        lng + 0.004,
      ];

      return {
        id: `osm-${item.osm_id}`,
        name,
        shortName: name,
        city: item.address?.city || item.address?.town || item.address?.state || 'Campus',
        country: item.address?.country || '',
        coordinates: { lat, lng },
        bounds: {
          south: Math.min(bb[0], bb[1]),
          north: Math.max(bb[0], bb[1]),
          west: Math.min(bb[2], bb[3]),
          east: Math.max(bb[2], bb[3]),
        },
        source: 'osm',
        attribution: 'OpenStreetMap contributors (ODbL)',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Retrieves actual building footprint polygons and pathways from OpenStreetMap Overpass API
 * for a confirmed campus area, and compiles them into a complete 3D simulation scenario.
 */
export async function fetchOsmCampusScenario(
  campus: DiscoveredCampus,
  options: {
    maxBuildings?: number;
    customRadiusMeters?: number;
    includePathways?: boolean;
  } = {}
): Promise<OsmFetchResult> {
  const maxBuildings = options.maxBuildings || 60;
  const radiusMeters = options.customRadiusMeters || 280;

  // Compute bounding box around campus center in degrees
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((campus.coordinates.lat * Math.PI) / 180);

  const deltaLat = radiusMeters / metersPerDegreeLat;
  const deltaLng = radiusMeters / metersPerDegreeLng;

  const south = campus.coordinates.lat - deltaLat;
  const north = campus.coordinates.lat + deltaLat;
  const west = campus.coordinates.lng - deltaLng;
  const east = campus.coordinates.lng + deltaLng;

  // Build Overpass QL Query for actual building footprints and pathways
  const overpassQuery = `
    [out:json][timeout:15];
    (
      way["building"](${south},${west},${north},${east});
      relation["building"](${south},${west},${north},${east});
      way["highway"~"footway|path|pedestrian|service|cycleway"](${south},${west},${north},${east});
    );
    out body geom ${maxBuildings + 40};
  `;

  let lastError = '';

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CampusTwin-DigitalTwin/2.0',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        lastError = `Overpass HTTP ${res.status}: ${res.statusText}`;
        continue;
      }

      const data = await res.json();
      const elements: any[] = data.elements || [];

      const buildingWays = elements.filter(
        (el) => el.tags?.building && el.geometry && el.geometry.length >= 3
      );
      const pathwayWays = elements.filter(
        (el) => el.tags?.highway && el.geometry && el.geometry.length >= 2
      );

      if (buildingWays.length === 0) {
        return {
          success: false,
          error: `No building footprint geometry found in OpenStreetMap for ${campus.name}. Try expanding the radius or select a different campus.`,
        };
      }

      // Compile buildings into metric coordinate system
      const centerLat = campus.coordinates.lat;
      const centerLng = campus.coordinates.lng;

      const buildings: Building[] = [];
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;

      for (let i = 0; i < buildingWays.length; i++) {
        const way = buildingWays[i];
        const geom: Array<{ lat: number; lon: number }> = way.geometry;

        // Project all polygon vertices into local metric Cartesian coordinates
        const metricVertices: BuildingPoint[] = geom.map((g) => {
          const pt = geoToCartesian(g.lat, g.lon, centerLat, centerLng);
          return { x: pt.x, z: pt.z };
        });

        // Compute centroid of polygon
        let sumX = 0;
        let sumZ = 0;
        metricVertices.forEach((v) => {
          sumX += v.x;
          sumZ += v.z;
        });
        const centroidX = Math.round(sumX / metricVertices.length);
        const centroidZ = Math.round(sumZ / metricVertices.length);

        // Compute local footprint vertices relative to centroid
        const relativeFootprint: BuildingPoint[] = metricVertices.map((v) => ({
          x: v.x - centroidX,
          z: v.z - centroidZ,
        }));

        // Compute bounding box dimensions
        let bMinX = Infinity,
          bMaxX = -Infinity,
          bMinZ = Infinity,
          bMaxZ = -Infinity;
        relativeFootprint.forEach((v) => {
          if (v.x < bMinX) bMinX = v.x;
          if (v.x > bMaxX) bMaxX = v.x;
          if (v.z < bMinZ) bMinZ = v.z;
          if (v.z > bMaxZ) bMaxZ = v.z;
        });

        const widthM = Math.max(8, Math.round(bMaxX - bMinX));
        const depthM = Math.max(8, Math.round(bMaxZ - bMinZ));

        // Skip abnormal or microscopic geometry
        if (widthM < 4 && depthM < 4) continue;

        // Determine height and floor metadata from OSM tags
        let heightM = 10;
        let floors = 3;
        let heightSource: 'osm' | 'estimated' = 'estimated';
        let levelsSource: 'osm' | 'estimated' = 'estimated';

        if (way.tags.height) {
          const parsedH = parseFloat(way.tags.height.replace(/[^\d.]/g, ''));
          if (!isNaN(parsedH) && parsedH > 3 && parsedH < 120) {
            heightM = parsedH;
            heightSource = 'osm';
            floors = Math.max(1, Math.round(heightM / 3.5));
          }
        }

        if (way.tags['building:levels']) {
          const parsedL = parseInt(way.tags['building:levels'], 10);
          if (!isNaN(parsedL) && parsedL >= 1 && parsedL < 35) {
            floors = parsedL;
            levelsSource = 'osm';
            if (heightSource === 'estimated') {
              heightM = floors * 3.5;
            }
          }
        }

        // Categorize building
        const nameTag = way.tags.name || way.tags['name:en'] || '';
        const lowerName = nameTag.toLowerCase();
        let category: Building['category'] = 'academic';
        if (lowerName.includes('library') || way.tags.amenity === 'library') {
          category = 'library';
        } else if (
          lowerName.includes('student') ||
          lowerName.includes('commons') ||
          lowerName.includes('union') ||
          lowerName.includes('cafeteria')
        ) {
          category = 'student-hub';
        } else if (lowerName.includes('auditorium') || lowerName.includes('hall')) {
          category = 'academic';
        }

        // Architectural materials based on Palette A
        let color = '#F2EFE8';
        let roofColor = '#384850';
        if (category === 'library') {
          roofColor = '#4A5C66';
        } else if (category === 'student-hub') {
          roofColor = '#5C4D44';
        }

        const bldgId = `osm-bldg-${way.id || i + 1}`;
        const bldgName = nameTag || `${campus.shortName} Building ${i + 1}`;
        const bldgCode =
          nameTag
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 4)
            .toUpperCase() + `-${i + 1}`;

        buildings.push({
          id: bldgId,
          name: bldgName,
          code: bldgCode,
          position: { x: centroidX, y: 0, z: centroidZ },
          dimensions: { x: widthM, y: Math.round(heightM), z: depthM },
          floors,
          wallAttenuationDb: category === 'library' ? 12 : 14,
          category,
          color,
          roofColor,
          footprint: relativeFootprint,
          geoCoordinates: geom.map((g) => ({ lat: g.lat, lng: g.lon })),
          heightSource,
          levelsSource,
          osmId: `${way.id}`,
        });

        // Update overall spatial bounds
        minX = Math.min(minX, centroidX - widthM / 2);
        maxX = Math.max(maxX, centroidX + widthM / 2);
        minZ = Math.min(minZ, centroidZ - depthM / 2);
        maxZ = Math.max(maxZ, centroidZ + depthM / 2);
      }

      if (buildings.length === 0) {
        return {
          success: false,
          error: `Could not parse valid building polygons from OpenStreetMap for ${campus.name}.`,
        };
      }

      // Parse campus pathways
      const pathways: CampusPathway[] = [];
      pathwayWays.forEach((pw, pIdx) => {
        const pts: BuildingPoint[] = pw.geometry.map((g: any) => {
          const pt = geoToCartesian(g.lat, g.lon, centerLat, centerLng);
          return { x: pt.x, z: pt.z };
        });
        pathways.push({
          id: `osm-path-${pw.id || pIdx}`,
          name: pw.tags?.name,
          type: pw.tags?.highway || 'path',
          points: pts,
        });
      });

      const pad = 25;
      const spatialBounds: CampusSpatialBounds = {
        minX: minX - pad,
        maxX: maxX + pad,
        minZ: minZ - pad,
        maxZ: maxZ + pad,
        widthMeters: Math.round(maxX - minX + pad * 2),
        depthMeters: Math.round(maxZ - minZ + pad * 2),
        centerGeo: { lat: centerLat, lng: centerLng },
      };

      // Generate realistic Access Points tailored to these real buildings
      const accessPoints = generateRealisticAccessPoints(buildings);

      // Generate realistic Clients walking pathways and inside buildings
      const clients = generateRealisticClients(buildings, pathways, accessPoints);

      const scenario: Scenario = {
        schemaVersion: 2,
        id: `campus-${campus.id}-${Date.now().toString().slice(-4)}`,
        name: campus.name,
        description: `Authentic digital twin constructed from OpenStreetMap footprints (${buildings.length} buildings, ${pathways.length} pathways).`,
        seed: 42,
        durationSeconds: 300,
        buildings,
        accessPoints,
        clients,
        modelConfig: {
          pathLossExponent: 3.0,
          referenceDistanceM: 1.0,
          referenceLossDbm: 40.0,
          minimumRssiDbm: -82,
          simulationStepSeconds: 0.5,
          wallDefaultAttenuationDb: 12,
        },
        spatialBounds,
        pathways,
        geographicCenter: { lat: centerLat, lng: centerLng },
        attribution: 'Map data © OpenStreetMap contributors (ODbL) via Overpass API',
        isDemo: false,
      };

      return {
        success: true,
        scenario,
        buildingCount: buildings.length,
        pathwayCount: pathways.length,
        attribution: 'OpenStreetMap contributors (ODbL)',
      };
    } catch (err: any) {
      lastError = err.message || 'Network error';
      continue;
    }
  }

  return {
    success: false,
    error: `Failed to fetch OSM geometry from Overpass API mirrors (${lastError}). Please check network connectivity or try demo mode.`,
  };
}

/**
 * Places realistic Wi-Fi Access Points within authentic building centroids and outdoor quads.
 */
function generateRealisticAccessPoints(buildings: Building[]): AccessPoint[] {
  const aps: AccessPoint[] = [];
  const channels5G = [36, 44, 149, 157, 161, 40, 48, 153];

  // Distribute APs inside major buildings
  const sortedBuildings = [...buildings].sort(
    (a, b) => b.dimensions.x * b.dimensions.z - a.dimensions.x * a.dimensions.z
  );

  const selectedForAp = sortedBuildings.slice(0, Math.min(10, buildings.length));

  selectedForAp.forEach((b, idx) => {
    const ch = channels5G[idx % channels5G.length];
    // AP on Floor 1
    aps.push({
      id: `ap-${b.id}-1f`,
      name: `AP-${b.code}-1F`,
      buildingId: b.id,
      position: {
        x: b.position.x,
        y: 3.5,
        z: b.position.z,
      },
      band: '5GHz',
      channel: ch,
      channelWidthMhz: 80,
      transmitPowerDbm: 20,
      antennaGainDbi: 4,
      capacityMbps: 867,
      status: 'online',
      model: 'Cisco Catalyst 9124AXE',
    });

    // If multi-floor and large, add upper floor AP
    if (b.floors >= 3 && b.dimensions.x > 20) {
      aps.push({
        id: `ap-${b.id}-2f`,
        name: `AP-${b.code}-2F`,
        buildingId: b.id,
        position: {
          x: b.position.x + 4,
          y: 7.0,
          z: b.position.z + 4,
        },
        band: '5GHz',
        channel: channels5G[(idx + 3) % channels5G.length],
        channelWidthMhz: 80,
        transmitPowerDbm: 20,
        antennaGainDbi: 4,
        capacityMbps: 867,
        status: 'online',
        model: 'Cisco Catalyst 9130AXI',
      });
    }
  });

  return aps;
}

/**
 * Generates simulated mobile and stationary clients within building footprints and paths.
 */
function generateRealisticClients(
  buildings: Building[],
  pathways: CampusPathway[],
  _aps?: AccessPoint[]
): Client[] {
  const clients: Client[] = [];
  let clientIdx = 1;

  // 1. Stationary and walking clients inside buildings
  buildings.slice(0, 8).forEach((b) => {
    const count = Math.min(4, Math.max(1, Math.round((b.dimensions.x * b.dimensions.z) / 400)));
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * (b.dimensions.x * 0.6);
      const offsetZ = (Math.random() - 0.5) * (b.dimensions.z * 0.6);

      clients.push({
        id: `cli-${clientIdx}`,
        name: `Student-${clientIdx}`,
        position: {
          x: Math.round(b.position.x + offsetX),
          y: 1.2,
          z: Math.round(b.position.z + offsetZ),
        },
        movementSpeedMps: i % 2 === 0 ? 0 : 0.8,
        demandMbps: Math.round((1.5 + Math.random() * 4.5) * 10) / 10,
        mobilityProfile: i % 2 === 0 ? 'stationary' : 'walking',
        connected: true,
      });
      clientIdx++;
    }
  });

  // 2. Roaming clients walking between buildings / along pathways
  if (pathways.length > 0) {
    pathways.slice(0, 4).forEach((path, pIdx) => {
      if (path.points.length >= 2) {
        const waypoints = path.points.map((pt) => ({ x: pt.x, y: 1.2, z: pt.z }));
        clients.push({
          id: `cli-roam-${pIdx + 1}`,
          name: `Pedestrian-${pIdx + 1}`,
          position: { ...waypoints[0] },
          movementSpeedMps: 1.3,
          demandMbps: 2.8,
          mobilityProfile: 'roaming',
          connected: true,
          waypointIndex: 0,
          waypoints,
        });
      }
    });
  }

  return clients;
}

/**
 * Computes great-circle distance between two lat/long points using Haversine formula.
 */
export function computeHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
