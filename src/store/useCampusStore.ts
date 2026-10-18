import { create } from 'zustand';
import type { AccessPoint, Building, Scenario, SimulationTelemetry } from '../types/scenario';
import { DEFAULT_CAMPUS_SCENARIO } from '../data/defaultCampus';
import { simulateTick } from '../simulation/engine';
import {
  PRESET_UNIVERSITIES,
  generateCampusBuildings,
  type CampusLocation,
} from '../services/campus-data';
import {
  saveScenarioToLocalStorage,
  loadScenarioFromLocalStorage,
  exportScenarioToFile,
} from '../services/scenario-storage';

export type SelectedObjectType = 'building' | 'accessPoint' | 'client' | null;

export interface VisualLayers {
  buildingGeometry: boolean; // 1. Campus and building geometry
  accessPoints: boolean;     // 2. Access-point locations and status
  heatmap: boolean;          // 3. Calculated Wi-Fi signal-strength heatmap
  heatmapMetric: 'rssi' | 'congestion';
  clients: boolean;          // 4. Connected-client locations
  associations: boolean;     // 5. Client-to-AP association links
  congestionZones: boolean;  // 6. Congestion and capacity utilization
  movementTrails: boolean;   // 7. User movement trails
  coverageWarnings: boolean; // 8. Weak-coverage and disconnected-client warnings
  coverageRings: boolean;
  labels: boolean;
  transparentRoofs: boolean;
}

export interface CampusStoreState {
  currentView: 'landing' | 'workspace';
  viewMode: '3d' | '2d';
  heatmapOpacity: number;
  activeTool: 'select' | 'place-ap';
  isInspectorOpen: boolean;
  activeFlyout: 'none' | 'layers' | 'inventory';

  scenario: Scenario;
  baselineScenario: Scenario | null;
  activeLocation: CampusLocation;
  telemetry: SimulationTelemetry;
  telemetryHistory: SimulationTelemetry[];
  selectedObject: {
    type: SelectedObjectType;
    id: string | null;
  };
  isPlaying: boolean;
  playbackSpeed: number;
  currentTimeSeconds: number;
  visualLayers: VisualLayers;
  apLoads: Record<string, { demandMbps: number; utilization: number; clientCount: number }>;

  // Modals & Panels
  showLocationModal: boolean;
  showComparisonModal: boolean;
  showAddApDrawer: boolean;
  showTopologyModal: boolean;
  isTopologyAnimated: boolean;
  topologyFilter: {
    buildingId: string | 'all';
    status: 'all' | 'connected' | 'overloaded' | 'offline';
    clientType: 'all' | 'stationary' | 'walking' | 'roaming';
  };

  // Actions
  setView: (view: 'landing' | 'workspace') => void;
  setViewMode: (mode: '3d' | '2d') => void;
  setHeatmapOpacity: (val: number) => void;
  setActiveTool: (tool: 'select' | 'place-ap') => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setActiveFlyout: (flyout: 'none' | 'layers' | 'inventory') => void;

  openLocationModal: () => void;
  closeLocationModal: () => void;
  openComparisonModal: () => void;
  closeComparisonModal: () => void;
  openAddApDrawer: () => void;
  closeAddApDrawer: () => void;
  openTopologyModal: () => void;
  closeTopologyModal: () => void;
  toggleTopologyModal: () => void;
  setTopologyAnimated: (val: boolean) => void;
  setTopologyFilter: (filter: Partial<CampusStoreState['topologyFilter']>) => void;
  setCampusLocation: (loc: CampusLocation, populateNetwork?: boolean) => void;

