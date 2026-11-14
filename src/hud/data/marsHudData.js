/**
 * Mars HUD System Data Specification
 * Supporting Interactive Astronaut Helmet HUD System (Mars EVA)
 */

export const ASTRONAUT_TELEMETRY = {
  id: 'CDR. Nived',
  fullName: 'Commander Nived',
  mission: 'Ares IV — Chryse Planitia Expedition',
  evaSession: 'EVA-04 • Primary Site Survey',
  callsign: 'Vanguard-1',
  role: 'Mission Commander / EVA Lead',
  vitals: {
    heartRate: 65,
    heartRateUnit: 'BPM',
    heartRateStatus: 'NOMINAL',
    respirationRate: 14,
    respirationUnit: 'BR/MIN',
    coreTemp: 37.0,
    coreTempUnit: '°C',
    spo2: 99,
    spo2Unit: '%',
    stressIndex: 12,
    stressLevel: 'LOW',
    hydration: 94
  },
  suit: {
    status: 'OPTIMAL',
    suitPressure: 4.3,
    suitPressureUnit: 'PSI',
    suitPressureKPa: 29.6,
    ambientTemp: -62.4,
    ambientTempUnit: '°C',
    suitTemp: 21.4,
    suitTempUnit: '°C',
    primaryO2: 98.4,
    reserveO2: 100.0,
    o2ConsumptionRate: '0.052 kg/hr',
    battery: 88.5,
    batteryHoursRemaining: '7.4 hrs',
    co2Scrubbers: 99.8,
    co2Ppm: 380,
    humidity: 34,
    radiationDoseRate: 0.18,
    radiationUnit: 'mSv/hr',
    gloveTemp: 18.2,
    helmetVisorTint: 45
  },
  location: {
    lat: 14.612,
    lng: 32.315,
    latStr: '14.6° N',
    lngStr: '32.3° E',
    elevation: -2450,
    elevationStr: '-2,450 m',
    heading: 42,
    speed: '1.2 m/s',
    totalDistanceTraversed: '1,420 m'
  }
};

