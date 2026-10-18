import React, { useMemo } from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import {
  GitFork,
  X,
  Play,
  Pause,
  Filter,
  Wifi,
  Users,
  AlertTriangle,
} from 'lucide-react';

export const TopologyModal: React.FC = () => {
  const show = useCampusStore((s) => s.showTopologyModal);
  const close = useCampusStore((s) => s.closeTopologyModal);
  const scenario = useCampusStore((s) => s.scenario);
  const apLoads = useCampusStore((s) => s.apLoads);
  const selectedObject = useCampusStore((s) => s.selectedObject);
  const selectObject = useCampusStore((s) => s.selectObject);
  const isAnimated = useCampusStore((s) => s.isTopologyAnimated);
  const setAnimated = useCampusStore((s) => s.setTopologyAnimated);
  const filter = useCampusStore((s) => s.topologyFilter);
  const setFilter = useCampusStore((s) => s.setTopologyFilter);

  if (!show) return null;

  const { accessPoints, clients, buildings } = scenario;

  // Filter APs and Clients based on user selection
  const filteredAps = useMemo(() => {
    return accessPoints.filter((ap) => {
      if (filter.buildingId !== 'all' && ap.buildingId !== filter.buildingId) {
        return false;
      }
      const load = apLoads[ap.id] || { utilization: 0, clientCount: 0 };
      if (filter.status === 'offline' && ap.status !== 'offline') return false;
      if (filter.status === 'overloaded' && load.utilization <= 0.85) return false;
      if (filter.status === 'connected' && (ap.status === 'offline' || load.clientCount === 0)) return false;
      return true;
    });
  }, [accessPoints, apLoads, filter]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filter.clientType !== 'all' && c.mobilityProfile !== filter.clientType) return false;
      if (filter.status === 'offline' && c.connected) return false;
      if (filter.status === 'connected' && !c.connected) return false;
      if (filter.buildingId !== 'all') {
        const ap = accessPoints.find((a) => a.id === c.associatedApId);
        if (!ap || ap.buildingId !== filter.buildingId) return false;
      }
      return true;
    });
  }, [clients, accessPoints, filter]);

  // Layout node coordinates on canvas:
  // Layout in two or three columns: Left = AP Nodes grouped by building; Right = Client Nodes
  const svgWidth = 920;
  const svgHeight = Math.max(540, Math.max(filteredAps.length, filteredClients.length) * 58 + 80);

  const apPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const spacing = (svgHeight - 100) / Math.max(1, filteredAps.length);
    filteredAps.forEach((ap, idx) => {
      map.set(ap.id, {
        x: 230,
        y: 60 + idx * spacing + spacing / 2,
      });
    });
    return map;
  }, [filteredAps, svgHeight]);

  const clientPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const spacing = (svgHeight - 100) / Math.max(1, filteredClients.length);
    filteredClients.forEach((client, idx) => {
      map.set(client.id, {
        x: 710,
        y: 60 + idx * spacing + spacing / 2,
      });
    });
    return map;
  }, [filteredClients, svgHeight]);

  // Network stats
  const totalClients = clients.length;
  const connectedClients = clients.filter((c) => c.connected).length;
  const offlineAps = accessPoints.filter((a) => a.status === 'offline').length;
  const overloadedAps = accessPoints.filter(
    (a) => (apLoads[a.id]?.utilization ?? 0) > 0.85
  ).length;

  return (
    <div className="topology-overlay-backdrop" onClick={close}>
      <div
        className="topology-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Network Topology Inspector"
      >
        {/* Modal Top Bar */}
        <div className="topology-header">
          <div className="topology-title-block">
            <div className="topology-icon-badge">
              <GitFork size={18} />
            </div>
            <div>
              <h3>Campus Wireless Topology</h3>
              <p>Dynamic 802.11 association graph and live packet transmission pulses</p>
            </div>
          </div>

          <div className="topology-header-actions">
            {/* Pause/Play Animation */}
            <button
              className={`topology-btn-ghost ${isAnimated ? 'active' : ''}`}
              onClick={() => setAnimated(!isAnimated)}
              title={isAnimated ? 'Pause Packet Pulses' : 'Play Packet Pulses'}
            >
              {isAnimated ? <Pause size={14} /> : <Play size={14} />}
              <span>{isAnimated ? 'Pause Flow' : 'Resume Flow'}</span>
            </button>

            {/* Close Button */}
            <button className="topology-close-btn" onClick={close} title="Close Topology View">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter & Metric Bar */}
        <div className="topology-filter-bar">
          <div className="filter-group">
            <Filter size={14} className="filter-icon" />
            <span className="filter-lbl">Filters:</span>

            {/* Building Filter */}
            <select
              value={filter.buildingId}
              onChange={(e) => setFilter({ buildingId: e.target.value })}
              className="topology-select"
            >
              <option value="all">All Buildings ({buildings.length})</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filter.status}
              onChange={(e) => setFilter({ status: e.target.value as any })}
              className="topology-select"
            >
              <option value="all">All Statuses</option>
              <option value="connected">Active Associated</option>
              <option value="overloaded">Overloaded APs</option>
              <option value="offline">Offline / Disconnected</option>
            </select>

            {/* Client Device Mobility Profile */}
            <select
              value={filter.clientType}
              onChange={(e) => setFilter({ clientType: e.target.value as any })}
              className="topology-select"
            >
              <option value="all">All Mobility Profiles</option>
              <option value="stationary">Stationary (Seminar/Study)</option>
              <option value="walking">Walking (Pedestrian Flow)</option>
              <option value="roaming">Roaming (Inter-Building)</option>
            </select>
          </div>

          {/* Quick Metrics */}
          <div className="topology-quick-stats">
            <span className="topology-stat-pill">
              <Wifi size={12} color="#287A50" />
              <strong>{accessPoints.length - offlineAps}</strong> / {accessPoints.length} APs Online
            </span>
            <span className="topology-stat-pill">
              <Users size={12} color="#4A8BC7" />
              <strong>{connectedClients}</strong> / {totalClients} Associated
            </span>
            {overloadedAps > 0 && (
              <span className="topology-stat-pill warn">
                <AlertTriangle size={12} color="#E06D53" />
                <strong>{overloadedAps}</strong> Overloaded
              </span>
            )}
          </div>
        </div>

        {/* Main Interactive Topology SVG Canvas */}
        <div className="topology-canvas-scroll">
          <svg
            className="topology-svg"
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          >
            <defs>
              {/* Gradient for links */}
              <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C8DDF5" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#DAD5F2" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#8FC9BE" stopOpacity="0.8" />
              </linearGradient>

              {/* Overloaded link gradient */}
              <linearGradient id="linkOverloaded" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E06D53" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F3D8C8" stopOpacity="0.7" />
              </linearGradient>

              {/* Pulse Marker Filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Column Headers */}
            <text x="230" y="30" textAnchor="middle" className="svg-col-header">
              ACCESS POINTS ({filteredAps.length})
            </text>
            <text x="710" y="30" textAnchor="middle" className="svg-col-header">
              CONNECTED CLIENT DEVICES ({filteredClients.length})
            </text>

            {/* Association Links (Curved Beziers) */}
            {filteredClients.map((client) => {
              if (!client.connected || !client.associatedApId) return null;
              const apPos = apPositions.get(client.associatedApId);
              const clPos = clientPositions.get(client.id);
              if (!apPos || !clPos) return null;

              const isSelected =
                (selectedObject.type === 'client' && selectedObject.id === client.id) ||
                (selectedObject.type === 'accessPoint' && selectedObject.id === client.associatedApId);

              const apLoad = apLoads[client.associatedApId]?.utilization ?? 0;
              const isOverloaded = apLoad > 0.85;

              // Curved bezier path
              const dx = (clPos.x - apPos.x) * 0.5;
              const pathD = `M ${apPos.x + 16} ${apPos.y} C ${apPos.x + dx} ${apPos.y}, ${clPos.x - dx} ${clPos.y}, ${clPos.x - 12} ${clPos.y}`;

              return (
                <g key={`link-${client.id}`} className="topology-link-group">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#287A50' : isOverloaded ? 'url(#linkOverloaded)' : 'url(#linkGradient)'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? 'none' : '4 3'}
                    className={`topology-link-path ${isSelected ? 'selected' : ''}`}
                  />

                  {/* Flowing Packet Pulses along active links */}
                  {isAnimated && (
                    <circle r={isSelected ? 3.5 : 2.5} fill={isSelected ? '#287A50' : '#8FC9BE'}>
                      <animateMotion
                        path={pathD}
                        dur={`${Math.max(1.2, 3.2 - (client.throughputMbps || 20) / 40)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Access Point Nodes (Left Column) */}
            {filteredAps.map((ap) => {
              const pos = apPositions.get(ap.id);
              if (!pos) return null;

              const isSelected = selectedObject.type === 'accessPoint' && selectedObject.id === ap.id;
              const load = apLoads[ap.id] || { demandMbps: 0, utilization: 0, clientCount: 0 };
              const isOverloaded = load.utilization > 0.85;
              const isOffline = ap.status === 'offline';

              const building = buildings.find((b) => b.id === ap.buildingId);

              return (
                <g
                  key={ap.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={`topology-node ap-node ${isSelected ? 'selected' : ''} ${isOffline ? 'offline' : ''}`}
                  onClick={() => selectObject('accessPoint', ap.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle r="22" fill="none" stroke="#8FC9BE" strokeWidth="3" opacity="0.8" />
                  )}

                  {/* Concentric RF broadcast waves (Botanical style matching design spec) */}
                  {!isOffline && (
                    <>
                      <path
                        d="M -7 -14 A 9 9 0 0 1 7 -14"
                        fill="none"
                        stroke={isOverloaded ? '#E06D53' : '#8FC9BE'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M -11 -18 A 14 14 0 0 1 11 -18"
                        fill="none"
                        stroke={isOverloaded ? '#E06D53' : '#8FC9BE'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                    </>
                  )}

                  {/* Main AP Node Circle */}
                  <circle
                    r="16"
                    fill={isOffline ? '#FDF2EF' : isOverloaded ? '#FCF4EE' : '#F0F6FD'}
                    stroke={isOffline ? '#E06D53' : isOverloaded ? '#E06D53' : '#4A8BC7'}
                    strokeWidth="2"
                  />

                  {/* Icon Representation */}
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                    fill={isOffline ? '#E06D53' : '#25343A'}
                  >
                    AP
                  </text>

                  {/* Node Label & Load Pill */}
                  <g transform="translate(-24, 0)">
                    <text
                      x="-8"
                      y="-4"
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fill="#25343A"
                    >
                      {ap.name}
                    </text>
                    <text
                      x="-8"
                      y="11"
                      textAnchor="end"
                      fontSize="10"
                      fill="#64767A"
                      className="font-mono"
                    >
                      {building?.name ? `${building.name} · ` : ''}{ap.band} · Ch {ap.channel}
                    </text>
                  </g>

                  {/* Client Count & Utilization Badge */}
                  <g transform="translate(24, 0)">
                    <rect
                      x="4"
                      y="-10"
                      width="54"
                      height="20"
                      rx="4"
                      fill={isOffline ? '#FDF2EF' : isOverloaded ? '#FCF4EE' : '#FAF8F3'}
                      stroke={isOffline ? '#E06D53' : isOverloaded ? '#E06D53' : '#E6E1D6'}
                      strokeWidth="1"
                    />
                    <text
                      x="31"
                      y="4"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      className="font-mono"
                      fill={isOffline ? '#E06D53' : isOverloaded ? '#E06D53' : '#25343A'}
                    >
                      {isOffline ? 'OFFLINE' : `${load.clientCount} usr | ${Math.round(load.utilization * 100)}%`}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Client Nodes (Right Column) */}
            {filteredClients.map((client) => {
              const pos = clientPositions.get(client.id);
              if (!pos) return null;

              const isSelected = selectedObject.type === 'client' && selectedObject.id === client.id;
              const isDisconnected = !client.connected;
              const rssi = client.currentRssiDbm ?? -80;

              const rssiColor = isDisconnected
                ? '#E06D53'
                : rssi >= -65
                ? '#287A50'
                : rssi >= -75
                ? '#D87834'
                : '#E06D53';

              return (
                <g
                  key={client.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={`topology-node client-node ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectObject('client', client.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle r="16" fill="none" stroke="#287A50" strokeWidth="2.5" opacity="0.8" />
                  )}

                  {/* Client Dot */}
                  <circle
                    r="10"
                    fill={isDisconnected ? '#FDF2EF' : '#FFFFFF'}
                    stroke={rssiColor}
                    strokeWidth="2"
                  />

                  {/* Device Label */}
                  <g transform="translate(18, 0)">
                    <text
                      x="0"
                      y="-3"
                      textAnchor="start"
                      fontSize="11.5"
                      fontWeight="600"
                      fill="#25343A"
                    >
                      {client.name}
                    </text>
                    <text
                      x="0"
                      y="11"
                      textAnchor="start"
                      fontSize="9.5"
                      fill={rssiColor}
                      className="font-mono"
                    >
                      {isDisconnected
                        ? 'Disconnected (Out of range)'
                        : `${rssi.toFixed(0)} dBm · ${(client.throughputMbps ?? 0).toFixed(1)} Mbps`}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Modal Footer Notes */}
        <div className="topology-footer">
          <div className="topology-legend-chips">
            <span className="legend-chip">
              <span className="chip-dot sage" /> Normal Healthy Load (&lt;85%)
            </span>
            <span className="legend-chip">
              <span className="chip-dot coral" /> Congested / Overloaded (&gt;85%)
            </span>
            <span className="legend-chip">
              <span className="chip-dot lilac" /> 802.11 Association Path
            </span>
            <span className="legend-chip">
              <span className="chip-dot seaglass" /> Animated Packet Pulse
            </span>
          </div>

          <p className="topology-hint">
            Tip: Click any AP or client node to inspect RF parameters and track in 3D scene.
          </p>
        </div>
      </div>
    </div>
  );
};
