import { z } from 'zod';
import type { Scenario, SimulationTelemetry } from '../types/scenario';
import { simulateTick } from '../simulation/engine';

export const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const BuildingSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string(),
  position: Vec3Schema,
  dimensions: Vec3Schema,
  floors: z.number().int().min(1),
  wallAttenuationDb: z.number().min(0),
  category: z.enum(['academic', 'library', 'student-hub', 'amenity', 'outdoor']),
  color: z.string(),
  roofColor: z.string(),
});

export const AccessPointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  buildingId: z.string().optional(),
  position: Vec3Schema,
  band: z.enum(['2.4GHz', '5GHz', '6GHz']),
  channel: z.number().int().min(1),
  channelWidthMhz: z.union([z.literal(20), z.literal(40), z.literal(80), z.literal(160)]),
  transmitPowerDbm: z.number().min(5).max(35),
  antennaGainDbi: z.number().min(0).max(15),
  capacityMbps: z.number().positive(),
  status: z.enum(['online', 'degraded', 'offline']),
  model: z.string(),
});

export const ClientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: Vec3Schema,
  movementSpeedMps: z.number().min(0),
  demandMbps: z.number().positive(),
  mobilityProfile: z.enum(['stationary', 'walking', 'roaming']),
  associatedApId: z.string().optional(),
  currentRssiDbm: z.number().optional(),
  throughputMbps: z.number().optional(),
  latencyMs: z.number().optional(),
  connected: z.boolean(),
  waypointIndex: z.number().optional(),
  waypoints: z.array(Vec3Schema).optional(),
});

export const ModelConfigSchema = z.object({
  pathLossExponent: z.number().positive(),
  referenceDistanceM: z.number().positive(),
  referenceLossDbm: z.number(),
  minimumRssiDbm: z.number(),
  simulationStepSeconds: z.number().positive(),
  wallDefaultAttenuationDb: z.number().min(0),
});

export const ScenarioSchema = z.object({
  schemaVersion: z.number().int().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  seed: z.number(),
  durationSeconds: z.number().positive(),
  buildings: z.array(BuildingSchema),
  accessPoints: z.array(AccessPointSchema),
  clients: z.array(ClientSchema),
  modelConfig: ModelConfigSchema,
});

const STORAGE_KEY = 'campustwin_active_scenario';

export function saveScenarioToLocalStorage(scenario: Scenario): boolean {
  try {
    const serialized = JSON.stringify(scenario);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save scenario to localStorage:', err);
    return false;
  }
}

export function loadScenarioFromLocalStorage(): Scenario | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = ScenarioSchema.safeParse(parsed);
    if (result.success) {
      return result.data as Scenario;
    }
    console.warn('Scenario validation failed on localStorage load:', result.error);
    return null;
  } catch {
    return null;
  }
}

export function exportScenarioToFile(scenario: Scenario) {
  const jsonStr = JSON.stringify(scenario, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-scenario.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseScenarioJson(jsonStr: string): { success: boolean; data?: Scenario; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = ScenarioSchema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data as Scenario };
    }
    const issueMsg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return { success: false, error: `Invalid scenario structure: ${issueMsg}` };
  } catch (err: any) {
    return { success: false, error: `Malformed JSON: ${err.message}` };
  }
}

export interface ScenarioComparison {
  baselineName: string;
  modifiedName: string;
  baselineTelemetry: SimulationTelemetry;
  modifiedTelemetry: SimulationTelemetry;
  deltaCoveragePercent: number;
  deltaLatencyMs: number;
  deltaThroughputMbps: number;
  deltaOverloadedAps: number;
  findings: string[];
}

/**
 * Runs a deterministic what-if comparison between baseline and modified scenario configurations.
 */
export function compareScenarios(baseline: Scenario, modified: Scenario): ScenarioComparison {
  const baseResult = simulateTick(baseline, 0, 0);
  const modResult = simulateTick(modified, 0, 0);

  const baseTel = baseResult.telemetry;
  const modTel = modResult.telemetry;

  const deltaCoveragePercent =
    Math.round((modTel.coverageRatioPercent - baseTel.coverageRatioPercent) * 10) / 10;
  const deltaLatencyMs = Math.round((modTel.averageLatencyMs - baseTel.averageLatencyMs) * 10) / 10;
  const deltaThroughputMbps =
    Math.round((modTel.totalDeliveredThroughputMbps - baseTel.totalDeliveredThroughputMbps) * 10) / 10;
  const deltaOverloadedAps = modTel.overloadedApCount - baseTel.overloadedApCount;

  const findings: string[] = [];

  if (deltaCoveragePercent > 0) {
    findings.push(`Campus coverage improved by +${deltaCoveragePercent}% under proposed deployment.`);
  } else if (deltaCoveragePercent < 0) {
    findings.push(`Campus coverage decreased by ${deltaCoveragePercent}% — check for dead zones.`);
  } else {
    findings.push(`Campus coverage maintained parity at ${modTel.coverageRatioPercent}%.`);
  }

  if (deltaOverloadedAps < 0) {
    findings.push(
      `Alleviated ${Math.abs(deltaOverloadedAps)} overloaded access point(s) through capacity distribution.`
    );
  } else if (deltaOverloadedAps > 0) {
    findings.push(`Notice: ${deltaOverloadedAps} access point(s) are now operating above 85% capacity.`);
  }

  if (deltaLatencyMs < 0) {
    findings.push(`Average user latency reduced by ${Math.abs(deltaLatencyMs)} ms due to lower queueing delays.`);
  } else if (deltaLatencyMs > 0) {
    findings.push(`Average latency increased by +${deltaLatencyMs} ms.`);
  }

  return {
    baselineName: baseline.name,
    modifiedName: modified.name,
    baselineTelemetry: baseTel,
    modifiedTelemetry: modTel,
    deltaCoveragePercent,
    deltaLatencyMs,
    deltaThroughputMbps,
    deltaOverloadedAps,
    findings,
  };
}
