import React from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Clock,
  Zap,
} from 'lucide-react';

export const TimelineBar: React.FC = () => {
  const isPlaying = useCampusStore((s) => s.isPlaying);
  const togglePlaying = useCampusStore((s) => s.togglePlaying);
  const stepForward = useCampusStore((s) => s.stepForward);
  const resetSimulation = useCampusStore((s) => s.resetSimulation);
  const playbackSpeed = useCampusStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useCampusStore((s) => s.setPlaybackSpeed);
  const currentTimeSeconds = useCampusStore((s) => s.currentTimeSeconds);
  const durationSeconds = useCampusStore((s) => s.scenario.durationSeconds);
  const telemetry = useCampusStore((s) => s.telemetry);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (currentTimeSeconds / durationSeconds) * 100);

  return (
    <footer className="workspace-timeline-bar">
      {/* Playback Button Group */}
      <div className="timeline-controls-left">
        <button
          className={`btn-timeline-play ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlaying}
          title={isPlaying ? 'Pause Simulation' : 'Run Simulation'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause' : 'Simulate'}</span>
        </button>

        <button
          className="btn-timeline-icon"
          onClick={stepForward}
          disabled={isPlaying}
          title="Advance single tick (0.5s)"
        >
          <SkipForward size={14} />
        </button>

        <button
          className="btn-timeline-icon"
          onClick={resetSimulation}
          title="Reset simulation to initial state"
        >
          <RotateCcw size={14} />
        </button>

        {/* Speed Multiplier Pills */}
        <div className="timeline-speed-pills">
          {[0.5, 1.0, 2.0, 5.0].map((s) => (
            <button
              key={s}
              className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Track & Clock */}
      <div className="timeline-progress-center">
        <div className="timeline-time-text font-mono">
          <Clock size={12} className="clock-icon" color="#287A50" />
          <span className="current-time">{formatTime(currentTimeSeconds)}</span>
          <span className="sep">/</span>
          <span className="total-time">{formatTime(durationSeconds)}</span>
        </div>

        <div className="timeline-track-bar">
          <div className="timeline-track-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Right: Bandwidth Metrics Telemetry */}
      <div className="timeline-telemetry-right">
        <div className="throughput-pill font-mono">
          <span className="lbl">Offered:</span>
          <span className="val blue">{telemetry.totalOfferedDemandMbps} Mbps</span>
        </div>

        <div className="throughput-pill font-mono">
          <span className="lbl">Delivered:</span>
          <span className="val green">{telemetry.totalDeliveredThroughputMbps} Mbps</span>
        </div>

        {telemetry.totalOfferedDemandMbps > telemetry.totalDeliveredThroughputMbps && (
          <div className="unserved-badge font-mono">
            <Zap size={11} color="#E06D53" />
            <span>
              {(telemetry.totalOfferedDemandMbps - telemetry.totalDeliveredThroughputMbps).toFixed(
                1
              )}{' '}
              Mbps unserved
            </span>
          </div>
        )}
      </div>
    </footer>
  );
};
