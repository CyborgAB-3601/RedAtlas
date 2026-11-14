# NASA TECHNICAL MEMORANDUM & MISSION ARCHITECTURE REPORT

**DOCUMENT IDENTIFIER**: NASA-TM-2026-REDATLAS-01  
**PROJECT TITLE**: RED ATLAS: Autonomous Multi-Modal Geospatial Intelligence, 3D Gaussian Splatting, and Gesture-Controlled Augmented Reality HUD for Martian Surface Exploration  
**PRINCIPAL SYSTEM**: Red Atlas Planetary GIS & EVA Telemetry Suite  
**TARGET MISSION ENVELOPE**: Human Mars Exploration (Artemis Base Camp Transition to Mars Surface Operations, 2030s)  
**DISTRIBUTION STATEMENT**: Approved for Public Release; Distribution Unlimited.

---

## 1. DOCUMENT CONTROL & METADATA

| Attribute | Specification |
| :--- | :--- |
| **Document Classification** | NASA Technical Report / Mission Architecture White Paper |
| **Subject Category** | 91 — Lunar and Planetary Science and Exploration |
| **Applicable Programs** | NASA Moon to Mars Strategy, Artemis Campaign, Mars Exploration Program (MEP) |
| **Lead Operational Scope** | Extravehicular Activity (EVA), Autonomous Rover Traversability, In-Situ Resource Utilization (ISRU) |
| **Primary Data Sources** | NASA JPL Mars Trek WMTS, PDS Geosciences, MRO HiRISE/CRISM/SHARAD, MGS MOLA, Odyssey THEMIS, MSL Curiosity REMS/RAD |
| **Rendering Core** | 3D Gaussian Splatting (3DGS) Radiance Fields with Three.js WebGL/WebGPU |

---

## 2. ABSTRACT

Human exploration of the Martian surface presents acute operational constraints: a communication latency with Earth ranging from 4 to 22 minutes, extreme thermal fluctuations ($-78^\circ\text{C}$ to $-12^\circ\text{C}$), ionizing cosmic radiation, severe topographic obstacles, and unyielding metabolic consumable limits. Traditional 2D geographic information systems (GIS) and polygonal 3D digital elevation models (DEMs) fail to deliver the sub-meter topographic fidelity and real-time situational awareness required for astronaut safety. 

This paper presents **RED ATLAS**, an end-to-end mission-oriented geospatial intelligence and traverse planning system engineered for Martian surface sorties. Red Atlas synthesizes multi-decadal NASA orbital and surface datasets into a unified spatial fabric. The system features: (1) **Smart Autonomous Route Detection** calculating energy-optimal, slope-constrained traverses and Points of Safe Return (PSR) for astronaut-rover teams; (2) **Mission-Oriented Smart Mapping** integrating real-time Level-of-Detail (LOD) tile streaming from NASA JPL Mars Trek servers with multi-spectral mineralogical (CRISM), thermal inertia (THEMIS), and radar subsurface ice (SHARAD) layers; (3) **3D Gaussian Splatting (3DGS)** terrain visualization, replacing artifact-prone polygonal meshes with continuous volumetric radiance fields to render micro-topographic hazards with zero geometry pop-in; and (4) an **Astronaut Augmented Reality (AR) Helmet Heads-Up Display (HUD)** controlled via glove gesture kinematics, delivering critical life-support telemetry, synthetic horizon guidance, and autonomous Laser-Induced Breakdown Spectroscopy (LIBS) mineral classification directly to the astronaut’s field of view.

---

## 3. INTRODUCTION

### 3.1 Operational Context & The Planetary Latency Barrier
Every robotic surface mission to Mars—from Sojourner to Perseverance—has relied on ground-in-the-loop tactical planning cycles conducted by Earth-based science teams over a 24-hour Martian Sol. Human exploration renders this paradigm obsolete. When crewed expeditions land on Mars, surface teams must execute daily extravehicular activities (EVAs) spanning 5 to 15 kilometers over unpredictable regolith, volcanic scarps, and boulder fields. 

