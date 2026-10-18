import React from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import {
  Wifi,
  Building2,
  Trash2,
  X,
  Gauge,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  Signal,
  ArrowRight,
} from 'lucide-react';
import { getRssiQuality } from '../../simulation/radio-model';

export const InspectorPanel: React.FC = () => {
  const isInspectorOpen = useCampusStore((s) => s.isInspectorOpen);
  const selectedObject = useCampusStore((s) => s.selectedObject);
  const selectObject = useCampusStore((s) => s.selectObject);
  const setInspectorOpen = useCampusStore((s) => s.setInspectorOpen);
  const scenario = useCampusStore((s) => s.scenario);
  const updateAccessPoint = useCampusStore((s) => s.updateAccessPoint);
  const removeAccessPoint = useCampusStore((s) => s.removeAccessPoint);
  const updateBuilding = useCampusStore((s) => s.updateBuilding);
  const apLoads = useCampusStore((s) => s.apLoads);

  // If inspector is collapsed or nothing selected, do not obstruct the canvas
  if (!isInspectorOpen || !selectedObject.type) {
    return null;
  }

  const handleClose = () => {
    setInspectorOpen(false);
    selectObject(null, null);
  };

  const selectedBuilding =
    selectedObject.type === 'building'
      ? scenario.buildings.find((b) => b.id === selectedObject.id)
      : null;

  const selectedAP =
    selectedObject.type === 'accessPoint'
      ? scenario.accessPoints.find((a) => a.id === selectedObject.id)
      : null;

  const selectedClient =
    selectedObject.type === 'client'
      ? scenario.clients.find((c) => c.id === selectedObject.id)
      : null;

  return (
    <aside className="contextual-inspector">
      {/* Inspector Header */}
      <div className="inspector-head">
        <div className="head-badge-row">
          <span className="object-type-badge">{selectedObject.type.toUpperCase()}</span>
          <span className="object-id-label">{selectedObject.id}</span>
        </div>
        <div className="head-title-row">
          <h3 className="object-title">
            {selectedBuilding?.name || selectedAP?.name || selectedClient?.name}
          </h3>
          <button className="btn-close-inspector" onClick={handleClose} title="Close inspector">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="inspector-content">
        {/* =========================================================
            CASE 1: ACCESS POINT INSPECTION & CONFIGURATION
            ========================================================= */}
        {selectedAP && (
          <div className="inspector-pane">
            <div className="status-indicator-bar">
              <span className={`status-pill ${selectedAP.status}`}>
                {selectedAP.status === 'online' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {selectedAP.status.toUpperCase()}
              </span>
              <span className="hardware-label">{selectedAP.model}</span>
            </div>

            {/* Load Utilization Gauge */}
            {(() => {
              const load = apLoads[selectedAP.id] || { demandMbps: 0, utilization: 0, clientCount: 0 };
              const utilPercent = Math.min(100, Math.round(load.utilization * 100));
              const isOverloaded = load.utilization > 0.85;

              return (
                <div className="utilization-card">
                  <div className="util-head">
                    <span className="util-title">
                      <Gauge size={13} /> AP Airtime & Bandwidth Load
                    </span>
                    <span className={`util-value ${isOverloaded ? 'overloaded' : ''}`}>
                      {utilPercent}%
                    </span>
                  </div>
                  <div className="util-progress-bar">
                    <div
                      className={`util-bar-fill ${isOverloaded ? 'overloaded' : ''}`}
                      style={{ width: `${utilPercent}%` }}
                    />
                  </div>
                  <div className="util-stats-grid">
                    <div>
                      <span className="u-lbl">Offered:</span>
                      <span className="u-val">{load.demandMbps.toFixed(1)} Mbps</span>
                    </div>
                    <div>
                      <span className="u-lbl">Capacity:</span>
                      <span className="u-val">{selectedAP.capacityMbps} Mbps</span>
                    </div>
                    <div>
                      <span className="u-lbl">Clients:</span>
                      <span className="u-val">{load.clientCount} connected</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Radio Settings */}
            <div className="section-divider-title">RADIO SPECIFICATIONS</div>

            <div className="form-item">
              <label>Frequency Band</label>
              <div className="segmented-control">
                {(['5GHz', '2.4GHz', '6GHz'] as const).map((band) => (
                  <button
                    key={band}
                    className={`segment-btn ${selectedAP.band === band ? 'active' : ''}`}
                    onClick={() => updateAccessPoint(selectedAP.id, { band })}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-item">
                <label>Wi-Fi Channel</label>
                <select
                  value={selectedAP.channel}
                  onChange={(e) =>
                    updateAccessPoint(selectedAP.id, { channel: Number(e.target.value) })
                  }
                  className="form-select"
                >
                  {selectedAP.band === '5GHz' ? (
                    <>
                      <option value={36}>Ch 36 (5180 MHz)</option>
                      <option value={44}>Ch 44 (5220 MHz)</option>
                      <option value={52}>Ch 52 (DFS)</option>
                      <option value={100}>Ch 100 (DFS)</option>
                      <option value={149}>Ch 149 (5745 MHz)</option>
                    </>
                  ) : (
                    <>
                      <option value={1}>Ch 1 (2412 MHz)</option>
                      <option value={6}>Ch 6 (2437 MHz)</option>
                      <option value={11}>Ch 11 (2462 MHz)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-item">
                <label>Channel Width</label>
                <select
                  value={selectedAP.channelWidthMhz}
                  onChange={(e) =>
                    updateAccessPoint(selectedAP.id, {
                      channelWidthMhz: Number(e.target.value) as any,
                    })
                  }
                  className="form-select"
                >
                  <option value={20}>20 MHz</option>
                  <option value={40}>40 MHz</option>
                  <option value={80}>80 MHz</option>
                  <option value={160}>160 MHz</option>
                </select>
              </div>
            </div>

            {/* Transmit Power Slider */}
            <div className="form-item">
              <div className="slider-label-row">
                <label>Transmit Power (Tx)</label>
                <span className="slider-num">{selectedAP.transmitPowerDbm} dBm</span>
              </div>
              <input
                type="range"
                min="10"
                max="26"
                step="1"
                value={selectedAP.transmitPowerDbm}
                onChange={(e) =>
                  updateAccessPoint(selectedAP.id, {
                    transmitPowerDbm: Number(e.target.value),
                  })
                }
                className="range-slider"
              />
              <span className="field-hint">
                Immediately updates log-distance signal calculation and coverage heatmap.
              </span>
            </div>

            {/* Capacity Slider */}
            <div className="form-item">
              <div className="slider-label-row">
                <label>Effective Capacity</label>
                <span className="slider-num">{selectedAP.capacityMbps} Mbps</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={selectedAP.capacityMbps}
                onChange={(e) =>
                  updateAccessPoint(selectedAP.id, {
                    capacityMbps: Number(e.target.value),
                  })
                }
                className="range-slider"
              />
            </div>

            {/* Actions: Failure Simulation & Deletion */}
            <div className="button-actions-row">
              <button
                className={`btn-action-state ${
                  selectedAP.status === 'online' ? 'warn' : 'success'
                }`}
                onClick={() =>
                  updateAccessPoint(selectedAP.id, {
                    status: selectedAP.status === 'online' ? 'offline' : 'online',
                  })
                }
              >
                {selectedAP.status === 'online' ? 'Simulate AP Outage' : 'Restore Online'}
              </button>

              <button
                className="btn-action-delete"
                onClick={() => removeAccessPoint(selectedAP.id)}
                title="Remove AP from campus scenario"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Associated Clients List */}
            <div className="section-divider-title">ASSOCIATED CLIENTS</div>
            <div className="client-listing">
              {scenario.clients
                .filter((c) => c.connected && c.associatedApId === selectedAP.id)
                .map((cli) => (
                  <div
                    key={cli.id}
                    className="client-row-item"
                    onClick={() => selectObject('client', cli.id)}
                  >
                    <div className="client-row-title">
                      <Laptop size={12} color="#57534e" />
                      <span>{cli.name}</span>
                    </div>
                    <div className="client-row-metrics">
                      <span className="rssi-tag">{cli.currentRssiDbm} dBm</span>
                      <span className="tp-tag">{cli.throughputMbps} Mbps</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================
            CASE 2: BUILDING INSPECTION
            ========================================================= */}
        {selectedBuilding && (
          <div className="inspector-pane">
            <div className="status-indicator-bar">
              <span className="status-pill online">
                <Building2 size={12} />
                {selectedBuilding.category.toUpperCase()}
              </span>
              <span className="hardware-label">Code: {selectedBuilding.code}</span>
            </div>

            <div className="properties-matrix">
              <div className="prop-cell">
                <span className="p-lbl">Floors</span>
                <span className="p-val">{selectedBuilding.floors}</span>
              </div>
              <div className="prop-cell">
                <span className="p-lbl">Footprint</span>
                <span className="p-val">
                  {selectedBuilding.dimensions.x}m × {selectedBuilding.dimensions.z}m
                </span>
              </div>
              <div className="prop-cell">
                <span className="p-lbl">Building Height</span>
                <span className="p-val">{selectedBuilding.dimensions.y}m</span>
              </div>
              <div className="prop-cell">
                <span className="p-lbl">Area Footprint</span>
                <span className="p-val">
                  {selectedBuilding.dimensions.x * selectedBuilding.dimensions.z} m²
                </span>
              </div>
            </div>

            {/* Wall Attenuation Slider */}
            <div className="form-item" style={{ marginTop: '12px' }}>
              <div className="slider-label-row">
                <label>Exterior Wall Loss</label>
                <span className="slider-num">{selectedBuilding.wallAttenuationDb} dB</span>
              </div>
              <input
                type="range"
                min="4"
                max="26"
                step="1"
                value={selectedBuilding.wallAttenuationDb}
                onChange={(e) =>
                  updateBuilding(selectedBuilding.id, {
                    wallAttenuationDb: Number(e.target.value),
                  })
                }
                className="range-slider"
              />
              <span className="field-hint">
                Standard drywall: 4-6 dB • Concrete: 12-16 dB • Thick reinforced masonry: 20+ dB.
              </span>
            </div>

            {/* Assigned APs inside this building */}
            <div className="section-divider-title">STATIONED ACCESS POINTS</div>
            <div className="client-listing">
              {scenario.accessPoints
                .filter((ap) => ap.buildingId === selectedBuilding.id)
                .map((ap) => (
                  <div
                    key={ap.id}
                    className="client-row-item"
                    onClick={() => selectObject('accessPoint', ap.id)}
                  >
                    <div className="client-row-title">
                      <Wifi size={12} color="#0284c7" />
                      <span>{ap.name}</span>
                    </div>
                    <span className="rssi-tag">{ap.band}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================
            CASE 3: CLIENT DEVICE INSPECTION
            ========================================================= */}
        {selectedClient && (
          <div className="inspector-pane">
            <div className="status-indicator-bar">
              <span className={`status-pill ${selectedClient.connected ? 'online' : 'offline'}`}>
                <Signal size={12} />
                {selectedClient.connected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
              <span className="hardware-label">{selectedClient.mobilityProfile.toUpperCase()}</span>
            </div>

            <div className="properties-matrix">
              <div className="prop-cell">
                <span className="p-lbl">Serving AP</span>
                <span className="p-val">{selectedClient.associatedApId || 'Out of Range'}</span>
              </div>
              <div className="prop-cell">
                <span className="p-lbl">Signal RSSI</span>
                <span className="p-val font-bold">
                  {selectedClient.currentRssiDbm ? `${selectedClient.currentRssiDbm} dBm` : 'N/A'}
                </span>
              </div>
              <div className="prop-cell">
                <span className="p-lbl">Traffic Demand</span>
                <span className="p-val">{selectedClient.demandMbps} Mbps</span>
              </div>
              <div className="prop-cell">
                <span className="p-lbl">Delivered Rate</span>
                <span className="p-val text-green">{selectedClient.throughputMbps} Mbps</span>
              </div>
            </div>

            <div className="meta-readout-card" style={{ marginTop: '10px' }}>
              <div className="meta-readout-row">
                <span>Signal Quality Classification:</span>
                <strong>{getRssiQuality(selectedClient.currentRssiDbm ?? -85)}</strong>
              </div>
              <div className="meta-readout-row">
                <span>Estimated Latency:</span>
                <strong>{selectedClient.latencyMs} ms</strong>
              </div>
              <div className="meta-readout-row">
                <span>Spatial Coordinates:</span>
                <code>
                  X: {selectedClient.position.x.toFixed(1)}, Z: {selectedClient.position.z.toFixed(1)}
                </code>
              </div>
            </div>

            {selectedClient.associatedApId && (
              <button
                className="btn-jump-to-ap"
                onClick={() => selectObject('accessPoint', selectedClient.associatedApId!)}
              >
                <span>Inspect Serving Access Point</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