export const MARS_LOCATIONS = {
  proposed_base: {
    id: 'proposed_base',
    name: 'Proposed Base Site',
    subtitle: 'Primary human landing and permanent habitat zone in Chryse Planitia.',
    coords: { lat: '14.6° N', lng: '32.3° E', elev: '-2,450 m' },
    coordsText: '14.6° N, 32.3° E',
    latNum: 14.6,
    lngNum: 32.3,
    elevationVal: '-2,450 m',
    elevationNum: -2450,
    distanceKm: '0.32 km',
    rockType: 'Basaltic Regolith',
    solarExposure: 'High (5.8 kWh/m²/day)',
    waterIce: 'High probability (Subsurface 1.2m)',
    satelliteImg: '/assets/crater_satellite_thumb.jpg',
    landscapeImg: '/assets/mars_base_site.jpg',
    suitability: 'Exceptional (Grade A+). Flat alluvial plain with shallow subsurface sheet ice confirmed by SHARAD radar. Slope < 3.5°, minimal boulder obstruction.',
    desc: 'Selected for its favorable flat terrain, shallow subsurface ice sheets confirmed by SHARAD radar, and optimal equatorial solar insolation for human habitation modules.',
    terrain: {
      summary: 'Relatively smooth, low-relief alluvial plain with fine regolith and sparse boulders. Optimal for human outpost landing and surface vehicle traverses.',
      roughness: '0.14 (Low roughness)',
      maxSlope: '< 3.5° (Gentle ramp)',
      traverseLimit: '5.2 km',
      elevationRange: '-2,450 m to -2,380 m'
    },
    resources: {
      summary: 'SHARAD radar detects shallow buried sheet ice within 1.2m of surface. High solar insolation provides 5.8 kWh/m²/day for habitat photovoltaic arrays.',
      primaryMineral: 'Basaltic Regolith & Smectites',
      leadInstrument: 'SHARAD Radar & MRO HiRISE',
      waterHydration: 'High (Subsurface sheet at 1.2m)',
      isruPotential: 'Optimal (Water extraction & Base fuel)'
    },
    hazards: {
      summary: 'Moderate seasonal dust drift from Acidalia. Low seismic activity and smooth terrain present minimal mobility risk for astronauts.',
      radiationLevel: '0.21 mSv/day (Nominal GCR)',
      riskLevel: 'Low (Sheltered Plains)',
      thermalSwings: '-78°C to -12°C',
      atmosphericPressure: '620 Pa (Nominal)'
    }
  },
  jezero: {
    id: 'jezero',
    name: 'Jezero Crater Delta',
    subtitle: 'Ancient river delta rich in clay minerals and astrobiological biosignatures.',
    coords: { lat: '18.4° N', lng: '77.6° E', elev: '-2,540 m' },
    coordsText: '18.4° N, 77.6° E',
    latNum: 18.38,
    lngNum: 77.58,
    elevationVal: '-2,540 m',
    elevationNum: -2540,
    distanceKm: '2,310 km',
    rockType: 'Lacustrine Mudstones & Clays',
    solarExposure: 'Moderate-High (5.4 kWh/m²/day)',
    waterIce: 'Hydrated phyllosilicates & sulfates',
    satelliteImg: '/assets/jezero_crater.jpg',
    landscapeImg: '/assets/jezero_crater.jpg',
    suitability: 'High Scientific Priority. Ancient river fan with layered sediment depositions ideal for biosignature core samples.',
    desc: 'Fan-delta formation deposited inside an ancient lake basin. Rich in carbonate minerals that preserve micro-fossil structures from the Noachian epoch.',
    terrain: {
      summary: 'Terraced delta front with steep scarps and remnant erosional buttes (Kodiak Butte).',
      roughness: '0.42 (Medium-High scarp terrain)',
      maxSlope: '14.5° (Delta edge)',
      traverseLimit: '12.4 km',
      elevationRange: '-2,540 m to -2,100 m'
    },
    resources: {
      summary: 'Abundant clay minerals and carbonate deposits. Local rover Perseverance currently caching high-priority return samples.',
      primaryMineral: 'Carbonates, Smectite Clays & Olivine',
      leadInstrument: 'Perseverance Rover PIXL & SHERLOC',
      waterHydration: 'Moderate (Chemically bound in clays)',
      isruPotential: 'Good (Scientific and mineral processing)'
    },
    hazards: {
      summary: 'Boulder fields near delta rim, sand ripple traps in valley troughs.',
      radiationLevel: '0.24 mSv/day',
      riskLevel: 'Moderate (Wheel slip hazards)',
      thermalSwings: '-85°C to -18°C',
      atmosphericPressure: '610 Pa'
    }
  },
  olympus: {
    id: 'olympus',
    name: 'Olympus Mons Caldera',
    subtitle: 'The largest shield volcano in the Solar System, towering 21.3 km.',
    coords: { lat: '18.7° N', lng: '133.8° W', elev: '+21,287 m' },
    coordsText: '18.7° N, 133.8° W',
    latNum: 18.7,
    lngNum: -133.8,
    elevationVal: '21,287 m',
    elevationNum: 21287,
    distanceKm: '5,820 km',
    rockType: 'Tholeiitic Basalt & Volcanic Glass',
    solarExposure: 'Extreme (6.4 kWh/m²/day — Above 90% atmosphere)',
    waterIce: 'Trace summit atmospheric frost',
    satelliteImg: '/assets/olympus_mons.jpg',
    landscapeImg: '/assets/olympus_mons.jpg',
    suitability: 'High Long-term Strategic Value. Massive subterranean lava tubes offer permanent natural radiation shielding and geothermal shelter.',
    desc: 'Towering shield volcano featuring multi-tiered caldera depressions and subterranean lava tube skylights providing natural radiation shielding for human exploration.',
    terrain: {
      summary: 'Colossal shield volcano flank with multi-tiered basalt lava flow terraces and scarp drops up to 6 km.',
      roughness: '0.38 (High scree & basalt blocks)',
      maxSlope: '7.8° (Flank ramp) / 32° (Basal Scarp)',
      traverseLimit: '3.2 km',
      elevationRange: '+18,500 m to +21,287 m'
    },
    resources: {
      summary: 'Pristine tholeiitic basalt samples and volcanic glass. Unfiltered solar radiation above 90% of the atmosphere yields peak solar flux of 6.4 kWh/m²/day.',
      primaryMineral: 'Tholeiitic Basalt & Olivine',
      leadInstrument: 'THEMIS IR & HRSC Altimeter',
      waterHydration: 'Trace (Morning summit frost)',
      isruPotential: 'High (Solar power & Basalt construction)'
    },
    hazards: {
      summary: 'Extreme low pressure (< 100 Pa) requires strict pressure suit integrity. Intense UV radiation and steep 6 km caldera cliffs.',
      radiationLevel: '0.42 mSv/day (Unshielded surface)',
      riskLevel: 'Severe (Atmospheric vacuum & cliffs)',
      thermalSwings: '-105°C to -22°C',
      atmosphericPressure: '80 Pa (Near Vacuum)'
    }
  },
  valles_marineris: {
    id: 'valles_marineris',
    name: 'Valles Marineris (Coprates Chasma)',
    subtitle: 'The Grand Canyon of Mars, over 4,000 km long and 7 km deep.',
    coords: { lat: '13.9° S', lng: '59.2° W', elev: '-7,000 m' },
    coordsText: '13.9° S, 59.2° W',
    latNum: -13.9,
    lngNum: -59.2,
    elevationVal: '-7,000 m',
    elevationNum: -7000,
    distanceKm: '4,100 km',
    rockType: 'Layered Sulfate Beds & Basalt',
    solarExposure: 'Moderate (Canyon wall shadowing)',
    waterIce: 'Recurring Slope Lineae (RSL) hydrated salts',
    satelliteImg: '/assets/valles_marineris.jpg',
    landscapeImg: '/assets/valles_marineris.jpg',
    suitability: 'High Atmospheric Pressure Zone (~1,100 Pa). Higher air density provides superior radiation shielding and easier thermal regulation.',
    desc: 'Deep tectonic fracture zone displaying billions of years of exposed Martian stratigraphy. Highest atmospheric pressure on the planet.',
    terrain: {
      summary: 'Vast canyon canyon floor flanked by near-vertical 7 km cliff faces and landslide debris aprons.',
      roughness: '0.65 (Rugged canyon floor)',
      maxSlope: '28° (Wall slopes)',
      traverseLimit: '8.0 km',
      elevationRange: '-7,000 m to +1,500 m'
    },
    resources: {
      summary: 'Extensive hydrated sulfate salt deposits and accessible geological strata spanning the Noachian and Hesperian epochs.',
      primaryMineral: 'Kieserite, Gypsum & Polyhydrated Sulfates',
      leadInstrument: 'CRISM Spectrometer & HiRISE',
      waterHydration: 'High in sulfate crystal lattices',
      isruPotential: 'High (Chemical processing and water extraction)'
    },
    hazards: {
      summary: 'Rockfalls, seasonal dust traps in canyon floor, communication shadows against northern canyon walls.',
      radiationLevel: '0.14 mSv/day (Lowest surface dose due to dense air column)',
      riskLevel: 'Moderate (Terrain slope hazards)',
      thermalSwings: '-65°C to -5°C',
      atmosphericPressure: '1,120 Pa (High)'
    }
  },
  gale: {
    id: 'gale',
    name: 'Gale Crater (Mount Sharp)',
    subtitle: 'Impact basin featuring 5 km high central sedimentary mound.',
    coords: { lat: '5.4° S', lng: '137.8° E', elev: '-4,500 m' },
    coordsText: '5.4° S, 137.8° E',
    latNum: -5.35,
    lngNum: 137.8,
    elevationVal: '-4,500 m',
    elevationNum: -4500,
    distanceKm: '4,650 km',
    rockType: 'Mudstones, Sandstones & Sulfates',
    solarExposure: 'High (5.7 kWh/m²/day)',
    waterIce: 'Low surface, high chemical bound water in clays',
    satelliteImg: '/assets/gale_crater.jpg',
    landscapeImg: '/assets/gale_crater.jpg',
    suitability: 'Historic exploration site of MSL Curiosity. Proven ancient habitable freshwater lake environment.',
    desc: 'Sedimentary mountain preserving record of changing Martian climate from wet warm epochs to arid cold desert.',
    terrain: {
      summary: 'Gently sloping mudstone floor ascending into stratified sulfate ridges of Mount Sharp (Aeolis Mons).',
      roughness: '0.28 (Moderate regolith and sand ripples)',
      maxSlope: '9.2° (Lower mountain flank)',
      traverseLimit: '22 km',
      elevationRange: '-4,500 m to +800 m'
    },
    resources: {
      summary: 'Extensive clay and sulfate-bearing strata. Organic molecules confirmed by SAM instrument.',
      primaryMineral: 'Smectite, Hematite & Magnesium Sulfates',
      leadInstrument: 'Curiosity Rover SAM & ChemCam',
      waterHydration: 'Moderate (Chemically bound)',
      isruPotential: 'Moderate'
    },
    hazards: {
      summary: 'Sharp ventifact rocks causing wheel wear; active barchan dune crossings.',
      radiationLevel: '0.22 mSv/day',
      riskLevel: 'Low-Moderate',
      thermalSwings: '-75°C to -10°C',
      atmosphericPressure: '750 Pa'
    }
  },
  korolev: {
    id: 'korolev',
    name: 'Korolev Ice Crater',
    subtitle: '81-kilometer-wide impact crater filled with a massive, permanent water-ice glacier.',
    coords: { lat: '73.0° N', lng: '165.0° E', elev: '-2,000 m' },
    coordsText: '73.0° N, 165.0° E',
    latNum: 73.0,
    lngNum: 165.0,
    elevationVal: '-2,000 m',
    elevationNum: -2000,
    distanceKm: '6,200 km',
    rockType: 'Water Ice Glacier & Regolith Cap',
    solarExposure: 'Low-Seasonal (3.2 kWh/m²/day)',
    waterIce: '99% Pure Solid Water Ice (2,200 km³ volume)',
    satelliteImg: '/assets/korolev_crater.jpg',
    landscapeImg: '/assets/korolev_crater.jpg',
    suitability: 'Unrivaled Water Resource. Permanent 1.8 km thick cold-trap glacier holding 2,200 cubic kilometers of clean water ice.',
    desc: 'Cold-trap glacier where descending cold air keeps the central 60-kilometer mound of water ice permanently frozen throughout all Martian seasons.',
    terrain: {
      summary: 'Vast dome of crystalline water ice enclosed by steep impact crater rims.',
      roughness: '0.18 (Smooth glacier surface)',
      maxSlope: '4.5° (Ice dome ramp)',
      traverseLimit: '45 km',
      elevationRange: '-2,000 m to -200 m'
    },
    resources: {
      summary: 'Over 2,200 cubic kilometers of pristine water ice. Capable of supporting large-scale permanent human civilization and propellant production.',
      primaryMineral: 'Water Ice (H2O) with minor silicate dust',
      leadInstrument: 'Mars Express HRSC & CaSSIS',
      waterHydration: 'Ultra-High (> 99% Water Content)',
      isruPotential: 'Highest in Solar System (Drinking, O2, Rocket Propellant)'
    },
    hazards: {
      summary: 'Extreme polar temperatures dropping below -120°C in winter. Crevasse hazards near ice margins.',
      radiationLevel: '0.19 mSv/day',
      riskLevel: 'Moderate (Extreme thermal cold)',
      thermalSwings: '-125°C to -35°C',
      atmosphericPressure: '640 Pa'
    }
  }
};

