import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCampusStore } from '../../store/useCampusStore';

export const CampusGround: React.FC = () => {
  const scenario = useCampusStore((s) => s.scenario);
  const spatialBounds = scenario.spatialBounds;
  const pathways = scenario.pathways;
  const isDemo = scenario.isDemo ?? (scenario.id === 'campus-twin-main-quad');

  // Compute ground scale and campus parcel boundary
  const { groundSize, parcelCenter, parcelSize } = useMemo(() => {
    if (spatialBounds) {
      const width = Math.max(160, spatialBounds.widthMeters);
      const depth = Math.max(140, spatialBounds.depthMeters);
      const cX = (spatialBounds.minX + spatialBounds.maxX) / 2;
      const cZ = (spatialBounds.minZ + spatialBounds.maxZ) / 2;
      return {
        groundSize: Math.max(500, Math.max(width, depth) * 2.2),
        parcelCenter: [cX, 0.01, cZ] as [number, number, number],
        parcelSize: [width, depth] as [number, number],
      };
    }
    return {
      groundSize: 500,
      parcelCenter: [0, 0.01, 2] as [number, number, number],
      parcelSize: [160, 140] as [number, number],
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
        args={[groundSize * 0.85, 40, '#E0DBD0', '#EAE6DC']}
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
        /* Demo Mode: Synthetic Cambridge Campus paths and quads */
        <group>
          {/* North Road */}
          <mesh position={[0, 0.012, -42]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[180, 8]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>
          {/* South Road */}
          <mesh position={[0, 0.012, 46]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[180, 8]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>
          {/* West Access Way */}
          <mesh position={[-52, 0.012, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 96]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>
          {/* East Access Way */}
          <mesh position={[52, 0.012, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 96]} />
            <meshStandardMaterial color="#E4DFD3" roughness={0.8} />
          </mesh>

          {/* Central Quad in Soft Sage #D7E9DF */}
          <mesh position={[0, 0.015, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[44, 38]} />
            <meshStandardMaterial color="#D7E9DF" roughness={0.85} />
          </mesh>
          {/* Pedestrian Promenade */}
          <mesh position={[0, 0.016, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 5]} />
            <meshStandardMaterial color="#EFECE3" roughness={0.65} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
