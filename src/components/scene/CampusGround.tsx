import React from 'react';

export const CampusGround: React.FC = () => {
  return (
    <group position={[0, -0.05, 0]}>
      {/* 1. Expansive Regional Basemap Terrain in Warm Ivory #F7F4ED */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 450]} />
        <meshStandardMaterial color="#F7F4ED" roughness={0.92} metalness={0.01} />
      </mesh>

      {/* Cartographic Coordinate Grid lines across region */}
      <gridHelper
        args={[400, 40, '#E0DBD0', '#EAE6DC']}
        position={[0, 0.005, 0]}
      />

      {/* 2. Campus Boundary Parcel Polygon in Subtle Surface #FAF8F3 */}
      <mesh position={[0, 0.01, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 140]} />
        <meshStandardMaterial color="#FAF8F3" roughness={0.88} />
      </mesh>

      {/* Perimeter Boundary Line */}
      <lineLoop position={[0, 0.015, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -80, -70, 0,
                 80, -70, 0,
                 80,  70, 0,
                -80,  70, 0,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#D3CDC0" linewidth={1.5} />
      </lineLoop>

      {/* 3. Perimeter Roads & Avenue Network (Muted architectural warm slate) */}
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

      {/* 4. Natural Green Campus Quads in Soft Sage Green #D7E9DF */}
      {/* Main Central Quad */}
      <mesh position={[0, 0.015, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[44, 38]} />
        <meshStandardMaterial color="#D7E9DF" roughness={0.85} />
      </mesh>
      {/* North-West Library Courtyard */}
      <mesh position={[-28, 0.015, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#D7E9DF" roughness={0.85} />
      </mesh>
      {/* South-East Commons Garden */}
      <mesh position={[28, 0.015, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#D7E9DF" roughness={0.85} />
      </mesh>

      {/* 5. Central Plaza & Paved Walkways (Warm architectural flagstone #EFECE3) */}
      <mesh position={[0, 0.018, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 8, 36]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.7} />
      </mesh>

      {/* North-South Pedestrian Spine */}
      <mesh position={[0, 0.016, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 84]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.65} />
      </mesh>

      {/* East-West Pedestrian Promenade */}
      <mesh position={[0, 0.016, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 5]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.65} />
      </mesh>

      {/* Diagonal Connecting Pathways */}
      <mesh position={[-16, 0.016, -10]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.65} />
      </mesh>
      <mesh position={[16, 0.016, 14]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.65} />
      </mesh>
      <mesh position={[16, 0.016, -10]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.65} />
      </mesh>
      <mesh position={[-16, 0.016, 14]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#EFECE3" roughness={0.65} />
      </mesh>

      {/* 6. Stylized Architectural Campus Trees (Sea Glass #8FC9BE & Deep Bark #42545B) */}
      {[
        [-14, -8], [-14, 12], [14, -8], [14, 12],
        [-34, -14], [-22, -14], [22, 16], [34, 16],
        [-6, -26], [6, -26], [-6, 30], [6, 30],
        [-24, 22], [24, -22], [-36, 6], [36, -6],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          {/* Tree Trunk */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 2.0, 8]} />
            <meshStandardMaterial color="#42545B" roughness={0.8} />
          </mesh>
          {/* Architectural Foliage Canopy in Sea Glass #8FC9BE */}
          <mesh position={[0, 2.8, 0]} castShadow>
            <sphereGeometry args={[1.3, 12, 10]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#8FC9BE' : '#7BB4A8'} roughness={0.65} />
          </mesh>
          {/* Subtle Ground Shadow Disk */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.2, 16]} />
            <meshBasicMaterial color="#25343A" transparent opacity={0.06} />
          </mesh>
        </group>
      ))}

      {/* 7. Metric Ground Scale Grid Labels */}
      {[-60, -30, 0, 30, 60].map((coord) => (
        <React.Fragment key={coord}>
          {/* East-West Axis tick marks */}
          <mesh position={[coord, 0.017, -46]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 1.4]} />
            <meshBasicMaterial color="#C8C2B5" />
          </mesh>
          {/* North-South Axis tick marks */}
          <mesh position={[-56, 0.017, coord]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.4, 0.3]} />
            <meshBasicMaterial color="#C8C2B5" />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};