export const ROVERS_DATA = [
  {
    id: 'rover_alpha',
    name: 'Rover Alpha (EVA Escort)',
    type: 'Pressurized Autonomous Crew Transport / Cargo Scout',
    coords: '14.65° N, 32.34° E',
    latNum: 14.65,
    lngNum: 32.34,
    status: 'OPERATIONAL',
    operationalMode: 'Autonomous Follow / Escort',
    battery: 94,
    batteryEta: '16.5 hrs',
    distanceFromAstronaut: '420 m',
    distanceNumKm: 0.42,
    commStatus: 'ONLINE (Direct 5.8 GHz)',
    commLatency: '4 ms',
    speed: '2.8 km/h',
    heading: '038° NE',
    cargoCapacity: '450 kg (Sample canisters & spare O2)',
    oxygenSupplyAvailable: '12 hrs crew umbilical',
    powerSource: 'MMRTG + 8 kWh Li-Ion Buffer',
    instruments: ['Forward LiDAR', 'MastCam-Z', 'Hazcams', 'Drill Arm']
  },
  {
    id: 'perseverance',
    name: 'Perseverance (Mars 2020)',
    type: 'Scientific Rover / Sample Cacher',
    coords: '18.38° N, 77.58° E',
    latNum: 18.38,
    lngNum: 77.58,
    status: 'ACTIVE_TRAVERSE',
    operationalMode: 'Sample Caching Campaign',
    battery: 89,
    batteryEta: 'Nominal MMRTG Continuous',
    distanceFromAstronaut: '2,310 km',
    distanceNumKm: 2310,
    commStatus: 'RELAY_OK (MRO Orbiter)',
    commLatency: '18 min (Earth), 12 ms (Orbital)',
    speed: '0.12 km/h',
    heading: '284° WNW',
    cargoCapacity: '38 hermetic sample tubes (24 filled)',
    powerSource: 'MMRTG Plutonium-238',
    instruments: ['SuperCam', 'PIXL', 'SHERLOC', 'MOXIE', 'RIMFAX Radar']
  },
  {
    id: 'curiosity',
    name: 'Curiosity (MSL)',
    type: 'Mobile Science Laboratory',
    coords: '5.35° S, 137.80° E',
    latNum: -5.35,
    lngNum: 137.8,
    status: 'STATIONARY_ANALYSIS',
    operationalMode: 'Mount Sharp Drill Survey',
    battery: 76,
    batteryEta: 'Nominal MMRTG Continuous',
    distanceFromAstronaut: '4,650 km',
    distanceNumKm: 4650,
    commStatus: 'RELAY_OK (Odyssey Orbiter)',
    commLatency: '22 min (Earth)',
    speed: '0.0 km/h',
    heading: '195° S',
    cargoCapacity: 'Internal ChemLab Analyzers',
    powerSource: 'MMRTG Plutonium-238',
    instruments: ['SAM Chem Lab', 'ChemCam', 'MastCam', 'RAD Radiation Detector']
  }
];