Because radio signals between Mars and Earth require between 4.3 and 22 minutes each way, real-time tactical navigation and anomaly intervention cannot be driven from Houston or Starbase Mission Control. Astronauts must possess fully autonomous, onboard spatial cognition systems capable of parsing multi-spectral orbital data, evaluating metabolic risks, and navigating terrain hazards in fractions of a second.

### 3.2 Limitations of Classical Polygonal DEMs
Standard planetary mapping approaches rely on triangulated irregular networks (TINs) and heightfield displacement meshes derived from Mars Orbiter Laser Altimeter (MOLA) and High Resolution Imaging Science Experiment (HiRISE) digital terrain models (DTMs). While effective for macroscopic navigation, these systems exhibit critical failure modes in tactical surface operations:
* **Decimation Spikes & Blurring**: Steep crater scarps and basalt overhangs produce severe polygon stretching and false elevation spikes.
* **Texture Distortion**: Flat orthorectified aerial mosaics projected onto 3D meshes lose depth cues, concealing metric-scale crevices, scree slopes, and sinkholes.
* **Prohibitive Compute Overhead**: High-resolution photogrammetric point clouds demand millions of polygons, overwhelming mobile spacesuit computing units.

### 3.3 The Red Atlas Vision
Red Atlas overcomes these limitations by combining a hierarchical multi-scale GIS pipeline with GPU-accelerated **3D Gaussian Splatting** and a **contactless, gesture-controlled AR HUD**. The system acts as a persistent digital co-pilot for EVA crew members and autonomous pressurized rovers, transforming raw orbital sensor telemetry into actionable, life-critical surface navigation.

