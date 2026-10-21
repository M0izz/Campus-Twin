import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCampusStore } from '../../store/useCampusStore';

// Stylized architectural tree positions across campus groves and plazas
const TREE_POSITIONS: Array<{ x: number; z: number; scale: number; type: 'oak' | 'pine' | 'maple' }> = [
  // Central Quad perimeter trees
  { x: -16, z: -10, scale: 1.1, type: 'oak' },
  { x: -16, z: 14, scale: 1.0, type: 'oak' },
  { x: 16, z: -10, scale: 1.15, type: 'oak' },
  { x: 16, z: 14, scale: 1.05, type: 'oak' },
  { x: -8, z: -12, scale: 0.9, type: 'maple' },
  { x: 8, z: -12, scale: 0.95, type: 'maple' },
  { x: -8, z: 16, scale: 0.9, type: 'maple' },
  { x: 8, z: 16, scale: 0.92, type: 'maple' },
  // North Promenade tree line
  { x: -38, z: -34, scale: 1.2, type: 'pine' },
  { x: -20, z: -34, scale: 1.1, type: 'pine' },
  { x: 20, z: -34, scale: 1.15, type: 'pine' },
  { x: 38, z: -34, scale: 1.25, type: 'pine' },
  // South Promenade tree line
  { x: -38, z: 38, scale: 1.1, type: 'pine' },
  { x: -18, z: 38, scale: 1.05, type: 'pine' },
  { x: 18, z: 38, scale: 1.1, type: 'pine' },
  { x: 38, z: 38, scale: 1.2, type: 'pine' },
  // West Courtyard grove (near Bio & Physics)
  { x: -48, z: -16, scale: 1.1, type: 'oak' },
  { x: -48, z: 2, scale: 1.25, type: 'oak' },
  { x: -48, z: 20, scale: 1.0, type: 'maple' },
  // East Plaza grove (near Hopper & Hawking)
  { x: 48, z: -16, scale: 1.05, type: 'oak' },
  { x: 48, z: 2, scale: 1.2, type: 'oak' },
  { x: 48, z: 20, scale: 1.1, type: 'maple' },
  // Corner gardens (near Dorms & Conservatory)
  { x: -44, z: -50, scale: 1.3, type: 'oak' },
  { x: 44, z: -50, scale: 1.2, type: 'maple' },
  { x: -44, z: 50, scale: 1.15, type: 'pine' },
  { x: 44, z: 50, scale: 1.25, type: 'oak' },
];

// Pedestrian LED Lampposts lining walkways
const LAMPPOST_POSITIONS = [
  { x: -14, z: -3, rot: 0 },
  { x: 14, z: -3, rot: Math.PI },
  { x: -14, z: 7, rot: 0 },
  { x: 14, z: 7, rot: Math.PI },
  { x: 0, z: -20, rot: -Math.PI / 2 },
  { x: 0, z: 24, rot: Math.PI / 2 },
  { x: -36, z: -3, rot: 0 },
  { x: 36, z: -3, rot: Math.PI },
  { x: -48, z: -28, rot: 0 },
  { x: 48, z: -28, rot: Math.PI },
  { x: -48, z: 32, rot: 0 },
  { x: 48, z: 32, rot: Math.PI },
];

// Outdoor Quad Benches
const BENCH_POSITIONS = [
  { x: -4, z: -8, rot: 0 },
  { x: 4, z: -8, rot: 0 },
  { x: -4, z: 12, rot: Math.PI },
  { x: 4, z: 12, rot: Math.PI },
  { x: -12, z: 2, rot: Math.PI / 2 },
  { x: 12, z: 2, rot: -Math.PI / 2 },
];

