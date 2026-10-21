import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCampusStore } from '../../store/useCampusStore';
import { calculateRssi } from '../../simulation/radio-model';
import { calculateObstacleAttenuation } from '../../simulation/engine';

export const CoverageHeatmapMesh: React.FC = () => {
  const showHeatmap = useCampusStore((s) => s.visualLayers.heatmap);
  const heatmapMetric = useCampusStore((s) => s.visualLayers.heatmapMetric ?? 'rssi');
  const heatmapOpacity = useCampusStore((s) => s.heatmapOpacity);
  const accessPoints = useCampusStore((s) => s.scenario.accessPoints);
  const buildings = useCampusStore((s) => s.scenario.buildings);
  const modelConfig = useCampusStore((s) => s.scenario.modelConfig);
  const spatialBounds = useCampusStore((s) => s.scenario.spatialBounds);
  const apLoads = useCampusStore((s) => s.apLoads);

  // Compute coverage grid dimensions encompassing all campus buildings and APs
  const { gridWidth, gridDepth, centerX, centerZ, minX, minZ } = useMemo(() => {
    if (spatialBounds) {
      const w = Math.max(160, spatialBounds.widthMeters);
      const d = Math.max(140, spatialBounds.depthMeters);
      const cX = (spatialBounds.minX + spatialBounds.maxX) / 2;
      const cZ = (spatialBounds.minZ + spatialBounds.maxZ) / 2;
      return {
        gridWidth: w + 40,
        gridDepth: d + 40,
        centerX: cX,
        centerZ: cZ,
        minX: cX - (w + 40) / 2,
        minZ: cZ - (d + 40) / 2,
      };
    }

    let bMinX = -80,
      bMaxX = 80,
      bMinZ = -70,
      bMaxZ = 70;

    if (buildings.length > 0 || accessPoints.length > 0) {
      bMinX = Infinity;
      bMaxX = -Infinity;
      bMinZ = Infinity;
      bMaxZ = -Infinity;

      buildings.forEach((b) => {
        bMinX = Math.min(bMinX, b.position.x - b.dimensions.x / 2);
        bMaxX = Math.max(bMaxX, b.position.x + b.dimensions.x / 2);
        bMinZ = Math.min(bMinZ, b.position.z - b.dimensions.z / 2);
        bMaxZ = Math.max(bMaxZ, b.position.z + b.dimensions.z / 2);
      });

      accessPoints.forEach((ap) => {
        bMinX = Math.min(bMinX, ap.position.x - 30);
        bMaxX = Math.max(bMaxX, ap.position.x + 30);
        bMinZ = Math.min(bMinZ, ap.position.z - 30);
        bMaxZ = Math.max(bMaxZ, ap.position.z + 30);
      });
    }

    const pad = 24;
    const w = Math.max(160, Math.round(bMaxX - bMinX + pad * 2));
    const d = Math.max(140, Math.round(bMaxZ - bMinZ + pad * 2));
    const cX = Math.round((bMinX + bMaxX) / 2);
    const cZ = Math.round((bMinZ + bMaxZ) / 2);

    return {
      gridWidth: w,
      gridDepth: d,
      centerX: cX,
      centerZ: cZ,
      minX: cX - w / 2,
      minZ: cZ - d / 2,
    };
  }, [spatialBounds, buildings, accessPoints]);

  // Generate radiant, per-pixel alpha RF heatmap texture
  const heatmapTexture = useMemo(() => {
    const onlineAps = accessPoints.filter((ap) => ap.status !== 'offline');
    if (onlineAps.length === 0) return null;

    // Grid resolution: 192 x 192 produces smooth contours with fast rendering
    const resX = 192;
    const resZ = 192;

    const canvas = document.createElement('canvas');
    canvas.width = resX;
    canvas.height = resZ;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(resX, resZ);
    const data = imgData.data;

    const dx = gridWidth / (resX - 1);
    const dz = gridDepth / (resZ - 1);

    for (let pz = 0; pz < resZ; pz++) {
      const worldZ = minZ + pz * dz;
      for (let px = 0; px < resX; px++) {
        const worldX = minX + px * dx;
        const point = { x: worldX, y: 1.0, z: worldZ };

        let maxRssi = -120;
        let associatedApLoad = 0;

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
            const load = apLoads[ap.id]?.utilization ?? 0.2;
            associatedApLoad = load;
          }
        }

        const pixelIndex = (pz * resX + px) * 4;

        if (heatmapMetric === 'congestion') {
          // Congestion / Channel load metric
          if (maxRssi < -82) {
            data[pixelIndex] = 0;
            data[pixelIndex + 1] = 0;
            data[pixelIndex + 2] = 0;
            data[pixelIndex + 3] = 0;
          } else {
            const util = associatedApLoad; // 0.0 to 1.0
            let r = 40, g = 180, b = 100;
            if (util > 0.8) {
              r = 230; g = 50; b = 50;
            } else if (util > 0.5) {
              r = 240; g = 160; b = 30;
            }
            data[pixelIndex] = r;
            data[pixelIndex + 1] = g;
            data[pixelIndex + 2] = b;
            data[pixelIndex + 3] = Math.floor(Math.min(230, 80 + util * 140));
          }
        } else {
          // Scientific Wi-Fi RSSI Signal Strength Heatmap (dBm)
          // Threshold: below -85 dBm fades to transparent
          if (maxRssi <= -86) {
            data[pixelIndex] = 0;
            data[pixelIndex + 1] = 0;
            data[pixelIndex + 2] = 0;
            data[pixelIndex + 3] = 0;
          } else {
            let r = 0, g = 0, b = 0, a = 0;

            if (maxRssi <= -78) {
              // Edge signal (-86 to -78 dBm): Deep Royal Blue to Sky Cyan
              const t = (maxRssi - -86) / 8;
              r = Math.floor(25 + t * 5);
              g = Math.floor(80 + t * 90);
              b = Math.floor(220 + t * 25);
              a = Math.floor(60 + t * 110);
            } else if (maxRssi <= -68) {
              // Fair signal (-78 to -68 dBm): Sky Cyan to Radiant Emerald
              const t = (maxRssi - -78) / 10;
              r = Math.floor(30 + t * 5);
              g = Math.floor(170 + t * 30);
              b = Math.floor(245 - t * 165);
              a = Math.floor(170 + t * 40);
            } else if (maxRssi <= -56) {
              // Good signal (-68 to -56 dBm): Botanical Emerald to Lime Yellow
              const t = (maxRssi - -68) / 12;
              r = Math.floor(35 + t * 195);
              g = Math.floor(200 + t * 10);
              b = Math.floor(80 - t * 65);
              a = Math.floor(210 + t * 25);
            } else if (maxRssi <= -44) {
              // High signal (-56 to -44 dBm): Lime Yellow to Warm Amber/Orange
              const t = (maxRssi - -56) / 12;
              r = Math.floor(230 + t * 20);
              g = Math.floor(210 - t * 90);
              b = Math.floor(15 + t * 5);
              a = 235;
            } else {
              // Peak signal (> -44 dBm): Warm Orange to Intense Coral
              const t = Math.min(1.0, (maxRssi - -44) / 15);
              r = Math.floor(250 + t * 5);
              g = Math.floor(120 - t * 60);
              b = Math.floor(20 + t * 35);
              a = 245;
            }

            // Subtle iso-contour line modulation for technical RF clarity
            const isContour = Math.abs(maxRssi % 5) < 0.35;
            if (isContour) {
              r = Math.min(255, Math.floor(r * 1.15 + 20));
              g = Math.min(255, Math.floor(g * 1.15 + 20));
              b = Math.min(255, Math.floor(b * 1.15 + 20));
              a = Math.min(255, a + 15);
            }

            data[pixelIndex] = r;
            data[pixelIndex + 1] = g;
            data[pixelIndex + 2] = b;
            data[pixelIndex + 3] = a;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    return texture;
  }, [accessPoints, buildings, modelConfig, gridWidth, gridDepth, minX, minZ, heatmapMetric, apLoads]);

  if (!showHeatmap || !heatmapTexture) {
    return null;
  }

  return (
    <mesh
      position={[centerX, 0.035, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[gridWidth, gridDepth]} />
      <meshBasicMaterial
        map={heatmapTexture}
        transparent
        opacity={Math.max(0.1, Math.min(1.0, heatmapOpacity))}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