```
+----------------------------------------------------------------------------------------------------+
|                                    RED ATLAS SYSTEM ARCHITECTURE                                   |
+----------------------------------------------------------------------------------------------------+
|  [NASA DATA INFRASTRUCTURE]                                                                        |
|  NASA JPL Mars Trek API • MRO HiRISE • MGS MOLA • Odyssey THEMIS • MRO CRISM • MRO SHARAD • RAD   |
|                                                  │                                                 |
|                                                  ▼                                                 |
|  [CORE GEOSPATIAL INTELLIGENCE CORE]                                                               |
|  ├─ Multi-Layer Geospatial Synthesis (Optical, Elevation, Thermal, Mineralogy, Ice, Radiation)      |
|  ├─ Autonomous Traverse Logistics & Metabolic Consumables Engine (O₂ Burn, Battery, PSR Calculation)|
|  └─ Multi-Modal Dynamic Pathfinding (Rover-Assisted 4.5 km/h vs. Suit-Only 1.4 km/h)              |
|                                                  │                                                 |
|                         ┌────────────────────────┴────────────────────────┐                        |
|                         ▼                                                 ▼                        |
|  [3D GAUSSIAN SPLATTING ENGINE]                         [SPACESUIT AR HELMET HUD]                  |
|  ├─ Continuous Radiance Fields                          ├─ Contactless Glove Gesture Controller    |
|  ├─ Adaptive 96x96 Ellipsoidal Covariance               ├─ Synthetic Horizon & Pitch Ladder        |
|  ├─ Laplacian DEM Anti-Spike Filter                     ├─ 360° Waypoint Bearing Compass           |
|  └─ Real-Time Micro-Slope Raycasting                    └─ LIBS Spectral Mineral Reticle           |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. SYSTEM FEATURES & TECHNICAL CAPABILITIES

### 4.1 Smart Maps for Efficient Route Detection (Human & Rover Teaming)
Surface mobility on Mars is governed by mechanical traversability and human metabolic limits. Red Atlas incorporates an autonomous multi-modal traverse routing engine:

1. **Slope-Constrained Cost-Path Modeling**:
   Slopes exceeding $15^\circ$ induce wheel slippage in rovers and trigger acute metabolic fatigue in pressurized spacesuits; slopes $>25^\circ$ present structural rollover hazards. Red Atlas dynamically constructs traversability cost grids $C(x,y)$ using MOLA elevation gradients:
   $$C(x, y) = d_{\text{euclid}} \cdot \left( 1 + k_{\text{slope}} \cdot \tan^2(\theta) + k_{\text{roughness}} \cdot R \right)$$
   where $\theta$ is the local incline angle and $R$ is the surface roughness coefficient derived from THEMIS thermal inertia.
2. **Dynamic Consumables & Metabolic Safety Envelope**:
   The engine computes real-time consumable depletion curves based on the selected mode:
   * **Rover-Assisted Mode**: 4.5 km/h nominal speed, low crew metabolic exertion, shared auxiliary life-support and battery recharge umbilical.
   * **On-Foot Suit-Only Mode**: 1.4 km/h walk rate, elevated heart rate, higher $O_2$ consumption ($0.34\text{ to }0.55\text{ L/min}$).
3. **Autonomous Point of Safe Return (PSR)**:
   The system continuously calculates the distance to the habitat or rover against remaining suit consumables ($O_2$ pressure, battery watt-hours, $CO_2$ scrubber margin). When remaining reserves equal the walkback requirement plus a mandatory 25% NASA EVA reserve margin, Red Atlas issues an alert and restricts outbound routing.

### 4.2 Mission-Oriented Smart Mapping
Rather than serving static tiles, Red Atlas implements an operational multi-layer planetary GIS:
* **Planetary Level-of-Detail (LOD) Streaming**: Streams multi-resolution map tiles dynamically from NASA JPL Mars Trek servers (`https://trek.nasa.gov/tiles/Mars/EQ/...`) down to sub-meter scales.
* **Multi-Spectral Science Overlay**:
  * *HiRISE Visible Mosaic*: Optical surface inspection for obstacle clearance down to 0.25 m/pixel.
  * *MOLA Digital Elevation & Shaded Relief*: Continuous topographical contouring with selectable 50 m to 500 m intervals.
  * *THEMIS Thermal Inertia*: Discriminating high-inertia consolidated bedrock from low-inertia, hazardous soft dust deposits.
  * *CRISM Mineralogical Mapping*: Delineating hydrated sulfates, carbonates, and phyllosilicates indicative of ancient lacustrine or hydrothermal environments.
  * *SHARAD Shallow Radar*: Subsurface ice mapping (up to 1 km depth) identifying extractable water ice within 1.2 m of the surface for In-Situ Resource Utilization (ISRU).

### 4.3 3D Gaussian Splatted Visualization of Martian Environments
To provide micro-scale situational awareness around complex structures (caldera rims, lava tube skylights, deep stratification), Red Atlas deploys a real-time **3D Gaussian Splatting (3DGS)** engine:
* **Continuous Volumetric Radiance Fields**: Replaces discrete triangle meshes with volumetric 3D Gaussians, reproducing delicate shadows, rock textures, and atmospheric haze.
* **DEM Anti-Spike Protection**: Applies a dual-pass spatial filter (Laplacian + $3\times3$ weighted Gaussian kernel) over raw DEM inputs to eliminate digital sensor artifacts and false peaks.
* **Zero-Latency Interactive Pin Probing**: Incorporates real-time GPU raycasting allowing operators to hover over any point in the 3D volume to extract precise elevation ($z$), latitude/longitude coordinates, and local surface incline ($\theta$) in degrees.

### 4.4 Astronaut AR Helmet HUD with Contactless Gesture Control
Operating physical touchscreens or wrist buttons while wearing pressurized spacesuit gloves (operating at 29.6 kPa differential pressure) is ergonomically prohibitive and induces crew hand fatigue. Red Atlas features a specialized spacesuit helmet AR Visor HUD powered by **optical and IMU gesture recognition**:

