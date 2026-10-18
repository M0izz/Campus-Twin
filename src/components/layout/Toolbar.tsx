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
            {/* Heatmap Layer */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.heatmap}
                onChange={() => toggleLayer('heatmap')}
              />
              <Eye size={14} color="#0284c7" />
              <span>RF Signal Coverage Heatmap</span>
            </label>

            {/* Coverage Radii */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.coverageRings}
                onChange={() => toggleLayer('coverageRings')}
              />
              <CircleDot size={14} color="#4f46e5" />
              <span>AP Nominal Coverage Radii</span>
            </label>

            {/* Association Rays */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.associations}
                onChange={() => toggleLayer('associations')}
              />
              <GitBranch size={14} color="#15803d" />
              <span>Client-to-AP Association Rays</span>
            </label>

            {/* Labels Decluttering */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.labels}
                onChange={() => toggleLayer('labels')}
              />
              <Tag size={14} color="#78716c" />
              <span>Always Show Object Labels</span>
            </label>

            {/* Transparent Roofs */}
            <label className="flyout-layer-row">
              <input
                type="checkbox"
                checked={visualLayers.transparentRoofs}
                onChange={() => toggleLayer('transparentRoofs')}
              />
              <Building2 size={14} color="#d97706" />
              <span>See-through Building Roofs</span>
            </label>
          </div>
        </div>
      )}
    </aside>
  );
};
