export type Vec3 = { x: number; y: number; z: number };

export interface Wall {
  id: string;
  start: [number, number]; // [x, z]
  end: [number, number];   // [x, z]
  attenuationDb: number;
  material: 'concrete' | 'drywall' | 'glass';
}

export interface Building {
  id: string;
  name: string;
  code: string;
  position: Vec3;
  dimensions: Vec3; // width (x), height (y), depth (z)
  floors: number;
  wallAttenuationDb: number;
  category: 'academic' | 'library' | 'student-hub' | 'amenity' | 'outdoor';
  color: string;
  roofColor: string;
  walls?: Wall[];
}

export interface AccessPoint {
  id: string;
  name: string;
  buildingId?: string;
  position: Vec3;
  band: '2.4GHz' | '5GHz' | '6GHz';
  channel: number;
  channelWidthMhz: 20 | 40 | 80 | 160;
  transmitPowerDbm: number;
  antennaGainDbi: number;
  capacityMbps: number;
  status: 'online' | 'degraded' | 'offline';
  model: string;
}

export type MobilityProfile = 'stationary' | 'walking' | 'roaming';

export interface Client {
  id: string;
  name: string;
  position: Vec3;
  destination?: Vec3;
  movementSpeedMps: number;
  demandMbps: number;
  mobilityProfile: MobilityProfile;
  associatedApId?: string;
  currentRssiDbm?: number;
  throughputMbps?: number;
  latencyMs?: number;
  connected: boolean;
  waypointIndex?: number;
  waypoints?: Vec3[];
}

export interface ModelConfig {
  pathLossExponent: number;
  referenceDistanceM: number;
  referenceLossDbm: number;
  minimumRssiDbm: number;
  simulationStepSeconds: number;
  wallDefaultAttenuationDb: number;
}

export interface Scenario {
  schemaVersion: number;
  id: string;
  name: string;
  description: string;
  seed: number;
  durationSeconds: number;
  buildings: Building[];
  accessPoints: AccessPoint[];
  clients: Client[];
  modelConfig: ModelConfig;
}

export interface SimulationTelemetry {
  timestampSeconds: number;
  totalClients: number;
  connectedClients: number;
  coverageRatioPercent: number;
  averageRssiDbm: number;
  totalOfferedDemandMbps: number;
  totalDeliveredThroughputMbps: number;
  averageLatencyMs: number;
  overloadedApCount: number;
  activeHandoverCount: number;
}
