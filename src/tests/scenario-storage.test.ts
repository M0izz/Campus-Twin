import { describe, it, expect } from 'vitest';
import {
  parseScenarioJson,
  compareScenarios,
} from '../services/scenario-storage';
import { DEFAULT_CAMPUS_SCENARIO } from '../data/defaultCampus';
import type { Scenario } from '../types/scenario';

describe('Scenario Storage, Validation & Comparison', () => {
  it('validates a correct scenario successfully with Zod', () => {
    const jsonStr = JSON.stringify(DEFAULT_CAMPUS_SCENARIO);
    const result = parseScenarioJson(jsonStr);
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(DEFAULT_CAMPUS_SCENARIO.id);
  });

  it('rejects an invalid scenario with missing required fields', () => {
    const invalid = { id: 'test-1', name: 'Broken' };
    const result = parseScenarioJson(JSON.stringify(invalid));
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('computes what-if metrics difference between baseline and modified deployments', () => {
    const baseline: Scenario = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));
    const modified: Scenario = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));

    // Boost modified transmit powers and double capacity
    modified.name = 'Proposed Wi-Fi 6 Upgrade';
    modified.accessPoints.forEach((ap) => {
      ap.transmitPowerDbm = 23;
      ap.capacityMbps = 1500;
    });

    const comparison = compareScenarios(baseline, modified);
    expect(comparison.baselineName).toBe(baseline.name);
    expect(comparison.modifiedName).toBe('Proposed Wi-Fi 6 Upgrade');
    expect(comparison.findings.length).toBeGreaterThan(0);
  });
});