export const CampusGround: React.FC = () => {
  const scenario = useCampusStore((s) => s.scenario);
  const spatialBounds = scenario.spatialBounds;
  const pathways = scenario.pathways;
  const isDemo = scenario.isDemo ?? (scenario.id === 'campus-twin-main-quad');

  // Compute ground scale and campus parcel boundary
  const { groundSize, parcelCenter, parcelSize } = useMemo(() => {
    if (spatialBounds) {
      const width = Math.max(220, spatialBounds.widthMeters);
      const depth = Math.max(180, spatialBounds.depthMeters);
      const cX = (spatialBounds.minX + spatialBounds.maxX) / 2;
      const cZ = (spatialBounds.minZ + spatialBounds.maxZ) / 2;
      return {
        groundSize: Math.max(650, Math.max(width, depth) * 2.2),
        parcelCenter: [cX, 0.01, cZ] as [number, number, number],
        parcelSize: [width, depth] as [number, number],
      };
    }
    return {
      groundSize: 650,
      parcelCenter: [0, 0.01, 2] as [number, number, number],
      parcelSize: [220, 180] as [number, number],
    };
  }, [spatialBounds]);

  const halfW = parcelSize[0] / 2;
  const halfD = parcelSize[1] / 2;

  // Compile real OSM pathway line geometries
  const pathwayGeometries = useMemo(() => {
    if (!pathways || pathways.length === 0) return [];
    return pathways
      .filter((p) => p.points.length >= 2)
      .map((p) => {
        const points = p.points.map((pt) => new THREE.Vector3(pt.x, 0.02, pt.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return {
          id: p.id,
          geometry,
          type: p.type,
        };
      });
  }, [pathways]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* 1. Expansive Regional Basemap Terrain in Warm Ivory #F7F4ED */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#F7F4ED" roughness={0.92} metalness={0.01} />
      </mesh>

      {/* Cartographic Coordinate Grid lines across region */}
      <gridHelper
        args={[groundSize * 0.85, 48, '#DFDAD0', '#EAE6DC']}
        position={[0, 0.005, 0]}
      />

      {/* 2. Campus Boundary Parcel Polygon in Subtle Surface #FAF8F3 */}
      <mesh position={parcelCenter} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={parcelSize} />
        <meshStandardMaterial color="#FAF8F3" roughness={0.88} />
      </mesh>

      {/* Perimeter Boundary Line */}
      <lineLoop position={parcelCenter} rotation={[-Math.PI / 2, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -halfW, -halfD, 0,
                 halfW, -halfD, 0,
                 halfW,  halfD, 0,
                -halfW,  halfD, 0,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#8FC9BE" linewidth={2} />
      </lineLoop>

      {/* 3. Real OpenStreetMap Streets & Pathways */}
      {pathwayGeometries.length > 0 ? (
        <group>
          {pathwayGeometries.map((pw) => {
            const mat = new THREE.LineBasicMaterial({
              color: pw.type === 'road' ? '#D3CDC0' : '#8FC9BE',
              linewidth: pw.type === 'road' ? 2 : 1.5,
              transparent: true,
              opacity: pw.type === 'road' ? 0.75 : 0.55,
            });
            const lineObj = new THREE.Line(pw.geometry, mat);
            return <primitive key={pw.id} object={lineObj} />;
          })}
        </group>
      ) : isDemo ? (
        /* Demo Mode: Comprehensive Cambridge Innovation Campus Masterplan */
        <group>
          {/* Main East-West North Avenue */}
          <mesh position={[0, 0.012, -38]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 9]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>
          {/* Main East-West South Avenue */}
          <mesh position={[0, 0.012, 42]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 9]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>

          {/* Far North & Far South Perimeter Access Roads */}
          <mesh position={[0, 0.012, -72]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 7]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.012, 72]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 7]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>

          {/* West Campus Boulevard (connecting Bio, Physics, Dorms) */}
          <mesh position={[-48, 0.012, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 144]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>
          {/* East Campus Boulevard (connecting Hopper, Hawking, Conservatory) */}
          <mesh position={[48, 0.012, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 144]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>

          {/* Central North-South Promenade (connecting Shannon Tower & Chancellor Hall) */}
          <mesh position={[0, 0.016, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6, 140]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.7} />
          </mesh>

          {/* East-West Pedestrian Promenade through Central Quad */}
          <mesh position={[0, 0.016, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[110, 6]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.7} />
          </mesh>

          {/* Central Quad Lawn in Soft Sage #D7E9DF */}
          <mesh position={[0, 0.014, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[56, 46]} />
            <meshStandardMaterial color="#D7E9DF" roughness={0.85} />
          </mesh>

          {/* West & East Secondary Quad Greens */}
          <mesh position={[-48, 0.014, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color="#DBEADE" roughness={0.85} />
          </mesh>
          <mesh position={[48, 0.014, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color="#DBEADE" roughness={0.85} />
          </mesh>

          {/* Central Quad Architectural Reflecting Pool / Fountain */}
          <group position={[0, 0.018, 2]}>
            {/* Stone Coping Rim */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[5.2, 5.9, 32]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
            </mesh>
            {/* Water Pool Disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[5.2, 32]} />
              <meshStandardMaterial
                color="#60A5FA"
                roughness={0.1}
                metalness={0.3}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Center Fountain Spire Pedestal */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.35, 0.5, 0.9, 16]} />
              <meshStandardMaterial color="#94A3B8" roughness={0.4} />
            </mesh>
          </group>

          {/* Diagonal Crosswalks connecting Quad corners */}
          <mesh position={[-16, 0.017, -10]} rotation={[-Math.PI / 2, 0, 0.65]}>
            <planeGeometry args={[22, 2.8]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.7} />
          </mesh>
          <mesh position={[16, 0.017, -10]} rotation={[-Math.PI / 2, 0, -0.65]}>
            <planeGeometry args={[22, 2.8]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.7} />
          </mesh>
          <mesh position={[-16, 0.017, 14]} rotation={[-Math.PI / 2, 0, -0.65]}>
            <planeGeometry args={[22, 2.8]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.7} />
          </mesh>
          <mesh position={[16, 0.017, 14]} rotation={[-Math.PI / 2, 0, 0.65]}>
            <planeGeometry args={[22, 2.8]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.7} />
          </mesh>
        </group>
      ) : null}

      {/* =========================================================================
          CAMPUS ENVIRONMENT ASSETS: 3D Trees, Lampposts, Benches
          ========================================================================= */}
      {/* 1. Procedural 3D Trees */}
      <group>
        {TREE_POSITIONS.map((tree, idx) => (
          <group
            key={`tree-${idx}`}
            position={[tree.x, 0, tree.z]}
            scale={[tree.scale, tree.scale, tree.scale]}
          >
            {/* Tree Trunk */}
            <mesh position={[0, 1.4, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.28, 2.8, 8]} />
              <meshStandardMaterial color="#5C4436" roughness={0.85} />
            </mesh>

            {/* Tree Foliage: Tiered Canopies */}
            {tree.type === 'oak' ? (
              <group position={[0, 3.2, 0]}>
                <mesh position={[0, 0, 0]} castShadow>
                  <sphereGeometry args={[1.5, 12, 10]} />
                  <meshStandardMaterial color="#2E6B38" roughness={0.75} />
                </mesh>
                <mesh position={[0, 1.0, 0]} castShadow>
                  <sphereGeometry args={[1.2, 10, 8]} />
                  <meshStandardMaterial color="#3B8246" roughness={0.75} />
                </mesh>
              </group>
            ) : tree.type === 'pine' ? (
              <group position={[0, 2.2, 0]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                  <coneGeometry args={[1.6, 2.4, 8]} />
                  <meshStandardMaterial color="#214D32" roughness={0.8} />
                </mesh>
                <mesh position={[0, 2.0, 0]} castShadow>
                  <coneGeometry args={[1.2, 2.0, 8]} />
                  <meshStandardMaterial color="#2A603E" roughness={0.8} />
                </mesh>
              </group>
            ) : (
              <group position={[0, 3.0, 0]}>
                <mesh position={[0, 0, 0]} castShadow>
                  <sphereGeometry args={[1.4, 10, 10]} />
                  <meshStandardMaterial color="#3D7A4A" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.9, 0]} castShadow>
                  <sphereGeometry args={[1.05, 8, 8]} />
                  <meshStandardMaterial color="#559964" roughness={0.7} />
                </mesh>
              </group>
            )}
          </group>
        ))}
      </group>

      {/* 2. Modern LED Pedestrian Lampposts */}
      <group>
        {LAMPPOST_POSITIONS.map((lp, idx) => (
          <group
            key={`lamp-${idx}`}
            position={[lp.x, 0, lp.z]}
            rotation={[0, lp.rot, 0]}
          >
            {/* Base Pedestal */}
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.15, 0.18, 0.4, 8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Pole */}
            <mesh position={[0, 2.1, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 3.8, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Horizontal Arm */}
            <mesh position={[0.4, 3.9, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.8, 6]} />
              <meshStandardMaterial color="#334155" metalness={0.6} />
            </mesh>
            {/* Luminaire Fixture Head */}
            <mesh position={[0.75, 3.85, 0]}>
              <boxGeometry args={[0.3, 0.06, 0.14]} />
              <meshStandardMaterial color="#0F172A" metalness={0.8} />
            </mesh>
            {/* Glowing Lamp Lens */}
            <mesh position={[0.75, 3.81, 0]}>
              <planeGeometry args={[0.26, 0.12]} />
              <meshBasicMaterial color="#FEF3C7" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. Teak Wood & Cast Iron Quad Benches */}
      <group>
        {BENCH_POSITIONS.map((bench, idx) => (
          <group
            key={`bench-${idx}`}
            position={[bench.x, 0, bench.z]}
            rotation={[0, bench.rot, 0]}
          >
            {/* Cast Iron Legs */}
            <mesh position={[-0.8, 0.25, 0]}>
              <boxGeometry args={[0.06, 0.5, 0.45]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh position={[0.8, 0.25, 0]}>
              <boxGeometry args={[0.06, 0.5, 0.45]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Teak Wood Slats Seat */}
            <mesh position={[0, 0.42, 0]} castShadow>
              <boxGeometry args={[1.8, 0.05, 0.42]} />
              <meshStandardMaterial color="#9A6B43" roughness={0.6} />
            </mesh>
            {/* Teak Wood Backrest */}
            <mesh position={[0, 0.72, -0.19]} castShadow>
              <boxGeometry args={[1.8, 0.35, 0.04]} />
              <meshStandardMaterial color="#9A6B43" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
