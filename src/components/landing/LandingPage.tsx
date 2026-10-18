import React from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import { CampusScene } from '../scene/CampusScene';
import {
  Radio,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  Activity,
  Users,
  Cpu,
  ExternalLink,
  GitFork,
  Play,
  Pause,
  Clock,
  Wifi,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const setView = useCampusStore((s) => s.setView);
  const openLocationModal = useCampusStore((s) => s.openLocationModal);
  const isPlaying = useCampusStore((s) => s.isPlaying);
  const togglePlaying = useCampusStore((s) => s.togglePlaying);
  const telemetry = useCampusStore((s) => s.telemetry);
  const currentTimeSeconds = useCampusStore((s) => s.currentTimeSeconds);
  const durationSeconds = useCampusStore((s) => s.scenario.durationSeconds);
  const accessPoints = useCampusStore((s) => s.scenario.accessPoints);
  const openTopologyModal = useCampusStore((s) => s.openTopologyModal);

  const handleOpenDemo = () => {
    setView('workspace');
  };

  const handleExploreCampus = () => {
    openLocationModal();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="landing-page-container">
      {/* 1. Refined Navigation Bar with Translucent Surface */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-logo">
            <Radio size={18} color="#287A50" />
          </div>
          <div className="landing-brand-text">
            <span className="brand-name">CampusTwin</span>
            <span className="brand-badge">RF DIGITAL TWIN</span>
          </div>
        </div>

        <div className="landing-nav-links">
          <a href="#capabilities" className="nav-link">
            Wireless Physics
          </a>
          <a href="#topology" className="nav-link">
            Network Topology
          </a>
          <a href="#workflow" className="nav-link">
            How It Works
          </a>
          <a href="#privacy" className="nav-link">
            Engineering & Privacy
          </a>
        </div>

        <div className="landing-nav-actions">
          <button className="btn-landing-secondary" onClick={handleOpenDemo}>
            Open Demo Campus
          </button>
          <button className="btn-landing-primary" onClick={handleExploreCampus}>
            <Compass size={15} />
            <span>Explore Campus</span>
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="landing-hero">
        <div className="hero-content">
          <div className="hero-tag">
            <span className="tag-dot" />
            <span>BOTANICAL TECHNOLOGY · SOFTWARE-ONLY RF TWIN</span>
          </div>

          <h1 className="hero-headline">
            See your campus. <br />
            Understand its connectivity. <br />
            <span className="hero-highlight">Simulate a better network.</span>
          </h1>

          <p className="hero-lead">
            An architectural digital twin combining real-world OpenStreetMap footprints,
            calibrated log-distance path loss, pedestrian student mobility, and dynamic 802.11
            network simulation in continuous time.
          </p>

          <div className="hero-cta-group">
            <button className="btn-hero-primary" onClick={handleExploreCampus}>
              <Compass size={17} />
              <span>Explore My Campus</span>
              <ArrowRight size={15} />
            </button>

            <button className="btn-hero-secondary" onClick={handleOpenDemo}>
              <span>Launch Engineering Workspace</span>
            </button>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <span className="stat-big font-mono">100%</span>
              <span className="stat-desc">Software-only simulation (Zero physical sensors needed)</span>
            </div>
            <div className="stat-v-divider" />
            <div className="hero-stat-item">
              <span className="stat-big font-mono">&lt; 3.0 dB</span>
              <span className="stat-desc">Deterministic roaming hysteresis barrier</span>
            </div>
            <div className="stat-v-divider" />
            <div className="hero-stat-item">
              <span className="stat-big font-mono">OSM GIS</span>
              <span className="stat-desc">Global university footprints via OpenStreetMap</span>
            </div>
          </div>
        </div>

        {/* 3. Large Live Interactive 3D Campus Preview with Real Demo Components */}
        <div className="hero-3d-wrapper">
          <div className="hero-3d-card">
            {/* Top Card Bar */}
            <div className="hero-3d-topbar">
              <div className="topbar-pills">
                <span className="pill-dot coral" />
                <span className="pill-dot peach" />
                <span className="pill-dot sage" />
              </div>
              <span className="hero-preview-label">
                Interactive 3D Digital Twin • Drag to Orbit & Pan
              </span>
              <button className="btn-fullscreen-preview" onClick={handleOpenDemo}>
                <span>Full Workspace</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Live 3D Viewport */}
            <div className="hero-3d-viewport">
              <CampusScene />

              {/* Live Telemetry Floating Badges on Preview */}
              <div className="hero-floating-hud top-right font-mono">
                <div className="hud-pill">
                  <Wifi size={12} color="#4A8BC7" />
                  <span>APs: {accessPoints.filter((a) => a.status === 'online').length} Online</span>
                </div>
                <div className="hud-pill">
                  <Activity size={12} color="#287A50" />
                  <span>Coverage: {telemetry.coverageRatioPercent}%</span>
                </div>
              </div>

              {/* Inline Timeline Control on 3D Preview */}
              <div className="hero-floating-timeline">
                <button
                  className="hero-timeline-play-btn"
                  onClick={togglePlaying}
                  title={isPlaying ? 'Pause Simulation' : 'Run Simulation'}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <div className="hero-time-readout font-mono">
                  <Clock size={11} color="#287A50" />
                  <span>{formatTime(currentTimeSeconds)}</span>
                  <span className="dim">/</span>
                  <span className="dim">{formatTime(durationSeconds)}</span>
                </div>
                <div className="hero-timeline-bar-bg">
                  <div
                    className="hero-timeline-bar-fill"
                    style={{ width: `${(currentTimeSeconds / durationSeconds) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 4. Technical Capabilities Grid */}
      <section id="capabilities" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">SCIENTIFIC FOUNDATIONS</span>
          <h2 className="section-title">Built on Transparent Wireless Physics</h2>
          <p className="section-lead">
            Visualizations in CampusTwin reflect deterministic mathematical models rather than
            decorative graphics. Every calculation is reproducible and explainable.
          </p>
        </div>

        <div className="capabilities-grid">
          <div className="cap-card">
            <div className="cap-icon-box bg-sky">
              <Layers size={20} color="#4A8BC7" />
            </div>
            <h3 className="cap-title">Log-Distance Propagation & Obstacles</h3>
            <p className="cap-body">
              Calculates received signal levels (RSSI in dBm) accounting for transmit power,
              antenna gain, path-loss exponents, and multi-dB exterior concrete and interior wall
              attenuation.
            </p>
            <div className="cap-equation font-mono">
              <code>PL(d) = PL(d₀) + 10·n·log₁₀(d/d₀) + L_walls</code>
            </div>
          </div>

          <div className="cap-card">
            <div className="cap-icon-box bg-sage">
              <Users size={20} color="#287A50" />
            </div>
            <h3 className="cap-title">Pedestrian Student Mobility</h3>
            <p className="cap-body">
              Models authentic university traffic flows: lecture attendees, students walking across
              courtyards, and rush transitions between academic buildings and libraries.
            </p>
            <div className="cap-equation font-mono">
              <code>Roam trigger: RSSI_cand &gt; RSSI_curr + 3.0 dB</code>
            </div>
          </div>

          <div className="cap-card">
            <div className="cap-icon-box bg-lilac">
              <Activity size={20} color="#64767A" />
            </div>
            <h3 className="cap-title">Capacity, Fair-Share & Congestion</h3>
            <p className="cap-body">
              Calculates access point airtime and bandwidth utilization ($U = D / C$). When demand
              exceeds capacity, throughput is fair-shared and nonlinear queueing latency penalties are
              applied.
            </p>
            <div className="cap-equation font-mono">
              <code>Overload Latency: L_base + (U - 1.0)¹·⁸ · 120 ms</code>
            </div>
          </div>

          <div className="cap-card">
            <div className="cap-icon-box bg-peach">
              <Cpu size={20} color="#D87834" />
            </div>
            <h3 className="cap-title">What-If Scenario Optimization</h3>
            <p className="cap-body">
              Modify AP placement, upgrade to 5 GHz / 6 GHz channels, simulate hardware outages,
              and compare baseline versus proposed network deployment metrics with measurable deltas.
            </p>
            <div className="cap-equation font-mono">
              <code>Side-by-side delta coverage, latency & unserved demand</code>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Network Topology & Packet Pulses Feature Section */}
      <section id="topology" className="landing-section bg-surface">
        <div className="section-header">
          <span className="section-eyebrow">NETWORK TOPOLOGY & FLOW</span>
          <h2 className="section-title">Living 802.11 Association Graph</h2>
          <p className="section-lead">
            Inspect every wireless node, curved association path, and directional packet pulse in real
            time. Identify overloaded cells and out-of-range clients instantly.
          </p>
        </div>

        <div className="topology-showcase-card">
          <div className="topology-showcase-info">
            <div className="showcase-badge font-mono">
              <GitFork size={13} color="#287A50" />
              <span>Full Graph Synchronization</span>
            </div>
            <h3 className="showcase-title">Connected Nodes & Dynamic Association Pulses</h3>
            <p className="showcase-desc">
              Every packet marker traveling along an association line is tied directly to the
              underlying throughput calculation. Selecting any node in the topology view focuses the
              object in the 3D twin and opens the contextual RF inspector.
            </p>

            <ul className="showcase-points">
              <li>
                <span className="check-bullet">✓</span>
                <span>Real-time AP load monitoring with utilization badges</span>
              </li>
              <li>
                <span className="check-bullet">✓</span>
                <span>Curved Bezier links with speed-calibrated packet animations</span>
              </li>
              <li>
                <span className="check-bullet">✓</span>
                <span>Instant filtering by building, device type, and connection status</span>
              </li>
            </ul>

            <button
              className="btn-showcase-action"
              onClick={() => {
                setView('workspace');
                setTimeout(() => openTopologyModal(), 100);
              }}
            >
              <GitFork size={15} />
              <span>Open Topology Inspector in Workspace</span>
            </button>
          </div>

          <div className="topology-showcase-visual">
            <div className="topology-mock-window">
              <div className="mock-window-topbar font-mono">
                <span>CAMPUS_TOPOLOGY_GRAPH.SVG</span>
                <span className="mock-live-pill">LIVE PULSES ACTIVE</span>
              </div>
              <div className="mock-topology-preview">
                {/* SVG Illustration of Topology */}
                <svg viewBox="0 0 400 220" className="mock-svg">
                  <path d="M 90 60 C 180 60, 220 40, 310 40" stroke="#C8DDF5" strokeWidth="2" fill="none" strokeDasharray="3 3" />
                  <path d="M 90 60 C 180 60, 220 80, 310 80" stroke="#DAD5F2" strokeWidth="2" fill="none" />
                  <path d="M 90 140 C 180 140, 220 120, 310 120" stroke="#8FC9BE" strokeWidth="2" fill="none" />
                  <path d="M 90 140 C 180 140, 220 160, 310 160" stroke="#E06D53" strokeWidth="2" fill="none" strokeDasharray="3 3" />

                  {/* Flowing animated pulse */}
                  <circle cx="190" cy="70" r="3.5" fill="#287A50" />
                  <circle cx="210" cy="130" r="3.5" fill="#8FC9BE" />

                  {/* AP Nodes */}
                  <g transform="translate(90, 60)">
                    <circle r="16" fill="#F0F6FD" stroke="#4A8BC7" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="#25343A">AP-1</text>
                  </g>
                  <g transform="translate(90, 140)">
                    <circle r="16" fill="#FAF8F3" stroke="#8FC9BE" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="#25343A">AP-2</text>
                  </g>

                  {/* Client Nodes */}
                  <circle cx="310" cy="40" r="8" fill="#FFFFFF" stroke="#287A50" strokeWidth="2" />
                  <circle cx="310" cy="80" r="8" fill="#FFFFFF" stroke="#287A50" strokeWidth="2" />
                  <circle cx="310" cy="120" r="8" fill="#FFFFFF" stroke="#D87834" strokeWidth="2" />
                  <circle cx="310" cy="160" r="8" fill="#FDF2EF" stroke="#E06D53" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Four-Step Engineering Workflow */}
      <section id="workflow" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">END-TO-END WORKFLOW</span>
          <h2 className="section-title">How CampusTwin Simulates Real Networks</h2>
          <p className="section-lead">
            From geographic coordinate selection to what-if hardware optimization in four distinct
            stages.
          </p>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <span className="step-num font-mono">01</span>
            <h4 className="step-title">Geographic Selection</h4>
            <p className="step-desc">
              Select from curated university boundaries (Cambridge, Stanford, UNAM, MIT, Oxford) or
              input custom coordinates via OpenStreetMap.
            </p>
          </div>

          <div className="workflow-step-card">
            <span className="step-num font-mono">02</span>
            <h4 className="step-title">Digital Twin Assembly</h4>
            <p className="step-desc">
              Building dimensions, multi-floor plans, and wall attenuation properties are synthesized
              into an interactive 3D geospatial scene.
            </p>
          </div>

          <div className="workflow-step-card">
            <span className="step-num font-mono">03</span>
            <h4 className="step-title">RF & Traffic Simulation</h4>
            <p className="step-desc">
              Deploy virtual APs, simulate student pedestrian paths, and run the time-dependent
              log-distance path loss propagation engine.
            </p>
          </div>

          <div className="workflow-step-card">
            <span className="step-num font-mono">04</span>
            <h4 className="step-title">What-If Optimization</h4>
            <p className="step-desc">
              Compare baseline vs upgraded AP placements side-by-side. Calculate exact throughput
              deltas, coverage gains, and latency savings.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Engineering & Privacy Reality Section */}
      <section id="privacy" className="landing-section bg-stone">
        <div className="section-header">
          <span className="section-eyebrow">REAL-WORLD CONTEXT & PRIVACY</span>
          <h2 className="section-title">Authentic Boundaries & Zero Device Tracking</h2>
          <p className="section-lead">
            CampusTwin bridges real geographic building footprints with an explicitly simulated
            wireless network environment.
          </p>
        </div>

        <div className="privacy-disclosure-box">
          <div className="disclosure-left">
            <Shield size={28} color="#287A50" />
            <div>
              <h3>Our Engineering & Privacy Contract</h3>
              <p>
                Browser geolocation locates only the consenting user to find nearest university
                boundaries through OpenStreetMap. It does not scan campus personal devices or Wi-Fi
                hardware. Access points, signal coverage, and student movements are simulated digital
                twin models unless imported through an authorized university network inventory.
              </p>
            </div>
          </div>
          <button className="btn-explore-inline" onClick={handleExploreCampus}>
            <span>Explore Campus Map</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 8. Coherent Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-brand">
              <Radio size={16} color="#287A50" />
              <span>CampusTwin</span>
            </div>
            <p className="footer-copy">
              Software-only Wireless Network Digital Twin for Smart Campus. Designed for university
              network planners, engineers, and academic researchers.
            </p>
          </div>
          <div className="footer-meta font-mono">
            <span>Map Data © OpenStreetMap contributors (ODbL)</span>
            <span>IEEE 802.11ax/be Propagation Specifications</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
