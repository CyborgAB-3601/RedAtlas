import { Droplet, Sun, Mountain, Wind, AlertTriangle, Radio, Navigation } from 'lucide-react';

export const MARS_LOCATIONS = {
  proposed_base: {
    id: 'proposed_base',
    name: 'Proposed Base Site',
    subtitle: 'A potential location for future exploration and research.',
    coords: { lat: '14.6° N', lng: '32.3° E', elev: '-2,450 m' },
    coordsText: '14.6° N, 32.3° E',
    elevationVal: '-2,450 m',
    elevationNum: -2450,
    distanceKm: '324 km',
    rockType: 'Basaltic Regolith',
    solarExposure: 'High (5.8 kWh/m²/day)',
    waterIce: 'High probability',
    satelliteImg: '/assets/crater_satellite_thumb.jpg',
    landscapeImg: '/assets/mars_base_site.jpg',
    desc: 'Selected for its favorable flat terrain, subsurface water ice deposits, and optimal solar exposure for permanent habitation modules.',
    chartX: 390,
    chartY: 119,
    insights: [
      { icon: Droplet, title: 'Water Ice (Subsurface)', desc: 'High probability' },
      { icon: Sun, title: 'Solar Exposure', desc: 'Good (5.8 kWh/m²/day)' },
      { icon: Mountain, title: 'Favorable Terrain', desc: 'Relatively flat, low roughness' },
      { icon: Wind, title: 'Low Dust Activity', desc: 'Compared to surrounding regions' }
    ]
  },
  olympus: {
    id: 'olympus',
    name: 'Olympus Mons',
    subtitle: 'The largest volcano in the Solar System, rising 21 km high.',
    coords: { lat: '18.7° N', lng: '133.8° W', elev: '21,287 m' },
    coordsText: '18.7° N, 133.8° W',
    elevationVal: '21,287 m',
    elevationNum: 21287,
    distanceKm: '1,420 km',
    rockType: 'Tholeiitic Basalt',
    solarExposure: 'Exceptional (Above 90% atmosphere)',
    waterIce: 'Trace (Atmospheric frost)',
    satelliteImg: '/assets/olympus_mons.jpg',
    landscapeImg: '/assets/olympus_mons.jpg',
    desc: 'Towering shield volcano featuring caldera depressions and subterranean lava tubes providing ideal radiation shielding for deep exploration.',
    chartX: 70,
    chartY: 28,
    insights: [
      { icon: Mountain, title: 'Extreme Altitude', desc: 'Above 90% of Mars atmosphere' },
      { icon: Sun, title: 'Solar Insolation', desc: 'Exceptional (6.4 kWh/m²/day)' },
      { icon: Wind, title: 'Lava Tubes', desc: 'Natural radiation shielding' },
      { icon: Droplet, title: 'Summit Frost', desc: 'Transient morning water vapor' }
    ]
  },
  valles: {
    id: 'valles',
    name: 'Valles Marineris',
    subtitle: 'A colossal canyon system stretching over 4,000 km across the equator.',
    coords: { lat: '14.0° S', lng: '59.3° W', elev: '-7,000 m' },
    coordsText: '14.0° S, 59.3° W',
    elevationVal: '-7,000 m',
    elevationNum: -7000,
    distanceKm: '880 km',
    rockType: 'Stratified Basaltic Layers',
    solarExposure: 'Moderate (Chasm shaded)',
    waterIce: 'Moderate (Deep canyon floor vapor)',
    satelliteImg: '/assets/valles_marineris.jpg',
    landscapeImg: '/assets/valles_marineris.jpg',
    desc: 'Grand canyon of Mars spanning equatorial depths with maximum surface atmospheric pressure and billions of years of exposed geologic history.',
    chartX: 280,
    chartY: 135,
    insights: [
      { icon: Wind, title: 'Atmospheric Pressure', desc: 'Highest on Martian surface' },
      { icon: Mountain, title: 'Exposed Stratigraphy', desc: 'Billions of years of geology' },
      { icon: Droplet, title: 'Morning Fog / Frost', desc: 'Transient water vapor observed' },
      { icon: Sun, title: 'Thermal Moderation', desc: 'Shielded deep chasms' }
    ]
  },
  jezero: {
    id: 'jezero',
    name: 'Jezero Crater',
    subtitle: 'Ancient lake basin with prime river delta biosignature deposits.',
    coords: { lat: '18.4° N', lng: '77.6° E', elev: '-2,500 m' },
    coordsText: '18.4° N, 77.6° E',
    elevationVal: '-2,500 m',
    elevationNum: -2500,
    distanceKm: '610 km',
    rockType: 'Clay & Carbonate Sediments',
    solarExposure: 'Good (5.6 kWh/m²/day)',
    waterIce: 'Hydrated Minerals',
    satelliteImg: '/assets/jezero_crater.jpg',
    landscapeImg: '/assets/jezero_crater.jpg',
    desc: 'Ancient delta basin explored by Perseverance with confirmed lacustrine mudstone beds and cached rock core samples ready for return.',
    chartX: 350,
    chartY: 112,
    insights: [
      { icon: Droplet, title: 'River Delta Fan', desc: 'Prime biosignature preservation' },
      { icon: Mountain, title: 'Carbonate Minerals', desc: 'Aqueous chemical indicators' },
      { icon: Sun, title: 'Solar Exposure', desc: 'Good (5.6 kWh/m²/day)' },
      { icon: Wind, title: 'Sample Depot', desc: 'Cached core samples stored' }
    ]
  },
  gale: {
    id: 'gale',
    name: 'Gale Crater',
    subtitle: 'Layered crater basin featuring Mount Sharp sediment mound.',
    coords: { lat: '5.4° S', lng: '137.8° E', elev: '-4,500 m' },
    coordsText: '5.4° S, 137.8° E',
    elevationVal: '-4,500 m',
    elevationNum: -4500,
    distanceKm: '940 km',
    rockType: 'Mudstone Sedimentary',
    solarExposure: 'Good (5.7 kWh/m²/day)',
    waterIce: 'Hydrated Sulfates',
    satelliteImg: '/assets/gale_crater.jpg',
    landscapeImg: '/assets/gale_crater.jpg',
    desc: 'Curiosity traverse site documenting ancient habitable lake conditions and continuous sediment stratification up Mount Sharp.',
    chartX: 430,
    chartY: 126,
    insights: [
      { icon: Mountain, title: 'Mudstone Sediments', desc: 'Evidence of ancient fresh water' },
      { icon: Droplet, title: 'Mount Sharp', desc: '5 km tall central sediment mound' },
      { icon: Sun, title: 'Organics Detected', desc: 'Preserved organic molecules' },
      { icon: Wind, title: 'Habitability Windows', desc: 'Long-duration aqueous history' }
    ]
  },
  waypoint_2: {
    id: 'waypoint_2',
    name: 'Waypoint 2',
    subtitle: 'Highland reconnaissance outpost and communication relay.',
    coords: { lat: '16.2° N', lng: '44.8° E', elev: '-1,120 m' },
    coordsText: '16.2° N, 44.8° E',
    elevationVal: '-1,120 m',
    elevationNum: -1120,
    distanceKm: '185 km',
    rockType: 'Volcanic Breccia',
    solarExposure: 'High (5.9 kWh/m²/day)',
    waterIce: 'Low (Regolith bonded)',
    satelliteImg: '/assets/crater_satellite_thumb.jpg',
    landscapeImg: '/assets/mars_expanded_terrain.jpg',
    desc: 'Intermediate highland plateau staging post along the northern perimeter with line-of-sight orbital relay coverage.',
    chartX: 200,
    chartY: 82,
    insights: [
      { icon: Mountain, title: 'Highland Plateau', desc: 'Elevated strategic vantage' },
      { icon: Sun, title: 'Direct Line of Sight', desc: 'Unobstructed comm relay' },
      { icon: Wind, title: 'Moderate Winds', desc: 'Stable atmospheric profile' },
      { icon: Droplet, title: 'Dry Regolith', desc: 'Solid foundation for arrays' }
    ]
  },
  rover_01: {
    id: 'rover_01',
    name: 'Rover 01',
    subtitle: 'Autonomous terrain scout currently analyzing canyon floor strata.',
    coords: { lat: '11.8° S', lng: '52.1° W', elev: '-6,200 m' },
    coordsText: '11.8° S, 52.1° W',
    elevationVal: '-6,200 m',
    elevationNum: -6200,
    distanceKm: '412 km',
    rockType: 'Layered Smectite Clay',
    solarExposure: 'Moderate (Chasm shaded)',
    waterIce: 'Detected (Hydrated minerals)',
    satelliteImg: '/assets/valles_marineris.jpg',
    landscapeImg: '/assets/mars_expanded_terrain.jpg',
    desc: 'Autonomous exploration rover actively sampling stratified canyon walls and transmitting spectral telemetry back to habitat.',
    chartX: 250,
    chartY: 130,
    insights: [
      { icon: Mountain, title: 'Active Mission', desc: 'Analyzing canyon strata' },
      { icon: Droplet, title: 'Mineral Hydration', desc: 'Spectrometer confirmed' },
      { icon: Sun, title: 'Solar Powered', desc: 'Operating at 92% efficiency' },
      { icon: Wind, title: 'Telemetry Live', desc: 'Direct link to habitat' }
    ]
  },
  drone_02: {
    id: 'drone_02',
    name: 'Drone 02',
    subtitle: 'Aerial LiDAR scout surveying crater rim topography.',
    coords: { lat: '17.1° N', lng: '68.4° E', elev: '-1,850 m' },
    coordsText: '17.1° N, 68.4° E',
    elevationVal: '-1,850 m',
    elevationNum: -1850,
    distanceKm: '520 km',
    rockType: 'Crater Ejecta Melt',
    solarExposure: 'High (6.1 kWh/m²/day)',
    waterIce: 'Shallow Permafrost',
    satelliteImg: '/assets/jezero_crater.jpg',
    landscapeImg: '/assets/mars_expanded_terrain.jpg',
    desc: 'Rotorcraft scout conducting high-resolution multispectral scans of perimeter crater ridges and landing hazards.',
    chartX: 320,
    chartY: 98,
    insights: [
      { icon: Mountain, title: 'Aerial Survey', desc: '3D LiDAR elevation mapping' },
      { icon: Sun, title: 'Rapid Recharge', desc: 'Solar top panel active' },
      { icon: Wind, title: 'Rotor Flight', desc: 'Stable low-density lift' },
      { icon: Droplet, title: 'Thermal Imaging', desc: 'Subsurface contrast map' }
    ]
  }
};

export const getLocationById = (id) => {
  return MARS_LOCATIONS[id] || MARS_LOCATIONS.proposed_base;
};
