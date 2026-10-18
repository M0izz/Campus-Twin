import './App.css';
import { useCampusStore } from './store/useCampusStore';
import { LandingPage } from './components/landing/LandingPage';
import { Header } from './components/layout/Header';
import { Toolbar } from './components/layout/Toolbar';
import { TimelineBar } from './components/layout/TimelineBar';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { AddAccessPointDrawer } from './components/inspector/AddAccessPointDrawer';
import { CampusDiscoveryModal } from './components/location/CampusDiscoveryModal';
import { ScenarioComparisonModal } from './components/analytics/ScenarioComparisonModal';
import { TopologyModal } from './components/topology/TopologyModal';
import { CampusScene } from './components/scene/CampusScene';
import { MapOverlays } from './components/scene/MapOverlays';

export function App() {
  const currentView = useCampusStore((s) => s.currentView);

  return (
    <div className="app-container">
      {currentView === 'landing' ? (
        <LandingPage />
      ) : (
        <>
          {/* Compact Top GIS Header */}
          <Header />

          {/* Central Geospatial Canvas */}
          <main className="viewport-container">
            <CampusScene />
            {/* On-Canvas Controls: Scale bar, 2D/3D switcher, Compass, Legend */}
            <MapOverlays />
          </main>

          {/* Slim Left Tool Rail */}
          <Toolbar />

          {/* Contextual Inspector (Visible ONLY when an object is selected) */}
          <InspectorPanel />

          {/* Hamina Hardware Specification Drawer */}
          <AddAccessPointDrawer />

          {/* What-If Comparison Modal */}
          <ScenarioComparisonModal />

          {/* Compact Bottom Simulation Timeline */}
          <TimelineBar />
        </>
      )}

      {/* Campus Discovery Modal */}
      <CampusDiscoveryModal />

      {/* Network Topology & Packet Pulses Modal */}
      <TopologyModal />
    </div>
  );
}

export default App;