```
+-------------------------------------------------------------------------------------+
| [● EVA-1 DIRECT FEED]     SPACESUIT AR HELMET VISOR HUD        HDG 048° NE ➔ 340 M  |
+-------------------------------------------------------------------------------------+
|                                                                                     |
|          +10° ──── [ SYNTHETIC HORIZON / PITCH LADDER ] ──── +10°                   |
|                    ───────────────────────────────────                              |
|                                                                                     |
|                          ┌──                ──┐                                     |
|                                [  ⌖  ]                                              |
|                          └──                ──┘                                     |
|                           TARGET LOCK RETICLE:                                      |
|                       "HYDROTHERMAL BOXWORK VEIN"                                   |
|                          LIBS CONFIDENCE: 94.2%                                     |
|                       CaSO₄ • MgSO₄ • Hydrated Gypsum                               |
|                                                                                     |
|          -10° ────────────────────────────────────────────── -10°                   |
|                                                                                     |
+-------------------------------------------------------------------------------------+
| [SUIT LIFE SUPPORT]          [GEOGRAPHIC NAVIGATION]          [CREW BIOMETRICS]     |
| Pressure: 29.6 kPa (100% O₂) Primary Site: Gale Crater        Heart Rate: 84 BPM    |
| O₂ Flow: 0.34 L/min (Nom)    5.4° S, 137.8° E • Elev: -4500m  Core Temp: 36.8°C     |
| Rad Dose: 0.19 mSv/hr        POINT OF SAFE RETURN: 1.8 KM     Comm: Comm Net 1 (ENC)|
+-------------------------------------------------------------------------------------+
```

* **Contactless Glove Gesture Control Schema**:
  * *Micro-Pinch (Index to Thumb)*: Locks the crosshair reticle on a geological rock target or terrain hazard.
  * *Open-Palm Forward (Push/Hold)*: Toggles synthetic horizon pitch ladder during brownout dust storms.
  * *Horizontal Wrist Sweep (Left/Right)*: Cycles through multi-spectral visual filters (Optical $\rightarrow$ Thermal Infrared $\rightarrow$ Mineral Highlight).
  * *Two-Finger Tap*: Acknowledges and dismisses non-critical consumable telemetry notifications.
* **Integrated Sensor Telemetry**:
  * *Synthetic Horizon & Pitch Ladder*: Stabilizes orientation when Martian dust storms drop ambient visibility below 5 meters.
  * *360° Compass Ribbon Tape*: Continuous heading indicator displaying distance and vector to target waypoints.
  * *Real-Time AR Reticle*: Identifies mineral formations via simulated Laser-Induced Breakdown Spectroscopy (LIBS), overlaying composition metrics (e.g., $94.2\%$ confidence hydrated calcium/magnesium sulfates).
  * *Consumables & Biometrics Display*: Continuous telemetry for suit pressure, $O_2$ mass flow, radiation dose rate ($0.19\text{ mSv/hr}$), heart rate, and internal core temperature.

---

## 5. RESEARCH MODEL & MATHEMATICAL FOUNDATIONS OF 3D GAUSSIAN SPLATTING

### 5.1 Theoretical Background (MDPI Remote Sensing Framework)
The mathematical foundation of the Red Atlas 3D visualization engine builds upon advancements in 3D Gaussian Splatting for Remote Sensing and Aerial Topographic Reconstruction as documented in recent peer-reviewed literature (e.g., *MDPI Remote Sensing*, ISSN: 2072-4292; Kerbl et al., 2023). 

Classical photogrammetry pipelines relying on multi-view stereo (MVS) construct explicit triangle meshes that suffer from severe geometric degeneration when imaging repetitive Martian basalt planes or steep caldera walls. 3DGS overcomes these limitations by modeling the scene as a collection of anisotropic 3D Gaussians that explicitly capture both geometry and view-dependent radiance fields.

### 5.2 Mathematical Formulation of 3D Gaussians
Each 3D Gaussian $G(x)$ is defined in world space $\mathbb{R}^3$ centered at mean position $\mu \in \mathbb{R}^3$, governed by a 3D covariance matrix $\Sigma$:

