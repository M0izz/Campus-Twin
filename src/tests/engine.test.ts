import { describe, it, expect } from 'vitest';
import { simulateTick, isPointInsideBuilding, calculateObstacleAttenuation } from '../simulation/engine';
import { DEFAULT_CAMPUS_SCENARIO } from '../data/defaultCampus';
import type { Building, Scenario } from '../types/scenario';

describe('CampusTwin Simulation Engine', () => {
  it('detects if point is inside a building', () => {
    const building: Building = {
      id: 'b1',
      name: 'Hall',
      code: 'H1',
      position: { x: 0, y: 0, z: 0 },
      dimensions: { x: 10, y: 5, z: 10 },
      floors: 1,
      wallAttenuationDb: 10,
      category: 'academic',
      color: '#fff',
      roofColor: '#000',
    };

    expect(isPointInsideBuilding({ x: 2, y: 2, z: 2 }, building)).toBe(true);
    expect(isPointInsideBuilding({ x: 12, y: 2, z: 2 }, building)).toBe(false);
  });

  it('penalizes signal with wall attenuation when crossing building boundaries', () => {
    const scenario = { ...DEFAULT_CAMPUS_SCENARIO };
    const ap = scenario.accessPoints[0]; // inside Turing building
    const indoorClientPos = { x: -28, y: 1.2, z: -18 }; // inside Turing
    const outdoorClientPos = { x: 0, y: 1.2, z: 0 }; // outdoor quad

    const indoorAtten = calculateObstacleAttenuation(ap, indoorClientPos, scenario.buildings);
    const outdoorAtten = calculateObstacleAttenuation(ap, outdoorClientPos, scenario.buildings);

    expect(indoorAtten).toBe(0);
    expect(outdoorAtten).toBeGreaterThanOrEqual(14); // Turing wall attenuation is 14
  });

  it('executes a simulation tick and updates client associations and telemetry', () => {
    const scenario: Scenario = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));
    const result = simulateTick(scenario, 0.5, 0.5);

    expect(result.updatedClients.length).toBe(scenario.clients.length);
    expect(result.telemetry.totalClients).toBe(scenario.clients.length);
    expect(result.telemetry.connectedClients).toBeGreaterThan(0);
    expect(result.telemetry.averageLatencyMs).toBeGreaterThan(0);
  });

  it('fair-shares capacity when demand exceeds AP capacity', () => {
    const scenario: Scenario = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));
    // Severely constrain AP capacity to trigger congestion
    scenario.accessPoints[0].capacityMbps = 10;
    // Client has 22 Mbps demand
    const result = simulateTick(scenario, 0.5, 0.5);

    const client2 = result.updatedClients.find((c) => c.id === 'cli-02');
    expect(client2).toBeDefined();
    if (client2 && client2.associatedApId === 'ap-ath-1') {
      // Throughput should be throttled below original 22 Mbps
      expect(client2.throughputMbps).toBeLessThan(22);
      // Latency should increase due to congestion
      expect(client2.latencyMs).toBeGreaterThan(20);
    }
  });
});
