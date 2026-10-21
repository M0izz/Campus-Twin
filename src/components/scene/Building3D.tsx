import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Building } from '../../types/scenario';
import { useCampusStore } from '../../store/useCampusStore';

interface Building3DProps {
  building: Building;
}

export const Building3D: React.FC<Building3DProps> = ({ building }) => {
  const [hovered, setHovered] = useState(false);
  const selectedObject = useCampusStore((s) => s.selectedObject);
  const selectObject = useCampusStore((s) => s.selectObject);
  const transparentRoofs = useCampusStore((s) => s.visualLayers.transparentRoofs);
  const showLabels = useCampusStore((s) => s.visualLayers.labels);

  const isSelected = selectedObject.type === 'building' && selectedObject.id === building.id;

  const { dimensions, position, footprint } = building;
  const halfY = dimensions.y / 2;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    selectObject('building', building.id);
  };

  // Restrained architectural limestone & warm alabaster
  const facadeColor = isSelected ? '#FFFFFF' : hovered ? '#FAF8F3' : building.color || '#F2EFE8';

  // Coordinated Architectural Roofs (Deep slate, zinc, terracotta)
  const roofColor = useMemo(() => {
    const raw = building.roofColor;
    if (
      !raw ||
      raw === '#2563eb' ||
      raw === '#7c3aed' ||
      raw === '#059669' ||
      raw === '#16a34a' ||
      raw === '#6366f1' ||
      raw === '#334155'
    ) {
      switch (building.category) {
        case 'academic':
          return '#384850'; // deep architectural slate
        case 'library':
          return '#4A5C66'; // zinc slate with sky undertone
        case 'student-hub':
          return '#5C4D44'; // warm architectural terracotta/timber tone
        default:
          return '#45564F'; // muted architectural sage slate
      }
    }
    return raw;
  }, [building.roofColor, building.category]);

  // Construct 2D polygonal footprint shape if available from OpenStreetMap
  const polygonShape = useMemo(() => {
    if (!footprint || footprint.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(footprint[0].x, footprint[0].z);
    for (let i = 1; i < footprint.length; i++) {
      shape.lineTo(footprint[i].x, footprint[i].z);
    }
    shape.closePath();
    return shape;
  }, [footprint]);

  const extrudeSettings = useMemo(
    () => ({
      depth: dimensions.y,
      bevelEnabled: false,
    }),
    [dimensions.y]
  );

  const hasSolar = building.category === 'academic' && dimensions.x >= 28;
  const hasSpire = building.id.includes('shannon') || building.id.includes('chancellor') || building.id.includes('admin');
  const hasDome = building.id.includes('hawking') || building.id.includes('conservatory');

  return (
    <group
      position={[position.x, position.y, position.z]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ground Footprint Selection Accent in Sea Glass #8FC9BE */}
      {isSelected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dimensions.x + 2.4, dimensions.z + 2.4]} />
          <meshBasicMaterial color="#8FC9BE" transparent opacity={0.45} />
        </mesh>
      )}

      {/* Building Body: Polygonal Extrusion or Rich Rectangular Architectural Massing */}
      {polygonShape ? (
        <group>
          {/* Extruded polygonal massing */}
          <mesh
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[polygonShape, extrudeSettings]} />
            <meshStandardMaterial
              color={facadeColor}
              roughness={0.65}
              metalness={0.04}
            />
          </mesh>

          {/* Polygonal Roof Cap */}
          <mesh
            position={[0, dimensions.y + 0.05, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
          >
            <shapeGeometry args={[polygonShape]} />
            <meshStandardMaterial
              color={roofColor}
              roughness={0.6}
              metalness={0.08}
              transparent={transparentRoofs}
              opacity={transparentRoofs ? 0.25 : 1.0}
            />
          </mesh>
        </group>
      ) : (
        /* Rich Multi-tier Architectural Massing with All-side Glazing & Entrance Portal */
        <group>
          {/* Ground Foundation Plinth Step */}
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[dimensions.x + 0.6, 0.2, dimensions.z + 0.6]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>

          {/* Main Facade Massing */}
          <mesh position={[0, halfY, 0]} castShadow receiveShadow>
            <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
            <meshStandardMaterial
              color={facadeColor}
              roughness={0.6}
              metalness={0.04}
            />
          </mesh>

          {/* Recessed Window Ribbon Glazing on ALL 4 Facades (Front, Back, Left, Right) */}
          {Array.from({ length: building.floors }).map((_, fIdx) => {
            const floorHeight = dimensions.y / building.floors;
            const yPos = floorHeight * (fIdx + 0.5);
            return (
              <group key={`floor-${fIdx}`} position={[0, yPos, 0]}>
                {/* Front Windows (+Z) */}
                <mesh position={[0, 0, dimensions.z / 2 + 0.015]}>
                  <planeGeometry args={[dimensions.x * 0.88, floorHeight * 0.45]} />
                  <meshStandardMaterial
                    color="#334155"
                    roughness={0.12}
                    metalness={0.6}
                    transparent
                    opacity={0.88}
                  />
                </mesh>
                {/* Back Windows (-Z) */}
                <mesh
                  position={[0, 0, -dimensions.z / 2 - 0.015]}
                  rotation={[0, Math.PI, 0]}
                >
                  <planeGeometry args={[dimensions.x * 0.88, floorHeight * 0.45]} />
                  <meshStandardMaterial
                    color="#334155"
                    roughness={0.12}
                    metalness={0.6}
                    transparent
                    opacity={0.88}
                  />
                </mesh>
                {/* Left Windows (-X) */}
                <mesh
                  position={[-dimensions.x / 2 - 0.015, 0, 0]}
                  rotation={[0, -Math.PI / 2, 0]}
                >
                  <planeGeometry args={[dimensions.z * 0.84, floorHeight * 0.45]} />
                  <meshStandardMaterial
                    color="#334155"
                    roughness={0.12}
                    metalness={0.6}
                    transparent
                    opacity={0.88}
                  />
                </mesh>
                {/* Right Windows (+X) */}
                <mesh
                  position={[dimensions.x / 2 + 0.015, 0, 0]}
                  rotation={[0, Math.PI / 2, 0]}
                >
                  <planeGeometry args={[dimensions.z * 0.84, floorHeight * 0.45]} />
                  <meshStandardMaterial
                    color="#334155"
                    roughness={0.12}
                    metalness={0.6}
                    transparent
                    opacity={0.88}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Architectural Entrance Portal / Glass Canopy */}
          <group position={[0, 0, dimensions.z / 2]}>
            {/* Extended Glass Canopy */}
            <mesh position={[0, 2.6, 1.4]} castShadow>
              <boxGeometry args={[dimensions.x * 0.32, 0.12, 2.8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Entrance Support Pillars */}
            <mesh position={[-dimensions.x * 0.14, 1.3, 2.6]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 2.6, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[dimensions.x * 0.14, 1.3, 2.6]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 2.6, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            {/* Illuminated Glass Double Doors */}
            <mesh position={[0, 1.2, 0.02]}>
              <planeGeometry args={[dimensions.x * 0.22, 2.3]} />
              <meshStandardMaterial
                color="#60A5FA"
                roughness={0.1}
                metalness={0.5}
                transparent
                opacity={0.7}
              />
            </mesh>
          </group>

          {/* Architectural Roof Overhang Slab */}
          <mesh position={[0, dimensions.y + 0.12, 0]} castShadow>
            <boxGeometry args={[dimensions.x + 0.4, 0.25, dimensions.z + 0.4]} />
            <meshStandardMaterial
              color={roofColor}
              roughness={0.6}
              metalness={0.08}
              transparent={transparentRoofs}
              opacity={transparentRoofs ? 0.25 : 1.0}
            />
          </mesh>

          {/* Recessed Rooftop Inset */}
          {!transparentRoofs && (
            <mesh
              position={[0, dimensions.y + 0.26, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[dimensions.x * 0.88, dimensions.z * 0.88]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.85} />
            </mesh>
          )}

          {/* Rooftop Penthouse & Mechanical HVAC Units */}
          {!transparentRoofs && (
            <group position={[0, dimensions.y + 0.26, 0]}>
              {/* Elevator / Staircase Penthouse */}
              <mesh position={[-dimensions.x * 0.16, 0.6, 0]} castShadow>
                <boxGeometry args={[dimensions.x * 0.24, 1.2, dimensions.z * 0.32]} />
                <meshStandardMaterial color="#334155" roughness={0.7} />
              </mesh>

              {/* HVAC Chillers & Ventilation Ducting */}
              <mesh position={[dimensions.x * 0.18, 0.4, -dimensions.z * 0.14]} castShadow>
                <boxGeometry args={[dimensions.x * 0.18, 0.7, dimensions.z * 0.18]} />
                <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[dimensions.x * 0.18, 0.4, dimensions.z * 0.14]} castShadow>
                <boxGeometry args={[dimensions.x * 0.18, 0.7, dimensions.z * 0.18]} />
                <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.4} />
              </mesh>

              {/* Solar Panel Array on Roof */}
              {hasSolar && (
                <group position={[0, 0.2, 0]}>
                  {[-1, 1].map((side) => (
                    <mesh
                      key={`solar-${side}`}
                      position={[side * (dimensions.x * 0.24), 0.15, 0]}
                      rotation={[-0.2, 0, 0]}
                      castShadow
                    >
                      <boxGeometry args={[dimensions.x * 0.18, 0.04, dimensions.z * 0.45]} />
                      <meshStandardMaterial color="#1E3A8A" metalness={0.85} roughness={0.2} />
                    </mesh>
                  ))}
                </group>
              )}

              {/* Telecom Tower / Spire */}
              {hasSpire && (
                <group position={[0, 0.6, 0]}>
                  <mesh position={[0, 2.5, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.18, 5.0, 8]} />
                    <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                  </mesh>
                  {/* Flashing aviation warning beacon */}
                  <mesh position={[0, 5.05, 0]}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshBasicMaterial color="#EF4444" />
                  </mesh>
                </group>
              )}

              {/* Observatory Dome / Glass Lantern */}
              {hasDome && (
                <group position={[dimensions.x * 0.18, 0, 0]}>
                  <mesh position={[0, 1.2, 0]} castShadow>
                    <sphereGeometry args={[dimensions.z * 0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#CBD5E1" metalness={0.7} roughness={0.25} />
                  </mesh>
                </group>
              )}
            </group>
          )}
        </group>
      )}

      {/* Contextual Architectural Tag: Shown on hover or when selected */}
      {(showLabels || hovered || isSelected) && (
        <Html
          position={[0, dimensions.y + 2.4, 0]}
          center
          distanceFactor={45}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            onClick={handlePointerDown}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${isSelected ? '#8FC9BE' : '#E2E8F0'}`,
              padding: '4px 10px',
              borderRadius: '6px',
              boxShadow: isSelected
                ? '0 0 0 2px rgba(143, 201, 190, 0.45), 0 4px 14px rgba(15, 23, 42, 0.12)'
                : '0 2px 8px rgba(15, 23, 42, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11.5px',
              color: '#1E293B',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                color: '#10B981',
                background: '#ECFDF5',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '10.5px',
              }}
            >
              {building.code}
            </span>
            <span>{building.name}</span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'IBM Plex Mono', monospace",
                color: '#64748B',
                borderLeft: '1px solid #E2E8F0',
                paddingLeft: '6px',
              }}
            >
              {dimensions.y}m · {building.floors}F
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
