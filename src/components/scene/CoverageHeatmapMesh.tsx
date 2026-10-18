import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCampusStore } from '../../store/useCampusStore';
import { calculateRssi } from '../../simulation/radio-model';
import { calculateObstacleAttenuation } from '../../simulation/engine';

export const CoverageHeatmapMesh: React.FC = () => {
  const showHeatmap = useCampusStore((s) => s.visualLayers.heatmap);
  const heatmapOpacity = useCampusStore((s) => s.heatmapOpacity);
  const accessPoints = useCampusStore((s) => s.scenario.accessPoints);
  const buildings = useCampusStore((s) => s.scenario.buildings);
  const modelConfig = useCampusStore((s) => s.scenario.modelConfig);
  const spatialBounds = useCampusStore((s) => s.scenario.spatialBounds);

  // Derive grid dimensions and center from real campus geometry
  const { gridWidth, gridDepth, centerX, centerZ } = useMemo(() => {
    if (spatialBounds) {
      return {
        gridWidth: Math.max(120, spatialBounds.widthMeters),
        gridDepth: Math.max(100, spatialBounds.depthMeters),
        centerX: (spatialBounds.minX + spatialBounds.maxX) / 2,
        centerZ: (spatialBounds.minZ + spatialBounds.maxZ) / 2,
      };
    }
    // Calculate from buildings and APs if spatialBounds missing
    if (buildings.length > 0 || accessPoints.length > 0) {
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
      accessPoints.forEach((ap) => {
        minX = Math.min(minX, ap.position.x - 30);
        maxX = Math.max(maxX, ap.position.x + 30);
        minZ = Math.min(minZ, ap.position.z - 30);
        maxZ = Math.max(maxZ, ap.position.z + 30);
      });
      const pad = 20;
      return {
        gridWidth: Math.max(120, Math.round(maxX - minX + pad * 2)),
        gridDepth: Math.max(100, Math.round(maxZ - minZ + pad * 2)),
        centerX: Math.round((minX + maxX) / 2),
        centerZ: Math.round((minZ + maxZ) / 2),
      };
    }
    return { gridWidth: 140, gridDepth: 120, centerX: 0, centerZ: 0 };
  }, [spatialBounds, buildings, accessPoints]);

  const segmentsX = Math.min(64, Math.max(36, Math.round(gridWidth / 3.5)));
  const segmentsZ = Math.min(60, Math.max(32, Math.round(gridDepth / 3.5)));

  const { geometry, hasCoverage } = useMemo(() => {
    const onlineAps = accessPoints.filter((ap) => ap.status !== 'offline');
    if (onlineAps.length === 0) {
      return { geometry: null, hasCoverage: false };
    }

    const geo = new THREE.PlaneGeometry(gridWidth, gridDepth, segmentsX, segmentsZ);
    geo.rotateX(-Math.PI / 2); // Lay flat on X-Z plane

    const posAttr = geo.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 4); // RGBA

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Absolute world coordinate
      const point = { x: vx + centerX, y: 1.0, z: vz + centerZ };

      // Find max RSSI among online APs
      let maxRssi = -120;
      for (const ap of onlineAps) {
        const wallAtten = calculateObstacleAttenuation(
          ap,
          point,
          buildings,
          modelConfig.wallDefaultAttenuationDb
        );
        const rssi = calculateRssi(ap, point, modelConfig, wallAtten, 0);
        if (rssi > maxRssi) {
          maxRssi = rssi;
        }
      }

      // Palette A RF spectrum mapping:
      // Low signal: soft sky blue fade
      // Fair signal: soft teal/sea glass
      // Good signal: vibrant botanical emerald
      // Peak signal: warm amber/peach peak
      let r = 0,
        g = 0,
        b = 0,
        a = 0.5;

      if (maxRssi <= -82) {
        // Edge / Low coverage (soft sky blue fade)
        r = 0.2;
        g = 0.45;
        b = 0.85;
        a = Math.max(0.04, ((maxRssi + 92) / 10) * 0.25);
      } else if (maxRssi <= -72) {
        // Sea glass / Teal
        const t = (maxRssi - -82) / 10;
        r = 0.1 + t * 0.2;
        g = 0.65 + t * 0.25;
        b = 0.8 - t * 0.2;
        a = 0.35 + t * 0.15;
      } else if (maxRssi <= -62) {
        // Botanical Emerald (#287A50)
        const t = (maxRssi - -72) / 10;
        r = 0.15 + t * 0.6;
        g = 0.88;
        b = 0.35 - t * 0.25;
        a = 0.5 + t * 0.15;
      } else if (maxRssi <= -50) {
        // Golden Yellow / Warm Amber
        const t = (maxRssi - -62) / 12;
        r = 0.92 + t * 0.06;
        g = 0.82 - t * 0.35;
        b = 0.1;
        a = 0.65 + t * 0.1;
      } else {
        // Peak Warm Peach / Coral
        const t = Math.min(1.0, (maxRssi - -50) / 15);
        r = 0.96;
        g = 0.48 - t * 0.15;
        b = 0.15;
        a = 0.75;
      }

      const cIdx = i * 4;
      colors[cIdx] = r;
      colors[cIdx + 1] = g;
      colors[cIdx + 2] = b;
      colors[cIdx + 3] = a;

      // Gentle 3D topological relief
      const elevation = Math.max(0, (maxRssi + 85) * 0.015);
      posAttr.setY(i, 0.06 + elevation);
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    geo.computeVertexNormals();

    return { geometry: geo, hasCoverage: true };
  }, [accessPoints, buildings, modelConfig, gridWidth, gridDepth, segmentsX, segmentsZ, centerX, centerZ]);

  if (!showHeatmap || !geometry || !hasCoverage) {
    return null;
  }

  return (
    <mesh position={[centerX, 0, centerZ]} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={heatmapOpacity}
        roughness={0.6}
        metalness={0.05}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
