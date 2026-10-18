import React from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import {
  MousePointer,
  PlusCircle,
  Layers,
  Building2,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Tag,
  CircleDot,
  GitBranch,
  Radio,
  Users,
  AlertTriangle,
  AlertCircle,
  Activity,
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  const activeTool = useCampusStore((s) => s.activeTool);
  const setActiveTool = useCampusStore((s) => s.setActiveTool);
  const activeFlyout = useCampusStore((s) => s.activeFlyout);
  const setActiveFlyout = useCampusStore((s) => s.setActiveFlyout);
  const openAddApDrawer = useCampusStore((s) => s.openAddApDrawer);
  const resetToDefault = useCampusStore((s) => s.resetToDefault);

  const visualLayers = useCampusStore((s) => s.visualLayers);
  const toggleLayer = useCampusStore((s) => s.toggleLayer);

  return (
    <aside className="workspace-left-rail">
      {/* Selection Tool */}
      <button
        className={`rail-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setActiveTool('select')}
        title="Select Tool (Click building, AP, or client)"
      >
        <MousePointer size={18} />
        <span className="rail-tooltip">Select Tool</span>
      </button>

      {/* Place AP on Canvas Mode */}
      <button
        className={`rail-btn ${activeTool === 'place-ap' ? 'active' : ''}`}
        onClick={() => {
          setActiveTool(activeTool === 'place-ap' ? 'select' : 'place-ap');
        }}
        title="Click-to-Place AP on Ground"
      >
        <PlusCircle size={18} />
        <span className="rail-tooltip">Click to Place AP</span>
      </button>

      {/* Hamina AP Vendor Specs Drawer */}
      <button
        className="rail-btn"
        onClick={openAddApDrawer}
        title="Deploy AP via Hardware Catalog (Cisco/Aruba/Ruckus/Mist)"
      >
        <SlidersHorizontal size={18} />
        <span className="rail-tooltip">AP Hardware Catalog</span>
      </button>

      <div className="rail-divider" />

      {/* Layers Flyout Toggle */}
      <button
        className={`rail-btn ${activeFlyout === 'layers' ? 'active' : ''}`}
        onClick={() => setActiveFlyout('layers')}
        title="Toggle Visual Layers Palette"
      >
        <Layers size={18} />
        <span className="rail-tooltip">Visualization Layers</span>
      </button>

      {/* Network Topology Graph Inspector */}
      <button
        className="rail-btn"
        onClick={useCampusStore.getState().openTopologyModal}
        title="Open Network Topology & Packet Pulses Graph"
      >
        <GitBranch size={18} />
        <span className="rail-tooltip">Network Topology Graph</span>
      </button>

      {/* Transparent Roofs / Indoor View */}
      <button
        className={`rail-btn ${visualLayers.transparentRoofs ? 'active' : ''}`}
        onClick={() => toggleLayer('transparentRoofs')}
        title="Toggle Transparent Roofs (Indoor View)"
      >
        <Building2 size={18} />
        <span className="rail-tooltip">Indoor AP View</span>
      </button>

      <div className="rail-divider" />

      {/* Reset Scenario */}
      <button
        className="rail-btn"
        onClick={resetToDefault}
        title="Reset Campus to Default Scenario"
      >
        <RotateCcw size={18} />
        <span className="rail-tooltip">Reset Campus Scenario</span>
      </button>

      {/* Collapsible Layers Flyout Panel */}
      {activeFlyout === 'layers' && (
        <div className="layers-flyout-panel">
          <div className="flyout-header">
            <h4>Visualization Layers</h4>
            <button className="flyout-close" onClick={() => setActiveFlyout('none')}>
              ×
            </button>
          </div>

          <div className="flyout-body">
            {/* 1. Campus and Building Geometry */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.buildingGeometry}
                onChange={() => toggleLayer('buildingGeometry')}
              />
              <Building2 size={14} color="#42545B" />
              <span>Campus & Building Geometry</span>
            </label>

            {/* 2. Access Point Locations & Status */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.accessPoints}
                onChange={() => toggleLayer('accessPoints')}
              />
              <Radio size={14} color="#4A8BC7" />
              <span>Access Point Locations & Hardware</span>
            </label>

            {/* 3. Wi-Fi Signal Coverage Heatmap */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.heatmap}
                onChange={() => toggleLayer('heatmap')}
              />
              <Layers size={14} color="#287A50" />
              <span>Calculated Wi-Fi RSSI Heatmap</span>
            </label>

            {/* 4. Connected Client Locations */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.clients}
                onChange={() => toggleLayer('clients')}
              />
              <Users size={14} color="#4A8BC7" />
              <span>Client Device Locations</span>
            </label>

            {/* 5. Client-to-AP Association Links */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.associations}
                onChange={() => toggleLayer('associations')}
              />
              <GitBranch size={14} color="#8FC9BE" />
              <span>802.11 Association Rays & Pulses</span>
            </label>

            {/* 6. Congestion & Capacity Utilization */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.congestionZones}
                onChange={() => toggleLayer('congestionZones')}
              />
              <AlertTriangle size={14} color="#E06D53" />
              <span>Overload & Congestion Zones</span>
            </label>

            {/* 7. User Movement Trails */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.movementTrails}
                onChange={() => toggleLayer('movementTrails')}
              />
              <Activity size={14} color="#287A50" />
              <span>Pedestrian Mobility Trails</span>
            </label>

            {/* 8. Weak Coverage & Disconnected Warnings */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.coverageWarnings}
                onChange={() => toggleLayer('coverageWarnings')}
              />
              <AlertCircle size={14} color="#E06D53" />
              <span>Weak Coverage & Outage Warnings</span>
            </label>

            <div className="flyout-divider" />

            {/* Additional Display Options */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.coverageRings}
                onChange={() => toggleLayer('coverageRings')}
              />
              <CircleDot size={14} color="#C8DDF5" />
              <span>Nominal AP Coverage Radii</span>
            </label>

            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.labels}
                onChange={() => toggleLayer('labels')}
              />
              <Tag size={14} color="#64767A" />
              <span>Always-Visible Object Labels</span>
            </label>

            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.transparentRoofs}
                onChange={() => toggleLayer('transparentRoofs')}
              />
              <Eye size={14} color="#D87834" />
              <span>See-through Roofs (Indoor View)</span>
            </label>
          </div>
        </div>
      )}
    </aside>
  );
};
