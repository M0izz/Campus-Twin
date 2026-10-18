import type {
  AccessPoint,
  Building,
  Client,
  Scenario,
  SimulationTelemetry,
  Vec3,
} from '../types/scenario';
import { calculateRssi } from './radio-model';

/**
 * Checks if a 3D point is inside an axis-aligned 3D building box.
 */
export function isPointInsideBuilding(point: Vec3, building: Building): boolean {
  const halfX = building.dimensions.x / 2;
  const halfZ = building.dimensions.z / 2;
  const height = building.dimensions.y;

  return (
    point.x >= building.position.x - halfX &&
    point.x <= building.position.x + halfX &&
    point.z >= building.position.z - halfZ &&
    point.z <= building.position.z + halfZ &&
    point.y >= building.position.y &&
    point.y <= building.position.y + height
  );
}

/**
 * Calculates wall attenuation penalty between client and AP.
 * If one is inside a building and the other is outside, or if they are in different buildings,
 * applies the building wall attenuation.
 */
export function calculateObstacleAttenuation(
  ap: AccessPoint,
  clientPos: Vec3,
  buildings: Building[],
  defaultWallAttenDb: number = 10
): number {
  let attenuation = 0;

  for (const bldg of buildings) {
    const apInside = isPointInsideBuilding(ap.position, bldg);
    const clientInside = isPointInsideBuilding(clientPos, bldg);

    if (apInside !== clientInside) {
      // Crosses exterior boundary
      attenuation += bldg.wallAttenuationDb || defaultWallAttenDb;
    }
  }

  return attenuation;
}

/**
 * Updates mobility of a client along its designated waypoints.
 */
export function updateClientMobility(client: Client, dtSeconds: number): Vec3 {
  if (
    client.mobilityProfile === 'stationary' ||
    !client.waypoints ||
    client.waypoints.length === 0
  ) {
    return client.position;
  }

  const currentIdx = client.waypointIndex ?? 0;
  const target = client.waypoints[currentIdx];

  const dx = target.x - client.position.x;
  const dy = target.y - client.position.y;
  const dz = target.z - client.position.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const moveDist = client.movementSpeedMps * dtSeconds;

  if (dist <= Math.max(0.2, moveDist)) {
    // Reached waypoint; advance to next
    client.waypointIndex = (currentIdx + 1) % client.waypoints.length;
    return { ...target };
  }

  // Move fractionally towards target
  const ratio = moveDist / dist;
  return {
    x: client.position.x + dx * ratio,
    y: client.position.y + dy * ratio,
    z: client.position.z + dz * ratio,
  };
}

export interface SimulationStepResult {
  updatedClients: Client[];
  telemetry: SimulationTelemetry;
  handoverCount: number;
  apLoads: Record<string, { demandMbps: number; utilization: number; clientCount: number }>;
}

/**
 * Executes one deterministic simulation tick.
 */
