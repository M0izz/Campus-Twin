import React, { useState } from 'react';
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

  const { dimensions, position } = building;
  const halfY = dimensions.y / 2;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    selectObject('building', building.id);
  };

  // Palette A: Restrained architectural limestone & warm alabaster
  const facadeColor = hovered ? '#FAF8F3' : '#F2EFE8';

  // Coordinated Palette A Architectural Roofs (Deep slate, zinc, terracotta)
  const roofColor = (() => {
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
  })();

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
          <planeGeometry args={[dimensions.x + 1.4, dimensions.z + 1.4]} />
          <meshBasicMaterial color="#8FC9BE" transparent opacity={0.45} />
        </mesh>
      )}

      {/* Building Concrete / Limestone Body */}
      <mesh position={[0, halfY, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
        <meshStandardMaterial
          color={facadeColor}
          roughness={0.6}
          metalness={0.04}
        />
      </mesh>

      {/* Recessed Window Ribbon Glazing per Floor */}
      {Array.from({ length: building.floors }).map((_, fIdx) => {
        const floorHeight = dimensions.y / building.floors;
        const yPos = floorHeight * (fIdx + 0.5);
        return (
          <group key={fIdx} position={[0, yPos, 0]}>
            {/* Front Windows */}
            <mesh position={[0, 0, dimensions.z / 2 + 0.015]}>
              <planeGeometry args={[dimensions.x * 0.9, floorHeight * 0.42]} />
              <meshStandardMaterial
                color="#42545B"
                roughness={0.15}
                metalness={0.5}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Back Windows */}
            <mesh position={[0, 0, -dimensions.z / 2 - 0.015]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[dimensions.x * 0.9, floorHeight * 0.42]} />
              <meshStandardMaterial
                color="#42545B"
                roughness={0.15}
                metalness={0.5}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        );
      })}

      {/* Architectural Roof Slab */}
      <mesh position={[0, dimensions.y + 0.12, 0]} castShadow>
        <boxGeometry args={[dimensions.x + 0.3, 0.25, dimensions.z + 0.3]} />
        <meshStandardMaterial
          color={roofColor}
          roughness={0.6}
          metalness={0.08}
          transparent={transparentRoofs}
          opacity={transparentRoofs ? 0.25 : 1.0}
        />
      </mesh>

      {/* Recessed Rooftop Gravel Inset (Warm Ivory #EFECE3) */}
      {!transparentRoofs && (
        <mesh position={[0, dimensions.y + 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dimensions.x * 0.88, dimensions.z * 0.88]} />
          <meshStandardMaterial color="#EFECE3" roughness={0.8} />
        </mesh>
      )}

      {/* Roof HVAC / Penthouse Infrastructure */}
      {!transparentRoofs && (
        <group position={[0, dimensions.y + 0.4, 0]}>
          <mesh position={[-dimensions.x * 0.15, 0, 0]} castShadow>
            <boxGeometry args={[dimensions.x * 0.25, 0.5, dimensions.z * 0.3]} />
            <meshStandardMaterial color="#42545B" roughness={0.7} />
          </mesh>
          <mesh position={[dimensions.x * 0.2, 0, -dimensions.z * 0.1]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.4, 12]} />
            <meshStandardMaterial color="#64767A" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Contextual Architectural Tag: ONLY shown on hover or when selected */}
      {(showLabels || hovered || isSelected) && (
        <Html
          position={[0, dimensions.y + 1.8, 0]}
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
              border: `1px solid ${isSelected ? '#8FC9BE' : '#E6E1D6'}`,
              padding: '3px 8px',
              borderRadius: '4px',
              boxShadow: isSelected
                ? '0 0 0 2px rgba(143, 201, 190, 0.4), 0 4px 12px rgba(37, 52, 58, 0.08)'
                : '0 2px 8px rgba(37, 52, 58, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11.5px',
              color: '#25343A',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                color: '#287A50',
                background: '#EDF7F1',
                padding: '1px 5px',
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
                color: '#64767A',
                borderLeft: '1px solid #E6E1D6',
                paddingLeft: '5px',
              }}
            >
              {building.floors}F · {building.wallAttenuationDb}dB Wall
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
