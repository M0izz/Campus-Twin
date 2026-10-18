import React, { useState } from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import { DEFAULT_CAMPUS_SCENARIO } from '../../data/defaultCampus';
import {
  discoverNearbyCampuses,
  searchCampusesOnline,
  fetchOsmCampusScenario,
  type DiscoveredCampus,
} from '../../services/osm-service';
import type { Scenario } from '../../types/scenario';
import {
  MapPin,
  Search,
  Navigation,
  CheckCircle,
  Building,
  ArrowRight,
  Shield,
  X,
  Compass,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const CampusDiscoveryModal: React.FC = () => {
  const showModal = useCampusStore((s) => s.showLocationModal);
  const closeModal = useCampusStore((s) => s.closeLocationModal);
  const loadScenario = useCampusStore((s) => s.loadScenario);
  const setView = useCampusStore((s) => s.setView);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiscoveredCampus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<DiscoveredCampus | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingGeometry, setIsFetchingGeometry] = useState(false);

  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [radiusMeters, setRadiusMeters] = useState<number>(300);
  const [populateNetwork, setPopulateNetwork] = useState(true);
  const [osmScenario, setOsmScenario] = useState<Scenario | null>(null);

  if (!showModal) return null;

  // 1. Geolocation Flow: Discover real educational institutions near user's coordinates
  const handleBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser. Please search by name.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Requesting browser location permission...');
    setFetchError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationStatus(`Found coordinates (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°). Querying nearby universities in OpenStreetMap...`);

        const result = await discoverNearbyCampuses(latitude, longitude, 30);
        setIsLocating(false);

        if (result.success && result.campuses.length > 0) {
          setSearchResults(result.campuses);
          setSelectedCampus(result.campuses[0]);
          setLocationStatus(`Found ${result.campuses.length} educational institutions near your location.`);
        } else {
          setLocationStatus(result.error || 'No universities found within 30km of your location. Please use the search bar below or try demo mode.');
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('Location permission was denied. You can search your university manually below.');
        } else {
          setLocationStatus('Could not acquire GPS position. Please search your university below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 2. Manual Search Flow
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setFetchError(null);
    setLocationStatus(null);

    const results = await searchCampusesOnline(searchQuery);
    setIsSearching(false);
    setSearchResults(results);

    if (results.length === 0) {
      setLocationStatus(`No university campuses found matching "${searchQuery}". Try adding "University" or search for a major institution.`);
    }
  };

  // 3. Selection of a candidate campus
  const handleSelectCampus = (campus: DiscoveredCampus) => {
    setSelectedCampus(campus);
    setFetchError(null);
    setOsmScenario(null);
    setStep(2);
  };

  // 4. Fetch real OSM building footprints for the confirmed campus
  const handleFetchOsmFootprints = async () => {
    if (!selectedCampus) return;

    setIsFetchingGeometry(true);
    setFetchError(null);

    const res = await fetchOsmCampusScenario(selectedCampus, {
      customRadiusMeters: radiusMeters,
      maxBuildings: 60,
    });

    setIsFetchingGeometry(false);

    if (res.success && res.scenario) {
      setOsmScenario(res.scenario);
      setStep(3);
    } else {
      setFetchError(res.error || 'Failed to retrieve building polygons from OpenStreetMap. Overpass API may be busy.');
    }
  };

  // 5. Final launch into workspace
  const handleLaunchWorkspace = () => {
    if (osmScenario) {
      // Apply user choice on whether to populate APs or start clean
      const finalScenario: Scenario = {
        ...osmScenario,
        accessPoints: populateNetwork ? osmScenario.accessPoints : [],
        clients: populateNetwork ? osmScenario.clients : [],
      };
      loadScenario(finalScenario);
    }
    setView('workspace');
    closeModal();
    setStep(1);
  };

  // 6. Direct Demo Mode Launch
  const handleLaunchDemo = () => {
    loadScenario(JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SCENARIO)));
    setView('workspace');
    closeModal();
    setStep(1);
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="campus-discovery-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="discovery-header">
          <div className="discovery-header-title">
            <Compass className="discovery-header-icon" size={22} />
            <div>
              <h3>Geographic Campus Setup</h3>
              <p>Authentic OpenStreetMap building polygons & continuous RF simulation</p>
            </div>
          </div>
          <button className="discovery-close-btn" onClick={closeModal} title="Close setup">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="discovery-stepper">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span>Discovery</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span>OSM Footprints</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>Network Review</span>
          </div>
        </div>

        {/* STEP 1: Discovery (Location or Search) */}
        {step === 1 && (
          <div className="discovery-content">
            <div className="permission-notice-box">
              <Shield size={18} className="text-emerald" />
              <div>
                <strong>Privacy & Location Scope</strong>
                <p>
                  Geolocation searches for real educational boundaries through OpenStreetMap. It does
                  not track devices or physical network telemetry. Coordinates are processed locally in
                  your browser.
                </p>
              </div>
            </div>

            <div className="discovery-actions-row">
              <button
                className="btn-locate-me"
                onClick={handleBrowserGeolocation}
                disabled={isLocating}
              >
                {isLocating ? <Loader2 size={16} className="spin" /> : <Navigation size={16} />}
                <span>{isLocating ? 'Querying OpenStreetMap...' : 'Use My Current Location'}</span>
              </button>

              <button className="btn-demo-mode" onClick={handleLaunchDemo}>
                <Sparkles size={15} color="#8FC9BE" />
                <span>Launch Cambridge Demo</span>
              </button>
            </div>

            {locationStatus && <div className="discovery-status-text">{locationStatus}</div>}

            {/* Manual Search Input */}
            <form onSubmit={handleSearchSubmit} className="discovery-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Or search any university (e.g., Stanford, MIT, Oxford, UNAM, IIT Bombay)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-submit-btn" disabled={isSearching}>
                {isSearching ? <Loader2 size={14} className="spin" /> : 'Search'}
              </button>
            </form>

            {/* Candidate Campuses List */}
            <div className="campus-results-list">
              {searchResults.length > 0 ? (
                searchResults.map((campus) => (
                  <div
                    key={campus.id}
                    className="campus-result-card"
                    onClick={() => handleSelectCampus(campus)}
                  >
                    <div className="campus-result-left">
                      <div className="campus-result-icon">
                        <Building size={16} />
                      </div>
                      <div>
                        <div className="campus-result-name">{campus.name}</div>
                        <div className="campus-result-meta">
                          {campus.city ? `${campus.city}, ` : ''}{campus.country}
                          {campus.distanceKm !== undefined ? ` • ${campus.distanceKm} km away` : ''}
                          <span className="coord-pill font-mono">
                            {campus.coordinates.lat.toFixed(3)}°, {campus.coordinates.lng.toFixed(3)}°
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-select-campus">
                      <span>Select</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-results-hint">
                  <Compass size={28} color="#8E9FA4" />
                  <p>Click "Use My Current Location" or type a university name above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Geospatial Confirmation & Bounding Box Adjustment */}
        {step === 2 && selectedCampus && (
          <div className="discovery-content">
            <div className="selected-campus-hero">
              <div className="selected-badge">CONFIRMED OPENSTREETMAP LOCATION</div>
              <h2 className="selected-title">{selectedCampus.name}</h2>
              <div className="selected-coords">
                <MapPin size={14} />
                <span>
                  {selectedCampus.coordinates.lat.toFixed(5)}° N, {selectedCampus.coordinates.lng.toFixed(5)}° E • {selectedCampus.city ? `${selectedCampus.city}, ` : ''}{selectedCampus.country}
                </span>
              </div>
            </div>

            <div className="campus-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Data Provider</span>
                <span className="spec-val">OpenStreetMap Overpass API</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Attribution</span>
                <span className="spec-val">© OpenStreetMap contributors (ODbL)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Campus Radius</span>
                <span className="spec-val">{radiusMeters} Meters</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Coordinate System</span>
                <span className="spec-val">Equirectangular Metric (Cartesian)</span>
              </div>
            </div>

            {/* Radius adjustment control */}
            <div className="radius-adjust-box">
              <label className="radius-label">
                <span>Capture Extent Radius:</span>
                <strong>{radiusMeters}m ({radiusMeters * 2}m × {radiusMeters * 2}m sector)</strong>
              </label>
              <div className="radius-buttons-row">
                {[200, 300, 450, 600].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`btn-radius-pill ${radiusMeters === r ? 'active' : ''}`}
                    onClick={() => setRadiusMeters(r)}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>

            {fetchError && (
              <div className="discovery-error-box">
                <AlertCircle size={18} color="#E06D53" />
                <div>
                  <strong>Geometry Fetch Notice</strong>
                  <p>{fetchError}</p>
                </div>
              </div>
            )}

            <div className="discovery-nav-footer">
              <button className="btn-back" onClick={() => setStep(1)} disabled={isFetchingGeometry}>
                Back to Search
              </button>
              <button
                className="btn-fetch-osm"
                onClick={handleFetchOsmFootprints}
                disabled={isFetchingGeometry}
              >
                {isFetchingGeometry ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Querying Overpass API...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    <span>Fetch Real OSM Footprints</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Footprint Summary & Network Deployment */}
        {step === 3 && osmScenario && (
          <div className="discovery-content">
            <div className="osm-success-card">
              <CheckCircle size={22} color="#287A50" />
              <div>
                <strong>OpenStreetMap Geometry Extruded Successfully</strong>
                <p>
                  Retrieved <strong>{osmScenario.buildings.length} authentic building polygons</strong> and{' '}
                  <strong>{osmScenario.pathways?.length || 0} pedestrian pathways</strong>.
                </p>
              </div>
            </div>

            <div className="network-options-group">
              <label
                className={`network-option-card ${populateNetwork ? 'active' : ''}`}
                onClick={() => setPopulateNetwork(true)}
              >
                <input
                  type="radio"
                  name="network_pop"
                  checked={populateNetwork}
                  onChange={() => setPopulateNetwork(true)}
                />
                <div className="option-text">
                  <strong>Simulate Wi-Fi 6 APs & Student Movement</strong>
                  <p>
                    Automatically distributes 802.11ax/be enterprise access points inside the real
                    buildings and creates student walking paths along OpenStreetMap walkways.
                  </p>
                </div>
              </label>

              <label
                className={`network-option-card ${!populateNetwork ? 'active' : ''}`}
                onClick={() => setPopulateNetwork(false)}
              >
                <input
                  type="radio"
                  name="network_pop"
                  checked={!populateNetwork}
                  onChange={() => setPopulateNetwork(false)}
                />
                <div className="option-text">
                  <strong>Clean Architectural Campus (No Default APs)</strong>
                  <p>
                    Loads only the real geographic building geometry. Deploy simulated APs manually
                    from the engineering toolbar.
                  </p>
                </div>
              </label>
            </div>

            <div className="discovery-nav-footer">
              <button className="btn-back" onClick={() => setStep(2)}>
                Adjust Radius
              </button>
              <button className="btn-launch-final" onClick={handleLaunchWorkspace}>
                <CheckCircle size={16} />
                <span>Launch 3D Engineering Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