export const INITIAL_WAYPOINTS = [
  {
    id: 'wp-01',
    name: 'Base Hab Alpha (Landing Hub)',
    coords: '14.60° N, 32.30° E',
    latNum: 14.60,
    lngNum: 32.30,
    elevation: -2450,
    type: 'HABITAT',
    icon: 'home',
    notes: 'Primary pressurized living quarters and airlock.'
  },
  {
    id: 'wp-02',
    name: 'Solar Array Field Delta',
    coords: '14.62° N, 32.33° E',
    latNum: 14.62,
    lngNum: 32.33,
    elevation: -2442,
    type: 'POWER',
    icon: 'zap',
    notes: '120 kW dual-axis photovoltaic farm and battery bank.'
  },
  {
    id: 'wp-03',
    name: 'ISRU Ice Extraction Borehole',
    coords: '14.68° N, 32.28° E',
    latNum: 14.68,
    lngNum: 32.28,
    elevation: -2465,
    type: 'RESOURCE',
    icon: 'droplet',
    notes: 'Subsurface thermal Rodriguez well tapping glacier ice.'
  },
  {
    id: 'wp-04',
    name: 'North Ridge Comms Mast',
    coords: '14.74° N, 32.39° E',
    latNum: 14.74,
    lngNum: 32.39,
    elevation: -2380,
    type: 'COMMS',
    icon: 'radio',
    notes: 'High-gain X-band relay antenna overlooking Chryse basin.'
  }
];

