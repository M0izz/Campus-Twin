import React, { useState } from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import {
  Wifi,
  Activity,
  Layers,
  Radio,
  ArrowLeft,
  GitCompare,
  Save,
  Download,
  Check,
  Building,
} from 'lucide-react';

export const Header: React.FC = () => {
  const telemetry = useCampusStore((s) => s.telemetry);
  const scenario = useCampusStore((s) => s.scenario);
  const setView = useCampusStore((s) => s.setView);
  const openLocationModal = useCampusStore((s) => s.openLocationModal);
  const openComparisonModal = useCampusStore((s) => s.openComparisonModal);
  const saveCurrentScenario = useCampusStore((s) => s.saveCurrentScenario);
  const exportCurrentScenario = useCampusStore((s) => s.exportCurrentScenario);

  const [savedNotice, setSavedNotice] = useState(false);

  const onlineApCount = scenario.accessPoints.filter((a) => a.status === 'online').length;

  const handleSave = () => {
    saveCurrentScenario();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <header className="workspace-header">
      {/* Left: Navigation, Brand & Campus Selector */}
      <div className="header-left">
        <button
          className="btn-back-nav"
          onClick={() => setView('landing')}
          title="Return to Product Overview"
        >
          <ArrowLeft size={15} />
        </button>

        <div className="header-brand-mark">
          <Radio size={16} />
        </div>

        {/* Campus Location Dropdown */}
        <div className="campus-selector-wrapper">
          <button
            className="campus-selector-trigger"
            onClick={openLocationModal}
            title="Configure or Switch Campus Location"
          >
            <Building size={14} className="campus-icon" />
            <span className="campus-title">{scenario.name.split('—')[0].trim()}</span>
            <span className={`campus-source-badge ${scenario.isDemo ? 'demo' : 'osm'}`}>
              {scenario.isDemo ? 'DEMO' : 'OSM GIS'}
            </span>
          </button>
        </div>
      </div>

      {/* Center: Live Engineering Telemetry Readouts */}
      <div className="header-center-telemetry">
        <div className="telemetry-item">
          <Wifi size={13} color="#4A8BC7" />
          <span className="telemetry-lbl">APs Online:</span>
          <span className="telemetry-val font-mono">
            {onlineApCount}/{scenario.accessPoints.length}
          </span>
        </div>

        <div className="telemetry-v-sep" />

        <div className="telemetry-item">
          <Layers size={13} color="#287A50" />
          <span className="telemetry-lbl">Coverage:</span>
          <span className="telemetry-val font-mono">{telemetry.coverageRatioPercent}%</span>
        </div>

        <div className="telemetry-v-sep" />

        <div className="telemetry-item">
          <Activity size={13} color="#64767A" />
          <span className="telemetry-lbl">Mean Latency:</span>
          <span className="telemetry-val font-mono">{telemetry.averageLatencyMs} ms</span>
        </div>

        {telemetry.overloadedApCount > 0 && (
          <>
            <div className="telemetry-v-sep" />
            <div className="telemetry-alert-badge font-mono">
              <span>{telemetry.overloadedApCount} AP Congested</span>
            </div>
          </>
        )}
      </div>

      {/* Right: Engineering Actions (Compare, Save, Export) */}
      <div className="header-right-actions">
        <button
          className="btn-header-tool"
          onClick={openComparisonModal}
          title="Compare baseline vs proposed network scenario"
        >
          <GitCompare size={14} />
          <span>Compare What-If</span>
        </button>

        <button
          className={`btn-header-tool ${savedNotice ? 'success' : ''}`}
          onClick={handleSave}
          title="Save scenario state to local storage"
        >
          {savedNotice ? <Check size={14} /> : <Save size={14} />}
          <span>{savedNotice ? 'Saved' : 'Save'}</span>
        </button>

        <button
          className="btn-header-tool"
          onClick={exportCurrentScenario}
          title="Export validated scenario JSON file"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