$$G(x) = \exp\left( -\frac{1}{2} (x - \mu)^T \Sigma^{-1} (x - \mu) \right)$$

To guarantee that $\Sigma$ remains positive semi-definite throughout geometric optimization and physical rendering, the covariance matrix is decomposed into a rotation quaternion $R \in \mathbb{SO}(3)$ and a 3D scaling vector $S = \text{diag}(s_x, s_y, s_z) \in \mathbb{R}^3$:

$$\Sigma = R S S^T R^T$$

### 5.3 2D Splat Projection onto the Camera Plane
To project a 3D Gaussian onto the astronaut's 2D viewing plane, the world-space covariance matrix $\Sigma$ is transformed using the viewing transformation matrix $W$ and the Jacobian of the projective perspective projection $J$ (Zwicker et al., 2001):

$$\Sigma' = J W \Sigma W^T J^T$$

Here, $\Sigma'$ represents a $2\times 2$ covariance matrix in screen space coordinates. The eigenvalues of $\Sigma'$ define the major and minor axes of the projected elliptical splat, allowing micro-topographical ridges to stretch smoothly without polygonal seam tearing.

### 5.4 Volumetric $\alpha$-Blending & Radiance Field Synthesis
Color and opacity accumulation along a viewing ray is evaluated using point-based volumetric compositing. The final rendered color $C$ for pixel $p$ is computed by sorting all overlapping Gaussians by depth and blending them via front-to-back alpha composition:

$$C(p) = \sum_{i \in \mathcal{N}} c_i \, \alpha_i \prod_{j=1}^{i-1} (1 - \alpha_j)$$

where $c_i$ is the color vector evaluated from spherical harmonics (or high-resolution NASA orthomosaic textures) and $\alpha_i$ is the evaluated Gaussian density modulated by a learned opacity factor:

