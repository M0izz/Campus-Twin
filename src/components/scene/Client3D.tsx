import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Client } from '../../types/scenario';
import { useCampusStore } from '../../store/useCampusStore';
import { Laptop, Smartphone } from 'lucide-react';

interface Client3DProps {
  client: Client;
}

export const Client3D: React.FC<Client3DProps> = ({ client }) => {
  const [hovered, setHovered] = useState(false);
  const packetRef = useRef<THREE.Mesh>(null);

  const selectedObject = useCampusStore((s) => s.selectedObject);
  const selectObject = useCampusStore((s) => s.selectObject);
  const showAssociations = useCampusStore((s) => s.visualLayers.associations);
  const showLabels = useCampusStore((s) => s.visualLayers.labels);
  const accessPoints = useCampusStore((s) => s.scenario.accessPoints);
  const isAnimated = useCampusStore((s) => s.isTopologyAnimated);

  const isSelected = selectedObject.type === 'client' && selectedObject.id === client.id;

  const servingAp = client.associatedApId
    ? accessPoints.find((ap) => ap.id === client.associatedApId)
    : null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject('client', client.id);
  };

  const rssi = client.currentRssiDbm ?? -80;
  // Botanical semantic colors for signal states
  const signalColor = !client.connected
    ? '#E06D53' // Muted coral: disconnected
    : rssi >= -65
    ? '#287A50' // Forest green: healthy high SNR
    : rssi >= -75
    ? '#D87834' // Warm amber: low
    : '#E06D53'; // Coral: degraded

  // Animate 3D directional packet pulse along link
  useFrame((state) => {
    if (!packetRef.current || !servingAp || !client.connected || !isAnimated) return;

    // Pulse travel speed based on simulated throughput
    const speed = Math.max(0.4, Math.min(1.8, (client.throughputMbps || 15) / 25));
    const t = (state.clock.getElapsedTime() * speed + (parseInt(client.id.replace(/\D/g, '') || '0') * 0.3)) % 1.0;

    const dx = servingAp.position.x - client.position.x;
    const dy = servingAp.position.y - client.position.y;
    const dz = servingAp.position.z - client.position.z;

    packetRef.current.position.set(dx * t, dy * t, dz * t);
  });

  return (
    <group position={[client.position.x, client.position.y, client.position.z]}>
      {/* Device Node (clean physical sphere) */}
      <mesh
        onPointerDown={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#8FC9BE' : signalColor}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>

      {/* Subtle Ground Footprint Ring */}
      <mesh position={[0, -client.position.y + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.35, 16]} />
        <meshBasicMaterial
          color={client.connected ? signalColor : '#E06D53'}
          transparent
          opacity={isSelected ? 0.65 : 0.25}
        />
      </mesh>

      {/* Association ray line connecting to serving AP */}
      {(showAssociations || isSelected) && servingAp && client.connected && (
        <group>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array([
                    0,
                    0,
                    0,
                    servingAp.position.x - client.position.x,
                    servingAp.position.y - client.position.y,
                    servingAp.position.z - client.position.z,
                  ]),
                  3,
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={isSelected ? '#287A50' : '#DAD5F2'}
              transparent
              opacity={isSelected ? 0.9 : 0.4}
              linewidth={isSelected ? 2 : 1}
            />
          </line>

          {/* 3D Flowing Packet Pulse along association link */}
          <mesh ref={packetRef}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshBasicMaterial color={isSelected ? '#287A50' : '#8FC9BE'} />
          </mesh>
        </group>
      )}

      {/* Contextual Device Tag: ONLY shown on hover or when selected */}
      {(showLabels || hovered || isSelected) && (
        <Html
          position={[0, 0.55, 0]}
          center
          distanceFactor={35}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            onClick={handleClick}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${isSelected ? '#8FC9BE' : '#E6E1D6'}`,
              padding: '3px 7px',
              borderRadius: '4px',
              boxShadow: isSelected ? '0 0 0 2px rgba(143, 201, 190, 0.4), 0 2px 8px rgba(37, 52, 58, 0.08)' : '0 2px 6px rgba(37, 52, 58, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              color: '#25343A',
              fontWeight: 600,
            }}
          >
            {client.mobilityProfile === 'walking' || client.mobilityProfile === 'roaming' ? (
              <Smartphone size={11} color="#64767A" />
            ) : (
              <Laptop size={11} color="#64767A" />
            )}
            <span>{client.name}</span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'IBM Plex Mono', monospace",
                color: signalColor,
                fontWeight: 600,
              }}
            >
              {client.connected ? `${rssi.toFixed(0)} dBm` : 'OFFLINE'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
