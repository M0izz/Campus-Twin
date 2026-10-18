import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import type { AccessPoint } from '../../types/scenario';
import { useCampusStore } from '../../store/useCampusStore';

interface AccessPoint3DProps {
  accessPoint: AccessPoint;
}

export const AccessPoint3D: React.FC<AccessPoint3DProps> = ({ accessPoint }) => {
  const [hovered, setHovered] = useState(false);
  const selectedObject = useCampusStore((s) => s.selectedObject);
  const selectObject = useCampusStore((s) => s.selectObject);
  const showRings = useCampusStore((s) => s.visualLayers.coverageRings);
  const showLabels = useCampusStore((s) => s.visualLayers.labels);
  const apLoads = useCampusStore((s) => s.apLoads);

  const isSelected = selectedObject.type === 'accessPoint' && selectedObject.id === accessPoint.id;
  const loadInfo = apLoads[accessPoint.id] || { demandMbps: 0, utilization: 0, clientCount: 0 };
  const isOverloaded = loadInfo.utilization > 0.85;

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject('accessPoint', accessPoint.id);
  };

  const coverageRadiusMeters = (accessPoint.transmitPowerDbm / 20) * 16;

  // Semantic status colors from Palette A
  const ledColor =
    accessPoint.status === 'offline'
      ? '#E06D53' // Muted coral
      : isOverloaded
      ? '#E06D53' // Coral overloaded
      : '#287A50'; // Forest green healthy

  const ringColor =
    isOverloaded
      ? '#E06D53'
      : accessPoint.band === '5GHz'
      ? '#4A8BC7' // Sky blue
      : '#DAD5F2'; // Soft lilac

  return (
    <group
      position={[accessPoint.position.x, accessPoint.position.y, accessPoint.position.z]}
      onPointerDown={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Physical AP Enclosure (40cm puck) */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.14, 20]} />
        <meshStandardMaterial
          color={isSelected ? '#8FC9BE' : '#FFFFFF'}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>

      {/* Status LED Ring */}
      <mesh position={[0, -0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.28, 20]} />
        <meshBasicMaterial color={ledColor} />
      </mesh>

      {/* Coverage Radius Disk projection on ground */}
      {(showRings || isSelected) && accessPoint.status !== 'offline' && (
        <group position={[0, -accessPoint.position.y + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <circleGeometry args={[coverageRadiusMeters, 40]} />
            <meshBasicMaterial
              color={ringColor}
              transparent
              opacity={isSelected ? 0.16 : 0.06}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[coverageRadiusMeters - 0.15, coverageRadiusMeters, 48]} />
            <meshBasicMaterial
              color={ringColor}
              transparent
              opacity={isSelected ? 0.75 : 0.28}
            />
          </mesh>
        </group>
      )}

      {/* Vertical Reference Tether Line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, -accessPoint.position.y, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#D3CDC0" transparent opacity={0.4} />
      </line>

      {/* Compact Architectural Beacon (decluttered, visible on hover/select or when labels enabled) */}
      {(showLabels || hovered || isSelected) && (
        <Html
          position={[0, 0.75, 0]}
          center
          distanceFactor={38}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            onClick={handleClick}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${isSelected ? '#8FC9BE' : isOverloaded ? '#F5B9AB' : '#E6E1D6'}`,
              padding: '3px 8px',
              borderRadius: '4px',
              boxShadow: isSelected
                ? '0 0 0 2px rgba(143, 201, 190, 0.4), 0 3px 10px rgba(37, 52, 58, 0.08)'
                : '0 2px 8px rgba(37, 52, 58, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              color: '#25343A',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: ledColor,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
              {accessPoint.name}
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: "'IBM Plex Mono', monospace",
                color: isOverloaded ? '#E06D53' : '#64767A',
              }}
            >
              {accessPoint.status === 'offline'
                ? 'OFFLINE'
                : `${loadInfo.clientCount} usr · ${Math.round(loadInfo.utilization * 100)}%`}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
