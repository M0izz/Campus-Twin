# CampusTwin — Wireless Network Digital Twin for Smart Campus
**Project #16 · Software-Only · 3D-First Architectural Platform**

> *"See your campus. Understand its connectivity. Simulate a better network."*

CampusTwin is an interactive engineering platform for designing, simulating, and validating university campus Wi-Fi infrastructure prior to physical deployment. Combining real-world OpenStreetMap geographic footprints, deterministic log-distance radio frequency propagation, pedestrian mobility profiles, and capacity-constrained queueing models, CampusTwin delivers measurable, explainable what-if network analysis.

---

## 1. Product Architecture & Visual Philosophy

- **Light-Mode-First Architectural Interface**: Warm stone surfaces (`#f8fafc`), clean white panels, charcoal slate typography (`#0f172a`), restrained green accents (`#15803d`), and subtle blue network overlays (`#0284c7`).
- **Interactive 3D Engineering Workspace**: Powered by Three.js and `@react-three/fiber` with OrbitControls (pan, tilt, zoom, elevation bounds).
- **Procedural Coverage Heatmap Layer**: Real-time calculated contour mesh reflecting log-distance path loss, multi-dB obstacle attenuation, and antenna transmit power.

```
+-------------------------------------------------------------------------+
|                              Landing Page                               |
|        (Interactive 3D Hero Preview, Capabilities, Privacy Contract)    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Campus Discovery & Setup Flow (OSM)                    |
|   Step 1: Geolocation / Search   ->   Step 2: Confirm Boundary (ODbL)  |
|   Step 3: Extrude 3D Buildings   ->   Step 4: Simulated Network Pop.    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  CampusTwin 3D Engineering Workspace                    |
|  - 3D Buildings (Multi-floor, Glass Strips, Wall Attenuation Sliders)   |
|  - Hamina-Style "Add Access Point" Drawer (Cisco, Aruba, Ruckus, Mist)  |
|  - Deterministic Log-Distance Signal Propagation & Congestion Engine    |
|  - Living Pedestrian Student Mobility & 3.0 dB Hysteresis Association   |
|  - Real-Time Inspector (Tx Power, Capacity, Utilization Gauges)         |
|  - What-If Scenario Comparison (Baseline vs. Proposed Network Deltas)   |
|  - Zod Schema Validation & JSON Scenario Import / Export                |
+-------------------------------------------------------------------------+
```

---

## 2. Mathematical Propagation & Congestion Models

### 2.1 Log-Distance Path Loss with Obstacle Attenuation
$$\text{PL}(d) = \text{PL}(d_0) + 10 \cdot n \cdot \log_{10}\left(\frac{d}{d_0}\right)$$
$$\text{RSSI} = P_t + G_t + G_r - \text{PL}(d) - L_{\text{walls}} - L_{\text{floors}}$$

- **Reference Distance ($d_0$)**: $1.0\text{ m}$.
- **Path-Loss Exponent ($n$)**: $3.0$ (calibrated for mixed university campus environments).
- **Wall Attenuation ($L_{\text{walls}}$)**: Dynamically applied when rays traverse exterior building boundaries ($8 - 18\text{ dB}$, configurable per building).
- **Floor Attenuation ($L_{\text{floors}}$)**: Concrete floor slab loss ($12\text{ dB}$ per floor level).

### 2.2 Client Association & Roaming Hysteresis
Active simulated clients evaluate candidate access points within coverage range ($\text{RSSI} \ge -80\text{ dBm}$):
- **Roam Trigger**: Roams to candidate AP only when $\text{RSSI}_{\text{candidate}} > \text{RSSI}_{\text{current}} + 3.0\text{ dB}$.
- **Hysteresis Threshold**: A $3.0\text{ dB}$ barrier eliminates ping-pong flapping between adjacent AP cells.

### 2.3 Capacity, Congestion & Queueing Latency
For each AP, total offered demand is aggregated ($D_{\text{AP}} = \sum D_i$) and compared against effective throughput capacity $C_{\text{AP}}$ ($U_{\text{AP}} = D_{\text{AP}} / C_{\text{AP}}$):
- **Non-congested ($U \le 1.0$)**: Full throughput delivered ($T_i = D_i$), latency $L_i = 12\text{ ms} + (U \cdot 15\text{ ms})$.
- **Saturated ($U > 1.0$)**: Fair-share allocation ($T_i = D_i / U$), non-linear queue delay $L_i = 12\text{ ms} + 15\text{ ms} + (U - 1.0)^{1.8} \cdot 120\text{ ms}$.

---

## 3. Real-World Context & Privacy Contract

> **Important Technical & Privacy Boundary:**
> Browser geolocation identifies only the consenting user's coordinates to discover nearby campus boundaries using OpenStreetMap data. A browser cannot scan campus client hardware or discover unauthenticated AP inventories. All wireless access points, student entities, and bandwidth demands are simulated digital models unless imported through an authorized university network telemetry file.

---

## 4. Getting Started & Testing

### Installation
```bash
git clone <repository_url>
cd campustwin
npm install
```

### Running Locally
```bash
npm run dev
# Open http://localhost:5173/ in your browser
```

### Running Automated Test Suite
```bash
npm test
# Runs 15 unit tests across propagation math, obstacle attenuation,
# congestion fair-sharing, and Zod scenario schema validation.
```

### Building for Production
```bash
npm run build
```

---

## 5. Walkthrough Demonstration Workflow

1. **Product Landing Page**:
   - Inspect the interactive 3D hero preview (drag to orbit/rotate).
   - Click **"Explore My Campus"** to launch the Location-Aware Campus Setup flow.
2. **Campus Discovery & Setup**:
   - Step 1: Click **"Use My Current Location"** (or search "Stanford", "UNAM", "MIT", "Oxford", "Cambridge").
   - Step 2: Confirm campus boundary, lat/lng coordinates, and OpenStreetMap attribution.
   - Step 3: Choose **"Simulate Enterprise Wi-Fi 6 Deployment"** and click **"Launch 3D Digital Twin"**.
3. **3D Workspace Exploration**:
   - Orbit, pan, and zoom around the campus buildings.
   - Click any building to inspect its area, floors, and adjust **Wall Attenuation (dB)**.
   - Toggle **"Indoor View"** in the top bar to inspect interior APs through transparent roofs.
4. **Hamina-Style AP Deployment**:
   - Click **"Deploy Access Point"** on the floating toolbar.
   - Select hardware vendor (Cisco, Aruba, Ruckus, Mist), antenna mount, elevation, and radio band.
   - Click **"Deploy to Campus"** to place the AP and observe instant heatmap recalculation.
5. **Simulate Hardware Failure**:
   - Select an access point and click **"Simulate AP Failure (Offline)"**.
   - Notice immediate client reassociation, updated latency, unserved demand, and coverage contour shifts.
6. **What-If Scenario Comparison**:
   - Click **"Compare What-If"** in the header.
   - Review side-by-side metric deltas (Coverage %, Mean Latency, Throughput, Bottlenecked APs) with explainable findings.
   - Click **"Export Comparison Report"** to save findings to JSON.