  selectObject: (type: SelectedObjectType, id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setPlaybackSpeed: (speed: number) => void;
  tick: () => void;
  stepForward: () => void;
  resetSimulation: () => void;
  updateAccessPoint: (id: string, updates: Partial<AccessPoint>) => void;
  addAccessPoint: (ap: AccessPoint) => void;
  removeAccessPoint: (id: string) => void;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  toggleLayer: (layer: keyof VisualLayers) => void;
  setLayer: <K extends keyof VisualLayers>(layer: K, value: VisualLayers[K]) => void;
  loadScenario: (scenario: Scenario) => void;
  resetToDefault: () => void;
  saveCurrentScenario: () => boolean;
  exportCurrentScenario: () => void;
  createSnapshotAsBaseline: () => void;
}

const savedScenario = loadScenarioFromLocalStorage();
const initialScenario = savedScenario || JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));
const initialTickResult = simulateTick(initialScenario, 0, 0);

export const useCampusStore = create<CampusStoreState>((set, get) => ({
  currentView: 'landing',
  viewMode: '3d',
  heatmapOpacity: 0.75,
  activeTool: 'select',
  isInspectorOpen: false,
  activeFlyout: 'none',

  scenario: initialScenario,
  baselineScenario: JSON.parse(JSON.stringify(initialScenario)),
  activeLocation: PRESET_UNIVERSITIES[0],
  telemetry: initialTickResult.telemetry,
  telemetryHistory: [initialTickResult.telemetry],
  selectedObject: { type: null, id: null },
  isPlaying: false,
  playbackSpeed: 1.0,
  currentTimeSeconds: 0,
  visualLayers: {
    buildingGeometry: true,
    accessPoints: true,
    heatmap: true,
    heatmapMetric: 'rssi',
    clients: true,
    associations: true,
    congestionZones: true,
    movementTrails: true,
    coverageWarnings: true,
    coverageRings: true,
    labels: false, // Default decluttered: labels show on hover/select
    transparentRoofs: false,
  },
  apLoads: initialTickResult.apLoads,

  showLocationModal: false,
  showComparisonModal: false,
  showAddApDrawer: false,
  showTopologyModal: false,
  isTopologyAnimated: true,
  topologyFilter: {
    buildingId: 'all',
    status: 'all',
    clientType: 'all',
  },

  setView: (view) => set({ currentView: view }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setHeatmapOpacity: (val) => set({ heatmapOpacity: val }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setActiveFlyout: (flyout) =>
    set((state) => ({ activeFlyout: state.activeFlyout === flyout ? 'none' : flyout })),

  openLocationModal: () => set({ showLocationModal: true }),
  closeLocationModal: () => set({ showLocationModal: false }),
  openComparisonModal: () => set({ showComparisonModal: true }),
  closeComparisonModal: () => set({ showComparisonModal: false }),
  openAddApDrawer: () => set({ showAddApDrawer: true }),
  closeAddApDrawer: () => set({ showAddApDrawer: false }),
  openTopologyModal: () => set({ showTopologyModal: true }),
  closeTopologyModal: () => set({ showTopologyModal: false }),
  toggleTopologyModal: () => set((state) => ({ showTopologyModal: !state.showTopologyModal })),
  setTopologyAnimated: (val) => set({ isTopologyAnimated: val }),
  setTopologyFilter: (filter) =>
    set((state) => ({
      topologyFilter: {
        ...state.topologyFilter,
        ...filter,
      },
    })),

  setCampusLocation: (loc, populateNetwork = true) => {
    const { scenario } = get();
    const newBuildings = generateCampusBuildings(loc);

    let nextAps: AccessPoint[] = [];
    if (populateNetwork) {
      nextAps = newBuildings.map((b, idx) => ({
        id: `ap-${loc.id}-${idx + 1}`,
        name: `AP-${b.code}-Floor1`,
        buildingId: b.id,
        position: { x: b.position.x, y: 4.5, z: b.position.z },
        band: idx % 2 === 0 ? '5GHz' : '2.4GHz',
        channel: idx % 2 === 0 ? 36 + idx * 8 : 1 + (idx % 3) * 5,
        channelWidthMhz: idx % 2 === 0 ? 80 : 20,
        transmitPowerDbm: 20,
        antennaGainDbi: 4,
        capacityMbps: idx % 2 === 0 ? 867 : 300,
        status: 'online',
        model: idx % 2 === 0 ? 'Cisco Catalyst 9124AXE' : 'Aruba AP-555 Wi-Fi 6',
      }));
      nextAps.push({
        id: `ap-${loc.id}-quad`,
        name: `AP-${loc.shortName}-Central-Quad`,
        position: { x: 0, y: 4.0, z: 2 },
        band: '2.4GHz',
        channel: 6,
        channelWidthMhz: 20,
        transmitPowerDbm: 22,
        antennaGainDbi: 6,
        capacityMbps: 300,
        status: 'online',
        model: 'Cisco Meraki MR76 Outdoor',
      });
    }

    const nextScenario: Scenario = {
      ...scenario,
      id: `campus-${loc.id}`,
      name: loc.name,
      description: `Geospatial digital twin for ${loc.name}. Attribution: ${loc.attribution}. All wireless APs and clients are simulated digital models.`,
      buildings: newBuildings,
      accessPoints: nextAps,
    };

    const tickResult = simulateTick(nextScenario, 0, 0);

    set({
      scenario: nextScenario,
      activeLocation: loc,
      telemetry: tickResult.telemetry,
      telemetryHistory: [tickResult.telemetry],
      apLoads: tickResult.apLoads,
      currentTimeSeconds: 0,
      isPlaying: false,
      selectedObject: { type: null, id: null },
      isInspectorOpen: false,
      showLocationModal: false,
      currentView: 'workspace',
    });
  },

  selectObject: (type, id) => {
    // When an object is selected, automatically open the contextual inspector!
    // When deselected (null), close the contextual inspector so the campus has room to breathe!
    set({
      selectedObject: { type, id },
      isInspectorOpen: type !== null,
    });
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  tick: () => {
    const { scenario, isPlaying, playbackSpeed, currentTimeSeconds, telemetryHistory } = get();
    if (!isPlaying) return;

    const baseDt = scenario.modelConfig.simulationStepSeconds || 0.5;
    const dt = baseDt * playbackSpeed;
    const nextTime = currentTimeSeconds + dt;

    const tickResult = simulateTick(scenario, dt, nextTime);

    const nextScenario = {
      ...scenario,
      clients: tickResult.updatedClients,
    };

    const nextHistory = [...telemetryHistory.slice(-60), tickResult.telemetry];

    set({
      scenario: nextScenario,
      telemetry: tickResult.telemetry,
      telemetryHistory: nextHistory,
      currentTimeSeconds: nextTime,
      apLoads: tickResult.apLoads,
    });
  },

  stepForward: () => {
    const { scenario, currentTimeSeconds, telemetryHistory } = get();
    const dt = scenario.modelConfig.simulationStepSeconds || 0.5;
    const nextTime = currentTimeSeconds + dt;

    const tickResult = simulateTick(scenario, dt, nextTime);
    const nextScenario = {
      ...scenario,
      clients: tickResult.updatedClients,
    };

    set({
      scenario: nextScenario,
      telemetry: tickResult.telemetry,
      telemetryHistory: [...telemetryHistory.slice(-60), tickResult.telemetry],
      currentTimeSeconds: nextTime,
      apLoads: tickResult.apLoads,
    });
  },

  resetSimulation: () => {
    const { scenario } = get();
    const fresh = JSON.parse(JSON.stringify(scenario));
    const initResult = simulateTick(fresh, 0, 0);
    set({
      scenario: fresh,
      telemetry: initResult.telemetry,
      telemetryHistory: [initResult.telemetry],
      currentTimeSeconds: 0,
      isPlaying: false,
      apLoads: initResult.apLoads,
      selectedObject: { type: null, id: null },
      isInspectorOpen: false,
    });
  },

  updateAccessPoint: (id, updates) => {
    const { scenario, currentTimeSeconds } = get();
    const updatedAps = scenario.accessPoints.map((ap) =>
      ap.id === id ? { ...ap, ...updates } : ap
    );
    const updatedScenario = { ...scenario, accessPoints: updatedAps };
    const tickResult = simulateTick(updatedScenario, 0, currentTimeSeconds);

    set({
      scenario: { ...updatedScenario, clients: tickResult.updatedClients },
      telemetry: tickResult.telemetry,
      apLoads: tickResult.apLoads,
    });
  },

  addAccessPoint: (ap) => {
    const { scenario, currentTimeSeconds } = get();
    const updatedScenario = {
      ...scenario,
      accessPoints: [...scenario.accessPoints, ap],
    };
    const tickResult = simulateTick(updatedScenario, 0, currentTimeSeconds);

    set({
      scenario: { ...updatedScenario, clients: tickResult.updatedClients },
      telemetry: tickResult.telemetry,
      apLoads: tickResult.apLoads,
      selectedObject: { type: 'accessPoint', id: ap.id },
      isInspectorOpen: true,
      showAddApDrawer: false,
      activeTool: 'select',
    });
  },

  removeAccessPoint: (id) => {
    const { scenario, currentTimeSeconds, selectedObject } = get();
    const updatedScenario = {
      ...scenario,
      accessPoints: scenario.accessPoints.filter((a) => a.id !== id),
    };
    const tickResult = simulateTick(updatedScenario, 0, currentTimeSeconds);

    set({
      scenario: { ...updatedScenario, clients: tickResult.updatedClients },
      telemetry: tickResult.telemetry,
      apLoads: tickResult.apLoads,
      selectedObject: selectedObject.id === id ? { type: null, id: null } : selectedObject,
      isInspectorOpen: selectedObject.id === id ? false : get().isInspectorOpen,
    });
  },

  updateBuilding: (id, updates) => {
    const { scenario, currentTimeSeconds } = get();
    const updatedBuildings = scenario.buildings.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    const updatedScenario = { ...scenario, buildings: updatedBuildings };
    const tickResult = simulateTick(updatedScenario, 0, currentTimeSeconds);

    set({
      scenario: { ...updatedScenario, clients: tickResult.updatedClients },
      telemetry: tickResult.telemetry,
      apLoads: tickResult.apLoads,
    });
  },

  toggleLayer: (layer) => {
    set((state) => ({
      visualLayers: {
        ...state.visualLayers,
        [layer]: !state.visualLayers[layer],
      },
    }));
  },

  setLayer: (layer, value) => {
    set((state) => ({
      visualLayers: {
        ...state.visualLayers,
        [layer]: value,
      },
    }));
  },

  loadScenario: (newScenario) => {
    const initResult = simulateTick(newScenario, 0, 0);
    set({
      scenario: newScenario,
      telemetry: initResult.telemetry,
      telemetryHistory: [initResult.telemetry],
      currentTimeSeconds: 0,
      isPlaying: false,
      apLoads: initResult.apLoads,
      selectedObject: { type: null, id: null },
      isInspectorOpen: false,
    });
  },

  resetToDefault: () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO));
    const initResult = simulateTick(fresh, 0, 0);
    set({
      scenario: fresh,
      activeLocation: PRESET_UNIVERSITIES[0],
      telemetry: initResult.telemetry,
      telemetryHistory: [initResult.telemetry],
      currentTimeSeconds: 0,
      isPlaying: false,
      apLoads: initResult.apLoads,
      selectedObject: { type: null, id: null },
      isInspectorOpen: false,
    });
  },

  saveCurrentScenario: () => {
    const { scenario } = get();
    return saveScenarioToLocalStorage(scenario);
  },

  exportCurrentScenario: () => {
    const { scenario } = get();
    exportScenarioToFile(scenario);
  },

  createSnapshotAsBaseline: () => {
    const { scenario } = get();
    set({ baselineScenario: JSON.parse(JSON.stringify(scenario)) });
  },
}));