export const DEFAULT_HUD_LAYERS = [
  { id: 'terrain', name: 'Terrain & Topography', enabled: true, color: '#f59e0b', description: 'Surface contours, scarps, and regolith roughness' },
  { id: 'elevation', name: 'Elevation Hypsometry', enabled: true, color: '#00f0ff', description: 'MOLA colorized height grading from -8km to +22km' },
  { id: 'geology', name: 'Geological Composition', enabled: true, color: '#a855f7', description: 'Basalt flows, hydrated sulfates, and olivine spectra' },
  { id: 'solar', name: 'Solar Insolation Flux', enabled: false, color: '#fbbf24', description: 'Photovoltaic exposure gradient (kWh/m²/day)' },
  { id: 'subsurface_ice', name: 'Subsurface Water Ice', enabled: true, color: '#38bdf8', description: 'SHARAD radar dielectric dielectric permittivity (>1m)' },
  { id: 'rovers', name: 'Rover Telemetry & Escort', enabled: true, color: '#22c55e', description: 'Real-time positions, comms link, and battery state' },
  { id: 'astronaut', name: 'Astronaut Position & Vitals', enabled: true, color: '#ec4899', description: 'First-person GPS/Ares coordinates and breadcrumbs' },
  { id: 'waypoints', name: 'Navigational Waypoints', enabled: true, color: '#eab308', description: 'Target beacons, drill sites, and base markers' },
  { id: 'routes', name: 'Active Traverse Routes', enabled: true, color: '#ef4444', description: 'Calculated optimal routes with slope optimization' },
  { id: 'hazards', name: 'Environmental Hazards', enabled: true, color: '#f97316', description: 'Steep slopes (>15°), boulder fields, and dust drifts' }
];

