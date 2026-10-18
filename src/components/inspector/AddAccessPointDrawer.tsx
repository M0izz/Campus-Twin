import React, { useState } from 'react';
import { useCampusStore } from '../../store/useCampusStore';
import type { AccessPoint } from '../../types/scenario';
import { Wifi, X, Check } from 'lucide-react';

export const AddAccessPointDrawer: React.FC = () => {
  const showDrawer = useCampusStore((s) => s.showAddApDrawer);
  const closeDrawer = useCampusStore((s) => s.closeAddApDrawer);
  const addAccessPoint = useCampusStore((s) => s.addAccessPoint);
  const accessPoints = useCampusStore((s) => s.scenario.accessPoints);

  const [vendor, setVendor] = useState<'Cisco' | 'Aruba' | 'Ruckus' | 'Mist'>('Cisco');
  const [model, setModel] = useState('Catalyst 9124AXE');
  const [band, setBand] = useState<'5GHz' | '2.4GHz' | '6GHz'>('5GHz');
  const [mountType, setMountType] = useState<'Ceiling' | 'Wall / Pole'>('Ceiling');
  const [heightM, setHeightM] = useState(4.0);
  const [transmitPowerDbm, setTransmitPowerDbm] = useState(20);
  const [channelWidthMhz, setChannelWidthMhz] = useState<20 | 40 | 80 | 160>(80);
  const [antennaType, setAntennaType] = useState('Integrated Omnidirectional');

  if (!showDrawer) return null;

  const handleDeploy = () => {
    const nextIdx = accessPoints.length + 1;
    // Generate position in central outdoor quad or near campus center
    const posX = (Math.random() - 0.5) * 30;
    const posZ = (Math.random() - 0.5) * 30;

    const newAp: AccessPoint = {
      id: `ap-${vendor.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: `${vendor}-${model.split(' ')[0]}-${nextIdx}`,
      position: { x: Math.round(posX), y: heightM, z: Math.round(posZ) },
      band,
      channel: band === '5GHz' ? 36 : band === '6GHz' ? 1 : 6,
      channelWidthMhz,
      transmitPowerDbm,
      antennaGainDbi: mountType === 'Ceiling' ? 4 : 6,
      capacityMbps: band === '5GHz' ? 867 : band === '6GHz' ? 1200 : 300,
      status: 'online',
      model: `${vendor} ${model}`,
    };

    addAccessPoint(newAp);
  };

  return (
    <aside className="hamina-add-ap-drawer">
      <div className="drawer-header">
        <div className="drawer-title-row">
          <Wifi size={18} className="text-blue" />
          <h3>Add Access Point</h3>
        </div>
        <button className="drawer-close-btn" onClick={closeDrawer} title="Close drawer">
          <X size={16} />
        </button>
      </div>

      <div className="drawer-body">
        {/* Technology */}
        <div className="form-group">
          <label>Technology</label>
          <div className="btn-group">
            <button className="btn-group-item active">Wi-Fi (802.11ax/be)</button>
            <button className="btn-group-item disabled" title="BLE location beacons integration">
              BLE Beacon
            </button>
          </div>
        </div>

        {/* Vendor & Model Selection */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Hardware Vendor</label>
            <select
              value={vendor}
              onChange={(e) => {
                const v = e.target.value as any;
                setVendor(v);
                if (v === 'Cisco') setModel('Catalyst 9124AXE');
                if (v === 'Aruba') setModel('AP-555 Wi-Fi 6');
                if (v === 'Ruckus') setModel('R850 High-Density');
                if (v === 'Mist') setModel('AP63 Outdoor');
              }}
              className="select-input"
            >
              <option value="Cisco">Cisco</option>
              <option value="Aruba">Aruba Networks</option>
              <option value="Ruckus">Ruckus CommScope</option>
              <option value="Mist">Juniper Mist</option>
            </select>
          </div>

          <div className="form-group">
            <label>Access Point Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="select-input"
            >
              {vendor === 'Cisco' && (
                <>
                  <option value="Catalyst 9124AXE">Catalyst 9124AXE</option>
                  <option value="Catalyst 9130AXI">Catalyst 9130AXI</option>
                  <option value="Meraki MR76 Outdoor">Meraki MR76</option>
                </>
              )}
              {vendor === 'Aruba' && (
                <>
                  <option value="AP-555 Wi-Fi 6">AP-555 Wi-Fi 6</option>
                  <option value="AP-635 Wi-Fi 6E">AP-635 Wi-Fi 6E</option>
                </>
              )}
              {vendor === 'Ruckus' && (
                <>
                  <option value="R850 High-Density">R850 High-Density</option>
                  <option value="T750 Outdoor">T750 Outdoor</option>
                </>
              )}
              {vendor === 'Mist' && (
                <>
                  <option value="AP63 Outdoor">AP63 Outdoor</option>
                  <option value="AP43 Enterprise">AP43 Enterprise</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Antenna */}
        <div className="form-group">
          <label>Antenna Configuration</label>
          <select
            value={antennaType}
            onChange={(e) => setAntennaType(e.target.value)}
            className="select-input"
          >
            <option value="Integrated Omnidirectional">Integrated Omnidirectional (360°)</option>
            <option value="AIR-ANT2513P4M-N Patch">AIR-ANT2513P4M-N Directional Patch</option>
          </select>
        </div>

        {/* Mounting Type & Elevation */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Mounting Type</label>
            <select
              value={mountType}
              onChange={(e) => setMountType(e.target.value as any)}
              className="select-input"
            >
              <option value="Ceiling">Ceiling Mount</option>
              <option value="Wall / Pole">Wall / Pole Mount</option>
            </select>
          </div>

          <div className="form-group">
            <label>Height: {heightM.toFixed(1)} m</label>
            <input
              type="range"
              min="2.0"
              max="8.0"
              step="0.5"
              value={heightM}
              onChange={(e) => setHeightM(Number(e.target.value))}
              className="slider"
            />
          </div>
        </div>

        {/* Radio Band & Channel Width */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Radio Band</label>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value as any)}
              className="select-input"
            >
              <option value="5GHz">5 GHz</option>
              <option value="2.4GHz">2.4 GHz</option>
              <option value="6GHz">6 GHz (Wi-Fi 6E)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Channel Width</label>
            <select
              value={channelWidthMhz}
              onChange={(e) => setChannelWidthMhz(Number(e.target.value) as any)}
              className="select-input"
            >
              <option value={20}>20 MHz</option>
              <option value={40}>40 MHz</option>
              <option value={80}>80 MHz</option>
              <option value={160}>160 MHz</option>
            </select>
          </div>
        </div>

        {/* Transmit Power Slider */}
        <div className="form-group">
          <div className="slider-header">
            <label>Transmit Power (Tx)</label>
            <span className="slider-val">{transmitPowerDbm} dBm</span>
          </div>
          <input
            type="range"
            min="10"
            max="26"
            step="1"
            value={transmitPowerDbm}
            onChange={(e) => setTransmitPowerDbm(Number(e.target.value))}
            className="slider"
          />
        </div>
      </div>

      <div className="drawer-footer">
        <button className="btn-secondary" onClick={closeDrawer}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleDeploy}>
          <Check size={15} />
          <span>Deploy to Campus</span>
        </button>
      </div>
    </aside>
  );
};