export function simulateTick(
  scenario: Scenario,
  dtSeconds: number,
  elapsedSeconds: number
): SimulationStepResult {
  const { buildings, accessPoints, modelConfig } = scenario;
  let handoverCount = 0;

  // 1. Update client positions
  const movedClients = scenario.clients.map((c) => {
    const newPos = updateClientMobility(c, dtSeconds);
    return { ...c, position: newPos };
  });

  // 2. Association & Signal evaluation for each client
  const updatedClients: Client[] = movedClients.map((client) => {
    let bestAp: AccessPoint | null = null;
    let bestRssi = -120;

    for (const ap of accessPoints) {
      if (ap.status === 'offline') continue;

      const wallAtten = calculateObstacleAttenuation(
        ap,
        client.position,
        buildings,
        modelConfig.wallDefaultAttenuationDb
      );

      const rssi = calculateRssi(ap, client.position, modelConfig, wallAtten, 0);

      if (rssi > bestRssi) {
        bestRssi = rssi;
        bestAp = ap;
      }
    }

    // Determine association with 3 dB hysteresis
    let associatedApId = client.associatedApId;
    let connected = false;

    if (bestAp && bestRssi >= modelConfig.minimumRssiDbm) {
      if (!associatedApId) {
        associatedApId = bestAp.id;
        connected = true;
      } else if (associatedApId === bestAp.id) {
        connected = true;
      } else {
        // Evaluate candidate vs current AP
        const currentAp = accessPoints.find((a) => a.id === associatedApId);
        if (!currentAp || currentAp.status === 'offline') {
          associatedApId = bestAp.id;
          handoverCount++;
          connected = true;
        } else {
          const currentWallAtten = calculateObstacleAttenuation(
            currentAp,
            client.position,
            buildings,
            modelConfig.wallDefaultAttenuationDb
          );
          const currentRssi = calculateRssi(
            currentAp,
            client.position,
            modelConfig,
            currentWallAtten,
            0
          );

          if (bestRssi > currentRssi + 3.0) {
            // Roaming trigger with hysteresis
            associatedApId = bestAp.id;
            handoverCount++;
            connected = true;
          } else {
            connected = currentRssi >= modelConfig.minimumRssiDbm;
            bestRssi = currentRssi;
          }
        }
      }
    } else {
      associatedApId = undefined;
      connected = false;
      bestRssi = -110;
    }

    return {
      ...client,
      associatedApId,
      connected,
      currentRssiDbm: bestRssi,
    };
  });

  // 3. AP Load aggregation
  const apLoads: Record<string, { demandMbps: number; utilization: number; clientCount: number }> = {};
  for (const ap of accessPoints) {
    apLoads[ap.id] = { demandMbps: 0, utilization: 0, clientCount: 0 };
  }

  for (const client of updatedClients) {
    if (client.connected && client.associatedApId && apLoads[client.associatedApId]) {
      apLoads[client.associatedApId].demandMbps += client.demandMbps;
      apLoads[client.associatedApId].clientCount += 1;
    }
  }

  for (const ap of accessPoints) {
    const load = apLoads[ap.id];
    load.utilization = ap.capacityMbps > 0 ? load.demandMbps / ap.capacityMbps : 0;
  }

  // 4. Client Delivered Throughput & Latency calculation
  let totalOffered = 0;
  let totalDelivered = 0;
  let totalLatency = 0;
  let connectedCount = 0;
  let rssiSum = 0;

  const finalizedClients = updatedClients.map((client) => {
    totalOffered += client.demandMbps;

    if (!client.connected || !client.associatedApId) {
      return {
        ...client,
        throughputMbps: 0,
        latencyMs: 999, // timeout
      };
    }

    connectedCount++;
    rssiSum += client.currentRssiDbm ?? -80;

    const apLoad = apLoads[client.associatedApId];
    const u = apLoad ? apLoad.utilization : 0;

    let deliveredThroughput = client.demandMbps;
    let latency = 12 + u * 15; // base latency + mild queueing

    if (u > 1.0) {
      // Saturated / Congested channel
      deliveredThroughput = client.demandMbps / u;
      latency = 12 + 15 + Math.pow(u - 1.0, 1.8) * 120;
    }

    totalDelivered += deliveredThroughput;
    totalLatency += latency;

    return {
      ...client,
      throughputMbps: Math.round(deliveredThroughput * 10) / 10,
      latencyMs: Math.round(latency * 10) / 10,
    };
  });

  const overloadedApCount = Object.values(apLoads).filter((l) => l.utilization > 0.85).length;
  const coverageRatioPercent =
    finalizedClients.length > 0 ? (connectedCount / finalizedClients.length) * 100 : 100;
  const avgLatency = connectedCount > 0 ? totalLatency / connectedCount : 0;
  const avgRssi = connectedCount > 0 ? rssiSum / connectedCount : -80;

  const telemetry: SimulationTelemetry = {
    timestampSeconds: Math.round(elapsedSeconds * 10) / 10,
    totalClients: finalizedClients.length,
    connectedClients: connectedCount,
    coverageRatioPercent: Math.round(coverageRatioPercent * 10) / 10,
    averageRssiDbm: Math.round(avgRssi * 10) / 10,
    totalOfferedDemandMbps: Math.round(totalOffered * 10) / 10,
    totalDeliveredThroughputMbps: Math.round(totalDelivered * 10) / 10,
    averageLatencyMs: Math.round(avgLatency * 10) / 10,
    overloadedApCount,
    activeHandoverCount: handoverCount,
  };

  return {
    updatedClients: finalizedClients,
    telemetry,
    handoverCount,
    apLoads,
  };
}