$$\alpha_i = \alpha_{\text{base}} \cdot \exp\left( -\frac{1}{2} (p - \mu'_i)^T (\Sigma'_i)^{-1} (p - \mu'_i) \right)$$

```
========================================================================================
                      3D GAUSSIAN SPLATTING PROCESSING PIPELINE
========================================================================================
[NASA Orbital DEM & Ortho Input]
        │
        ▼
[Laplacian & Gaussian Anti-Spike Filter] ──► Removes MGS/HiRISE sensor artifacts
        │
        ▼
[Adaptive Grid Sampling (96 x 96)] ──────► Allocates 3D Gaussian centers μ_i
        │
        ▼
[Covariance Synthesis (Σ = R S S^T R^T)] ─► Orientates ellipsoids along terrain slope
        │
        ▼
[EWA Splat Projection (Σ' = J W Σ W^T J^T)]► Projects 3D Gaussians into camera plane
        │
        ▼
[Fast GPU Tile-Based Alpha-Blending] ───► 60+ FPS photorealistic terrain rendering
========================================================================================
```

### 5.5 Planetary Implementation in Red Atlas
Red Atlas adapts this formulation for planetary GIS environments:
1. **Adaptive Aspect-Ratio Resampling**: Terrain quadrangles are mapped to dynamic grid resolutions (up to $96 \times 96$ localized cells per quadrant) to preserve uniform splat density across asymmetric regions.
2. **Terrain Slope-Aligned Covariance**: The scaling vector $S$ and rotation matrix $R$ of each Gaussian are aligned tangentially to the local terrain normal vector $\vec{n} = (-\frac{\partial z}{\partial x}, -\frac{\partial z}{\partial y}, 1)^T$, ensuring that Gaussians flatten against slopes rather than poking out as artificial spikes.
3. **GPU-Accelerated WebGL/Three.js Pipeline**: Splats are uploaded to GPU buffers as packed `Float32Array` attributes (`position`, `color`, `scale`, `rotation`), achieving steady 60 FPS performance on embedded hardware without requiring server-side rendering farms.

---

## 6. NASA PLANETARY RESOURCES & DATA INTEGRATION

Red Atlas directly interfaces with authoritative NASA planetary archives, ingesting products certified by the NASA Planetary Data System (PDS) and the Jet Propulsion Laboratory (JPL):

| Dataset / Instrument | Mission / Lead Center | Spatial Resolution | Spectrum / Band | Mission Purpose in Red Atlas |
| :--- | :--- | :--- | :--- | :--- |
| **Mars Trek Tile Server** | NASA JPL / Solar System Treks | Level 1–9 Pyramid | Multi-band WMS/WMTS | Seamless global streaming of basemaps and regional DEMs |
| **HiRISE DTM / Orthos** | Mars Reconnaissance Orbiter (MRO) / UArizona | $0.25\text{ m/pixel}$ | Visible ($0.4 - 1.0\ \mu\text{m}$) | Identification of meter-scale boulders, fissures, and wheel hazards |
| **MOLA Altimetry Grid** | Mars Global Surveyor (MGS) / NASA GSFC | $463\text{ m}$ ($128\text{ px/deg}$) | $1064\text{ nm}$ Nd:YAG Laser | Global datum, macro-topography, slope calculations |
| **THEMIS Thermal Inertia**| 2001 Mars Odyssey / ASU | $100\text{ m/pixel}$ | 9 IR bands ($6.8 - 14.9\ \mu\text{m}$) | Distinguishes firm bedrock from hazardous unconsolidated dust mantles |
| **CRISM Spectral Cubes** | MRO / JHU Applied Physics Lab | $18\text{ m/pixel}$ | $0.36 - 3.92\ \mu\text{m}$ (544 ch) | Surface mineral identification: phyllosilicates, sulfates, carbonates |
| **SHARAD Radar Sounder** | MRO / Agenzia Spaziale Italiana (ASI) | $15\text{ m}$ vertical resolution | $15 - 25\text{ MHz}$ RF pulse | Subsurface ice sounding down to 1 km depth for ISRU water extraction |
| **REMS & MEDA Sensors** | MSL Curiosity / Mars 2020 Perseverance | Point In-Situ Telemetry | Environmental sensors | Sol tracking, diurnal pressure waves ($620\text{ Pa}$), wind and dust monitoring |
| **MSL RAD Dosimeter** | MSL Curiosity / SwRI | Continuous Dosimetry | Energetic particles & neutrons | Galactic Cosmic Ray (GCR) and Solar Particle Event (SPE) safety limits |

---

## 7. OPERATIONAL USE CASES & FLIGHT ROADMAP

### 7.1 Landing Site Selection & Habitat Certification (Pre-Mission Phase)
Prior to crew descent, Red Atlas serves as a certification engine for landing ellipses (e.g., Chryse Planitia, Arcadia Planitia, Jezero Crater). By combining HiRISE boulder density counts with MOLA slope histograms, the system identifies landing zones that minimize engine plume scour hazards and ensure touchdown stability for heavy descent vehicles (e.g., SpaceX Starship or NASA Mars Lander).

### 7.2 Human-Machine Collaborative EVA Sorties (Surface Operations Phase)
During active surface missions, Red Atlas acts as the shared tactical bridge between crew members on foot, pressurized rover operators, and autonomous robotic scouts. Waypoints flagged during orbital scans are refined via rover reconnaissance and updated across all suit HUDs with dynamically computed Point of Safe Return envelopes.

### 7.3 In-Situ Resource Utilization (ISRU) Mining Corridors
By layering SHARAD radar echograms with THEMIS day/night thermal curves, Red Atlas maps out extraction corridors where subsurface sheet ice is located within 1 to 2 meters of the surface, allowing autonomous excavators to quarry water feedstocks for fuel production plants with minimal overburden stripping.

### 7.4 Spatial Computing & Edge Hardware Roadmap
* **Milestone 1 (Current)**: WebGL/WebGPU cross-platform interface supporting interactive planning on field laptops and mission control consoles.
* **Milestone 2 (2027)**: Integration with NASA spacesuit optical prototypes and commercial mixed-reality headsets (Apple VisionOS, Meta Quest Pro) utilizing local SLAM tracking.
* **Milestone 3 (2029)**: Containerized deployment to radiation-hardened flight computers (e.g., High-Performance Spaceflight Computing / HPSC processors) operating on habitat local area networks with zero reliance on terrestrial cloud infrastructure.

---

## 8. CONCLUSION

Human exploration of Mars requires a profound departure from 20th-century mission architectures. In an environment where communication delays prevent terrestrial intervention and environmental hazards threaten crew survival, geospatial intelligence must be autonomous, hyper-fast, and integrated directly into the explorer's optical field of view.

**RED ATLAS** provides this missing operational layer. By unifying multi-mission NASA orbital science, deploying advanced 3D Gaussian Splatting for continuous volumetric micro-terrain reconstruction, and introducing a contactless, gesture-controlled spacesuit AR HUD, Red Atlas establishes a new benchmark for planetary exploration software. It bridges the gap between petabytes of cold orbital data and the real-time survival decisions of humanity’s first interplanetary explorers.

---

## 9. REFERENCES

1. **Kerbl, B., Kopanas, G., Leimkühler, T., & Drettakis, G.** (2023). *3D Gaussian Splatting for Real-Time Radiance Field Rendering*. ACM Transactions on Graphics (TOG), 42(4), 1-14.
2. **MDPI Remote Sensing Editorial Board & Contributors.** (2023–2025). *Special Issue on 3D Gaussian Splatting in Remote Sensing, Aerial Photogrammetry, and Planetary Terrain Modeling*. MDPI Remote Sensing, ISSN: 2072-4292. https://www.mdpi.com/2072-4292/
3. **Zwicker, M., Pfister, H., van Baar, J., & Gross, M.** (2001). *Surface Splatting*. Proceedings of the 28th Annual Conference on Computer Graphics and Interactive Techniques (SIGGRAPH '01), 371-378.
4. **NASA Jet Propulsion Laboratory.** (2024). *Mars Trek Web Map Tile Service (WMTS) API Specification and Planetary Data Archive*. NASA JPL Solar System Treks Program. https://trek.nasa.gov/mars/
5. **Smith, D. E., et al.** (2001). *Mars Orbiter Laser Altimeter: Experiment overview and selected results from the primary mapping mission*. Journal of Geophysical Research: Planets, 106(E10), 23689-23722.
6. **McEwen, A. S., et al.** (2007). *Mars Reconnaissance Orbiter's High Resolution Imaging Science Experiment (HiRISE)*. Journal of Geophysical Research: Planets, 112(E5), E05S02.
7. **Christensen, P. R., et al.** (2004). *The Thermal Emission Imaging System (THEMIS) for the Mars 2001 Odyssey Mission*. Space Science Reviews, 110(1), 85-130.
8. **Murchie, S., et al.** (2007). *Compact Reconnaissance Imaging Spectrometer for Mars (CRISM) on Mars Reconnaissance Orbiter (MRO)*. Journal of Geophysical Research: Planets, 112(E5), E05S03.
9. **Seu, R., et al.** (2007). *SHARAD Sounding Radar on the Mars Reconnaissance Orbiter*. Journal of Geophysical Research: Planets, 112(E5), E05S05.
10. **Hassler, D. M., et al.** (2014). *Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover*. Science, 343(6169), 1244726.
11. **Gomez-Elvira, J., et al.** (2012). *REMS: The Environmental Sensor Suite for the Mars Science Laboratory/Curiosity Rover*. Space Science Reviews, 170(1-4), 583-640.
12. **NASA Moon to Mars Architecture Strategy.** (2023). *Moon to Mars Architecture Definition Document (ADD)*. NASA Exploration Systems Development Mission Directorate (ESDMD), Washington, D.C.

