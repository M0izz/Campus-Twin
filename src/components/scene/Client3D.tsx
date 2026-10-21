import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Client } from '../../types/scenario';
import { useCampusStore } from '../../store/useCampusStore';
import { Laptop, Smartphone, Wifi, WifiOff } from 'lucide-react';

interface Client3DProps {
  client: Client;
}

// Preset modern collegiate clothing palettes
const CLOTHING_PALETTES = [
  { jacket: '#1E3A8A', pants: '#1E293B', hair: '#1F2937', skin: '#E0AC69' }, // Navy & Denim
  { jacket: '#14532D', pants: '#334155', hair: '#78350F', skin: '#F1C27D' }, // Forest Ivy & Tan
  { jacket: '#9A3412', pants: '#1F2937', hair: '#1C1917', skin: '#C68642' }, // Rust & Dark Slate
  { jacket: '#334155', pants: '#0F172A', hair: '#451A03', skin: '#8D5524' }, // Cambridge Charcoal
  { jacket: '#831843', pants: '#334155', hair: '#172554', skin: '#FFDBAC' }, // Burgundy & Indigo
  { jacket: '#B45309', pants: '#1E293B', hair: '#292524', skin: '#E0AC69' }, // Warm Amber
  { jacket: '#3730A3', pants: '#1E293B', hair: '#44403C', skin: '#F1C27D' }, // Deep Indigo
  { jacket: '#475569', pants: '#0F172A', hair: '#0C0A09', skin: '#C68642' }, // Minimalist Slate
];

