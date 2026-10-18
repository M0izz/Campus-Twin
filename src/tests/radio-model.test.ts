import { describe, it, expect } from 'vitest';
import {
  calculateEuclideanDistance,
  calculatePathLoss,
  calculateRssi,
  getRssiQuality,
  getRssiColor,
} from '../simulation/radio-model';
import type { AccessPoint, ModelConfig, Vec3 } from '../types/scenario';

describe('Signal Propagation Radio Model', () => {
  const defaultConfig: ModelConfig = {
    pathLossExponent: 3.0,
    referenceDistanceM: 1.0,
    referenceLossDbm: 40.0,
    minimumRssiDbm: -80,
    simulationStepSeconds: 1,
    wallDefaultAttenuationDb: 10,
  };

  const sampleAP: AccessPoint = {
    id: 'ap-1',
    name: 'Lecture Hall AP-1',
    position: { x: 0, y: 3, z: 0 },
    band: '5GHz',
    channel: 36,
    channelWidthMhz: 80,
    transmitPowerDbm: 20,
    antennaGainDbi: 3,
    capacityMbps: 867,
    status: 'online',
    model: 'Enterprise 802.11ax AP',
  };

  it('calculates 3D Euclidean distance correctly', () => {
    const p1: Vec3 = { x: 0, y: 0, z: 0 };
    const p2: Vec3 = { x: 3, y: 4, z: 0 };
    expect(calculateEuclideanDistance(p1, p2)).toBeCloseTo(5.0, 2);
  });

  it('predicts path loss according to log-distance equation', () => {
    // Doubling distance with n=3 should increase PL by 10 * 3 * log10(2) ~= 9.03 dB
    const pl10 = calculatePathLoss(10, 1.0, 3.0, 40.0);
    const pl20 = calculatePathLoss(20, 1.0, 3.0, 40.0);
    const delta = pl20 - pl10;
    expect(delta).toBeCloseTo(9.0308998, 2);
  });

  it('reduces received signal strength (RSSI) monotonically as distance increases', () => {
    const posNear: Vec3 = { x: 5, y: 3, z: 0 };
    const posFar: Vec3 = { x: 25, y: 3, z: 0 };

    const rssiNear = calculateRssi(sampleAP, posNear, defaultConfig);
    const rssiFar = calculateRssi(sampleAP, posFar, defaultConfig);

    expect(rssiNear).toBeGreaterThan(rssiFar);
  });

  it('increases received signal strength directly with higher transmit power', () => {
    const clientPos: Vec3 = { x: 10, y: 1.5, z: 0 };
    const apStandard = { ...sampleAP, transmitPowerDbm: 17 };
    const apBoosted = { ...sampleAP, transmitPowerDbm: 23 };

    const rssiStandard = calculateRssi(apStandard, clientPos, defaultConfig);
    const rssiBoosted = calculateRssi(apBoosted, clientPos, defaultConfig);

    expect(rssiBoosted - rssiStandard).toBeCloseTo(6.0, 1);
  });

  it('accounts for physical wall attenuation correctly', () => {
    const clientPos: Vec3 = { x: 15, y: 1.5, z: 0 };
    const freeRssi = calculateRssi(sampleAP, clientPos, defaultConfig, 0);
    const attenuatedRssi = calculateRssi(sampleAP, clientPos, defaultConfig, 12);

    expect(freeRssi - attenuatedRssi).toBeCloseTo(12.0, 1);
  });

  it('returns noise floor for offline access points', () => {
    const offlineAP: AccessPoint = { ...sampleAP, status: 'offline' };
    const clientPos: Vec3 = { x: 5, y: 1.5, z: 0 };
    expect(calculateRssi(offlineAP, clientPos, defaultConfig)).toBe(-110);
  });

  it('classifies signal quality tiers according to industry thresholds', () => {
    expect(getRssiQuality(-50, -80)).toBe('excellent');
    expect(getRssiQuality(-65, -80)).toBe('good');
    expect(getRssiQuality(-72, -80)).toBe('marginal');
    expect(getRssiQuality(-78, -80)).toBe('poor');
    expect(getRssiQuality(-85, -80)).toBe('disconnected');
  });

  it('generates continuous color scale values for heatmap display', () => {
    expect(getRssiColor(-45)).toBe('#f97316');
    expect(getRssiColor(-60)).toBe('#eab308');
    expect(getRssiColor(-68)).toBe('#10b981');
    expect(getRssiColor(-76)).toBe('#06b6d4');
    expect(getRssiColor(-85)).toBe('#3b82f6');
    expect(getRssiColor(-95)).toBe('#1e1e38');
  });
});
