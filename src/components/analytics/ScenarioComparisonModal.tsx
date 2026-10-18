import React, { useMemo } from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import { compareScenarios } from '../../services/scenario-storage';
import {
  GitCompare,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  CheckCircle,
  X,
  FileDown,
  Sparkles,
} from 'lucide-react';

export const ScenarioComparisonModal: React.FC = () => {
  const showModal = useCampusStore((s) => s.showComparisonModal);
  const closeModal = useCampusStore((s) => s.closeComparisonModal);
  const baseline = useCampusStore((s) => s.baselineScenario);
  const current = useCampusStore((s) => s.scenario);
  const createSnapshotAsBaseline = useCampusStore((s) => s.createSnapshotAsBaseline);

  const comparison = useMemo(() => {
    if (!baseline || !current) return null;
    return compareScenarios(baseline, current);
  }, [baseline, current]);

  if (!showModal || !comparison) return null;

  const handleExportReport = () => {
    const report = {
      title: 'CampusTwin — Scenario Comparison Analysis',
      timestamp: new Date().toISOString(),
      comparison,
      baselineScenario: baseline,
      proposedScenario: current,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campustwin-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="comparison-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <GitCompare size={20} className="text-emerald" />
            <div>
              <h2 className="modal-title">What-If Network Scenario Comparison</h2>
              <p className="modal-sub">
                Side-by-side engineering evaluation between Baseline and Proposed network deployment
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <div className="comparison-body">
          {/* Comparison Cards Grid */}
          <div className="comparison-metrics-grid">
            {/* Coverage Ratio */}
            <div className="metric-compare-card">
              <div className="metric-compare-header">
                <Layers size={16} color="#0284c7" />
                <span>Coverage Ratio</span>
              </div>
              <div className="metric-compare-values">
                <div className="val-col">
                  <span className="col-lbl">Baseline</span>
                  <span className="col-num">{comparison.baselineTelemetry.coverageRatioPercent}%</span>
                </div>
                <div className="val-arrow">→</div>
                <div className="val-col">
                  <span className="col-lbl">Proposed</span>
                  <span className="col-num font-bold">
                    {comparison.modifiedTelemetry.coverageRatioPercent}%
                  </span>
                </div>
              </div>
              <div
                className={`delta-badge ${
                  comparison.deltaCoveragePercent >= 0 ? 'positive' : 'negative'
                }`}
              >
                {comparison.deltaCoveragePercent >= 0 ? '+' : ''}
                {comparison.deltaCoveragePercent}%
              </div>
            </div>

            {/* Average Latency */}
            <div className="metric-compare-card">
              <div className="metric-compare-header">
                <Activity size={16} color="#16a34a" />
                <span>Mean Latency</span>
              </div>
              <div className="metric-compare-values">
                <div className="val-col">
                  <span className="col-lbl">Baseline</span>
                  <span className="col-num">{comparison.baselineTelemetry.averageLatencyMs} ms</span>
                </div>
                <div className="val-arrow">→</div>
                <div className="val-col">
                  <span className="col-lbl">Proposed</span>
                  <span className="col-num font-bold">
                    {comparison.modifiedTelemetry.averageLatencyMs} ms
                  </span>
                </div>
              </div>
              <div
                className={`delta-badge ${
                  comparison.deltaLatencyMs <= 0 ? 'positive' : 'negative'
                }`}
              >
                {comparison.deltaLatencyMs <= 0 ? '' : '+'}
                {comparison.deltaLatencyMs} ms
              </div>
            </div>

            {/* Delivered Throughput */}
            <div className="metric-compare-card">
              <div className="metric-compare-header">
                <TrendingUp size={16} color="#287A50" />
                <span>Delivered Bandwidth</span>
              </div>
              <div className="metric-compare-values">
                <div className="val-col">
                  <span className="col-lbl">Baseline</span>
                  <span className="col-num">
                    {comparison.baselineTelemetry.totalDeliveredThroughputMbps} M
                  </span>
                </div>
                <div className="val-arrow">→</div>
                <div className="val-col">
                  <span className="col-lbl">Proposed</span>
                  <span className="col-num font-bold">
                    {comparison.modifiedTelemetry.totalDeliveredThroughputMbps} M
                  </span>
                </div>
              </div>
              <div
                className={`delta-badge ${
                  comparison.deltaThroughputMbps >= 0 ? 'positive' : 'negative'
                }`}
              >
                {comparison.deltaThroughputMbps >= 0 ? '+' : ''}
                {comparison.deltaThroughputMbps} Mbps
              </div>
            </div>

            {/* Overloaded Access Points */}
            <div className="metric-compare-card">
              <div className="metric-compare-header">
                <Zap size={16} color="#d97706" />
                <span>Overloaded APs (&gt;85%)</span>
              </div>
              <div className="metric-compare-values">
                <div className="val-col">
                  <span className="col-lbl">Baseline</span>
                  <span className="col-num">{comparison.baselineTelemetry.overloadedApCount}</span>
                </div>
                <div className="val-arrow">→</div>
                <div className="val-col">
                  <span className="col-lbl">Proposed</span>
                  <span className="col-num font-bold">
                    {comparison.modifiedTelemetry.overloadedApCount}
                  </span>
                </div>
              </div>
              <div
                className={`delta-badge ${
                  comparison.deltaOverloadedAps <= 0 ? 'positive' : 'negative'
                }`}
              >
                {comparison.deltaOverloadedAps <= 0 ? '' : '+'}
                {comparison.deltaOverloadedAps} APs
              </div>
            </div>
          </div>

          {/* Explainable Engineering Findings */}
          <div className="findings-section">
            <div className="findings-title">
              <Sparkles size={16} className="text-emerald" />
              <span>Model Insights & Optimization Findings</span>
            </div>
            <ul className="findings-list">
              {comparison.findings.map((finding, idx) => (
                <li key={idx} className="finding-item">
                  <CheckCircle size={15} className="text-emerald finding-icon" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="comparison-footer">
          <button className="btn-secondary" onClick={createSnapshotAsBaseline}>
            Set Current As New Baseline
          </button>
          <button className="btn-primary" onClick={handleExportReport}>
            <FileDown size={15} />
            <span>Export Comparison Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
