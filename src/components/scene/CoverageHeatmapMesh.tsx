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

  // Grid dimensions
  const gridWidth = 140;
  const gridDepth = 120;
  const segmentsX = 52;
  const segmentsZ = 46;

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
      const point = { x: vx, y: 1.0, z: vz };

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

      // Convert maxRssi to color:
      // RSSI range: -85 (blue/cold) -> -75 (cyan) -> -65 (green) -> -55 (yellow) -> -45 (orange/red)
      let r = 0, g = 0, b = 0, a = 0.5;

      if (maxRssi <= -82) {
        // Edge / Low coverage (cerulean blue fade)
        r = 0.12;
        g = 0.35;
        b = 0.75;
        a = Math.max(0.04, (maxRssi + 92) / 10 * 0.2);
      } else if (maxRssi <= -72) {
        // Cyan / Teal
        const t = (maxRssi - (-82)) / 10;
        r = 0.05 + t * 0.08;
        g = 0.55 + t * 0.35;
        b = 0.85 - t * 0.3;
        a = 0.35 + t * 0.15;
      } else if (maxRssi <= -62) {
        // Emerald Green (Good service)
        const t = (maxRssi - (-72)) / 10;
        r = 0.15 + t * 0.65;
        g = 0.88;
        b = 0.35 - t * 0.25;
        a = 0.5 + t * 0.1;
      } else if (maxRssi <= -50) {
        // Golden Yellow (Strong service)
        const t = (maxRssi - (-62)) / 12;
        r = 0.92 + t * 0.06;
        g = 0.82 - t * 0.35;
        b = 0.1;
        a = 0.6 + t * 0.1;
      } else {
        // Peak Orange / Red (Maximum direct line-of-sight)
        const t = Math.min(1.0, (maxRssi - (-50)) / 15);
        r = 0.98;
        g = 0.42 - t * 0.2;
        b = 0.1;
        a = 0.7;
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
  }, [accessPoints, buildings, modelConfig, gridWidth, gridDepth, segmentsX, segmentsZ]);

  if (!showHeatmap || !geometry || !hasCoverage) {
    return null;
  }

  return (
    <mesh geometry={geometry} receiveShadow>
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
