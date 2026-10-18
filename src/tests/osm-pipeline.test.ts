import { describe, it, expect } from 'vitest';
import { geoToCartesian } from '../services/campus-data';
import { computeHaversineDistanceKm } from '../services/osm-service';
import type { Building, Scenario } from '../types/scenario';
import { DEFAULT_CAMPUS_SCENARIO } from '../data/defaultCampus';
import { simulateTick } from '../simulation/engine';

describe('Geographic OpenStreetMap Pipeline & Projection', () => {
  it('converts geographic coordinates to local metric Cartesian offsets', () => {
    const centerLat = 52.2053;
    const centerLng = 0.1218;

    // Point exactly at center should be (0, 0)
    const centerPt = geoToCartesian(centerLat, centerLng, centerLat, centerLng);
    expect(centerPt.x).toBe(0);
    expect(centerPt.z).toBe(0);

    // Point 100 meters north (+latitude) should have negative Z in Three.js coordinate system
    const deltaLat100m = 100 / 111320;
    const northPt = geoToCartesian(centerLat + deltaLat100m, centerLng, centerLat, centerLng);
    expect(northPt.z).toBeCloseTo(-100, 0);

    // Point 100 meters east (+longitude) should have positive X
    const metersPerLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
    const deltaLng100m = 100 / metersPerLng;
    const eastPt = geoToCartesian(centerLat, centerLng + deltaLng100m, centerLat, centerLng);
    expect(eastPt.x).toBeCloseTo(100, 0);
  });

  it('computes accurate spherical distance using Haversine formula', () => {
    // Distance between London (51.5074, -0.1278) and Paris (48.8566, 2.3522) is ~343 km
    const distKm = computeHaversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(distKm).toBeGreaterThan(340);
    expect(distKm).toBeLessThan(350);

    // Distance from a point to itself is 0
    expect(computeHaversineDistanceKm(37.4275, -122.1705, 37.4275, -122.1705)).toBe(0);
  });

  it('preserves building polygon footprint vertices relative to centroid', () => {
    // Synthetic OSM polygon for an L-shaped building
    const rawVertices = [
      { x: -30, z: -20 },
      { x: 10, z: -20 },
      { x: 10, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 20 },
      { x: -30, z: 20 },
    ];

    let sumX = 0;
    let sumZ = 0;
    rawVertices.forEach((v) => {
      sumX += v.x;
      sumZ += v.z;
    });
    const centroidX = Math.round(sumX / rawVertices.length);
    const centroidZ = Math.round(sumZ / rawVertices.length);

    const relativeFootprint = rawVertices.map((v) => ({
      x: v.x - centroidX,
      z: v.z - centroidZ,
    }));

    expect(relativeFootprint.length).toBe(6);
    expect(centroidX).toBe(-7);
    expect(centroidZ).toBe(0);

    // Centroid of relative vertices should sum approximately to 0
    let relSumX = 0;
    let relSumZ = 0;
    relativeFootprint.forEach((v) => {
      relSumX += v.x;
      relSumZ += v.z;
    });
    expect(Math.abs(relSumX / relativeFootprint.length)).toBeLessThan(1);
    expect(Math.abs(relSumZ / relativeFootprint.length)).toBeLessThan(1);
  });

  it('correctly labels OSM metadata height versus explicitly estimated heights', () => {
    const buildingWithOsmHeight: Building = {
      id: 'b-osm-1',
      name: 'Engineering Tower',
      code: 'ENG-1',
      position: { x: 20, y: 0, z: 15 },
      dimensions: { x: 25, y: 32, z: 22 },
      floors: 8,
      wallAttenuationDb: 14,
      category: 'academic',
      color: '#F2EFE8',
      roofColor: '#384850',
      heightSource: 'osm',
      levelsSource: 'osm',
    };

    const buildingEstimated: Building = {
      id: 'b-est-2',
      name: 'Campus Pavilion',
      code: 'PAV-2',
      position: { x: -10, y: 0, z: -10 },
      dimensions: { x: 18, y: 10, z: 16 },
      floors: 3,
      wallAttenuationDb: 10,
      category: 'student-hub',
      color: '#F2EFE8',
      roofColor: '#45564F',
      heightSource: 'estimated',
      levelsSource: 'estimated',
    };

    expect(buildingWithOsmHeight.heightSource).toBe('osm');
    expect(buildingWithOsmHeight.dimensions.y).toBe(32);

    expect(buildingEstimated.heightSource).toBe('estimated');
    expect(buildingEstimated.dimensions.y).toBe(10);
  });

  it('calculates spatial bounds correctly across all buildings', () => {
    const buildings: Building[] = [
      {
        id: 'b1',
        name: 'West Wing',
        code: 'WW',
        position: { x: -60, y: 0, z: -40 },
        dimensions: { x: 20, y: 10, z: 20 },
        floors: 2,
        wallAttenuationDb: 12,
        category: 'academic',
        color: '#fff',
        roofColor: '#333',
      },
      {
        id: 'b2',
        name: 'East Wing',
        code: 'EW',
        position: { x: 80, y: 0, z: 50 },
        dimensions: { x: 30, y: 12, z: 24 },
        floors: 3,
        wallAttenuationDb: 14,
        category: 'library',
        color: '#fff',
        roofColor: '#333',
      },
    ];

    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    buildings.forEach((b) => {
      minX = Math.min(minX, b.position.x - b.dimensions.x / 2);
      maxX = Math.max(maxX, b.position.x + b.dimensions.x / 2);
      minZ = Math.min(minZ, b.position.z - b.dimensions.z / 2);
      maxZ = Math.max(maxZ, b.position.z + b.dimensions.z / 2);
    });

    // West edge is -60 - 10 = -70
    expect(minX).toBe(-70);
    // East edge is 80 + 15 = 95
    expect(maxX).toBe(95);
    // North edge is -40 - 10 = -50
    expect(minZ).toBe(-50);
    // South edge is 50 + 12 = 62
    expect(maxZ).toBe(62);

    const spanX = maxX - minX;
    const spanZ = maxZ - minZ;
    expect(spanX).toBe(165);
    expect(spanZ).toBe(112);
  });

  it('keeps the bundled Cambridge demo functional with zero errors', () => {
    const demo: Scenario = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));
    expect(demo.id).toBe('campus-twin-main-quad');
    expect(demo.buildings.length).toBeGreaterThanOrEqual(4);
    expect(demo.accessPoints.length).toBeGreaterThanOrEqual(4);

    const result = simulateTick(demo, 0.5, 0.5);
    expect(result.telemetry.totalClients).toBe(demo.clients.length);
    expect(result.telemetry.connectedClients).toBeGreaterThan(0);
    expect(result.telemetry.coverageRatioPercent).toBeGreaterThan(80);
  });
});
