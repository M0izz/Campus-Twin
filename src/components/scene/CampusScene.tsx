import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useCampusStore } from '../../store/useCampusStore';
import { CampusGround } from './CampusGround';
import { Building3D } from './Building3D';
import { AccessPoint3D } from './AccessPoint3D';
import { Client3D } from './Client3D';
import { CoverageHeatmapMesh } from './CoverageHeatmapMesh';
import type { AccessPoint } from '../../types/scenario';

// Simulation frame-loop ticker (throttled to 20Hz for high UI fluidity)
const SimulationController: React.FC = () => {
  const isPlaying = useCampusStore((s) => s.isPlaying);
  const tick = useCampusStore((s) => s.tick);
  const lastTickTimeRef = useRef(0);

  useFrame((state) => {
    if (!isPlaying) return;
    const now = state.clock.getElapsedTime();
    if (now - lastTickTimeRef.current >= 0.05) {
      lastTickTimeRef.current = now;
      tick();
    }
  });

  return null;
};

// Camera Controller for Smooth Architectural Camera Transitions
const CameraController: React.FC<{ controlsRef: React.RefObject<OrbitControlsImpl | null> }> = ({
  controlsRef,
}) => {
  const viewMode = useCampusStore((s) => s.viewMode);
  const selectedObject = useCampusStore((s) => s.selectedObject);
  const scenario = useCampusStore((s) => s.scenario);

  const desiredCamPos = useRef(new THREE.Vector3(52, 46, 62));
  const desiredTarget = useRef(new THREE.Vector3(0, 2, 0));
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (viewMode === '2d') {
      desiredCamPos.current.set(0, 110, 0.01);
      desiredTarget.current.set(0, 0, 0);
      controls.maxPolarAngle = 0.01;
      controls.minPolarAngle = 0;
      isTransitioning.current = true;
    } else {
      controls.maxPolarAngle = Math.PI / 2.08;
      controls.minPolarAngle = 0.1;

      if (selectedObject.type === 'building' && selectedObject.id) {
        const b = scenario.buildings.find((item) => item.id === selectedObject.id);
        if (b) {
          desiredTarget.current.set(b.position.x, b.dimensions.y * 0.4, b.position.z);
          desiredCamPos.current.set(
            b.position.x + 28,
            b.dimensions.y + 24,
            b.position.z + 32
          );
          isTransitioning.current = true;
        }
      } else if (selectedObject.type === 'accessPoint' && selectedObject.id) {
        const ap = scenario.accessPoints.find((item) => item.id === selectedObject.id);
        if (ap) {
          desiredTarget.current.set(ap.position.x, ap.position.y, ap.position.z);
          desiredCamPos.current.set(ap.position.x + 18, ap.position.y + 14, ap.position.z + 20);
          isTransitioning.current = true;
        }
      } else if (selectedObject.type === 'client' && selectedObject.id) {
        const cl = scenario.clients.find((item) => item.id === selectedObject.id);
        if (cl) {
          desiredTarget.current.set(cl.position.x, cl.position.y, cl.position.z);
          desiredCamPos.current.set(cl.position.x + 16, cl.position.y + 12, cl.position.z + 18);
          isTransitioning.current = true;
        }
      } else {
        // Return to campus overview
        desiredCamPos.current.set(52, 46, 62);
        desiredTarget.current.set(0, 2, 0);
        isTransitioning.current = true;
      }
    }
  }, [viewMode, selectedObject, scenario, controlsRef]);

  useFrame(() => {
    if (!controlsRef.current || !isTransitioning.current) return;
    const controls = controlsRef.current;

    controls.target.lerp(desiredTarget.current, 0.07);
    controls.object.position.lerp(desiredCamPos.current, 0.07);
    controls.update();

    // End transition when close enough
    if (
      controls.target.distanceTo(desiredTarget.current) < 0.05 &&
      controls.object.position.distanceTo(desiredCamPos.current) < 0.05
    ) {
      isTransitioning.current = false;
    }
  });

  return null;
};

export const CampusScene: React.FC = () => {
  const buildings = useCampusStore((s) => s.scenario.buildings);
  const accessPoints = useCampusStore((s) => s.scenario.accessPoints);
  const clients = useCampusStore((s) => s.scenario.clients);
  const selectObject = useCampusStore((s) => s.selectObject);
  const activeTool = useCampusStore((s) => s.activeTool);
  const addAccessPoint = useCampusStore((s) => s.addAccessPoint);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handlePointerMissed = (e: any) => {
    if (activeTool === 'place-ap' && e.point) {
      // Click-to-place AP on the 3D ground plane
      const nextIdx = accessPoints.length + 1;
      const newAp: AccessPoint = {
        id: `ap-placed-${Date.now().toString().slice(-4)}`,
        name: `AP-Plaza-${nextIdx}`,
        position: {
          x: Math.round(e.point.x),
          y: 4.0,
          z: Math.round(e.point.z),
        },
        band: '5GHz',
        channel: 36,
        channelWidthMhz: 80,
        transmitPowerDbm: 20,
        antennaGainDbi: 4,
        capacityMbps: 867,
        status: 'online',
        model: 'Cisco Catalyst 9124AXE',
      };
      addAccessPoint(newAp);
      return;
    }

    selectObject(null, null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        onPointerMissed={handlePointerMissed}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, scene }) => {
          // Palette A: Warm Ivory horizon that perfectly matches the ground plane
          gl.setClearColor(new THREE.Color('#F7F4ED'), 1);
          scene.background = new THREE.Color('#F7F4ED');
          scene.fog = new THREE.FogExp2('#F7F4ED', 0.0032);
        }}
      >
        <PerspectiveCamera makeDefault position={[52, 46, 62]} fov={38} near={0.5} far={800} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.08}
          minDistance={8}
          maxDistance={280}
          target={[0, 2, 0]}
        />

        {/* Soft Sunlight & Balanced Sky Lighting */}
        <ambientLight intensity={0.78} color="#FFFFFF" />
        <directionalLight
          position={[60, 80, 45]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={220}
          shadow-camera-left={-85}
          shadow-camera-right={85}
          shadow-camera-top={85}
          shadow-camera-bottom={-85}
          shadow-bias={-0.00015}
          color="#FFFDF7"
        />
        <directionalLight position={[-40, 30, -50]} intensity={0.35} color="#DAD5F2" />
        <hemisphereLight intensity={0.45} color="#FFFFFF" groundColor="#EFECE3" />

        {/* 3D Scene Components */}
        <CampusGround />
        <CoverageHeatmapMesh />

        {/* 3D Buildings */}
        {buildings.map((building) => (
          <Building3D key={building.id} building={building} />
        ))}

        {/* 3D Access Points */}
        {accessPoints.map((ap) => (
          <AccessPoint3D key={ap.id} accessPoint={ap} />
        ))}

        {/* 3D Roaming/Stationary Clients */}
        {clients.map((client) => (
          <Client3D key={client.id} client={client} />
        ))}

        {/* Dynamic Simulation Loop Driver */}
        <SimulationController />

        {/* 2D/3D Camera Controller */}
        <CameraController controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
};