export const NAVIGATION_ROUTES = [
  {
    id: 'route_base_to_ice',
    name: 'Traverse Alpha: Base → Ice Extraction Site',
    from: 'Proposed Base Site',
    to: 'ISRU Ice Extraction Borehole',
    distanceKm: 3.4,
    estimatedWalkTime: '42 min',
    maxSlopeDeg: 3.2,
    suitEnergyConsumption: '142 Wh',
    checkpoints: [
      { name: 'Hab Airlock Exit', coords: '14.60° N, 32.30° E', distance: '0.0 km' },
      { name: 'Solar Array West Margin', coords: '14.62° N, 32.31° E', distance: '1.1 km' },
      { name: 'Basalt Plateau Ramp', coords: '14.65° N, 32.29° E', distance: '2.3 km' },
      { name: 'Drill Well Alpha Target', coords: '14.68° N, 32.28° E', distance: '3.4 km' }
    ]
  },
  {
    id: 'route_base_to_rover',
    name: 'Traverse Bravo: Base → Rover Alpha Escort',
    from: 'Proposed Base Site',
    to: 'Rover Alpha (Autonomous Escort)',
    distanceKm: 0.42,
    estimatedWalkTime: '6 min',
    maxSlopeDeg: 1.5,
    suitEnergyConsumption: '18 Wh',
    checkpoints: [
      { name: 'Current Astronaut Coordinates', coords: '14.61° N, 32.31° E', distance: '0.0 m' },
      { name: 'Rover Alpha Staging Spot', coords: '14.65° N, 32.34° E', distance: '420 m' }
    ]
  },
  {
    id: 'route_base_to_ridge',
    name: 'Traverse Charlie: Base → North Ridge Mast',
    from: 'Proposed Base Site',
    to: 'North Ridge Comms Mast',
    distanceKm: 6.8,
    estimatedWalkTime: '1 hr 25 min',
    maxSlopeDeg: 5.8,
    suitEnergyConsumption: '320 Wh',
    checkpoints: [
      { name: 'Base Hab Alpha', coords: '14.60° N, 32.30° E', distance: '0.0 km' },
      { name: 'Outcrop Alpha Marker', coords: '14.66° N, 32.34° E', distance: '2.8 km' },
      { name: 'Ridge Ascent Gully', coords: '14.70° N, 32.37° E', distance: '4.9 km' },
      { name: 'Comms Mast Summit', coords: '14.74° N, 32.39° E', distance: '6.8 km' }
    ]
  }
];
