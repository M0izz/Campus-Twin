# CampusTwin — Wireless Propagation & Congestion Simulation Model Specification

CampusTwin is a 3D digital twin platform for designing, simulating, and validating university campus Wi-Fi infrastructure prior to physical deployment. Every visual representation maps deterministically to underlying mathematical models.

---

## 1. Signal Propagation Model (Log-Distance Path Loss with Attenuation)

Signal strength is estimated using a log-distance path loss model expanded with deterministic obstacle attenuation for physical structures (walls, glass partitions, floors).

### 1.1 Path Loss Formula
$$PL(d) = PL(d_0) + 10 \cdot n \cdot \log_{10}\left(\frac{d}{d_0}\right)$$

Where:
- $d$: 3D Euclidean distance between the client position $(x_c, y_c, z_c)$ and access point $(x_{ap}, y_{ap}, z_{ap})$ in meters.
- $d_0$: Reference distance (typically $1.0\text{ m}$).
- $PL(d_0)$: Free space path loss at reference distance $d_0$ (e.g., $40.0\text{ dB}$ for $2.4\text{ GHz}$, $46.4\text{ dB}$ for $5\text{ GHz}$).
- $n$: Environment-dependent path-loss exponent:
  - Free space / open outdoor quad: $n \approx 2.0$
  - Mixed campus indoor/outdoor: $n \approx 2.8 - 3.2$
  - Obstructed indoor building: $n \approx 3.5 - 4.0$

### 1.2 Received Signal Strength (RSSI)
$$\text{RSSI} = P_t + G_t + G_r - PL(d) - L_{\text{walls}} - L_{\text{floors}}$$

Where:
- $P_t$: Transmit power of the AP (dBm, typically $17 - 23\text{ dBm}$).
- $G_t$: AP antenna gain (dBi, e.g., $3 - 5\text{ dBi}$).
- $G_r$: Client antenna gain (dBi, typically $0\text{ dBi}$ for mobile devices).
- $L_{\text{walls}} = \sum_{w \in \text{intersected}} A_w$: Cumulative attenuation (dB) of building exterior walls ($10 - 15\text{ dB}$) and interior partition walls ($3 - 6\text{ dB}$).
- $L_{\text{floors}} = \Delta \text{floor} \cdot A_f$: Attenuation through reinforced concrete floor slabs ($12 - 18\text{ dB}$ per floor).

### 1.3 Signal Quality Classification
- **Excellent**: $\text{RSSI} \ge -60\text{ dBm}$ (High throughput, 4K streaming, AR/VR)
- **Good / Decent**: $-70\text{ dBm} \le \text{RSSI} < -60\text{ dBm}$ (Standard video conferencing, smooth browsing)
- **Marginal / Low**: $-80\text{ dBm} \le \text{RSSI} < -70\text{ dBm}$ (Basic web access, potential packet retries)
- **Unacceptable / Out of Range**: $\text{RSSI} < -80\text{ dBm}$ (Disconnected or packet loss rate $> 50\%$)

---

## 2. Mobility & Client Association Model

Simulated clients represent students, faculty, and IoT sensors navigating campus pathways and occupied interior spaces.

### 2.1 Association Policy
Each active client evaluates all AP candidates within coverage range. Client $i$ associates with $\text{AP}^*$:
$$\text{AP}^* = \arg\max_{j} \left( \text{RSSI}_{i, j} \right) \quad \text{subject to } \text{RSSI}_{i, \text{AP}^*} \ge \text{RSSI}_{\min}$$

- **Hysteresis Threshold ($\Delta H = 3\text{ dB}$)**: To prevent ping-pong flapping between adjacent APs, roaming triggers only when $\text{RSSI}_{\text{candidate}} > \text{RSSI}_{\text{current}} + \Delta H$.
- If no AP satisfies $\text{RSSI} \ge \text{RSSI}_{\min}$ (e.g. $-80\text{ dBm}$), the client enters the `Disconnected` state.

### 2.2 Mobility Profiles
1. **Stationary / Deskbound**: Clients in lecture halls, study pods, and libraries with minor stochastic jitter.
2. **Wayfinding / Walking**: Clients moving between building waypoints (e.g. from Library to Lecture Hall or Cafeteria) at walking speeds ($1.2 - 1.5\text{ m/s}$).
3. **Roaming / Inter-building**: High mobility transitions traversing outdoor quad spaces and entering adjacent structures.

---

## 3. Capacity, Load & Congestion Model

High signal strength does not guarantee high performance if the radio channel or access point hardware is saturated.

### 3.1 Aggregated Traffic Demand
For each Access Point $j$, total offered demand $D_{\text{AP}, j}$ is the sum of bandwidth requested by associated clients:
$$D_{\text{AP}, j} = \sum_{i \in \text{Clients}(j)} D_i$$
- Baseline streaming / browsing demand: $D_i \in [2.0, 15.0]\text{ Mbps}$.

### 3.2 AP Utilization Ratio ($U_{\text{AP}}$)
$$U_{\text{AP}, j} = \frac{D_{\text{AP}, j}}{C_{\text{AP}, j}}$$
Where $C_{\text{AP}, j}$ is the configured effective throughput capacity of the AP (e.g., $300\text{ Mbps}$ on $2.4\text{ GHz}$, $867\text{ Mbps}$ on $5\text{ GHz}$ $802.11\text{ac/ax}$).

### 3.3 Throughput Fair-Sharing & Latency Penalty
- When $U_{\text{AP}, j} \le 1.0$ (Non-congested):
  - Delivered throughput $T_i = D_i$.
  - Modeled latency $L_i = L_{\text{base}} + (U_{\text{AP}, j} \cdot 15\text{ ms})$.
- When $U_{\text{AP}, j} > 1.0$ (Overloaded / Bottlenecked):
  - Fair-share allocation: $T_i = D_i \cdot \frac{1.0}{U_{\text{AP}, j}}$.
  - Congestion latency: $L_i = L_{\text{base}} + 15\text{ ms} + \left(U_{\text{AP}, j} - 1.0\right)^{1.8} \cdot 120\text{ ms}$.
  - Unserved demand: $\Delta D_{\text{AP}, j} = D_{\text{AP}, j} - C_{\text{AP}, j}$.

---

## 4. Engineering Metrics & Observability Contract

1. **Campus Coverage Ratio ($\%$)**: Spatial grid samples with $\text{RSSI} \ge -75\text{ dBm} / \text{Total area samples}$.
2. **Connected Client Ratio ($\%$)**: Associated active clients / Total campus population.
3. **Mean Latency ($\text{ms}$)** and **Bottlenecked AP Count**: APs operating above $85\%$ capacity utilization.
4. **Aggregate Throughput Delivered ($\text{Gbps}$)** vs. **Unserved Demand ($\text{Mbps}$)**.
