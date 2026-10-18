import React from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import { Compass, Sliders, Radio } from 'lucide-react';

export const MapOverlays: React.FC = () => {
  const viewMode = useCampusStore((s) => s.viewMode);
  const setViewMode = useCampusStore((s) => s.setViewMode);
  const heatmapOpacity = useCampusStore((s) => s.heatmapOpacity);
  const setHeatmapOpacity = useCampusStore((s) => s.setHeatmapOpacity);
  const showHeatmap = useCampusStore((s) => s.visualLayers.heatmap);
  const toggleLayer = useCampusStore((s) => s.toggleLayer);

  return (
    <div className="map-overlays-container">
      {/* Top-Right: 2D / 3D Mode Switcher & Compass */}
      <div className="map-control-top-right">
        <div className="view-mode-toggle-group">
          <button
            className={`view-mode-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
            title="3D Oblique Isometric View"
          >
            3D
          </button>
          <button
            className={`view-mode-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
            title="2D Top-Down Plan View"
          >
            2D
          </button>
        </div>

        <div className="map-compass-badge" title="Campus North Orientation">
          <Compass size={15} className="compass-icon" color="#287A50" />
          <span className="font-mono">N</span>
        </div>
      </div>

      {/* Bottom-Left: Metric Architectural Scale Bar */}
      <div className="map-scale-bar-wrapper">
        <div className="scale-bar-ticks">
          <div className="scale-line" />
          <div className="scale-notch start" />
          <div className="scale-notch mid" />
          <div className="scale-notch end" />
        </div>
        <div className="scale-labels-row font-mono">
          <span>0m</span>
          <span>25m</span>
          <span>50m</span>
        </div>
      </div>

      {/* Bottom-Right: Unobtrusive Scientific RF Coverage Legend with Opacity Slider */}
      {showHeatmap && (
        <div className="map-rf-legend-card">
          <div className="legend-header-row">
            <div className="legend-title">
              <Radio size={12} color="#287A50" />
              <span>Calculated Wi-Fi RSSI</span>
            </div>
            <button
              className="legend-hide-btn"
              onClick={() => toggleLayer('heatmap')}
              title="Hide Heatmap"
            >
              ×
            </button>
          </div>

          {/* Continuous Scientific Spectral Gradient Bar */}
          <div className="legend-gradient-bar" />

          {/* dBm Scale Labels in IBM Plex Mono */}
          <div className="legend-scale-labels font-mono">
            <span>-85 dBm<br /><small>Edge</small></span>
            <span>-75 dBm<br /><small>Low</small></span>
            <span>-65 dBm<br /><small>Good</small></span>
            <span>-50 dBm<br /><small>Peak</small></span>
          </div>

          {/* Heatmap Opacity Control */}
          <div className="legend-opacity-slider-row">
            <Sliders size={11} color="#64767A" />
            <span className="opacity-lbl font-mono">
              Opacity: {Math.round(heatmapOpacity * 100)}%
            </span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
              className="legend-slider"
            />
          </div>
        </div>
      )}
    </div>
  );
};
