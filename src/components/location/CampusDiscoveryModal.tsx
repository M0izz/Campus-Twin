import React, { useState } from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import {
  PRESET_UNIVERSITIES,
  searchCampuses,
  findNearestPresetCampus,
  type CampusLocation,
} from '../../services/campus-data';
import {
  MapPin,
  Search,
  Navigation,
  CheckCircle,
  Building,
  Layers,
  ArrowRight,
  Shield,
  X,
  Compass,
} from 'lucide-react';

export const CampusDiscoveryModal: React.FC = () => {
  const showModal = useCampusStore((s) => s.showLocationModal);
  const closeModal = useCampusStore((s) => s.closeLocationModal);
  const setCampusLocation = useCampusStore((s) => s.setCampusLocation);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CampusLocation[]>(PRESET_UNIVERSITIES);
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>(PRESET_UNIVERSITIES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [populateNetwork, setPopulateNetwork] = useState(true);

  if (!showModal) return null;

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    const results = await searchCampuses(val);
    setSearchResults(results);
  };

  const handleBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser. Please search manually.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Requesting browser geolocation permission...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestPresetCampus(latitude, longitude);
        setSelectedCampus(nearest);
        setLocationStatus(`Located near: ${nearest.city}. Matched ${nearest.shortName}.`);
        setStep(2);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('Location access was denied. You can select your university below.');
        } else {
          setLocationStatus('Could not determine exact location. Please select from the list below.');
        }
      },
      { timeout: 8000 }
    );
  };

  const handleSelectCampus = (campus: CampusLocation) => {
    setSelectedCampus(campus);
    setStep(2);
  };

  const handleLaunchWorkspace = () => {
    setCampusLocation(selectedCampus, populateNetwork);
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
              <h3>Campus Discovery & Setup</h3>
              <p>Geospatial digital twin setup powered by OpenStreetMap</p>
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
            <span>Location Discovery</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span>Geospatial Confirmation</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>Network Population</span>
          </div>
        </div>

        {/* STEP 1: Search or Geolocation */}
        {step === 1 && (
          <div className="discovery-content">
            <div className="permission-notice-box">
              <Shield size={18} className="text-emerald" />
              <div>
                <strong>Why do we ask for location?</strong>
                <p>
                  To discover your university boundaries and generate authentic 3D building
                  footprints using OpenStreetMap GIS data. Your coordinates are processed locally
                  and never stored.
                </p>
              </div>
            </div>

            <div className="discovery-actions-row">
              <button
                className="btn-locate-me"
                onClick={handleBrowserGeolocation}
                disabled={isLocating}
              >
                <Navigation size={16} />
                <span>{isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
              </button>
            </div>

            {locationStatus && <div className="discovery-status-text">{locationStatus}</div>}

            <div className="discovery-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Or search university by name, city, or state..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            <div className="campus-results-list">
              {searchResults.map((campus) => (
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
                        {campus.city}, {campus.country} • {campus.buildingCount} Buildings •{' '}
                        {campus.areaKm2} km²
                      </div>
                    </div>
                  </div>
                  <button className="btn-select-campus">
                    <span>Select</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Geospatial Confirmation */}
        {step === 2 && (
          <div className="discovery-content">
            <div className="selected-campus-hero">
              <div className="selected-badge">CONFIRMED CAMPUS BOUNDARY</div>
              <h2 className="selected-title">{selectedCampus.name}</h2>
              <div className="selected-coords">
                <MapPin size={14} />
                <span>
                  {selectedCampus.coordinates.lat.toFixed(4)}° N,{' '}
                  {selectedCampus.coordinates.lng.toFixed(4)}° E • {selectedCampus.city},{' '}
                  {selectedCampus.country}
                </span>
              </div>
            </div>

            <div className="campus-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Footprint Source</span>
                <span className="spec-val">OpenStreetMap (ODbL)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Building Entities</span>
                <span className="spec-val">{selectedCampus.buildingCount} Structures</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Geographic Area</span>
                <span className="spec-val">{selectedCampus.areaKm2} km²</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Attribution</span>
                <span className="spec-val">{selectedCampus.attribution}</span>
              </div>
            </div>

            <div className="building-preview-section">
              <div className="section-heading">
                <Layers size={14} />
                <span>Extruded 3D Campus Structures</span>
              </div>
              <div className="building-preview-tags">
                <span className="preview-tag">Academic Engineering Quad</span>
                <span className="preview-tag">Science & Research Library</span>
                <span className="preview-tag">Lecture Hall & Auditorium</span>
                <span className="preview-tag">Student Commons Pavilion</span>
              </div>
              <p className="notice-subtext">
                Height and partition walls are calibrated using standard academic building
                materials. You can modify floor counts and wall attenuation in the 3D editor.
              </p>
            </div>

            <div className="discovery-nav-footer">
              <button className="btn-back" onClick={() => setStep(1)}>
                Back to Search
              </button>
              <button className="btn-continue" onClick={() => setStep(3)}>
                Configure Network
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Network Population */}
        {step === 3 && (
          <div className="discovery-content">
            <div className="privacy-card">
              <Shield size={20} className="text-emerald" />
              <div>
                <strong>Important Technical & Privacy Boundary</strong>
                <p>
                  Browser geolocation locates only the consenting user, not campus Wi-Fi hardware or
                  individual student devices. Access points, signal coverage, and student movements
                  are simulated models based on IEEE standards unless authorized enterprise
                  telemetry is imported.
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
                  <strong>Simulate Enterprise Wi-Fi 6 Deployment</strong>
                  <p>
                    Deploys high-density enterprise APs (Cisco Catalyst / Aruba AP-555) with
                    simulated student roaming routes across faculties and outdoor quads.
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
                  <strong>Start with Clean Architectural Campus</strong>
                  <p>
                    Loads the campus structures without APs. Use the 3D placement tool to design
                    your wireless network from scratch.
                  </p>
                </div>
              </label>
            </div>

            <div className="discovery-nav-footer">
              <button className="btn-back" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn-launch-final" onClick={handleLaunchWorkspace}>
                <CheckCircle size={16} />
                <span>Launch 3D Digital Twin</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