export const Client3D: React.FC<Client3DProps> = ({ client }) => {
  const [hovered, setHovered] = useState(false);
  const packetRef = useRef<THREE.Mesh>(null);
  const figureGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const selectedObject = useCampusStore((s) => s.selectedObject);
  const selectObject = useCampusStore((s) => s.selectObject);
  const showAssociations = useCampusStore((s) => s.visualLayers.associations);
  const showMovementTrails = useCampusStore((s) => s.visualLayers.movementTrails);
  const showCoverageWarnings = useCampusStore((s) => s.visualLayers.coverageWarnings);
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
  const isGoodSignal = client.connected && rssi >= -65;
  const isMediumSignal = client.connected && rssi >= -75 && rssi < -65;
  const isWeakSignal = client.connected && rssi < -75;

  const signalColor = !client.connected
    ? '#EF4444' // Coral red: disconnected
    : isGoodSignal
    ? '#10B981' // Radiant emerald
    : isMediumSignal
    ? '#F59E0B' // Warm amber
    : '#EF4444'; // Red: degraded

  // Deterministic style attributes per client
  const styleIdx = useMemo(() => {
    const num = parseInt(client.id.replace(/\D/g, '') || '0', 10);
    return Math.abs(num) % CLOTHING_PALETTES.length;
  }, [client.id]);

  const palette = CLOTHING_PALETTES[styleIdx];
  const isPhoneUser =
    client.mobilityProfile === 'walking' ||
    client.mobilityProfile === 'roaming' ||
    client.name.toLowerCase().includes('phone') ||
    client.name.toLowerCase().includes('tablet');

  // Tracking previous position for walking direction
  const prevPosRef = useRef(new THREE.Vector3(client.position.x, 0, client.position.z));
  const currentHeadingRef = useRef(0);

  // Animation loop: leg walk cycle, arm swing, device tilt, and packet pulses
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const isMoving = client.movementSpeedMps > 0.1;

    // 1. Calculate heading orientation when moving
    const curX = client.position.x;
    const curZ = client.position.z;
    const dx = curX - prevPosRef.current.x;
    const dz = curZ - prevPosRef.current.z;
    const moveDistSq = dx * dx + dz * dz;

    if (moveDistSq > 0.00005) {
      const targetHeading = Math.atan2(dx, dz);
      // Smooth lerp heading
      let diff = targetHeading - currentHeadingRef.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentHeadingRef.current += diff * Math.min(1.0, delta * 8.0);
    }
    prevPosRef.current.set(curX, 0, curZ);

    if (figureGroupRef.current) {
      figureGroupRef.current.rotation.y = currentHeadingRef.current;
    }

    // 2. Walk cycle kinematics
    if (isMoving && isAnimated) {
      const walkFreq = client.movementSpeedMps * 5.5;
      const walkPhase = time * walkFreq + styleIdx * 1.5;

      // Legs swing forward and backward
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(walkPhase) * 0.48;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -Math.sin(walkPhase) * 0.48;
      }

      // Torso natural vertical bob
      if (torsoRef.current) {
        torsoRef.current.position.y = Math.abs(Math.sin(walkPhase * 2)) * 0.035;
      }

      // Arms swing
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(walkPhase) * 0.35;
      }
      if (rightArmRef.current && !isPhoneUser) {
        rightArmRef.current.rotation.x = Math.sin(walkPhase) * 0.35;
      }
    } else {
      // Natural idle breathing & sway
      const idle = Math.sin(time * 1.8 + styleIdx) * 0.015;
      if (torsoRef.current) {
        torsoRef.current.position.y = idle;
        torsoRef.current.rotation.z = Math.sin(time * 0.9 + styleIdx) * 0.01;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
    }

    // 3. Flowing 3D Packet pulse towards serving AP
    if (packetRef.current && servingAp && client.connected && isAnimated) {
      const speed = Math.max(0.5, Math.min(2.0, (client.throughputMbps || 15) / 20));
      const t = (time * speed + styleIdx * 0.25) % 1.0;

      const deviceY = 1.15; // hand height
      const pDx = servingAp.position.x - client.position.x;
      const pDy = servingAp.position.y - deviceY;
      const pDz = servingAp.position.z - client.position.z;

      packetRef.current.position.set(pDx * t, deviceY + pDy * t, pDz * t);
    }
  });

  return (
    <group position={[client.position.x, 0, client.position.z]}>
      {/* =========================================================================
          STYLED ARCHITECTURAL 3D FIGURE MODEL (Height: 1.76m)
          ========================================================================= */}
      <group
        ref={figureGroupRef}
        onPointerDown={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Invisible Hitbox for effortless clicking and hovering anywhere on figure */}
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 1.76, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* 1. Left Leg (Pivots at hip y = 0.78) */}
        <group ref={leftLegRef} position={[-0.1, 0.78, 0]}>
          {/* Pants leg */}
          <mesh position={[0, -0.38, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.055, 0.74, 10]} />
            <meshStandardMaterial color={palette.pants} roughness={0.7} />
          </mesh>
          {/* Modern white / dark sneaker with sole */}
          <mesh position={[0, -0.74, 0.04]} castShadow>
            <boxGeometry args={[0.11, 0.07, 0.22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.765, 0.04]}>
            <boxGeometry args={[0.115, 0.02, 0.23]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
          </mesh>
        </group>

        {/* 2. Right Leg (Pivots at hip y = 0.78) */}
        <group ref={rightLegRef} position={[0.1, 0.78, 0]}>
          <mesh position={[0, -0.38, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.055, 0.74, 10]} />
            <meshStandardMaterial color={palette.pants} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.74, 0.04]} castShadow>
            <boxGeometry args={[0.11, 0.07, 0.22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.765, 0.04]}>
            <boxGeometry args={[0.115, 0.02, 0.23]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
          </mesh>
        </group>

        {/* 3. Upper Body / Torso (Pivots at waist y = 0.78) */}
        <group ref={torsoRef} position={[0, 0.78, 0]}>
          {/* Hips & Belt line */}
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.28, 0.12, 0.18]} />
            <meshStandardMaterial color={palette.pants} roughness={0.65} />
          </mesh>

          {/* Campus Jacket / Hoodie Torso */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.32, 0.44, 0.2]} />
            <meshStandardMaterial
              color={isSelected ? '#8FC9BE' : palette.jacket}
              roughness={0.6}
              metalness={0.08}
            />
          </mesh>

          {/* Collar / Hood Accent */}
          <mesh position={[0, 0.54, -0.02]} castShadow>
            <cylinderGeometry args={[0.09, 0.12, 0.08, 10]} />
            <meshStandardMaterial color={palette.jacket} roughness={0.7} />
          </mesh>

          {/* Student Campus Backpack on Back */}
          <group position={[0, 0.34, -0.15]}>
            <mesh castShadow>
              <boxGeometry args={[0.24, 0.32, 0.13]} />
              <meshStandardMaterial color="#1E293B" roughness={0.75} />
            </mesh>
            {/* Front pouch pocket */}
            <mesh position={[0, -0.06, -0.05]} castShadow>
              <boxGeometry args={[0.2, 0.16, 0.04]} />
              <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>
            {/* Zipper accent */}
            <mesh position={[0, 0.03, -0.07]}>
              <boxGeometry args={[0.16, 0.015, 0.01]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
            </mesh>
          </group>

          {/* Neck & Head */}
          <mesh position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 8]} />
            <meshStandardMaterial color={palette.skin} roughness={0.8} />
          </mesh>

          {/* Stylized Head */}
          <group position={[0, 0.69, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.11, 14, 14]} />
              <meshStandardMaterial color={palette.skin} roughness={0.75} />
            </mesh>

            {/* Modern Hair / Cap Style */}
            <mesh position={[0, 0.03, -0.01]} castShadow>
              <sphereGeometry args={[0.116, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color={palette.hair} roughness={0.85} />
            </mesh>

            {/* Stylized Headphones or Glasses */}
            {styleIdx % 2 === 0 ? (
              <group position={[0, 0.01, 0]}>
                {/* Over-ear headphones */}
                <mesh position={[-0.115, 0, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.03, 10]} />
                  <meshStandardMaterial color="#0F172A" metalness={0.5} roughness={0.3} />
                </mesh>
                <mesh position={[0.115, 0, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.03, 10]} />
                  <meshStandardMaterial color="#0F172A" metalness={0.5} roughness={0.3} />
                </mesh>
                {/* Headband arch */}
                <mesh position={[0, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.11, 0.014, 8, 16, Math.PI]} />
                  <meshStandardMaterial color="#0F172A" metalness={0.6} />
                </mesh>
              </group>
            ) : null}
          </group>

          {/* 4. Left Arm */}
          <group ref={leftArmRef} position={[-0.2, 0.48, 0]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.04, 0.36, 8]} />
              <meshStandardMaterial color={palette.jacket} roughness={0.6} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.38, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={palette.skin} roughness={0.75} />
            </mesh>
          </group>

          {/* 5. Right Arm & Interactive Handheld Device */}
          <group ref={rightArmRef} position={[0.2, 0.48, 0]}>
            {isPhoneUser ? (
              /* Walking / Roaming Smartphone User Pose */
              <group>
                {/* Upper arm angled forward */}
                <mesh position={[0, -0.15, 0.08]} rotation={[-0.45, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.045, 0.04, 0.32, 8]} />
                  <meshStandardMaterial color={palette.jacket} roughness={0.6} />
                </mesh>
                {/* Forearm bent up holding phone */}
                <group position={[0, -0.28, 0.16]} rotation={[-1.1, 0.2, 0]}>
                  <mesh position={[0, -0.12, 0]} castShadow>
                    <cylinderGeometry args={[0.038, 0.034, 0.26, 8]} />
                    <meshStandardMaterial color={palette.skin} roughness={0.75} />
                  </mesh>
                  {/* Smartphone Body */}
                  <mesh position={[0, -0.26, 0.02]} rotation={[0.4, 0, 0]} castShadow>
                    <boxGeometry args={[0.075, 0.14, 0.009]} />
                    <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.2} />
                  </mesh>
                  {/* Glowing Smartphone Screen */}
                  <mesh position={[0, -0.26, 0.026]} rotation={[0.4, 0, 0]}>
                    <planeGeometry args={[0.068, 0.13]} />
                    <meshBasicMaterial color={client.connected ? '#60A5FA' : '#EF4444'} />
                  </mesh>
                </group>
              </group>
            ) : (
              /* Stationary / Research Laptop User Pose */
              <group>
                {/* Right arm forward */}
                <mesh position={[-0.04, -0.16, 0.1]} rotation={[-0.55, -0.2, 0]} castShadow>
                  <cylinderGeometry args={[0.045, 0.04, 0.34, 8]} />
                  <meshStandardMaterial color={palette.jacket} roughness={0.6} />
                </mesh>
                {/* Hand on keyboard */}
                <mesh position={[-0.08, -0.32, 0.22]}>
                  <sphereGeometry args={[0.038, 8, 8]} />
                  <meshStandardMaterial color={palette.skin} roughness={0.75} />
                </mesh>
              </group>
            )}
          </group>

          {/* Open Ultra-thin Laptop (for stationary / study persona) */}
          {!isPhoneUser && (
            <group position={[0, 0.28, 0.25]} rotation={[0.12, 0, 0]}>
              {/* Laptop Base & Keyboard */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.26, 0.012, 0.18]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.25} />
              </mesh>
              {/* Keyboard keys area */}
              <mesh position={[0, 0.007, 0]}>
                <planeGeometry args={[0.22, 0.12]} />
                <meshStandardMaterial color="#1E293B" roughness={0.8} />
              </mesh>
              {/* Angled Laptop Display Lid */}
              <group position={[0, 0.006, -0.09]} rotation={[-1.95, 0, 0]}>
                <mesh position={[0, 0.08, 0]} castShadow>
                  <boxGeometry args={[0.26, 0.16, 0.008]} />
                  <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.25} />
                </mesh>
                {/* Glowing IDE / Data Screen */}
                <mesh position={[0, 0.08, 0.005]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[0.24, 0.14]} />
                  <meshBasicMaterial color={client.connected ? '#38BDF8' : '#EF4444'} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      </group>

      {/* =========================================================================
          GROUND HOLOGRAM STATUS BEACON (Semantic Wi-Fi status aura)
          ========================================================================= */}
      {/* Ground Contact Shadow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 16]} />
        <meshBasicMaterial color="#1E293B" transparent opacity={0.28} />
      </mesh>

      {/* Concentric Wi-Fi Signal Pulse Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.38, 24]} />
        <meshBasicMaterial
          color={signalColor}
          transparent
          opacity={isSelected ? 0.9 : 0.65}
        />
      </mesh>

      {/* Animated Beacon Wave when Selected */}
      {isSelected && (
        <group>
          <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.58, 32]} />
            <meshBasicMaterial color="#8FC9BE" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.5, 24]} />
            <meshBasicMaterial color="#8FC9BE" transparent opacity={0.12} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          802.11 ASSOCIATION LINK & DATA PACKET PULSES TO SERVING AP
          ========================================================================= */}
      {(showAssociations || isSelected) && servingAp && client.connected && (
        <group>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array([
                    0,
                    1.15,
                    0,
                    servingAp.position.x - client.position.x,
                    servingAp.position.y,
                    servingAp.position.z - client.position.z,
                  ]),
                  3,
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={isSelected ? '#10B981' : '#A7F3D0'}
              transparent
              opacity={isSelected ? 0.95 : 0.5}
              linewidth={isSelected ? 2 : 1}
            />
          </line>

          {/* 3D Flowing Packet Pulse along association link */}
          <mesh ref={packetRef}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshBasicMaterial color={isSelected ? '#10B981' : '#34D399'} />
          </mesh>
        </group>
      )}

      {/* User Movement Waypoint Trails */}
      {(showMovementTrails || isSelected) && client.waypoints && client.waypoints.length > 0 && (
        <group position={[-client.position.x, 0.03, -client.position.z]}>
          {client.waypoints.map((wp, idx) => {
            const nextWp = client.waypoints![idx + 1];
            return (
              <group key={`wp-${idx}`}>
                <mesh position={[wp.x, 0, wp.z]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.26, 12]} />
                  <meshBasicMaterial color="#8FC9BE" />
                </mesh>
                {nextWp && (
                  <line>
                    <bufferGeometry>
                      <bufferAttribute
                        attach="attributes-position"
                        args={[new Float32Array([wp.x, 0, wp.z, nextWp.x, 0, nextWp.z]), 3]}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial color="#10B981" transparent opacity={0.55} />
                  </line>
                )}
              </group>
            );
          })}
        </group>
      )}

      {/* Weak-Coverage and Disconnected-Client Warning Ring */}
      {showCoverageWarnings && (!client.connected || rssi < -78) && (
        <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 24]} />
          <meshBasicMaterial color="#EF4444" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Contextual Device Tag: ONLY shown on hover or when selected */}
      {(showLabels || hovered || isSelected) && (
        <Html
          position={[0, 2.05, 0]}
          center
          distanceFactor={32}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            onClick={handleClick}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${isSelected ? '#8FC9BE' : '#E2E8F0'}`,
              padding: '4px 9px',
              borderRadius: '6px',
              boxShadow: isSelected
                ? '0 0 0 2px rgba(143, 201, 190, 0.4), 0 4px 12px rgba(15, 23, 42, 0.12)'
                : '0 2px 8px rgba(15, 23, 42, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              color: '#1E293B',
              fontWeight: 600,
            }}
          >
            {isPhoneUser ? (
              <Smartphone size={12} color="#64748B" />
            ) : (
              <Laptop size={12} color="#64748B" />
            )}
            <span>{client.name}</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontFamily: "'IBM Plex Mono', monospace",
                color: signalColor,
                fontWeight: 700,
                borderLeft: '1px solid #E2E8F0',
                paddingLeft: '6px',
              }}
            >
              {client.connected ? (
                <>
                  <Wifi size={10} color={signalColor} />
                  <span>{rssi.toFixed(0)} dBm</span>
                </>
              ) : (
                <>
                  <WifiOff size={10} color="#EF4444" />
                  <span>OFFLINE</span>
                </>
              )}
            </div>
            {client.throughputMbps && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#64748B',
                }}
              >
                {client.throughputMbps.toFixed(1)} Mbps
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
