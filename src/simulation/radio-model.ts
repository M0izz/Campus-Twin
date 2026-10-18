import type { AccessPoint, ModelConfig, Vec3 } from '../types/scenario';

/**
 * Calculates 3D Euclidean distance between two points in meters.
 */
export function calculateEuclideanDistance(p1: Vec3, p2: Vec3): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.max(0.1, Math.sqrt(dx * dx + dy * dy + dz * dz));
}

/**
 * Calculates log-distance path loss:
 * PL(d) = PL(d0) + 10 * n * log10(d / d0)
 */
export function calculatePathLoss(
  distance: number,
  d0: number = 1.0,
  n: number = 3.0,
  pl0: number = 40.0
): number {
  const effectiveDist = Math.max(distance, d0);
  return pl0 + 10 * n * Math.log10(effectiveDist / d0);
}

/**
 * Calculates RSSI (Received Signal Strength Indicator) in dBm:
 * RSSI = Pt + Gt + Gr - PL(d) - L_walls - L_floors
 */
export function calculateRssi(
  ap: AccessPoint,
  clientPos: Vec3,
  config: ModelConfig,
  wallAttenuationDb: number = 0,
  floorAttenuationDb: number = 0
): number {
  if (ap.status === 'offline') {
    return -110;
  }

  const distance = calculateEuclideanDistance(ap.position, clientPos);
  const pathLoss = calculatePathLoss(
    distance,
    config.referenceDistanceM,
    config.pathLossExponent,
    config.referenceLossDbm
  );

  const rssi =
    ap.transmitPowerDbm +
    ap.antennaGainDbi -
    pathLoss -
    wallAttenuationDb -
    floorAttenuationDb;

  return Math.round(rssi * 10) / 10;
}

/**
 * Classifies signal quality based on IEEE standard thresholds.
 */
export function getRssiQuality(
  rssiDbm: number,
  minRssiDbm: number = -80
): 'excellent' | 'good' | 'marginal' | 'poor' | 'disconnected' {
  if (rssiDbm < minRssiDbm) return 'disconnected';
  if (rssiDbm >= -55) return 'excellent';
  if (rssiDbm >= -68) return 'good';
  if (rssiDbm >= -75) return 'marginal';
  return 'poor';
}

/**
 * Maps RSSI dBm to a continuous turbo/spectral color map for visual heatmaps.
 * Range: -90 dBm (dark blue/purple) -> -75 (cyan/green) -> -65 (yellow) -> -40 (bright green/emerald)
 */
export function getRssiColor(rssiDbm: number): string {
  if (rssiDbm <= -90) return '#1e1e38'; // Out of range / noise floor
  if (rssiDbm <= -80) return '#3b82f6'; // Deep blue / weak
  if (rssiDbm <= -70) return '#06b6d4'; // Cyan / acceptable
  if (rssiDbm <= -62) return '#10b981'; // Green / good
  if (rssiDbm <= -52) return '#eab308'; // Yellow / strong
  return '#f97316';                     // Orange/Amber / maximum direct line of sight
}
